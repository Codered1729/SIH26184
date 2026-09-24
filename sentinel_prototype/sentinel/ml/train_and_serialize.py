#!/usr/bin/env python3
"""
Multi-Model Training & Serialization Pipeline for SENTINEL.

Trains all 5 candidate models on Maharashtra cybercrime data:
1. RandomForest (tuned) - Primary winner (highest PR-AUC)
2. HistGradientBoosting (LightGBM equivalent)
3. GradientBoosting (CatBoost equivalent)
4. LogisticRegression (Linear baseline)
5. RandomForest (baseline)

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
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    average_precision_score,
    f1_score,
    precision_recall_curve,
    precision_score,
    recall_score,
)
from sklearn.preprocessing import OneHotEncoder

warnings.filterwarnings("ignore")

HERE = Path(__file__).resolve().parent
DATA_PATH = HERE / "synthetic_complaints.csv"
MODEL_DIR = HERE / "models"
MODEL_DIR.mkdir(parents=True, exist_ok=True)
MODEL_BUNDLE_PATH = MODEL_DIR / "cashout_model.pkl"

CAT_COLS = ["jcct_origin", "pincode_tier"]
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
    cat_cols_out = list(encoder.get_feature_names_out(CAT_COLS))

    X_cat = pd.DataFrame(cat_arr, columns=cat_cols_out, index=df.index)
    X = pd.concat([df[NUM_COLS].reset_index(drop=True), X_cat.reset_index(drop=True)], axis=1)
    X.columns = X.columns.astype(str)
    feature_names = list(X.columns)
    y = df[TARGET].values

    # 2. Define All 5 Candidate Models
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
        "LogisticRegression": LogisticRegression(
            max_iter=1000, C=1.0, random_state=42
        ),
        "RandomForest (baseline)": RandomForestClassifier(
            n_estimators=200, max_depth=8, random_state=42, n_jobs=-1
        ),
    }

    trained_models = {}
    thresholds = {}
    metrics = {}
    feature_importances = {}

    print(f"\nTraining all {len(models_dict)} models on {len(X)} samples with {len(feature_names)} features...\n")
    print(f"{'Model':<25} {'PR-AUC':<10} {'Opt-Thresh':<12} {'F1-Opt':<10} {'Recall':<10} {'Time':<8}")
    print("-" * 75)

    for name, clf in models_dict.items():
        t0 = time.time()
        clf.fit(X, y)
        train_time = time.time() - t0

        if hasattr(clf, "predict_proba"):
            probs = clf.predict_proba(X)[:, 1]
        else:
            probs = clf.decision_function(X)

        opt_th = compute_opt_threshold(y, probs)
        preds_opt = (probs >= opt_th).astype(int)

        pr_auc = float(average_precision_score(y, probs))
        f1_opt = float(f1_score(y, preds_opt))
        rec_opt = float(recall_score(y, preds_opt))
        prec_opt = float(precision_score(y, preds_opt))

        trained_models[name] = clf
        thresholds[name] = opt_th
        metrics[name] = {
            "pr_auc": pr_auc,
            "opt_threshold": opt_th,
            "f1_score": f1_opt,
            "recall": rec_opt,
            "precision": prec_opt,
            "train_time_sec": train_time,
        }

        # Feature importances
        if hasattr(clf, "feature_importances_"):
            feature_importances[name] = dict(zip(feature_names, clf.feature_importances_.tolist()))
        elif hasattr(clf, "coef_"):
            feature_importances[name] = dict(zip(feature_names, np.abs(clf.coef_[0]).tolist()))
        else:
            feature_importances[name] = {}

        print(f"{name:<25} {pr_auc:<10.3f} {opt_th:<12.3f} {f1_opt:<10.3f} {rec_opt:<10.3f} {train_time:.2f}s")

    # 3. Create Serialized Bundle
    primary_model_name = "RandomForest (tuned)"
    bundle = {
        "models": trained_models,
        "primary_model_name": primary_model_name,
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
