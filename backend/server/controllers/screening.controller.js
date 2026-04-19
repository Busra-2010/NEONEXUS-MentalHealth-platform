const screeningService = require('../services/screening.service');

/**
 * POST /api/chat/screening/start
 * Body: { sessionId, screeningType, language? }
 */
async function startScreening(req, res) {
  try {
    const { sessionId, screeningType, language = 'en' } = req.body;

    if (!sessionId || !screeningType) {
      return res.status(400).json({
        success: false,
        error: 'sessionId and screeningType are required',
      });
    }

    if (!screeningService.VALID_TYPES.includes(screeningType)) {
      return res.status(400).json({
        success: false,
        error: `Invalid screeningType. Valid: ${screeningService.VALID_TYPES.join(', ')}`,
      });
    }

    const result = await screeningService.startScreening(sessionId, screeningType, language);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (err) {
    console.error('startScreening error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * POST /api/chat/screening/answer
 * Body: { sessionId, screeningType, questionIndex, answer (0-3), language? }
 */
async function submitAnswer(req, res) {
  try {
    const { sessionId, screeningType, questionIndex, answer, language = 'en' } = req.body;

    if (!sessionId || !screeningType || questionIndex === undefined || answer === undefined) {
      return res.status(400).json({
        success: false,
        error: 'sessionId, screeningType, questionIndex, and answer are required',
      });
    }

    if (typeof answer !== 'number' || answer < 0 || answer > 3) {
      return res.status(400).json({
        success: false,
        error: 'answer must be a number between 0 and 3',
      });
    }

    const result = await screeningService.submitAnswer(
      sessionId,
      screeningType,
      questionIndex,
      answer,
      language
    );

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (err) {
    console.error('submitAnswer error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * GET /api/chat/screening/results/:sessionId
 */
async function getResults(req, res) {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'sessionId is required',
      });
    }

    const results = await screeningService.getResults(sessionId);

    res.status(200).json({
      success: true,
      results,
    });
  } catch (err) {
    console.error('getResults error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = { startScreening, submitAnswer, getResults };
