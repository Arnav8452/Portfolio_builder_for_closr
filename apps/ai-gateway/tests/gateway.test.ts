process.env.GOOGLE_API_KEY = 'test';
process.env.CEREBRAS_API_KEY = 'test';
process.env.GROQ_API_KEY = 'test';
process.env.OPENROUTER_API_KEY = 'test';

import request from 'supertest';
import { app, pipeline } from '../src/app';

// Mock the pipeline execute method to avoid actual API calls during tests
jest.mock('@freeloaderapi/core', () => {
  const originalModule = jest.requireActual('@freeloaderapi/core');
  return {
    ...originalModule,
    PipelineOrchestrator: jest.fn().mockImplementation(() => ({
      execute: jest.fn().mockResolvedValue({
        id: 'mock-response',
        choices: [{ message: { role: 'assistant', content: 'Mocked reply' } }]
      })
    }))
  };
});

describe('AI Gateway API', () => {
  const SECRET = process.env.GATEWAY_SECRET || 'dev-secret';

  it('should return 200 OK for /health', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('should reject requests without a Bearer token', async () => {
    const res = await request(app).post('/v1/chat/completions').send({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Hello' }]
    });
    expect(res.status).toBe(401);
  });

  it('should reject requests with an invalid Bearer token', async () => {
    const res = await request(app)
      .post('/v1/chat/completions')
      .set('Authorization', 'Bearer WRONG_TOKEN')
      .send({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Hello' }]
      });
    expect(res.status).toBe(403);
  });

  it('should accept valid tokens and return AI completion', async () => {
    const res = await request(app)
      .post('/v1/chat/completions')
      .set('Authorization', `Bearer ${SECRET}`)
      .send({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Hello' }]
      });
    expect(res.status).toBe(200);
    expect(res.body.id).toBe('mock-response');
    expect(res.body.choices[0].message.content).toBe('Mocked reply');
  });
});
