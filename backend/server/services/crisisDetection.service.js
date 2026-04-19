const path = require('path');
const keywordsData = require('../crisis/keywords.json');
const CrisisEvent = require('../models/CrisisEvent');
const CrisisLog = require('../models/CrisisLog');

/**
 * Crisis Detection Service — Two-Layer Architecture
 *
 * Layer 1 (keyword scanner):  Deterministic, instant, never removed.
 * Layer 2 (BERT / BART-MNLI): Probabilistic, async, 500ms timeout.
 *
 * Escalation rule:
 *   escalate = keywordFlagged
 *           OR (bertConfidence > 0.75 AND bertSeverity ∈ {medium, high})
 *
 * Every message is logged to CrisisLog regardless of outcome.
 */

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';
const BERT_TIMEOUT_MS = 500;
const BERT_CONFIDENCE_THRESHOLD = 0.75;
const BERT_ESCALATION_SEVERITIES = new Set(['medium', 'high']);

// ── Layer 1: Keyword Scanner (unchanged) ─────────────────────────────────

/**
 * Scan a message for crisis keywords.
 * @param {string} message - The user's message text
 * @param {string} language - Language code (en, hi, ur, ks, doi)
 * @returns {{ crisisDetected: boolean, matchedKeywords: string[], helplines: object[] }}
 */
function scanForCrisis(message, language = 'en') {
  const lang = keywordsData.keywords[language] ? language : 'en';
  const keywords = keywordsData.keywords[lang] || [];
  const messageLower = message.toLowerCase();

  const matchedKeywords = keywords.filter((kw) =>
    messageLower.includes(kw.toLowerCase())
  );

  const crisisDetected = matchedKeywords.length > 0;
  const helplines = crisisDetected
    ? keywordsData.helplines[lang] || keywordsData.helplines['en']
    : [];

  return { crisisDetected, matchedKeywords, helplines };
}

// ── Layer 2: BERT Crisis Classification ──────────────────────────────────

/**
 * Call POST /ml/crisis on the Python ML microservice.
 * Times out after 500ms — returns safe fallback on timeout or error.
 *
 * @param {string} message
 * @param {string} language
 * @returns {Promise<{ crisisDetected: boolean, severity: string, confidence: number, triggers: string[] }>}
 */
async function callBertCrisis(message, language = 'en') {
  const safeFallback = {
    crisisDetected: false,
    severity: 'none',
    confidence: 0.0,
    triggers: [],
    timedOut: false,
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), BERT_TIMEOUT_MS);

    const response = await fetch(`${ML_SERVICE_URL}/ml/crisis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, language }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`BERT crisis endpoint returned ${response.status}`);
      return safeFallback;
    }

    const data = await response.json();
    return {
      crisisDetected: data.crisisDetected || false,
      severity: data.severity || 'none',
      confidence: data.confidence || 0.0,
      triggers: data.triggers || [],
      timedOut: false,
    };
  } catch (err) {
    if (err.name === 'AbortError') {
      console.warn(`BERT crisis call timed out after ${BERT_TIMEOUT_MS}ms — using keyword result only`);
      return { ...safeFallback, timedOut: true };
    }
    console.warn(`BERT crisis call failed: ${err.message} — using keyword result only`);
    return safeFallback;
  }
}

// ── Two-Layer Orchestrator ───────────────────────────────────────────────

/**
 * Run both layers, determine escalation, and log the result.
 *
 * @param {string} sessionId
 * @param {string} message
 * @param {string} language
 * @returns {Promise<{
 *   crisisDetected: boolean,
 *   matchedKeywords: string[],
 *   helplines: object[],
 *   bertResult: { crisisDetected: boolean, severity: string, confidence: number, triggers: string[], timedOut: boolean },
 *   escalated: boolean
 * }>}
 */
async function detectAndLog(sessionId, message, language = 'en') {
  // Layer 1: keyword scan (sync, instant)
  const keywordResult = scanForCrisis(message, language);

  // Layer 2: BERT crisis classification (async, 500ms timeout)
  const bertResult = await callBertCrisis(message, language);

  // Escalation decision
  const keywordFlagged = keywordResult.crisisDetected;
  const bertFlagged = bertResult.crisisDetected;
  const bertMeetsThreshold =
    bertResult.confidence > BERT_CONFIDENCE_THRESHOLD &&
    BERT_ESCALATION_SEVERITIES.has(bertResult.severity);

  const escalated = keywordFlagged || bertMeetsThreshold;

  // Log to CrisisLog (every message, encrypted)
  try {
    await CrisisLog.create({
      sessionId,
      message,                          // encrypted by Sequelize hook
      language,
      keywordFlagged,
      bertFlagged,
      bertSeverity: bertResult.severity,
      bertConfidence: bertResult.confidence,
      escalated,
      detectedAt: new Date(),
    });
  } catch (err) {
    console.error('Failed to write CrisisLog:', err.message);
  }

  // Also log to legacy CrisisEvent if keywords fired (backward compat)
  if (keywordFlagged) {
    try {
      await CrisisEvent.create({
        sessionId,
        message,
        language,
        detectedKeywords: keywordResult.matchedKeywords,
        detectedAt: new Date(),
      });
    } catch (err) {
      console.error('Failed to log legacy CrisisEvent:', err.message);
    }
  }

  return {
    crisisDetected: keywordResult.crisisDetected,
    matchedKeywords: keywordResult.matchedKeywords,
    helplines: keywordResult.helplines,
    bertResult,
    escalated,
  };
}

module.exports = { scanForCrisis, callBertCrisis, detectAndLog };
