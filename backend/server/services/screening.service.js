const questionsData = require('../locales/questions.json');
const ScreeningResult = require('../models/ScreeningResult');
const { getSession, setSession } = require('../config/redis');

/**
 * Screening Service
 * Manages PHQ-9, GAD-7, GHQ-12 screening flows.
 * Tracks in-progress answers in Redis/memory; persists final results to Sequelize.
 */

const VALID_TYPES = ['PHQ9', 'GAD7', 'GHQ12'];

/**
 * Get the Redis key for an in-progress screening.
 */
function screeningKey(sessionId, screeningType) {
  return `screening:${sessionId}:${screeningType}`;
}

/**
 * Start a new screening session.
 * @returns {{ question, questionIndex, totalQuestions, screeningName, instruction, options }}
 */
async function startScreening(sessionId, screeningType, language = 'en') {
  if (!VALID_TYPES.includes(screeningType)) {
    throw new Error(`Invalid screening type: ${screeningType}. Valid: ${VALID_TYPES.join(', ')}`);
  }

  const screening = questionsData.screenings[screeningType];
  const lang = screening.questions[0][language] ? language : 'en';

  // Store empty answers in session
  const sessionData = {
    sessionId,
    screeningType,
    language: lang,
    answers: [],
    startedAt: new Date().toISOString(),
  };
  await setSession(screeningKey(sessionId, screeningType), sessionData);

  return {
    screeningName: screening.name[lang],
    instruction: screening.instruction[lang],
    question: screening.questions[0][lang],
    questionIndex: 0,
    totalQuestions: screening.questions.length,
    options: screening.options[lang],
  };
}

/**
 * Submit an answer and return the next question or final result.
 * @param {number} answer - 0-3 score for the answer
 * @returns {{ done: boolean, question?, questionIndex?, score?, severity?, totalQuestions? }}
 */
async function submitAnswer(sessionId, screeningType, questionIndex, answer, language = 'en') {
  if (!VALID_TYPES.includes(screeningType)) {
    throw new Error(`Invalid screening type: ${screeningType}`);
  }
  if (answer < 0 || answer > 3) {
    throw new Error('Answer must be between 0 and 3');
  }

  const key = screeningKey(sessionId, screeningType);
  let sessionData = await getSession(key);

  if (!sessionData) {
    // No in-progress screening — start fresh with this answer
    sessionData = {
      sessionId,
      screeningType,
      language: language,
      answers: [],
      startedAt: new Date().toISOString(),
    };
  }

  const screening = questionsData.screenings[screeningType];
  const lang = sessionData.language || language;
  const totalQuestions = screening.questions.length;

  // Validate question index
  if (questionIndex < 0 || questionIndex >= totalQuestions) {
    throw new Error(`Invalid questionIndex: ${questionIndex}. Must be 0-${totalQuestions - 1}`);
  }

  // Store the answer
  sessionData.answers[questionIndex] = answer;
  await setSession(key, sessionData);

  const nextIndex = questionIndex + 1;

  // If there are more questions, return the next one
  if (nextIndex < totalQuestions) {
    return {
      done: false,
      question: screening.questions[nextIndex][lang],
      questionIndex: nextIndex,
      totalQuestions,
      options: screening.options[lang],
    };
  }

  // Screening complete: calculate score and severity
  const score = sessionData.answers.reduce((sum, a) => sum + (a || 0), 0);
  const severityEntry = screening.severity.find(
    (s) => score >= s.min && score <= s.max
  );
  const severity = severityEntry
    ? severityEntry.label[lang] || severityEntry.label['en']
    : 'Unknown';
  const severityEn = severityEntry
    ? severityEntry.label['en']
    : 'Unknown';

  // Persist to DB
  try {
    await ScreeningResult.create({
      sessionId,
      type: screeningType,
      score,
      severity: severityEn,
      answers: sessionData.answers,
      completedAt: new Date(),
    });
  } catch (err) {
    console.error('Failed to save screening result:', err.message);
  }

  return {
    done: true,
    score,
    severity,
    severityKey: severityEn,
    totalQuestions,
    answers: sessionData.answers,
  };
}

/**
 * Get all past screening results for a session.
 */
async function getResults(sessionId) {
  const results = await ScreeningResult.findAll({
    where: { sessionId },
    order: [['completedAt', 'DESC']],
  });
  return results;
}

module.exports = { startScreening, submitAnswer, getResults, VALID_TYPES };
