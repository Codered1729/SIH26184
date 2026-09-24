# SENTINEL Model Comparison

Walk-forward validation, 4 temporal folds, synthetic calibrated dataset (`ml/synthetic_complaints.csv`). PR-AUC is the primary selection metric (the positive class is a minority, so ROC-AUC would overstate performance). Precision/Recall/F1 are reported at each model's own F1-optimal threshold (a fixed 0.5 cutoff is not meaningful on ~1:4 imbalanced data) - that threshold is also what would be deployed as the dispatch cutoff.

| Model | Source | Opt. threshold | Precision | Recall | F1 | PR-AUC | Brier | Latency (ms/sample) |
|---|---|---|---|---|---|---|---|---|
| RandomForest (baseline) | real | 0.235 | 0.313 | 0.842 | 0.455 | 0.353 | 0.1989 | 0.0170 |
| LogisticRegression (baseline) | real | 0.212 | 0.306 | 0.883 | 0.453 | 0.352 | 0.1998 | 0.0004 |
| CatBoost | real | 0.176 | 0.301 | 0.897 | 0.451 | 0.343 | 0.2027 | 0.0006 |
| XGBoost | real | 0.115 | 0.295 | 0.936 | 0.449 | 0.329 | 0.2107 | 0.0034 |
| LightGBM | fallback:HistGradientBoosting | 0.140 | 0.305 | 0.855 | 0.448 | 0.327 | 0.2129 | 0.0037 |

**Selected model: RandomForest (baseline)** (highest PR-AUC = 0.353).

Rows marked `fallback:*` used a scikit-learn substitute because lightgbm/catboost/xgboost could not be installed in the sandbox this benchmark was built in (no network egress). The harness auto-detects the real library via `try/except ImportError` - installing the real packages and re-running `benchmark_models.py` swaps them in with no code changes and will shift these numbers.

**Caveat on this particular result:** the synthetic label in `generate_synthetic_data.py` is generated from a roughly logistic function of linear features, which gives logistic regression a structural home-field advantage it won't have on real complaint data (which will have non-linear interactions boosted trees are built to capture). Treat this run as validation that the *harness* works end to end, not as the final model verdict - re-run against real or better-simulated data before presenting a winner as final.