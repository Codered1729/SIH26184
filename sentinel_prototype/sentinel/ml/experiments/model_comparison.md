# SENTINEL Model Comparison

Walk-forward validation, 4 temporal folds, synthetic calibrated dataset (`ml/synthetic_complaints.csv`). PR-AUC is the primary selection metric (the positive class is a minority, so ROC-AUC would overstate performance). Precision/Recall/F1 are reported at each model's own F1-optimal threshold (a fixed 0.5 cutoff is not meaningful on ~1:4 imbalanced data) - that threshold is also what would be deployed as the dispatch cutoff.

| Model | Source | Opt. threshold | Precision | Recall | F1 | PR-AUC | Brier | Latency (ms/sample) |
|---|---|---|---|---|---|---|---|---|
| XGBoost | fallback:RandomForest(tuned) | 0.242 | 0.317 | 0.813 | 0.455 | 0.353 | 0.1989 | 0.0205 |
| RandomForest (baseline) | real | 0.235 | 0.313 | 0.842 | 0.455 | 0.353 | 0.1989 | 0.0159 |
| LogisticRegression (baseline) | real | 0.212 | 0.306 | 0.883 | 0.453 | 0.352 | 0.1998 | 0.0008 |
| CatBoost | fallback:GradientBoosting | 0.135 | 0.301 | 0.896 | 0.449 | 0.333 | 0.2097 | 0.0035 |
| LightGBM | fallback:HistGradientBoosting | 0.140 | 0.305 | 0.855 | 0.448 | 0.327 | 0.2129 | 0.0034 |

**Selected model: XGBoost** (highest PR-AUC = 0.353).

Rows marked `fallback:*` used a scikit-learn substitute because lightgbm/catboost/xgboost could not be installed in the sandbox this benchmark was built in (no network egress). The harness auto-detects the real library via `try/except ImportError` - installing the real packages and re-running `benchmark_models.py` swaps them in with no code changes and will shift these numbers.

**Caveat on this particular result:** the synthetic label in `generate_synthetic_data.py` is generated from a roughly logistic function of linear features, which gives logistic regression a structural home-field advantage it won't have on real complaint data (which will have non-linear interactions boosted trees are built to capture). Treat this run as validation that the *harness* works end to end, not as the final model verdict - re-run against real or better-simulated data before presenting a winner as final.