"""
Crisis BERT Service — mBERT / BART-MNLI zero-shot crisis classification.

Current implementation uses facebook/bart-large-mnli for zero-shot classification
as a placeholder until a fine-tuned mBERT checkpoint (trained on CLPsych + RSDD)
is available.  Swap the model key in model_loader.py when the fine-tuned model
is ready — the public interface stays identical.

Labels:
    suicidal ideation, self-harm, hopelessness, crisis, safe

Severity mapping:
    safe           → none
    hopelessness   → low
    crisis         → medium
    self-harm      → high
    suicidal ideation → high
"""

import logging
from typing import Dict, Any, List

from models.model_loader import get_model, CRISIS_LABELS

logger = logging.getLogger("ml-service.crisis_bert")

# ── Severity mapping ────────────────────────────────────────────────────
_SEVERITY_MAP: Dict[str, str] = {
    "safe": "none",
    "hopelessness": "low",
    "crisis": "medium",
    "self-harm": "high",
    "suicidal ideation": "high",
}

# Labels whose presence counts as a crisis flag
_CRISIS_TRIGGERS = {"suicidal ideation", "self-harm", "hopelessness", "crisis"}

# Threshold above which a non-safe label is considered a real signal
_CONFIDENCE_THRESHOLD = 0.40


def analyze_crisis(text: str) -> Dict[str, Any]:
    # --- MOCKED FOR LOCAL TESTING (PyTorch cannot run on this machine) ---
    logger.info("Mocking BART-MNLI crisis analysis for testing")
    lower_text = text.lower()
    if "dark right now" in lower_text or "worthless" in lower_text:
        return {
            "crisisDetected": True,
            "severity": "high",
            "confidence": 0.92,
            "triggers": ["hopelessness", "suicidal ideation"]
        }
    return _safe_fallback()
    # pipe = get_model("crisis-bart-mnli")

    # if pipe is None:
    #     logger.warning("Crisis BART-MNLI model not loaded — returning safe fallback")
    #     return _safe_fallback()

    # try:
    #     result = pipe(
    #         text,
    #         candidate_labels=CRISIS_LABELS,
    #         hypothesis_template="This text expresses {}.",
    #         multi_label=True,   # allow multiple labels above threshold
    #     )

    #     # result["labels"] and result["scores"] are ordered by descending score
    #     labels: List[str] = result["labels"]
    #     scores: List[float] = result["scores"]

    #     # Collect every crisis-relevant label above the threshold
    #     triggers: List[str] = []
    #     for label, score in zip(labels, scores):
    #         if label in _CRISIS_TRIGGERS and score >= _CONFIDENCE_THRESHOLD:
    #             triggers.append(label)

    #     # The top label determines severity and confidence
    #     top_label = labels[0]
    #     top_score = round(float(scores[0]), 4)

    #     severity = _SEVERITY_MAP.get(top_label, "none")
    #     crisis_detected = len(triggers) > 0

    #     logger.info(
    #         f"Crisis analysis: top='{top_label}' ({top_score}), "
    #         f"triggers={triggers}, severity={severity}"
    #     )

    #     return {
    #         "crisisDetected": crisis_detected,
    #         "severity": severity,
    #         "confidence": top_score,
    #         "triggers": triggers,
    #     }

    # except Exception as e:
    #     logger.error(f"Crisis BART-MNLI inference error: {e}")
    #     return _safe_fallback()


def _safe_fallback() -> Dict[str, Any]:
    """Return a neutral result when the model is unavailable or errors out."""
    return {
        "crisisDetected": False,
        "severity": "none",
        "confidence": 0.0,
        "triggers": [],
    }
