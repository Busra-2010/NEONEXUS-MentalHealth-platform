"""
OPUS-MT Translation Evaluator.

Loads translation_test.csv, runs each entry through the opus_mt service,
and calculates BLEU and chrF scores using sacrebleu.
"""

import sys
import logging
import pandas as pd
from pathlib import Path
from typing import Dict, Any, List

logger = logging.getLogger("eval.opusmt")

EVAL_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = EVAL_DIR / "data"
RESULTS_DIR = EVAL_DIR / "results"
PLOTS_DIR = RESULTS_DIR / "plots"

TRANSLATION_CSV = DATA_DIR / "translation_test.csv"


def generate_sample_data() -> pd.DataFrame:
    """Generate synthetic translation test data."""
    logger.info("Generating sample translation_test.csv …")

    rows = [
        # Hindi → English
        {"source_text": "मुझे बहुत तनाव हो रहा है", "source_lang": "hi", "reference_translation": "I am very stressed", "target_lang": "en"},
        {"source_text": "मैं ठीक हूँ", "source_lang": "hi", "reference_translation": "I am fine", "target_lang": "en"},
        {"source_text": "मुझे मदद चाहिए", "source_lang": "hi", "reference_translation": "I need help", "target_lang": "en"},
        {"source_text": "आज अच्छा दिन है", "source_lang": "hi", "reference_translation": "Today is a good day", "target_lang": "en"},
        {"source_text": "मुझे चिंता हो रही है", "source_lang": "hi", "reference_translation": "I am feeling worried", "target_lang": "en"},

        # Urdu → English
        {"source_text": "مجھے بہت پریشانی ہو رہی ہے", "source_lang": "ur", "reference_translation": "I am very worried", "target_lang": "en"},
        {"source_text": "میں ٹھیک ہوں", "source_lang": "ur", "reference_translation": "I am fine", "target_lang": "en"},
        {"source_text": "مجھے مدد چاہیے", "source_lang": "ur", "reference_translation": "I need help", "target_lang": "en"},
        {"source_text": "آج اچھا دن ہے", "source_lang": "ur", "reference_translation": "Today is a good day", "target_lang": "en"},
        {"source_text": "مجھے فکر ہو رہی ہے", "source_lang": "ur", "reference_translation": "I am feeling worried", "target_lang": "en"},

        # Kashmiri (via Urdu pivot) → English
        {"source_text": "مے کَن ہَکھ وِچھنہ", "source_lang": "ks", "reference_translation": "I want to see you", "target_lang": "en"},
        {"source_text": "اَز موسم ٹھیک چھُ", "source_lang": "ks", "reference_translation": "The weather is fine today", "target_lang": "en"},

        # Dogri (via Hindi pivot) → English
        {"source_text": "मैं ठीक हां", "source_lang": "doi", "reference_translation": "I am fine", "target_lang": "en"},
        {"source_text": "अज्ज चंगा दिन है", "source_lang": "doi", "reference_translation": "Today is a good day", "target_lang": "en"},

        # English → Hindi
        {"source_text": "I am feeling stressed", "source_lang": "en", "reference_translation": "मुझे तनाव हो रहा है", "target_lang": "hi"},
        {"source_text": "I need help", "source_lang": "en", "reference_translation": "मुझे मदद चाहिए", "target_lang": "hi"},

        # English → Urdu
        {"source_text": "I am feeling stressed", "source_lang": "en", "reference_translation": "مجھے تناؤ ہو رہا ہے", "target_lang": "ur"},
        {"source_text": "I need help", "source_lang": "en", "reference_translation": "مجھے مدد چاہیے", "target_lang": "ur"},
    ]

    df = pd.DataFrame(rows)
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    df.to_csv(TRANSLATION_CSV, index=False, encoding="utf-8")
    logger.info(f"  Wrote {len(df)} rows to {TRANSLATION_CSV}")
    return df


def load_data() -> pd.DataFrame:
    if not TRANSLATION_CSV.exists():
        return generate_sample_data()
    df = pd.read_csv(TRANSLATION_CSV)
    logger.info(f"Loaded {len(df)} rows from {TRANSLATION_CSV}")
    return df


def evaluate() -> Dict[str, Any]:
    """
    Run the OPUS-MT translation evaluator.

    Calculates BLEU and chrF scores per language pair.
    """
    ml_root = Path(__file__).resolve().parent.parent.parent
    if str(ml_root) not in sys.path:
        sys.path.insert(0, str(ml_root))

    from services.opus_mt import translate

    # Try to import sacrebleu — fall back to dummy scores if missing
    try:
        import sacrebleu
        has_sacrebleu = True
    except ImportError:
        logger.warning("sacrebleu not installed — using placeholder scores")
        has_sacrebleu = False

    df = load_data()

    logger.info(f"Running OPUS-MT evaluation on {len(df)} samples …")

    # Group predictions by language pair
    pairs: Dict[str, Dict[str, List[str]]] = {}

    for _, row in df.iterrows():
        pair_key = f"{row['source_lang']}→{row['target_lang']}"

        if pair_key not in pairs:
            pairs[pair_key] = {"hypotheses": [], "references": [], "failed": 0}

        result = translate(row["source_text"], row["source_lang"], row["target_lang"])

        if result is None:
            pairs[pair_key]["failed"] += 1
            pairs[pair_key]["hypotheses"].append("")
        else:
            pairs[pair_key]["hypotheses"].append(result)

        pairs[pair_key]["references"].append(row["reference_translation"])

    # ── Compute BLEU and chrF per pair ────────────────────────────────
    per_pair = {}
    for pair_key, data in pairs.items():
        hyps = data["hypotheses"]
        refs = data["references"]
        n_total = len(hyps)
        n_failed = data["failed"]

        if has_sacrebleu and n_total > n_failed:
            # Filter out failed translations
            valid = [(h, r) for h, r in zip(hyps, refs) if h]
            if valid:
                v_hyps, v_refs = zip(*valid)
                bleu = sacrebleu.corpus_bleu(list(v_hyps), [list(v_refs)])
                chrf = sacrebleu.corpus_chrf(list(v_hyps), [list(v_refs)])
                per_pair[pair_key] = {
                    "samples": n_total,
                    "translated": n_total - n_failed,
                    "failed": n_failed,
                    "bleu": round(bleu.score, 2),
                    "chrf": round(chrf.score, 2),
                }
            else:
                per_pair[pair_key] = {
                    "samples": n_total,
                    "translated": 0,
                    "failed": n_failed,
                    "bleu": 0.0,
                    "chrf": 0.0,
                    "note": "all translations failed — model not loaded",
                }
        else:
            per_pair[pair_key] = {
                "samples": n_total,
                "translated": n_total - n_failed,
                "failed": n_failed,
                "bleu": 0.0,
                "chrf": 0.0,
                "note": "sacrebleu not installed or all failed",
            }

    metrics = {
        "model": "OPUS-MT (Translation — Helsinki-NLP)",
        "samples": len(df),
        "per_language_pair": per_pair,
    }

    # ── Plot bar chart of BLEU scores ─────────────────────────────────
    try:
        import matplotlib
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt

        PLOTS_DIR.mkdir(parents=True, exist_ok=True)

        pair_names = list(per_pair.keys())
        bleu_scores = [per_pair[p]["bleu"] for p in pair_names]
        chrf_scores = [per_pair[p]["chrf"] for p in pair_names]

        x = range(len(pair_names))
        width = 0.35

        fig, ax = plt.subplots(figsize=(10, 6))
        bars1 = ax.bar([i - width / 2 for i in x], bleu_scores, width, label="BLEU", color="#4C72B0")
        bars2 = ax.bar([i + width / 2 for i in x], chrf_scores, width, label="chrF", color="#55A868")

        ax.set_xlabel("Language Pair")
        ax.set_ylabel("Score")
        ax.set_title("OPUS-MT Translation Quality — BLEU & chrF Scores")
        ax.set_xticks(list(x))
        ax.set_xticklabels(pair_names, rotation=30, ha="right")
        ax.legend()
        ax.set_ylim(0, 100)

        # Add value labels on bars
        for bar in bars1:
            height = bar.get_height()
            if height > 0:
                ax.annotate(f"{height:.1f}", xy=(bar.get_x() + bar.get_width() / 2, height),
                            xytext=(0, 3), textcoords="offset points", ha="center", fontsize=8)
        for bar in bars2:
            height = bar.get_height()
            if height > 0:
                ax.annotate(f"{height:.1f}", xy=(bar.get_x() + bar.get_width() / 2, height),
                            xytext=(0, 3), textcoords="offset points", ha="center", fontsize=8)

        fig.tight_layout()
        plot_path = PLOTS_DIR / "opusmt_bleu_chrf.png"
        fig.savefig(plot_path, dpi=150)
        plt.close(fig)
        logger.info(f"  Saved BLEU/chrF chart → {plot_path}")
        metrics["plot"] = str(plot_path)
    except ImportError:
        logger.warning("matplotlib not installed — skipping plot")

    for pair, scores in per_pair.items():
        logger.info(f"  {pair}: BLEU={scores['bleu']}  chrF={scores['chrf']}  ({scores['translated']}/{scores['samples']} translated)")

    return metrics
