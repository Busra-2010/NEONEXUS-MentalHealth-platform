"""
XLM-RoBERTa Intent Classification Evaluator (English).

Loads intent_test_en.csv, runs each message through the xlm_roberta service,
and calculates weighted multi-class metrics.
"""

import sys
import logging
import pandas as pd
import numpy as np
from pathlib import Path
from typing import Dict, Any

from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    classification_report,
)

logger = logging.getLogger("eval.xlmr")

EVAL_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = EVAL_DIR / "data"
RESULTS_DIR = EVAL_DIR / "results"
PLOTS_DIR = RESULTS_DIR / "plots"

INTENT_CSV = DATA_DIR / "intent_test_en.csv"

INTENTS = [
    "stress", "anxiety", "depression", "grief",
    "loneliness", "greeting", "help", "screening_request", "unknown",
]


def generate_sample_data() -> pd.DataFrame:
    """Generate synthetic English intent test data."""
    logger.info("Generating sample intent_test_en.csv …")

    rows = [
        # stress
        {"message": "I'm so stressed out about my exams.", "true_intent": "stress"},
        {"message": "Work deadlines are killing me.", "true_intent": "stress"},
        {"message": "I can't handle all this pressure anymore.", "true_intent": "stress"},
        {"message": "I feel overwhelmed by responsibilities.", "true_intent": "stress"},

        # anxiety
        {"message": "I keep worrying about everything.", "true_intent": "anxiety"},
        {"message": "My heart races for no reason and I can't sleep.", "true_intent": "anxiety"},
        {"message": "I have panic attacks almost daily.", "true_intent": "anxiety"},
        {"message": "I feel anxious all the time.", "true_intent": "anxiety"},

        # depression
        {"message": "I feel empty inside all the time.", "true_intent": "depression"},
        {"message": "Nothing brings me joy anymore.", "true_intent": "depression"},
        {"message": "I've lost interest in everything I used to love.", "true_intent": "depression"},
        {"message": "I feel like a burden to everyone.", "true_intent": "depression"},

        # grief
        {"message": "I just lost my mother and I can't cope.", "true_intent": "grief"},
        {"message": "My friend passed away and I feel devastated.", "true_intent": "grief"},
        {"message": "I'm grieving the loss of my pet.", "true_intent": "grief"},
        {"message": "The death of my grandmother has broken me.", "true_intent": "grief"},

        # loneliness
        {"message": "I feel so alone, nobody talks to me.", "true_intent": "loneliness"},
        {"message": "I have no friends and I feel isolated.", "true_intent": "loneliness"},
        {"message": "I moved to a new city and feel completely alone.", "true_intent": "loneliness"},
        {"message": "Nobody cares about me.", "true_intent": "loneliness"},

        # greeting
        {"message": "Hello, how are you?", "true_intent": "greeting"},
        {"message": "Hi there!", "true_intent": "greeting"},
        {"message": "Good morning!", "true_intent": "greeting"},
        {"message": "Hey, nice to meet you.", "true_intent": "greeting"},

        # help
        {"message": "Can you help me find a therapist?", "true_intent": "help"},
        {"message": "I need professional help.", "true_intent": "help"},
        {"message": "Where can I get counseling?", "true_intent": "help"},
        {"message": "How do I talk to a mental health professional?", "true_intent": "help"},

        # screening_request
        {"message": "Can I take a depression test?", "true_intent": "screening_request"},
        {"message": "I want to check my anxiety levels.", "true_intent": "screening_request"},
        {"message": "Is there a mental health questionnaire I can fill?", "true_intent": "screening_request"},
        {"message": "I'd like to do a self-assessment.", "true_intent": "screening_request"},

        # unknown
        {"message": "What time is it?", "true_intent": "unknown"},
        {"message": "Can you order pizza for me?", "true_intent": "unknown"},
        {"message": "Tell me a joke.", "true_intent": "unknown"},
        {"message": "What is the capital of France?", "true_intent": "unknown"},
    ]

    df = pd.DataFrame(rows)
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    df.to_csv(INTENT_CSV, index=False)
    logger.info(f"  Wrote {len(df)} rows to {INTENT_CSV}")
    return df


def load_data() -> pd.DataFrame:
    if not INTENT_CSV.exists():
        return generate_sample_data()
    df = pd.read_csv(INTENT_CSV)
    logger.info(f"Loaded {len(df)} rows from {INTENT_CSV}")
    return df


def evaluate() -> Dict[str, Any]:
    """Run the XLM-RoBERTa intent classification evaluator."""
    ml_root = Path(__file__).resolve().parent.parent.parent
    if str(ml_root) not in sys.path:
        sys.path.insert(0, str(ml_root))

    from services.xlm_roberta import classify

    df = load_data()
    y_true = df["true_intent"].tolist()
    y_pred = []
    confidences = []

    logger.info(f"Running XLM-RoBERTa evaluation on {len(df)} samples …")

    for _, row in df.iterrows():
        result = classify(row["message"])
        y_pred.append(result["intent"])
        confidences.append(result["confidence"])

    # ── Metrics (weighted for multi-class) ────────────────────────────
    acc = round(accuracy_score(y_true, y_pred), 4)
    prec = round(precision_score(y_true, y_pred, average="weighted", zero_division=0), 4)
    rec = round(recall_score(y_true, y_pred, average="weighted", zero_division=0), 4)
    f1 = round(f1_score(y_true, y_pred, average="weighted", zero_division=0), 4)

    report = classification_report(
        y_true, y_pred, labels=INTENTS, output_dict=True, zero_division=0
    )
    cm = confusion_matrix(y_true, y_pred, labels=INTENTS)

    metrics = {
        "model": "XLM-RoBERTa (Intent Classification — English)",
        "samples": len(df),
        "accuracy": acc,
        "precision_weighted": prec,
        "recall_weighted": rec,
        "f1_weighted": f1,
        "avg_confidence": round(float(np.mean(confidences)), 4),
        "confusion_matrix": cm.tolist(),
        "classification_report": report,
    }

    # ── Plot ──────────────────────────────────────────────────────────
    try:
        import matplotlib
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt
        import seaborn as sns

        PLOTS_DIR.mkdir(parents=True, exist_ok=True)

        fig, ax = plt.subplots(figsize=(10, 8))
        sns.heatmap(
            cm, annot=True, fmt="d", cmap="Blues",
            xticklabels=INTENTS, yticklabels=INTENTS, ax=ax,
        )
        ax.set_xlabel("Predicted")
        ax.set_ylabel("Actual")
        ax.set_title("XLM-RoBERTa Intent Classification — Confusion Matrix")
        plt.xticks(rotation=45, ha="right")
        plt.yticks(rotation=0)
        fig.tight_layout()

        plot_path = PLOTS_DIR / "xlmr_confusion_matrix.png"
        fig.savefig(plot_path, dpi=150)
        plt.close(fig)
        logger.info(f"  Saved confusion matrix → {plot_path}")
        metrics["plot"] = str(plot_path)
    except ImportError:
        logger.warning("matplotlib/seaborn not installed — skipping plot")

    logger.info(
        f"  XLM-R Results: acc={acc}  prec={prec}  rec={rec}  f1={f1}"
    )
    return metrics
