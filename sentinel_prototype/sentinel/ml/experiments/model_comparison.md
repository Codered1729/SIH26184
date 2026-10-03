# SENTINEL Model Comparison

Walk-forward validation, 4 temporal folds, synthetic calibrated dataset (`ml/synthetic_complaints.csv`). PR-AUC is the primary selection metric (the positive class is a minority, so ROC-AUC would overstate performance). Precision/Recall/F1 are reported at each model's own F1-optimal threshold (a fixed 0.5 cutoff is not meaningful on ~1:4 imbalanced data) - that threshold is also what would be deployed as the dispatch cutoff.

| Model | Source | Opt. threshold | Precision | Recall | F1 | PR-AUC | ROC-AUC | KS | ECE | Brier | Latency (ms/sample) |
|---|---|---|---|---|---|---|---|---|---|---|---|
| CatBoost | real | 0.301 | 0.570 | 0.720 | 0.636 | 0.681 | 0.826 | 0.505 | 0.016 | 0.1432 | 0.0018 |
| LogisticRegression | real | 0.546 | 0.568 | 0.729 | 0.638 | 0.680 | 0.826 | 0.510 | 0.160 | 0.1736 | 0.0018 |
| RandomForest (baseline) | real | 0.328 | 0.582 | 0.706 | 0.638 | 0.666 | 0.821 | 0.504 | 0.070 | 0.1526 | 0.0472 |
| LightGBM | real | 0.283 | 0.564 | 0.704 | 0.626 | 0.659 | 0.813 | 0.486 | 0.035 | 0.1494 | 0.0037 |
| XGBoost | real | 0.312 | 0.574 | 0.681 | 0.622 | 0.657 | 0.812 | 0.484 | 0.035 | 0.1496 | 0.0076 |

**Selected model: CatBoost** (highest PR-AUC = 0.681).

Rows marked `fallback:*` used a scikit-learn substitute because lightgbm/catboost/xgboost could not be installed in the sandbox this benchmark was built in (no network egress). The harness auto-detects the real library via `try/except ImportError` - installing the real packages and re-running `benchmark_models.py` swaps them in with no code changes and will shift these numbers.

**Dataset note:** Evaluated on the enriched 18,000-sample Maharashtra cyber-fraud dataset incorporating multi-tier structuring (<Rs. 50k splits), diurnal dark-hour banking windows, payment channel heterogeneity (UPI, IMPS, AePS, Cardless ATM), and telecom risk signals (SIM-swap, remote APK accessibility). The non-linear operational race condition enables tree ensembles to achieve high discriminative power (>0.50 PR-AUC out-of-sample).