"""
mBERT / BART-MNLI Crisis Detection Evaluator.

Loads crisis_test.csv, runs each message through the crisis_bert service,
and calculates binary classification metrics (accuracy, precision, recall, F1).
Outputs a confusion matrix heatmap.
"""

import os
import sys
import logging
import json
import pandas as pd
import numpy as np
from pathlib import Path
from typing import Dict, Any, Tuple

from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    classification_report,
)

logger = logging.getLogger("eval.bert")

# ── Paths ──────────────────────────────────────────────────────────────
EVAL_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = EVAL_DIR / "data"
RESULTS_DIR = EVAL_DIR / "results"
PLOTS_DIR = RESULTS_DIR / "plots"

CRISIS_CSV = DATA_DIR / "crisis_test.csv"


def generate_sample_data() -> pd.DataFrame:
    """Generate synthetic crisis test data when real data is not available."""
    logger.info("Generating sample crisis_test.csv …")

    rows = [
        # Safe messages
        {"message": "I had a great day today!", "language": "en", "label": 0},
        {"message": "The weather is really nice.", "language": "en", "label": 0},
        {"message": "I'm looking forward to the weekend.", "language": "en", "label": 0},
        {"message": "My project is going well.", "language": "en", "label": 0},
        {"message": "I enjoyed the movie last night.", "language": "en", "label": 0},
        {"message": "Had a good lunch with friends.", "language": "en", "label": 0},
        {"message": "Feeling ok, just a bit tired.", "language": "en", "label": 0},
        {"message": "Thanks for checking in, I'm fine.", "language": "en", "label": 0},
        {"message": "I like this new song.", "language": "en", "label": 0},
        {"message": "Today was a peaceful day.", "language": "en", "label": 0},
        {"message": "I'm planning to cook dinner.", "language": "en", "label": 0},
        {"message": "My cats are being silly today.", "language": "en", "label": 0},
        {"message": "Just finished my assignment.", "language": "en", "label": 0},
        {"message": "The book I'm reading is interesting.", "language": "en", "label": 0},
        {"message": "I feel content with how things are going.", "language": "en", "label": 0},

        # Crisis messages
        {"message": "I want to kill myself.", "language": "en", "label": 1},
        {"message": "I can't take this anymore, I want to die.", "language": "en", "label": 1},
        {"message": "I'm thinking about ending my life.", "language": "en", "label": 1},
        {"message": "Everything is so dark right now, I feel worthless.", "language": "en", "label": 1},
        {"message": "Nobody would miss me if I was gone.", "language": "en", "label": 1},
        {"message": "I've been cutting myself to cope.", "language": "en", "label": 1},
        {"message": "I feel like the world would be better without me.", "language": "en", "label": 1},
        {"message": "I have no reason to keep living.", "language": "en", "label": 1},
        {"message": "I've been stockpiling pills.", "language": "en", "label": 1},
        {"message": "I just want the pain to stop permanently.", "language": "en", "label": 1},
        {"message": "Life is meaningless and I am worthless.", "language": "en", "label": 1},
        {"message": "I don't see any future for myself.", "language": "en", "label": 1},
        {"message": "I've written goodbye letters to my family.", "language": "en", "label": 1},
        {"message": "Everything feels hopeless and dark right now.", "language": "en", "label": 1},
        {"message": "I hurt myself last night.", "language": "en", "label": 1},

        # Hindi crisis messages
        {"message": "मैं मरना चाहता हूँ", "language": "hi", "label": 1},
        {"message": "मुझे कोई उम्मीद नहीं दिखती", "language": "hi", "label": 1},

        # Hindi safe messages
        {"message": "आज का दिन अच्छा था", "language": "hi", "label": 0},
        {"message": "मैं ठीक हूँ, धन्यवाद", "language": "hi", "label": 0},

        # Urdu messages
        {"message": "میں زندگی ختم کرنا چاہتا ہوں", "language": "ur", "label": 1},
        {"message": "آج موسم اچھا ہے", "language": "ur", "label": 0},
    ]

    df = pd.DataFrame(rows)
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    df.to_csv(CRISIS_CSV, index=False)
    logger.info(f"  Wrote {len(df)} rows to {CRISIS_CSV}")
    return df


def load_data() -> pd.DataFrame:
    """Load the crisis test CSV, generating sample data if missing."""
    if not CRISIS_CSV.exists():
        return generate_sample_data()
    df = pd.read_csv(CRISIS_CSV)
    logger.info(f"Loaded {len(df)} rows from {CRISIS_CSV}")
    return df


def evaluate() -> Dict[str, Any]:
    """
    Run the mBERT / BART-MNLI crisis evaluator.

    Returns a dict with all metrics and the confusion matrix.
    """
    # Add ml-service root to path so we can import services
    ml_root = Path(__file__).resolve().parent.parent.parent
    if str(ml_root) not in sys.path:
        sys.path.insert(0, str(ml_root))

    from services.crisis_bert import analyze_crisis

    df = load_data()
    y_true = df["label"].tolist()
    y_pred = []

    logger.info(f"Running BERT crisis evaluation on {len(df)} samples …")

    for _, row in df.iterrows():
        result = analyze_crisis(row["message"])
        pred = 1 if result["crisisDetected"] else 0
        y_pred.append(pred)

    # ── Metrics ──────────────────────────────────────────────────────
    acc = round(accuracy_score(y_true, y_pred), 4)
    prec = round(precision_score(y_true, y_pred, zero_division=0), 4)
    rec = round(recall_score(y_true, y_pred, zero_division=0), 4)
    f1 = round(f1_score(y_true, y_pred, zero_division=0), 4)
    cm = confusion_matrix(y_true, y_pred, labels=[0, 1])

    report = classification_report(
        y_true, y_pred, target_names=["safe", "crisis"], output_dict=True,
        zero_division=0
    )

    metrics = {
        "model": "mBERT / BART-MNLI (Crisis Detection)",
        "samples": len(df),
        "accuracy": acc,
        "precision": prec,
        "recall": rec,
        "f1": f1,
        "confusion_matrix": cm.tolist(),
        "classification_report": report,
    }

    # ── Plot confusion matrix ────────────────────────────────────────
    try:
        import matplotlib
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt
        import seaborn as sns

        PLOTS_DIR.mkdir(parents=True, exist_ok=True)

        fig, ax = plt.subplots(figsize=(6, 5))
        sns.heatmap(
            cm, annot=True, fmt="d", cmap="RdYlGn_r",
            xticklabels=["safe", "crisis"],
            yticklabels=["safe", "crisis"],
            ax=ax,
        )
        ax.set_xlabel("Predicted")
        ax.set_ylabel("Actual")
        ax.set_title("mBERT Crisis Detection — Confusion Matrix")
        fig.tight_layout()

        plot_path = PLOTS_DIR / "bert_confusion_matrix.png"
        fig.savefig(plot_path, dpi=150)
        plt.close(fig)
        logger.info(f"  Saved confusion matrix → {plot_path}")
        metrics["plot"] = str(plot_path)
    except ImportError:
        logger.warning("matplotlib/seaborn not installed — skipping plot")

    logger.info(
        f"  BERT Results: acc={acc}  prec={prec}  rec={rec}  f1={f1}"
    )
    return metrics
