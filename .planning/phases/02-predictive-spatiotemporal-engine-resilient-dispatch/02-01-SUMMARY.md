---
phase: 02-predictive-spatiotemporal-engine-resilient-dispatch
plan: 01
subsystem: ml-cashout-prediction
tags: [model-training, serialization, multi-model, explainability, top-3-reasons]
requires:
  - phase: 01-01
    provides: Maharashtra synthetic complaints dataset
provides:
  - Multi-model training and serialization pipeline (train_and_serialize.py)
  - Serialized model bundle cashout_model.pkl containing all 5 trained models with thresholds
  - Production CashoutPredictor service with runtime model switching and Top-3 explainable reasons
affects: [02-02, 02-03, phase-03]
actuals:
  tasks: 2
  commits: 1
tech-stack:
  added: []
  patterns: [Multi-model bundle serialization, F1-optimal threshold calibration, rule-based feature contribution explainability]
key-files:
  created:
    - sentinel_prototype/sentinel/ml/train_and_serialize.py
    - sentinel_prototype/sentinel/ml/models/cashout_model.pkl
    - sentinel_prototype/sentinel/backend/app/services/predictor.py
  modified: []
key-decisions:
  - "Trained and bundled all 5 candidate models into cashout_model.pkl with individual optimal thresholds"
  - "Defaulted primary model to RandomForest (tuned) while enabling runtime switching to any of the 5 models"
  - "Attached all_model_probabilities dictionary to every prediction result for multi-model consensus and judge transparency"
  - "Provided Top-3 plain-language explainability contributions for law enforcement officers"
requirements-completed: [PRED-01]
coverage:
  - id: P1
    description: "Multi-model training, calibration, and serialization"
    requirement: "PRED-01"
    verification:
      - kind: unit
        ref: "python sentinel_prototype/sentinel/ml/train_and_serialize.py"
        status: pass
  - id: P2
    description: "CashoutPredictor real-time inference and Top-3 explainability"
    requirement: "PRED-01"
    verification:
      - kind: unit
        ref: "python sentinel_prototype/sentinel/backend/app/services/predictor.py"
        status: pass
---

# Plan 02-01 Summary: Multi-Model Cash-Out Prediction & Top-3 Explainability

## Accomplishments
1. **Multi-Model Training Pipeline**: Created `sentinel_prototype/sentinel/ml/train_and_serialize.py` training all 5 models on 12,000 Maharashtra complaints:
   - `RandomForest (tuned)` (PR-AUC 0.611, F1 0.573, Opt-Thresh 0.297)
   - `HistGradientBoosting` (PR-AUC 0.535, F1 0.529, Opt-Thresh 0.277)
   - `GradientBoosting` (PR-AUC 0.661, F1 0.596, Opt-Thresh 0.296)
   - `LogisticRegression` (PR-AUC 0.363, F1 0.454, Opt-Thresh 0.223)
   - `RandomForest (baseline)` (PR-AUC 0.611, F1 0.573, Opt-Thresh 0.292)
2. **Unified Bundle Serialization**: Saved all 5 estimators, `OneHotEncoder`, feature columns, optimal decision thresholds, and feature importances into `sentinel_prototype/sentinel/ml/models/cashout_model.pkl` (12.9 MB).
3. **Multi-Model `CashoutPredictor` Service**: Built `sentinel_prototype/sentinel/backend/app/services/predictor.py`:
   - Returns calibrated probability, binary cash-out risk, optimal threshold, risk tier (`CRITICAL`, `HIGH`, `ELEVATED`, `LOW`).
   - Attaches `all_model_probabilities` capturing the consensus across all 5 architectures simultaneously.
   - Provides runtime model switching (`.set_active_model(model_name)`).
   - Generates Top-3 plain-language explainability reasons for LEA officers based on hop velocity, shared hardware devices, transaction amount, and sectoral ATM density.
4. **Verification**: Standalone self-tests pass with 0 warnings and low inference latency.
