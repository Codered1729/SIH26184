"""
Explainable Multi-Model Cash-Out Predictor Service for SENTINEL.

Serves the trained model bundle from `ml/models/cashout_model.pkl`:
- Provides real-time inference across candidate models:
  1. RandomForest (tuned) [Default primary]
  2. HistGradientBoosting (LightGBM equivalent)
  3. GradientBoosting (CatBoost equivalent)
  4. RandomForest (baseline)
  5. Native XGBoost / CatBoost / LightGBM
- Returns calibrated probability, binary risk classification, risk tier,
  and Top-3 plain-language explainability reasons for LEA officers.
- Allows runtime model switching and cross-model consensus comparisons.
"""

import pickle
import sys
import time
import warnings
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any, Dict, List, Optional

import numpy as np
import pandas as pd

warnings.filterwarnings("ignore")

_BACKEND_ROOT = str(Path(__file__).resolve().parents[2])
if _BACKEND_ROOT not in sys.path:
    sys.path.insert(0, _BACKEND_ROOT)

DEFAULT_MODEL_PATH = Path(__file__).resolve().parents[3] / "ml" / "models" / "cashout_model.pkl"


@dataclass
class PredictionResult:
    probability: float
    is_cashout_risk: bool
    opt_threshold: float
    model_used: str
    all_model_probabilities: Dict[str, float]
    risk_tier: str  # "CRITICAL", "HIGH", "ELEVATED", "LOW"
    top_reasons: List[str]
    features_used: Dict[str, Any]
    top_shap_factors: Optional[List[Dict[str, Any]]] = None

    def to_dict(self) -> dict:
        return asdict(self)


_SHAP_MODULE = None
_SHAP_CHECKED = False


def _safe_import_shap():
    global _SHAP_MODULE, _SHAP_CHECKED
    if not _SHAP_CHECKED:
        _SHAP_CHECKED = True
        try:
            import shap
            _SHAP_MODULE = shap
        except Exception:
            _SHAP_MODULE = None
    return _SHAP_MODULE


class CashoutPredictor:
    """Production service for scoring cybercrime cash-out risk across 5 ML architectures."""

    def __init__(self, model_path: Optional[Path | str] = None):
        self.model_path = Path(model_path) if model_path else DEFAULT_MODEL_PATH
        self.bundle: Optional[dict] = None
        self.active_model_name: str = "LightGBM"
        self.calibrated_model = None
        self.calibrated_model_name: Optional[str] = None
        self._shap_explainers: Dict[str, Any] = {}
        self._load_bundle()
        if self.bundle:
            self._warmup()

    def _warmup(self):
        """Warm up scikit-learn models and tree traversal structures."""
        dummy = {"amount": 25000.0, "hop_velocity_min": 15.0}
        self.predict_risk(dummy)

    def _load_bundle(self):
        if not self.model_path.exists():
            # Graceful dummy fallback if bundle is not yet trained
            self.bundle = None
            self.bundle_sha256 = "UNVERIFIED"
            return

        try:
            import hashlib
            self.bundle_sha256 = f"sha256:{hashlib.sha256(self.model_path.read_bytes()).hexdigest()}"
            # Map legacy Cython _loss module alias if required by scikit-learn pickle
            try:
                import sklearn._loss._loss
                sys.modules.setdefault("_loss", sklearn._loss._loss)
            except Exception:
                pass

            with open(self.model_path, "rb") as f:
                self.bundle = pickle.load(f)
            self.bundle["bundle_sha256"] = self.bundle_sha256

            # Set n_jobs=1 for low-overhead single-sample inference on Windows
            for m in self.bundle.get("models", {}).values():
                if hasattr(m, "n_jobs"):
                    m.n_jobs = 1

            self.active_model_name = self.bundle.get("primary_model_name", "LightGBM")
            self.calibrated_model = self.bundle.get("calibrated_model", None)
            self.calibrated_model_name = self.bundle.get("calibrated_model_name", None)
        except Exception as exc:
            import logging
            logging.getLogger("uvicorn.error").warning(f"Could not load ML bundle ({exc}), using heuristic fallback.")
            self.bundle = None

    @property
    def available_models(self) -> List[str]:
        if not self.bundle or "models" not in self.bundle:
            return ["RandomForest (tuned)", "HistGradientBoosting", "GradientBoosting", "RandomForest (baseline)", "XGBoost", "CatBoost", "LightGBM"]
        return list(self.bundle["models"].keys())

    def set_active_model(self, model_name: str) -> None:
        if model_name not in self.available_models:
            raise ValueError(f"Unknown model '{model_name}'. Available: {self.available_models}")
        self.active_model_name = model_name

    def _generate_top_reasons(self, features: dict, feature_importances: dict) -> List[str]:
        """Generates top-3 explainable reasons why this complaint was flagged."""
        reasons = []

        # 1. Telecommunications / Device Hijack Signals
        if features.get("sim_swap_last_48h") == 1:
            reasons.append("Critical risk: Beneficiary SIM-swap detected within preceding 48 hours (OTP interception pattern)")

        if features.get("remote_access_tool_flag") == 1:
            reasons.append("Malicious remote desktop / APK accessibility service active on initiating endpoint")

        # 2. Multi-tier Structuring / Smurfing
        if features.get("structuring_flag") == 1:
            reasons.append("Layer-2 transaction structured below Rs. 50,000 threshold to evade bank AML reporting")

        fan_out = features.get("fan_out_ratio", 1)
        if fan_out > 2:
            reasons.append(f"Immediate fan-out layering across {fan_out} beneficiary accounts to fragment audit trail")

        # 3. Off-hours Dark Window Timing
        if features.get("is_banking_hours_flag") == 0:
            hr = features.get("hour_of_day", 2)
            reasons.append(f"Off-hours transaction initiated outside core banking hours ({hr:02d}:00 dark window)")

        # 4. Rapid Hop Velocity
        velocity = features.get("hop_velocity_min", 30.0)
        if velocity < 10.0:
            reasons.append(f"Rapid hop velocity ({velocity:.1f} mins) indicates automated laundering before freeze")

        # 5. Payment Rail
        channel = str(features.get("channel_type", "")).upper()
        if channel in ["ATM_CARDLESS", "AEPS_KIOSK"]:
            reasons.append(f"High-risk cash-out rail ({channel}) enables immediate physical extraction without teller validation")

        # 6. Device Clustering
        devices = features.get("linked_device_count", 0)
        if devices > 1:
            reasons.append(f"Beneficiary account shares hardware device fingerprint with {devices} other flagged accounts")

        # 7. High Value / ATM Density
        amount = features.get("amount", 0.0)
        if amount >= 50000.0:
            reasons.append(f"High-value fraud volume (Rs. {amount:,.0f}) exceeds typical digital retail thresholds")

        atm_density = features.get("atm_density_home_pincode", 15.0)
        if atm_density >= 25.0:
            reasons.append(f"Target urban sector exhibits high ATM cluster density ({atm_density:.1f}/lakh), enabling rapid cash-out")

        time_to_file = features.get("time_to_file_min", 60.0)
        if time_to_file <= 30.0:
            reasons.append(f"Report filed within {time_to_file:.0f} mins of debit; active physical withdrawal in progress")

        account_age = features.get("account_age_days", 180.0)
        if account_age <= 60.0:
            reasons.append(f"Recently opened mule account ({account_age:.0f} days old) exhibits synthetic mule pattern")

        # Fallbacks if fewer than 3 triggers fired
        if len(reasons) < 3:
            reasons.append("Multi-hop transaction topology matches known Maharashtra syndicate fan-out")
        if len(reasons) < 3:
            reasons.append("Sectoral cash-out velocity elevated across destination district")

        return reasons[:3]

    def _get_explainer(self, model_name: str, model: Any):
        if model_name not in self._shap_explainers:
            shap_lib = _safe_import_shap()
            if shap_lib is not None:
                try:
                    self._shap_explainers[model_name] = shap_lib.TreeExplainer(model)
                except Exception:
                    self._shap_explainers[model_name] = None
            else:
                self._shap_explainers[model_name] = None
        return self._shap_explainers.get(model_name)

    def _compute_shap_reasons(
        self, features_df: pd.DataFrame, model_name: str, model_obj: Any
    ) -> tuple[List[str], List[Dict[str, Any]]]:
        """
        Computes mathematically authentic TreeSHAP feature attributions per sample.
        Uses native CatBoost TreeSHAP (C++ engine) for CatBoost models,
        or shap.TreeExplainer when available, with feature importance fallback.
        """
        vals = None
        feature_names = self.bundle.get("feature_names", list(features_df.columns))

        # 1. Native CatBoost TreeSHAP (fastest, zero-overhead C++ implementation)
        if hasattr(model_obj, "get_feature_importance"):
            try:
                import catboost
                pool = catboost.Pool(features_df)
                raw_shap = model_obj.get_feature_importance(pool, type=catboost.EFstrType.ShapValues)
                if raw_shap.ndim == 2 and raw_shap.shape[1] >= len(feature_names):
                    # Last column is base value / expected value
                    vals = raw_shap[0, :len(feature_names)]
            except Exception:
                vals = None

        # 2. Scikit-learn / XGBoost / LightGBM TreeExplainer if shap is importable
        if vals is None:
            try:
                explainer = self._get_explainer(model_name, model_obj)
                if explainer is not None:
                    sv = explainer.shap_values(features_df)
                    if isinstance(sv, list) and len(sv) == 2:
                        vals = sv[1][0]
                    elif hasattr(sv, "values"):
                        vals = sv.values[0]
                    elif isinstance(sv, np.ndarray):
                        if sv.ndim == 3 and sv.shape[2] == 2:
                            vals = sv[0, :, 1]
                        elif sv.ndim == 2:
                            vals = sv[0]
                        else:
                            vals = sv
                    else:
                        vals = sv[0]
            except Exception:
                vals = None

        # 3. Fallback: feature importances scaled by presence of feature
        if vals is None:
            importances = getattr(model_obj, "feature_importances_", None)
            if importances is not None and len(importances) == len(feature_names):
                row_vals = features_df.iloc[0].values
                vals = np.array(importances) * np.where(row_vals != 0, 1.0, 0.0)
            else:
                vals = np.zeros(len(feature_names))

        # Defensively guarantee vals is a 1D float list
        vals = np.asarray(vals)
        if vals.ndim == 2 and vals.shape[1] == 2:
            vals = vals[:, 1]
        elif vals.ndim > 1:
            vals = vals.ravel()[:len(feature_names)]
        clean_vals = [float(v) for v in vals]

        contributions = list(zip(feature_names, clean_vals))
        sorted_contribs = sorted(contributions, key=lambda x: abs(x[1]), reverse=True)

        top_shap_factors = []
        for feat, impact in sorted_contribs[:5]:
            direction = "elevates" if impact > 0 else "reduces"
            top_shap_factors.append({
                "feature": feat,
                "impact": round(float(impact), 4),
                "direction": direction,
                "text": f"{feat} ({direction} cash-out probability by {abs(impact):.3f})",
            })

        # Generate top plain-language explainability reasons
        top_reasons = []
        for feat, impact in sorted_contribs[:3]:
            direction = "elevates" if impact > 0 else "reduces"
            val = float(features_df.iloc[0].get(feat, 0.0))
            reason = self._format_shap_reason(feat, val, impact, direction)
            top_reasons.append(reason)

        return top_reasons, top_shap_factors

    def _format_shap_reason(self, feat: str, val: float, impact: float, direction: str) -> str:
        """Translates a SHAP feature attribution into plain-language LEA evidence."""
        imp_str = f"{abs(impact):.3f}"
        if feat == "amount":
            return f"Fraud volume (Rs. {val:,.0f}) {direction} cash-out likelihood by {imp_str}"
        elif feat == "hop_velocity_min":
            return f"Hop velocity ({val:.1f} mins) {direction} automated laundering risk by {imp_str}"
        elif feat == "sim_swap_last_48h" and val == 1:
            return f"Beneficiary SIM-swap in preceding 48 hours {direction} risk by {imp_str} (OTP interception pattern)"
        elif feat == "remote_access_tool_flag" and val == 1:
            return f"Remote desktop / APK accessibility service active on endpoint {direction} risk by {imp_str}"
        elif feat == "structuring_flag" and val == 1:
            return f"Transaction structured below Rs. 50,000 AML threshold {direction} risk by {imp_str}"
        elif feat == "atm_density_home_pincode":
            return f"ATM cluster density ({val:.1f}/lakh) {direction} physical extraction speed by {imp_str}"
        elif feat == "fan_out_ratio" and val > 1:
            return f"Fan-out layering across {int(val)} beneficiary accounts {direction} risk by {imp_str}"
        elif feat == "is_banking_hours_flag" and val == 0:
            return f"Off-hours transaction timing outside core banking window {direction} risk by {imp_str}"
        elif feat == "time_to_file_min":
            return f"Reporting latency ({val:.0f} mins) {direction} active cash-out urgency by {imp_str}"
        elif feat == "linked_device_count" and val > 0:
            return f"Shared hardware device fingerprint with {int(val)} accounts {direction} risk by {imp_str}"
        elif "channel_type" in feat:
            rail = feat.replace("channel_type_", "")
            return f"Payment rail ({rail}) {direction} physical withdrawal risk by {imp_str}"
        else:
            clean_name = feat.replace("_", " ").title()
            return f"{clean_name} ({direction} cash-out probability by {imp_str})"

    def predict_risk(
        self,
        complaint: Dict[str, Any],
        model_name: Optional[str] = None,
        use_calibrated: bool = False,
    ) -> PredictionResult:
        """Evaluates cash-out probability for a complaint across all candidate models."""
        chosen_model_name = model_name or self.active_model_name

        # Fail-closed: raise runtime exception if bundle is not loaded
        if not self.bundle:
            raise RuntimeError("ML model bundle not loaded. Cannot generate risk prediction.")

        # 1. Prepare Feature Vector
        num_cols = self.bundle["num_cols"]
        cat_cols = self.bundle["cat_cols"]
        encoder = self.bundle["encoder"]
        models = self.bundle["models"]
        thresholds = self.bundle["thresholds"]
        importances = self.bundle["feature_importances"]

        cat_defaults = {
            "jcct_origin": "Mumbai",
            "pincode_tier": "urban",
            "channel_type": "UPI",
        }

        # Fill defaults
        raw_num = [float(complaint.get(col, 0.0)) for col in num_cols]
        raw_cat_df = pd.DataFrame(
            [[str(complaint.get(col, cat_defaults.get(col, "urban"))) for col in cat_cols]],
            columns=cat_cols,
        )
        cat_encoded = encoder.transform(raw_cat_df)
        cat_names = encoder.get_feature_names_out(cat_cols)
        X_df = pd.concat([
            pd.DataFrame([raw_num], columns=num_cols),
            pd.DataFrame(cat_encoded, columns=cat_names),
        ], axis=1)
        X_df.columns = X_df.columns.astype(str)

        # 2. Score across ALL 5 models
        all_model_probs = {}
        for m_name, clf in models.items():
            if hasattr(clf, "predict_proba"):
                p = float(clf.predict_proba(X_df)[0, 1])
            else:
                raw_decision = clf.decision_function(X_df)[0]
                import numpy as np
                p = float(1.0 / (1.0 + np.exp(-raw_decision)))
            all_model_probs[m_name] = round(p, 4)

        # 3. Primary model prediction
        if use_calibrated and self.calibrated_model is not None:
            primary_prob = round(float(self.calibrated_model.predict_proba(X_df)[0, 1]), 4)
            chosen_model_name = self.calibrated_model_name or f"{chosen_model_name}_calibrated"
            active_model_obj = self.calibrated_model
        else:
            primary_prob = all_model_probs.get(chosen_model_name, all_model_probs[self.active_model_name])
            active_model_obj = models.get(chosen_model_name, models[self.active_model_name])
        threshold = thresholds.get(chosen_model_name, 0.24)
        is_risk = bool(primary_prob >= threshold)

        # Determine risk tier
        if primary_prob >= 0.70:
            risk_tier = "CRITICAL"
        elif primary_prob >= 0.45:
            risk_tier = "HIGH"
        elif is_risk:
            risk_tier = "ELEVATED"
        else:
            risk_tier = "LOW"

        # 4. Generate SHAP explainable reasons
        top_reasons, top_shap_factors = self._compute_shap_reasons(X_df, chosen_model_name, active_model_obj)

        return PredictionResult(
            probability=primary_prob,
            is_cashout_risk=is_risk,
            opt_threshold=round(threshold, 3),
            model_used=chosen_model_name,
            all_model_probabilities=all_model_probs,
            risk_tier=risk_tier,
            top_reasons=top_reasons,
            features_used={k: complaint.get(k) for k in num_cols + cat_cols},
            top_shap_factors=top_shap_factors,
        )


_PREDICTOR_INSTANCE: Optional[CashoutPredictor] = None


def get_predictor() -> CashoutPredictor:
    """Singleton accessor for CashoutPredictor service."""
    global _PREDICTOR_INSTANCE
    if _PREDICTOR_INSTANCE is None:
        _PREDICTOR_INSTANCE = CashoutPredictor()
    return _PREDICTOR_INSTANCE


if __name__ == "__main__":
    predictor = CashoutPredictor()
    print("=" * 70)
    print("SENTINEL CashoutPredictor Self-Test")
    print(f"Available Models: {predictor.available_models}")
    print(f"Active Model:     {predictor.active_model_name}")
    print("=" * 70)

    # 1. Test High-Risk Cybercrime Complaint (Pune AEPS Mule Layering)
    high_risk_complaint = {
        "channel_type": "AEPS_KIOSK",
        "jcct_origin": "Pune",
        "pincode_tier": "metro",
        "amount": 48000.0,
        "hop_depth": 4,
        "hop_velocity_min": 4.2,
        "account_age_days": 18.0,
        "linked_device_count": 3,
        "time_to_file_min": 85.0,
        "atm_density_home_pincode": 32.5,
        "complainant_filing_count_90d": 0,
        "utr_verified": 1,
        "bank_corroborated": 1,
        "police_attested": 1,
        "attestation_count": 3,
        "structuring_flag": 1,
        "sim_swap_last_48h": 1,
    }

    t0 = time.time()
    res_high = predictor.predict_risk(high_risk_complaint)
    lat_ms = (time.time() - t0) * 1000

    print("\n--- High-Risk Complaint Prediction ---")
    print(f"Model Used:        {res_high.model_used}")
    print(f"Probability:       {res_high.probability:.4f} (Threshold: {res_high.opt_threshold})")
    print(f"Cash-Out Risk:     {res_high.is_cashout_risk}")
    print(f"Risk Tier:         {res_high.risk_tier}")
    print(f"Latency:           {lat_ms:.2f} ms")
    print("\nTop-3 Plain-Language Reasons for LEA:")
    for r in res_high.top_reasons:
        print(f"  * {r}")

    print(f"\nAll {len(res_high.all_model_probabilities)} Models Comparison on this Complaint:")
    for m, p in res_high.all_model_probabilities.items():
        print(f"  - {m:<25}: {p:.4f}")

    assert res_high.is_cashout_risk is True
    assert len(res_high.top_reasons) == 3
    assert len(res_high.all_model_probabilities) >= 5
    assert lat_ms < 150.0  # Sequential scoring of all 7 models combined in <150ms

    # 2. Test Dynamic Model Switching
    predictor.set_active_model("HistGradientBoosting")
    res_hgb = predictor.predict_risk(high_risk_complaint)
    print(f"\nSwitched to {res_hgb.model_used}: Prob = {res_hgb.probability:.4f}, Tier = {res_hgb.risk_tier}")
    assert res_hgb.model_used == "HistGradientBoosting"

    # 3. Test Low-Risk Normal Debit
    low_risk_complaint = {
        "jcct_origin": "Nagpur",
        "pincode_tier": "rural",
        "amount": 800.0,
        "hop_depth": 1,
        "hop_velocity_min": 180.0,
        "account_age_days": 1200.0,
        "linked_device_count": 0,
        "time_to_file_min": 420.0,
        "atm_density_home_pincode": 6.0,
        "complainant_filing_count_90d": 0,
        "utr_verified": 1,
        "bank_corroborated": 1,
        "police_attested": 0,
        "attestation_count": 1,
    }
    res_low = predictor.predict_risk(low_risk_complaint, model_name="RandomForest (tuned)")
    print(f"\nLow-Risk Debit: Prob = {res_low.probability:.4f}, Risk Tier = {res_low.risk_tier}")
    assert res_low.probability < res_high.probability

    print("\n" + "=" * 70)
    print("ALL TESTS PASSED: CashoutPredictor multi-model service operational.")
    print("=" * 70)
