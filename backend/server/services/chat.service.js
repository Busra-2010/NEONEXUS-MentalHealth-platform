const responses = require('../locales/responses.json');

/**
 * Chat Service — generates localized replies based on intent.
 *
 * Keeps response generation separate from NLP and crisis detection.
 * All text comes from locales/responses.json — no hardcoded strings.
 */

/**
 * Generate a reply for a given intent and language.
 * @param {string} message - Original user message (for future context use)
 * @param {string} intent - Classified intent
 * @param {string} language - Language code
 * @returns {string} The localized reply text
 */
function generateReply(message, intent, language = 'en') {
  const intentResponses = responses[intent] || responses['general'];

  // Try requested language, fall back to English
  return intentResponses[language] || intentResponses['en'] || responses['general']['en'];
}

module.exports = { generateReply };
