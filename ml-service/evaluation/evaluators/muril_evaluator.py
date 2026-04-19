"""
MuRIL Intent Classification Evaluator (Hindi & Urdu).

Loads intent_test_indic.csv, runs each message through the muril service,
and calculates weighted multi-class metrics with per-language breakdown.
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

logger = logging.getLogger("eval.muril")

EVAL_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = EVAL_DIR / "data"
RESULTS_DIR = EVAL_DIR / "results"
PLOTS_DIR = RESULTS_DIR / "plots"

INDIC_CSV = DATA_DIR / "intent_test_indic.csv"

INTENTS = [
    "stress", "anxiety", "depression", "grief",
    "loneliness", "greeting", "help", "screening_request", "unknown",
]


def generate_sample_data() -> pd.DataFrame:
    """Generate synthetic Hindi/Urdu intent test data."""
    logger.info("Generating sample intent_test_indic.csv …")

    rows = [
        # Hindi
        {"message": "मुझे बहुत तनाव हो रहा है", "language": "hi", "true_intent": "stress"},
        {"message": "परीक्षा की चिंता से नींद नहीं आती", "language": "hi", "true_intent": "stress"},
        {"message": "मुझे हर वक्त चिंता रहती है", "language": "hi", "true_intent": "anxiety"},
        {"message": "मेरा दिल बहुत तेज धड़कता है बिना कारण", "language": "hi", "true_intent": "anxiety"},
        {"message": "मुझे किसी चीज़ में मन नहीं लगता", "language": "hi", "true_intent": "depression"},
        {"message": "मैं अंदर से खालीपन महसूस करता हूँ", "language": "hi", "true_intent": "depression"},
        {"message": "मेरी माँ का निधन हो गया", "language": "hi", "true_intent": "grief"},
        {"message": "मैं अपने दोस्त की मौत से टूट गया हूँ", "language": "hi", "true_intent": "grief"},
        {"message": "मुझे बहुत अकेलापन लगता है", "language": "hi", "true_intent": "loneliness"},
        {"message": "कोई मेरे साथ नहीं है", "language": "hi", "true_intent": "loneliness"},
        {"message": "नमस्ते, कैसे हो?", "language": "hi", "true_intent": "greeting"},
        {"message": "हैलो!", "language": "hi", "true_intent": "greeting"},
        {"message": "मुझे मदद चाहिए", "language": "hi", "true_intent": "help"},
        {"message": "क्या मैं डिप्रेशन टेस्ट ले सकता हूँ?", "language": "hi", "true_intent": "screening_request"},
        {"message": "आज मौसम कैसा है?", "language": "hi", "true_intent": "unknown"},

        # Urdu
        {"message": "مجھے بہت تناؤ ہو رہا ہے", "language": "ur", "true_intent": "stress"},
        {"message": "امتحانات کی وجہ سے نیند نہیں آتی", "language": "ur", "true_intent": "stress"},
        {"message": "مجھے ہر وقت فکر رہتی ہے", "language": "ur", "true_intent": "anxiety"},
        {"message": "میرا دل بلا وجہ تیز دھڑکتا ہے", "language": "ur", "true_intent": "anxiety"},
        {"message": "مجھے کسی چیز میں دلچسپی نہیں رہی", "language": "ur", "true_intent": "depression"},
        {"message": "میں اندر سے خالی محسوس کرتا ہوں", "language": "ur", "true_intent": "depression"},
        {"message": "میری امی کا انتقال ہو گیا", "language": "ur", "true_intent": "grief"},
        {"message": "میں اپنے دوست کی موت سے ٹوٹ گیا ہوں", "language": "ur", "true_intent": "grief"},
        {"message": "مجھے بہت تنہائی محسوس ہوتی ہے", "language": "ur", "true_intent": "loneliness"},
        {"message": "کوئی میرے ساتھ نہیں ہے", "language": "ur", "true_intent": "loneliness"},
        {"message": "السلام علیکم", "language": "ur", "true_intent": "greeting"},
        {"message": "ہیلو!", "language": "ur", "true_intent": "greeting"},
        {"message": "مجھے مدد چاہیے", "language": "ur", "true_intent": "help"},
        {"message": "کیا میں ڈپریشن ٹیسٹ لے سکتا ہوں؟", "language": "ur", "true_intent": "screening_request"},
        {"message": "آج موسم کیسا ہے؟", "language": "ur", "true_intent": "unknown"},
    ]

    df = pd.DataFrame(rows)
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    df.to_csv(INDIC_CSV, index=False, encoding="utf-8")
    logger.info(f"  Wrote {len(df)} rows to {INDIC_CSV}")
    return df


def load_data() -> pd.DataFrame:
    if not INDIC_CSV.exists():
        return generate_sample_data()
    df = pd.read_csv(INDIC_CSV)
    logger.info(f"Loaded {len(df)} rows from {INDIC_CSV}")
    return df


def _compute_metrics(y_true, y_pred):
    """Compute standard classification metrics."""
    return {
        "accuracy": round(accuracy_score(y_true, y_pred), 4),
        "precision_weighted": round(precision_score(y_true, y_pred, average="weighted", zero_division=0), 4),
        "recall_weighted": round(recall_score(y_true, y_pred, average="weighted", zero_division=0), 4),
        "f1_weighted": round(f1_score(y_true, y_pred, average="weighted", zero_division=0), 4),
    }


def evaluate() -> Dict[str, Any]:
    """Run the MuRIL intent classification evaluator with per-language breakdown."""
    ml_root = Path(__file__).resolve().parent.parent.parent
    if str(ml_root) not in sys.path:
        sys.path.insert(0, str(ml_root))

    from services.muril import classify

    df = load_data()
    y_true = df["true_intent"].tolist()
    y_pred = []
    confidences = []

    logger.info(f"Running MuRIL evaluation on {len(df)} samples …")

    for _, row in df.iterrows():
        result = classify(row["message"], row["language"])
        y_pred.append(result["intent"])
        confidences.append(result["confidence"])

    # ── Overall metrics ──────────────────────────────────────────────
    overall = _compute_metrics(y_true, y_pred)
    overall["avg_confidence"] = round(float(np.mean(confidences)), 4)

    report = classification_report(
        y_true, y_pred, labels=INTENTS, output_dict=True, zero_division=0
    )
    cm = confusion_matrix(y_true, y_pred, labels=INTENTS)

    # ── Per-language breakdown ────────────────────────────────────────
    per_lang = {}
    for lang in df["language"].unique():
        mask = df["language"] == lang
        lang_true = [y_true[i] for i in range(len(y_true)) if mask.iloc[i]]
        lang_pred = [y_pred[i] for i in range(len(y_pred)) if mask.iloc[i]]
        per_lang[lang] = _compute_metrics(lang_true, lang_pred)
        per_lang[lang]["samples"] = int(mask.sum())

    metrics = {
        "model": "MuRIL (Intent Classification — Hindi/Urdu)",
        "samples": len(df),
        **overall,
        "per_language": per_lang,
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
            cm, annot=True, fmt="d", cmap="Purples",
            xticklabels=INTENTS, yticklabels=INTENTS, ax=ax,
        )
        ax.set_xlabel("Predicted")
        ax.set_ylabel("Actual")
        ax.set_title("MuRIL Intent Classification (Hindi/Urdu) — Confusion Matrix")
        plt.xticks(rotation=45, ha="right")
        plt.yticks(rotation=0)
        fig.tight_layout()

        plot_path = PLOTS_DIR / "muril_confusion_matrix.png"
        fig.savefig(plot_path, dpi=150)
        plt.close(fig)
        logger.info(f"  Saved confusion matrix → {plot_path}")
        metrics["plot"] = str(plot_path)
    except ImportError:
        logger.warning("matplotlib/seaborn not installed — skipping plot")

    logger.info(
        f"  MuRIL Results: acc={overall['accuracy']}  "
        f"prec={overall['precision_weighted']}  "
        f"rec={overall['recall_weighted']}  "
        f"f1={overall['f1_weighted']}"
    )
    return metrics
