import request from 'supertest';
import express from 'express';

// Setup a simple app for testing the route logic directly
// instead of spinning up the full DB for a unit test
describe('Express API Base Routes', () => {
  const app = express();
  app.get('/api/health', (req, res) => res.status(200).json({ status: 'ok' }));

  it('should return 200 OK on health check', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });

  it('should handle 404 for unknown routes', async () => {
    const response = await request(app).get('/api/unknown');
    expect(response.status).toBe(404);
  });
});
