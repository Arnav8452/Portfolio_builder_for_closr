import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { PipelineOrchestrator } from '@freeloaderapi/core';
import { GeminiAdapter, GroqAdapter, CerebrasAdapter, OpenRouterAdapter } from '@freeloaderapi/adapters';
import { authenticate } from './middleware/auth';
import dotenv from 'dotenv';

dotenv.config();

export const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

// Initialize Freeloader Pipeline
const providers = [];

// The library automatically reads process.env keys inside the constructors!
providers.push(new GeminiAdapter());
providers.push(new CerebrasAdapter());
providers.push(new GroqAdapter());
providers.push(new OpenRouterAdapter());

export const pipeline = new PipelineOrchestrator(providers);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// OpenAI compatible endpoint using Freeloader
app.post('/v1/chat/completions', authenticate, async (req, res) => {
  try {
    const result = await pipeline.execute(req.body);
    res.json(result);
  } catch (error: any) {
    console.error('Freeloader error:', error);
    res.status(500).json({
      error: {
        message: error.message || 'Internal Server Error',
        type: 'server_error'
      }
    });
  }
});
