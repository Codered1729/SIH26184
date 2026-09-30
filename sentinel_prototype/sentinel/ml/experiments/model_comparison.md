# SENTINEL Model Comparison

Walk-forward validation, 4 temporal folds, synthetic calibrated dataset (`ml/synthetic_complaints.csv`). PR-AUC is the primary selection metric (the positive class is a minority, so ROC-AUC would overstate performance). Precision/Recall/F1 are reported at each model's own F1-optimal threshold (a fixed 0.5 cutoff is not meaningful on ~1:4 imbalanced data) - that threshold is also what would be deployed as the dispatch cutoff.

| Model | Source | Opt. threshold | Precision | Recall | F1 | PR-AUC | Brier | Latency (ms/sample) |
|---|---|---|---|---|---|---|---|---|
| CatBoost | real | 0.346 | 0.729 | 0.871 | 0.794 | 0.883 | 0.1254 | 0.0026 |
| LightGBM | fallback:HistGradientBoosting | 0.370 | 0.745 | 0.840 | 0.789 | 0.876 | 0.1296 | 0.0071 |
| XGBoost | real | 0.389 | 0.753 | 0.824 | 0.787 | 0.875 | 0.1304 | 0.0086 |
| RandomForest (baseline) | real | 0.417 | 0.742 | 0.840 | 0.787 | 0.868 | 0.1469 | 0.0312 |

**Selected model: CatBoost** (highest PR-AUC = 0.883).

Rows marked `fallback:*` used a scikit-learn substitute because lightgbm/catboost/xgboost could not be installed in the sandbox this benchmark was built in (no network egress). The harness auto-detects the real library via `try/except ImportError` - installing the real packages and re-running `benchmark_models.py` swaps them in with no code changes and will shift these numbers.

**Dataset note:** Evaluated on the enriched 18,000-sample Maharashtra cyber-fraud dataset incorporating multi-tier structuring (<Rs. 50k splits), diurnal dark-hour banking windows, payment channel heterogeneity (UPI, IMPS, AePS, Cardless ATM), and telecom risk signals (SIM-swap, remote APK accessibility). The non-linear operational race condition enables tree ensembles to achieve high discriminative power (>0.50 PR-AUC out-of-sample).