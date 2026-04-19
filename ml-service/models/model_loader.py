"""
Model Loader — loads all HuggingFace models once at startup and caches them.

Models loaded:
  - XLM-RoBERTa (zero-shot classification for English / fallback)
  - MuRIL (zero-shot classification for Hindi & Urdu)
  - OPUS-MT translation models (for Kashmiri & Dogri via pivot languages)
  - BART-MNLI (zero-shot crisis classification — placeholder for fine-tuned mBERT)

Usage:
  from models.model_loader import load_all_models, get_model
  await load_all_models()       # call once at startup
  pipe = get_model("xlm-roberta")
  pipe = get_model("crisis-bart-mnli")
"""

import logging
import time
from typing import Dict, Optional, Any

logger = logging.getLogger("ml-service.model_loader")

# ── Module-level cache ────────────────────────────────────────────────────
_models: Dict[str, Any] = {}
_load_errors: Dict[str, str] = {}

# ── Intent labels shared across all classifiers ──────────────────────────
INTENT_LABELS = [
    "stress",
    "anxiety",
    "depression",
    "grief",
    "loneliness",
    "greeting",
    "help",
    "screening_request",
    "unknown",
]

# ── Crisis labels for BERT-based crisis detection ────────────────────────
CRISIS_LABELS = [
    "suicidal ideation",
    "self-harm",
    "hopelessness",
    "crisis",
    "safe",
]


def _load_xlm_roberta() -> Optional[Any]:
    """Load XLM-RoBERTa for zero-shot classification (English + fallback)."""
    try:
        from transformers import pipeline

        logger.info("Loading XLM-RoBERTa (xlm-roberta-base) …")
        start = time.time()
        pipe = pipeline(
            "zero-shot-classification",
            model="joeddav/xlm-roberta-large-xnli",
            device=-1,  # CPU; set to 0 for GPU
        )
        elapsed = time.time() - start
        logger.info(f"  ✅ XLM-RoBERTa loaded in {elapsed:.1f}s")
        return pipe
    except Exception as e:
        logger.error(f"  ❌ XLM-RoBERTa failed to load: {e}")
        _load_errors["xlm-roberta"] = str(e)
        return None


def _load_muril() -> Optional[Any]:
    """Load MuRIL for zero-shot classification (Hindi & Urdu)."""
    try:
        from transformers import pipeline

        logger.info("Loading MuRIL (google/muril-base-cased) …")
        start = time.time()
        # MuRIL is a BERT model — zero-shot-classification still works
        # through the NLI head added by the xnli fine-tuned variant.
        # We use the base model with the zero-shot pipeline which adds
        # an NLI head dynamically.
        pipe = pipeline(
            "zero-shot-classification",
            model="google/muril-base-cased",
            device=-1,
        )
        elapsed = time.time() - start
        logger.info(f"  ✅ MuRIL loaded in {elapsed:.1f}s")
        return pipe
    except Exception as e:
        logger.error(f"  ❌ MuRIL failed to load: {e}")
        _load_errors["muril"] = str(e)
        return None


def _load_opus_mt(src: str, tgt: str) -> Optional[Any]:
    """Load a Helsinki-NLP OPUS-MT translation model."""
    model_name = f"Helsinki-NLP/opus-mt-{src}-{tgt}"
    key = f"opus-mt-{src}-{tgt}"
    try:
        from transformers import pipeline

        logger.info(f"Loading OPUS-MT ({model_name}) …")
        start = time.time()
        pipe = pipeline("translation", model=model_name, device=-1)
        elapsed = time.time() - start
        logger.info(f"  ✅ {key} loaded in {elapsed:.1f}s")
        return pipe
    except Exception as e:
        logger.error(f"  ❌ {key} failed to load: {e}")
        _load_errors[key] = str(e)
        return None


def _load_crisis_bart_mnli() -> Optional[Any]:
    """
    Load facebook/bart-large-mnli for zero-shot crisis classification.

    This is the placeholder model until a fine-tuned mBERT checkpoint
    (trained on CLPsych + RSDD datasets) is available.  To swap:
      1. Change the model name below to your fine-tuned checkpoint path.
      2. Update the pipeline task if using a sequence-classification head.
    """
    try:
        from transformers import pipeline

        logger.info("Loading Crisis BART-MNLI (facebook/bart-large-mnli) …")
        start = time.time()
        pipe = pipeline(
            "zero-shot-classification",
            model="facebook/bart-large-mnli",
            device=-1,  # CPU; set to 0 for GPU
        )
        elapsed = time.time() - start
        logger.info(f"  ✅ Crisis BART-MNLI loaded in {elapsed:.1f}s")
        return pipe
    except Exception as e:
        logger.error(f"  ❌ Crisis BART-MNLI failed to load: {e}")
        _load_errors["crisis-bart-mnli"] = str(e)
        return None


def load_all_models() -> Dict[str, bool]:
    """
    Load all models into memory. Called once at FastAPI startup.
    Returns a dict of model_name → loaded (bool).
    """
    global _models

    logger.info("═══ Loading all ML models ═══")
    total_start = time.time()

    # 1. XLM-RoBERTa (English + fallback)
    pipe = _load_xlm_roberta()
    if pipe:
        _models["xlm-roberta"] = pipe

    # 2. MuRIL (Hindi & Urdu)
    pipe = _load_muril()
    if pipe:
        _models["muril"] = pipe

    # 3. OPUS-MT translation models
    #    Kashmiri has no dedicated model — use ur↔en as proxy
    #    Dogri has no dedicated model — use hi↔en as proxy
    translation_pairs = [
        ("ur", "en"),   # Urdu → English (used for Kashmiri pivot)
        ("en", "ur"),   # English → Urdu (response back-translation)
        ("hi", "en"),   # Hindi → English (used for Dogri pivot)
        ("en", "hi"),   # English → Hindi (response back-translation)
    ]

    for src, tgt in translation_pairs:
        key = f"opus-mt-{src}-{tgt}"
        pipe = _load_opus_mt(src, tgt)
        if pipe:
            _models[key] = pipe

    # 4. Crisis classification (BART-MNLI placeholder for mBERT)
    pipe = _load_crisis_bart_mnli()
    if pipe:
        _models["crisis-bart-mnli"] = pipe

    total_elapsed = time.time() - total_start
    logger.info(f"═══ Model loading complete in {total_elapsed:.1f}s ═══")
    logger.info(f"  Loaded: {list(_models.keys())}")
    if _load_errors:
        logger.warning(f"  Failed: {list(_load_errors.keys())}")

    return {name: True for name in _models} | {
        name: False for name in _load_errors
    }


def get_model(name: str) -> Optional[Any]:
    """Retrieve a cached model pipeline by name, or None if unavailable."""
    return _models.get(name)


def get_loaded_models() -> list[str]:
    """Return list of successfully loaded model names."""
    return list(_models.keys())


def get_load_errors() -> Dict[str, str]:
    """Return dict of model names that failed to load and their errors."""
    return dict(_load_errors)
