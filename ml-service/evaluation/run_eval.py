#!/usr/bin/env python3
"""
NEONEXUS ML Evaluation Suite — Master Runner.

Runs evaluation suites for all 4 ML models and outputs metrics to console,
JSON report, and plots.

Usage:
  python run_eval.py              # Run all 4 evaluations
  python run_eval.py --model bert  # Run only mBERT crisis detection
  python run_eval.py --model xlmr  # Run only XLM-RoBERTa
  python run_eval.py --model muril # Run only MuRIL
  python run_eval.py --model opusmt # Run only OPUS-MT
"""

import argparse
import json
import logging
import sys
import time
from pathlib import Path

# ── Setup paths ──────────────────────────────────────────────────────────
EVAL_DIR = Path(__file__).resolve().parent
ML_ROOT = EVAL_DIR.parent
RESULTS_DIR = EVAL_DIR / "results"
PLOTS_DIR = RESULTS_DIR / "plots"

# Add ml-service root to path so evaluators can import services
if str(ML_ROOT) not in sys.path:
    sys.path.insert(0, str(ML_ROOT))

# ── Logging ──────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(name)-20s  %(levelname)-7s  %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("eval")

# ── Import evaluators ────────────────────────────────────────────────────
from evaluators import bert_evaluator, xlmr_evaluator, muril_evaluator, opusmt_evaluator

EVALUATORS = {
    "bert": ("mBERT / BART-MNLI (Crisis)", bert_evaluator),
    "xlmr": ("XLM-RoBERTa (Intent EN)", xlmr_evaluator),
    "muril": ("MuRIL (Intent HI/UR)", muril_evaluator),
    "opusmt": ("OPUS-MT (Translation)", opusmt_evaluator),
}


def print_divider(title: str):
    """Print a formatted section divider."""
    width = 70
    print(f"\n{'═' * width}")
    print(f"  {title}")
    print(f"{'═' * width}")


def print_metrics_table(metrics: dict, model_key: str):
    """Pretty-print metrics to the console using rich if available."""
    try:
        from rich.console import Console
        from rich.table import Table
        from rich.panel import Panel

        console = Console()

        # ── Main metrics table ────────────────────────────────────────
        table = Table(
            title=metrics.get("model", model_key),
            show_header=True,
            header_style="bold cyan",
        )
        table.add_column("Metric", style="bold")
        table.add_column("Value", justify="right")

        skip_keys = {
            "model", "confusion_matrix", "classification_report",
            "plot", "per_language", "per_language_pair",
        }

        for key, value in metrics.items():
            if key in skip_keys:
                continue
            if isinstance(value, float):
                table.add_row(key, f"{value:.4f}")
            else:
                table.add_row(key, str(value))

        console.print(table)

        # ── Per-language breakdown (MuRIL) ────────────────────────────
        if "per_language" in metrics:
            lang_table = Table(
                title="Per-Language Breakdown",
                show_header=True,
                header_style="bold magenta",
            )
            lang_table.add_column("Language")
            lang_table.add_column("Samples", justify="right")
            lang_table.add_column("Accuracy", justify="right")
            lang_table.add_column("F1 (weighted)", justify="right")

            for lang, lang_metrics in metrics["per_language"].items():
                lang_table.add_row(
                    lang,
                    str(lang_metrics.get("samples", "?")),
                    f"{lang_metrics['accuracy']:.4f}",
                    f"{lang_metrics['f1_weighted']:.4f}",
                )
            console.print(lang_table)

        # ── Per-pair breakdown (OPUS-MT) ──────────────────────────────
        if "per_language_pair" in metrics:
            pair_table = Table(
                title="Per-Language-Pair Scores",
                show_header=True,
                header_style="bold green",
            )
            pair_table.add_column("Pair")
            pair_table.add_column("Samples", justify="right")
            pair_table.add_column("Translated", justify="right")
            pair_table.add_column("BLEU", justify="right")
            pair_table.add_column("chrF", justify="right")

            for pair, scores in metrics["per_language_pair"].items():
                pair_table.add_row(
                    pair,
                    str(scores["samples"]),
                    str(scores["translated"]),
                    f"{scores['bleu']:.2f}",
                    f"{scores['chrf']:.2f}",
                )
            console.print(pair_table)

        # ── Classification report ─────────────────────────────────────
        if "classification_report" in metrics:
            report = metrics["classification_report"]
            cr_table = Table(
                title="Classification Report",
                show_header=True,
                header_style="bold yellow",
            )
            cr_table.add_column("Class")
            cr_table.add_column("Precision", justify="right")
            cr_table.add_column("Recall", justify="right")
            cr_table.add_column("F1-Score", justify="right")
            cr_table.add_column("Support", justify="right")

            for cls_name, cls_metrics in report.items():
                if isinstance(cls_metrics, dict) and "precision" in cls_metrics:
                    cr_table.add_row(
                        cls_name,
                        f"{cls_metrics['precision']:.4f}",
                        f"{cls_metrics['recall']:.4f}",
                        f"{cls_metrics['f1-score']:.4f}",
                        str(int(cls_metrics.get('support', 0))),
                    )
            console.print(cr_table)

    except ImportError:
        # Fallback: plain print
        print(json.dumps(metrics, indent=2, default=str))


def run_evaluation(model_key: str) -> dict:
    """Run a single evaluator and return its metrics."""
    name, evaluator = EVALUATORS[model_key]
    print_divider(f"Evaluating: {name}")

    start = time.time()
    try:
        metrics = evaluator.evaluate()
    except Exception as e:
        logger.error(f"  ❌ {name} evaluation failed: {e}")
        import traceback
        traceback.print_exc()
        metrics = {"model": name, "error": str(e)}

    elapsed = round(time.time() - start, 2)
    metrics["eval_time_s"] = elapsed
    logger.info(f"  ⏱  {name} completed in {elapsed}s")

    print_metrics_table(metrics, model_key)
    return metrics


def main():
    parser = argparse.ArgumentParser(
        description="NEONEXUS ML Model Evaluation Suite"
    )
    parser.add_argument(
        "--model",
        choices=["bert", "xlmr", "muril", "opusmt"],
        default=None,
        help="Evaluate a specific model (default: all 4)",
    )
    args = parser.parse_args()

    print("\n" + "╔" + "═" * 68 + "╗")
    print("║" + "  NEONEXUS ML Evaluation Suite".center(68) + "║")
    print("╚" + "═" * 68 + "╝")

    # Ensure output directories exist
    RESULTS_DIR.mkdir(parents=True, exist_ok=True)
    PLOTS_DIR.mkdir(parents=True, exist_ok=True)

    # Determine which models to evaluate
    if args.model:
        models_to_run = [args.model]
    else:
        models_to_run = list(EVALUATORS.keys())

    # Run evaluations
    all_results = {}
    total_start = time.time()

    for model_key in models_to_run:
        result = run_evaluation(model_key)
        all_results[model_key] = result

    total_elapsed = round(time.time() - total_start, 2)

    # ── Save JSON report ─────────────────────────────────────────────
    report_path = RESULTS_DIR / "eval_report.json"

    # Make results JSON-serializable (convert numpy types)
    def make_serializable(obj):
        if hasattr(obj, "tolist"):
            return obj.tolist()
        if hasattr(obj, "item"):
            return obj.item()
        return obj

    report_data = json.loads(json.dumps(all_results, default=make_serializable))
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(report_data, f, indent=2, ensure_ascii=False)

    print_divider("Summary")
    print(f"  Total time:    {total_elapsed}s")
    print(f"  Models tested: {len(all_results)}")
    print(f"  Report saved:  {report_path}")
    print(f"  Plots saved:   {PLOTS_DIR}/")
    print()

    # Quick summary table
    try:
        from rich.console import Console
        from rich.table import Table

        console = Console()
        summary = Table(title="Evaluation Summary", show_header=True, header_style="bold cyan")
        summary.add_column("Model")
        summary.add_column("Key Metric", justify="right")
        summary.add_column("Value", justify="right")
        summary.add_column("Time", justify="right")

        for key, result in all_results.items():
            if "error" in result:
                summary.add_row(result.get("model", key), "ERROR", result["error"], f"{result.get('eval_time_s', '?')}s")
            elif key in ("bert",):
                summary.add_row(result["model"], "F1", f"{result.get('f1', 0):.4f}", f"{result['eval_time_s']}s")
            elif key in ("xlmr", "muril"):
                summary.add_row(result["model"], "F1 (weighted)", f"{result.get('f1_weighted', 0):.4f}", f"{result['eval_time_s']}s")
            elif key == "opusmt":
                pairs = result.get("per_language_pair", {})
                avg_bleu = sum(p.get("bleu", 0) for p in pairs.values()) / max(len(pairs), 1)
                summary.add_row(result["model"], "Avg BLEU", f"{avg_bleu:.2f}", f"{result['eval_time_s']}s")

        console.print(summary)
    except ImportError:
        for key, result in all_results.items():
            print(f"  {result.get('model', key)}: {result.get('f1', result.get('f1_weighted', 'N/A'))}")


if __name__ == "__main__":
    main()
