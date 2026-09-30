# SENTINEL Model Comparison

Walk-forward validation, 4 temporal folds, synthetic calibrated dataset (`ml/synthetic_complaints.csv`). PR-AUC is the primary selection metric (the positive class is a minority, so ROC-AUC would overstate performance). Precision/Recall/F1 are reported at each model's own F1-optimal threshold (a fixed 0.5 cutoff is not meaningful on ~1:4 imbalanced data) - that threshold is also what would be deployed as the dispatch cutoff.

| Model | Source | Opt. threshold | Precision | Recall | F1 | PR-AUC | ROC-AUC | KS | ECE | Brier | Latency (ms/sample) |
|---|---|---|---|---|---|---|---|---|---|---|---|
| CatBoost | real | 0.349 | 0.736 | 0.858 | 0.792 | 0.878 | 0.903 | 0.634 | 0.018 | 0.1246 | 0.0023 |
| LightGBM | fallback:HistGradientBoosting | 0.351 | 0.743 | 0.838 | 0.787 | 0.872 | 0.899 | 0.624 | 0.033 | 0.1287 | 0.0070 |
| XGBoost | real | 0.373 | 0.749 | 0.830 | 0.787 | 0.871 | 0.897 | 0.625 | 0.033 | 0.1293 | 0.0095 |
| RandomForest (baseline) | real | 0.413 | 0.742 | 0.823 | 0.780 | 0.865 | 0.894 | 0.616 | 0.110 | 0.1453 | 0.0479 |

**Selected model: CatBoost** (highest PR-AUC = 0.878).

Rows marked `fallback:*` used a scikit-learn substitute because lightgbm/catboost/xgboost could not be installed in the sandbox this benchmark was built in (no network egress). The harness auto-detects the real library via `try/except ImportError` - installing the real packages and re-running `benchmark_models.py` swaps them in with no code changes and will shift these numbers.

**Dataset note:** Evaluated on the enriched 18,000-sample Maharashtra cyber-fraud dataset incorporating multi-tier structuring (<Rs. 50k splits), diurnal dark-hour banking windows, payment channel heterogeneity (UPI, IMPS, AePS, Cardless ATM), and telecom risk signals (SIM-swap, remote APK accessibility). The non-linear operational race condition enables tree ensembles to achieve high discriminative power (>0.50 PR-AUC out-of-sample).