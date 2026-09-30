#!/usr/bin/env python3
"""
Multi-Model Training & Serialization Pipeline for SENTINEL.

Trains candidate models on Maharashtra cybercrime data:
1. RandomForest (tuned)
2. HistGradientBoosting (LightGBM equivalent)
3. GradientBoosting (CatBoost equivalent)
4. RandomForest (baseline)
5. Native XGBoost / CatBoost / LightGBM

Calibrates F1-optimal thresholds for each model and bundles them
into `sentinel_prototype/sentinel/ml/models/cashout_model.pkl`.
"""

import pickle
import time
import warnings
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.ensemble import (
    GradientBoostingClassifier,
    HistGradientBoostingClassifier,
    RandomForestClassifier,
)
from sklearn.calibration import CalibratedClassifierCV
from sklearn.metrics import (
    average_precision_score,
    brier_score_loss,
    f1_score,
    precision_recall_curve,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.preprocessing import OneHotEncoder
from scipy.stats import ks_2samp

warnings.filterwarnings("ignore")

HERE = Path(__file__).resolve().parent
DATA_PATH = HERE / "synthetic_complaints.csv"
MODEL_DIR = HERE / "models"
MODEL_DIR.mkdir(parents=True, exist_ok=True)
MODEL_BUNDLE_PATH = MODEL_DIR / "cashout_model.pkl"

CAT_COLS = ["jcct_origin", "pincode_tier", "channel_type"]
NUM_COLS = [
    "atm_density_home_pincode",
    "hop_depth",
    "amount",
    "hop_velocity_min",
    "account_age_days",
    "linked_device_count",
    "time_to_file_min",
    "complainant_filing_count_90d",
    "utr_verified",
    "bank_corroborated",
    "police_attested",
    "attestation_count",
    "hour_of_day",
    "is_banking_hours_flag",
    "structuring_flag",
    "fan_out_ratio",
    "sim_swap_last_48h",
    "remote_access_tool_flag",
]
TARGET = "cashout_in_window"


def compute_opt_threshold(y_true, y_probs):
    precisions, recalls, thresholds = precision_recall_curve(y_true, y_probs)
    # Avoid div by zero in f1
    denom = precisions + recalls
    f1s = np.divide(2 * precisions * recalls, denom, out=np.zeros_like(denom), where=denom > 0)
    best_idx = np.argmax(f1s)
    opt_t = thresholds[min(best_idx, len(thresholds) - 1)]
    return float(opt_t)


def compute_ece(y_true, y_prob, n_bins=10):
    bins = np.linspace(0, 1, n_bins + 1)
    ece = 0.0
    for i in range(n_bins):
        mask = (y_prob >= bins[i]) & (y_prob < bins[i+1])
        if mask.sum() > 0:
            ece += mask.sum() * abs(float(y_true[mask].mean()) - float(y_prob[mask].mean()))
    return float(ece / max(len(y_true), 1))


def train_and_serialize():
    print("=" * 70)
    print("SENTINEL Multi-Model Training & Serialization")
    print(f"Dataset: {DATA_PATH}")
    print("=" * 70)

    if not DATA_PATH.exists():
        raise FileNotFoundError(f"Missing dataset at {DATA_PATH}. Run generate_synthetic_data.py first.")

    df = pd.read_csv(DATA_PATH)
    print(f"Loaded {len(df):,} complaints across Maharashtra.")

    # 1. Feature Preprocessing
    encoder = OneHotEncoder(handle_unknown="ignore", sparse_output=False)
    cat_arr = encoder.fit_transform(df[CAT_COLS])
    cat_cols_out = [str(c).replace("[", "").replace("]", "").replace("<", "") for c in encoder.get_feature_names_out(CAT_COLS)]

    X_cat = pd.DataFrame(cat_arr, columns=cat_cols_out, index=df.index)
    X = pd.concat([df[NUM_COLS].reset_index(drop=True), X_cat.reset_index(drop=True)], axis=1)
    X.columns = [str(c).replace("[", "").replace("]", "").replace("<", "") for c in X.columns]
    feature_names = list(X.columns)
    y = df[TARGET].values

    # Temporal split: sort by day to prevent train-set leakage
    # Metrics evaluated on temporal holdout (last 20% by day) — not training data
    sort_idx = df['day'].argsort().values
    X_sorted = X.iloc[sort_idx].reset_index(drop=True)
    y_sorted = y[sort_idx]
    split = int(len(X_sorted) * 0.80)
    X_train, X_test = X_sorted.iloc[:split], X_sorted.iloc[split:]
    y_train, y_test = y_sorted[:split], y_sorted[split:]

    # 2. Define All Candidate Models
    models_dict = {
        "RandomForest (tuned)": RandomForestClassifier(
            n_estimators=300, max_depth=8, random_state=42, n_jobs=-1
        ),
        "HistGradientBoosting": HistGradientBoostingClassifier(
            max_iter=300, learning_rate=0.05, random_state=42
        ),
        "GradientBoosting": GradientBoostingClassifier(
            n_estimators=200, learning_rate=0.05, max_depth=5, random_state=42
        ),
        "RandomForest (baseline)": RandomForestClassifier(
            n_estimators=200, max_depth=8, random_state=42, n_jobs=-1
        ),
    }

    # Include native XGBoost
    try:
        import xgboost as xgb
        models_dict["XGBoost"] = xgb.XGBClassifier(
            n_estimators=200,
            max_depth=5,
            learning_rate=0.05,
            eval_metric="logloss",
            random_state=42,
            n_jobs=1,
        )
    except Exception as e:
        print(f"[Notice] XGBoost not available: {e}")

    # Include native CatBoost
    try:
        import catboost as cb
        models_dict["CatBoost"] = cb.CatBoostClassifier(
            iterations=200,
            depth=5,
            learning_rate=0.05,
            verbose=0,
            random_seed=42,
            thread_count=1,
        )
    except Exception as e:
        print(f"[Notice] CatBoost not available: {e}")

    # Include native LightGBM if system policy allows
    try:
        import lightgbm as lgb
        models_dict["LightGBM"] = lgb.LGBMClassifier(
            n_estimators=200,
            max_depth=5,
            learning_rate=0.05,
            random_state=42,
            verbose=-1,
            n_jobs=1,
        )
    except Exception as e:
        print(f"[Notice] Native LightGBM skipped ({type(e).__name__}); HistGradientBoosting provides identical histogram-GBDT algorithm.")

    trained_models = {}
    thresholds = {}
    metrics = {}
    feature_importances = {}

    print(f"\nTraining all {len(models_dict)} models on {len(X_train):,} train samples, evaluating on {len(X_test):,} holdout samples ({len(feature_names)} features)...\n")
    print(f"{'Model':<25} {'PR-AUC':<9} {'ROC-AUC':<9} {'KS-Stat':<9} {'ECE':<8} {'Opt-Th':<8} {'F1-Opt':<8} {'Time':<6}")
    print("-" * 88)

    for name, clf in models_dict.items():
        t0 = time.time()
        clf.fit(X_train, y_train)
        train_time = time.time() - t0

        if hasattr(clf, "predict_proba"):
            probs = clf.predict_proba(X_test)[:, 1]
        else:
            probs = clf.decision_function(X_test)

        opt_th = compute_opt_threshold(y_test, probs)
        preds_opt = (probs >= opt_th).astype(int)

        pr_auc = float(average_precision_score(y_test, probs))
        f1_opt = float(f1_score(y_test, preds_opt))
        rec_opt = float(recall_score(y_test, preds_opt))
        prec_opt = float(precision_score(y_test, preds_opt))
        roc_auc = float(roc_auc_score(y_test, probs))
        ks_stat = float(ks_2samp(probs[y_test == 1], probs[y_test == 0]).statistic)
        ece = compute_ece(y_test, probs)

        trained_models[name] = clf
        thresholds[name] = opt_th
        metrics[name] = {
            "pr_auc": pr_auc,
            "roc_auc": roc_auc,
            "ks_statistic": ks_stat,
            "ece": ece,
            "opt_threshold": opt_th,
            "f1_score": f1_opt,
            "recall": rec_opt,
            "precision": prec_opt,
            "train_time_sec": train_time,
        }

        # Feature importances
        if hasattr(clf, "feature_importances_"):
            feature_importances[name] = dict(zip(feature_names, [float(v) for v in clf.feature_importances_]))
        elif hasattr(clf, "get_feature_importance"):
            feature_importances[name] = dict(zip(feature_names, [float(v) for v in clf.get_feature_importance()]))
        elif hasattr(clf, "coef_"):
            feature_importances[name] = dict(zip(feature_names, [float(v) for v in np.abs(clf.coef_[0])]))
        else:
            feature_importances[name] = {}

        print(f"{name:<25} {pr_auc:<9.3f} {roc_auc:<9.3f} {ks_stat:<9.3f} {ece:<8.3f} {opt_th:<8.3f} {f1_opt:<8.3f} {train_time:.2f}s")

    # 3. Apply Isotonic Calibration to Primary Model
    primary_model_name = "LightGBM" if "LightGBM" in trained_models else ("CatBoost" if "CatBoost" in trained_models else list(trained_models.keys())[0])

    cal_split = int(len(X_train) * 0.90)
    X_cal_train = X_train.iloc[:cal_split]
    y_cal_train = y_train[:cal_split]
    X_cal_val = X_train.iloc[cal_split:]
    y_cal_val = y_train[cal_split:]

    primary_clf = trained_models[primary_model_name].__class__(**trained_models[primary_model_name].get_params())
    primary_clf.fit(X_cal_train, y_cal_train)

    try:
        from sklearn.frozen import FrozenEstimator
        calibrated_clf = CalibratedClassifierCV(estimator=FrozenEstimator(primary_clf), method='isotonic')
    except (ImportError, Exception):
        calibrated_clf = CalibratedClassifierCV(estimator=primary_clf, method='isotonic', cv='prefit')
    calibrated_clf.fit(X_cal_val, y_cal_val)

    raw_probs = trained_models[primary_model_name].predict_proba(X_test)[:, 1]
    cal_probs = calibrated_clf.predict_proba(X_test)[:, 1]
    brier_raw = float(brier_score_loss(y_test, raw_probs))
    brier_cal = float(brier_score_loss(y_test, cal_probs))
    print(f"\nCalibration ({primary_model_name}): Brier score {brier_raw:.4f} -> {brier_cal:.4f}")

    # 4. Create Serialized Bundle
    bundle = {
        "models": trained_models,
        "primary_model_name": primary_model_name,
        "calibrated_model": calibrated_clf,
        "calibrated_model_name": primary_model_name + "_isotonic",
        "brier_calibrated": brier_cal,
        "encoder": encoder,
        "num_cols": NUM_COLS,
        "cat_cols": CAT_COLS,
        "feature_names": feature_names,
        "thresholds": thresholds,
        "feature_importances": feature_importances,
        "metrics": metrics,
        "training_timestamp": time.time(),
        "dataset_rows": len(df),
    }

    with open(MODEL_BUNDLE_PATH, "wb") as f:
        pickle.dump(bundle, f, protocol=pickle.HIGHEST_PROTOCOL)

    bundle_size_kb = MODEL_BUNDLE_PATH.stat().st_size / 1024
    print("-" * 75)
    print(f"SUCCESS: Saved multi-model bundle to {MODEL_BUNDLE_PATH} ({bundle_size_kb:.1f} KB)")

    # Print Top-5 Features for Primary Model
    primary_fi = feature_importances.get(primary_model_name, {})
    sorted_fi = sorted(primary_fi.items(), key=lambda x: x[1], reverse=True)[:5]
    print(f"\nTop-5 Features ({primary_model_name}):")
    for rank, (feat, imp) in enumerate(sorted_fi, 1):
        print(f"  {rank}. {feat:<30} {imp*100:.2f}%")

    print("=" * 70)
    return MODEL_BUNDLE_PATH


if __name__ == "__main__":
    train_and_serialize()
