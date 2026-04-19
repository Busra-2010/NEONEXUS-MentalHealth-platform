const express = require('express');
const router = express.Router();
const screeningController = require('../controllers/screening.controller');

// POST /api/chat/screening/start — Start a screening
router.post('/screening/start', screeningController.startScreening);

// POST /api/chat/screening/answer — Submit answer, get next question or result
router.post('/screening/answer', screeningController.submitAnswer);

// GET /api/chat/screening/results/:sessionId — Get all past screening results
router.get('/screening/results/:sessionId', screeningController.getResults);

module.exports = router;
