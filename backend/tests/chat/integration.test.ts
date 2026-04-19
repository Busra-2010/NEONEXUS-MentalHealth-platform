/**
 * Integration tests for /api/chat endpoints.
 *
 * Uses a standalone Express app with in-memory SQLite
 * so no external database is needed.
 */
const express = require('express');
const request = require('supertest');

// Override DB to use in-memory SQLite before importing anything else
process.env.CHAT_DB_PATH = ':memory:';

const { router, initChatModule } = require('../../server/app');

let app: any;

beforeAll(async () => {
  app = express();
  app.use(express.json());
  app.use('/api/chat', router);
  await initChatModule();
}, 15000);

describe('POST /api/chat/session', () => {
  it('should create an anonymous session with UUID', async () => {
    const res = await request(app).post('/api/chat/session');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.sessionId).toBeDefined();
    expect(res.body.sessionId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
  });
});

describe('POST /api/chat/message', () => {
  let sessionId: string;

  beforeAll(async () => {
    const res = await request(app).post('/api/chat/session');
    sessionId = res.body.sessionId;
  });

  it('should return a reply with intent classification', async () => {
    const res = await request(app)
      .post('/api/chat/message')
      .send({ sessionId, message: 'Hello there!', language: 'en' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.reply).toBeDefined();
    expect(res.body.intent).toBeDefined();
    expect(res.body.crisisDetected).toBe(false);
  });

  it('should detect crisis keywords and return helplines', async () => {
    const res = await request(app)
      .post('/api/chat/message')
      .send({ sessionId, message: 'I want to kill myself', language: 'en' });

    expect(res.status).toBe(200);
    expect(res.body.crisisDetected).toBe(true);
    expect(res.body.helplines).toBeDefined();
    expect(res.body.helplines.length).toBeGreaterThan(0);
    expect(res.body.severity).toBe('crisis');
  });

  it('should handle Hindi messages', async () => {
    const res = await request(app)
      .post('/api/chat/message')
      .send({ sessionId, message: 'मुझे बहुत तनाव हो रहा है', language: 'hi' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.reply).toBeDefined();
    expect(res.body.intent).toBe('stress');
  });

  it('should return 400 for missing fields', async () => {
    const res = await request(app)
      .post('/api/chat/message')
      .send({ sessionId });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe('POST /api/chat/screening/start', () => {
  let sessionId: string;

  beforeAll(async () => {
    const res = await request(app).post('/api/chat/session');
    sessionId = res.body.sessionId;
  });

  it('should start PHQ9 screening and return the first question', async () => {
    const res = await request(app)
      .post('/api/chat/screening/start')
      .send({ sessionId, screeningType: 'PHQ9', language: 'en' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.question).toBeDefined();
    expect(res.body.questionIndex).toBe(0);
    expect(res.body.totalQuestions).toBe(9);
    expect(res.body.options).toHaveLength(4);
  });

  it('should start GAD7 screening', async () => {
    const res = await request(app)
      .post('/api/chat/screening/start')
      .send({ sessionId, screeningType: 'GAD7' });

    expect(res.status).toBe(200);
    expect(res.body.totalQuestions).toBe(7);
  });

  it('should start GHQ12 screening', async () => {
    const res = await request(app)
      .post('/api/chat/screening/start')
      .send({ sessionId, screeningType: 'GHQ12' });

    expect(res.status).toBe(200);
    expect(res.body.totalQuestions).toBe(12);
  });

  it('should return questions in Hindi', async () => {
    const res = await request(app)
      .post('/api/chat/screening/start')
      .send({ sessionId, screeningType: 'PHQ9', language: 'hi' });

    expect(res.status).toBe(200);
    // The Hindi question should contain Hindi characters
    expect(res.body.question).toMatch(/[\u0900-\u097F]/);
  });

  it('should reject invalid screening type', async () => {
    const res = await request(app)
      .post('/api/chat/screening/start')
      .send({ sessionId, screeningType: 'INVALID' });

    expect(res.status).toBe(400);
  });
});

describe('POST /api/chat/screening/answer', () => {
  let sessionId: string;

  beforeAll(async () => {
    const createRes = await request(app).post('/api/chat/session');
    sessionId = createRes.body.sessionId;

    // Start PHQ9 screening
    await request(app)
      .post('/api/chat/screening/start')
      .send({ sessionId, screeningType: 'PHQ9' });
  });

  it('should return next question after answering', async () => {
    const res = await request(app)
      .post('/api/chat/screening/answer')
      .send({ sessionId, screeningType: 'PHQ9', questionIndex: 0, answer: 2 });

    expect(res.status).toBe(200);
    expect(res.body.done).toBe(false);
    expect(res.body.questionIndex).toBe(1);
    expect(res.body.question).toBeDefined();
  });

  it('should return final score after all questions', async () => {
    // Answer remaining questions (1 through 8)
    for (let i = 1; i < 8; i++) {
      await request(app)
        .post('/api/chat/screening/answer')
        .send({ sessionId, screeningType: 'PHQ9', questionIndex: i, answer: 1 });
    }

    // Final answer (question 8, index 8)
    const res = await request(app)
      .post('/api/chat/screening/answer')
      .send({ sessionId, screeningType: 'PHQ9', questionIndex: 8, answer: 1 });

    expect(res.status).toBe(200);
    expect(res.body.done).toBe(true);
    expect(res.body.score).toBeDefined();
    expect(res.body.severity).toBeDefined();
    // First answer was 2, rest were 1: 2 + 8*1 = 10
    expect(res.body.score).toBe(10);
  });

  it('should reject invalid answer values', async () => {
    const res = await request(app)
      .post('/api/chat/screening/answer')
      .send({ sessionId, screeningType: 'PHQ9', questionIndex: 0, answer: 5 });

    expect(res.status).toBe(400);
  });
});

describe('GET /api/chat/screening/results/:sessionId', () => {
  it('should return screening results for a session', async () => {
    // Create session and complete a screening first
    const createRes = await request(app).post('/api/chat/session');
    const sid = createRes.body.sessionId;

    await request(app)
      .post('/api/chat/screening/start')
      .send({ sessionId: sid, screeningType: 'GAD7' });

    // Answer all 7 GAD7 questions
    for (let i = 0; i < 7; i++) {
      await request(app)
        .post('/api/chat/screening/answer')
        .send({ sessionId: sid, screeningType: 'GAD7', questionIndex: i, answer: 0 });
    }

    // Get results
    const res = await request(app)
      .get(`/api/chat/screening/results/${sid}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.results).toBeDefined();
    expect(res.body.results.length).toBeGreaterThanOrEqual(1);
    expect(res.body.results[0].type).toBe('GAD7');
    expect(res.body.results[0].score).toBe(0);
  });

  it('should return empty results for unknown session', async () => {
    const res = await request(app)
      .get('/api/chat/screening/results/unknown-session-id');

    expect(res.status).toBe(200);
    expect(res.body.results).toHaveLength(0);
  });
});
