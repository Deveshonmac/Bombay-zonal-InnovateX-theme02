import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const app = express();
// In development, AI Studio dev server proxy strictly routes to port 3000.
// In production container deployment (e.g. Cloud Run), use the assigned PORT environment variable.
const port = process.env.NODE_ENV === 'production' ? (Number(process.env.PORT) || 3000) : 3000;

app.use(express.json());

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const PYTHON_BACKEND = 'http://localhost:8000';

// Proxy: GET /api/clusters → Python FastAPI /api/clusters/priority (priority-sorted)
app.get('/api/clusters', async (_req, res) => {
  try {
    const r = await fetch(`${PYTHON_BACKEND}/api/clusters/priority`);
    if (!r.ok) throw new Error(`Python backend returned ${r.status}`);
    const data = await r.json();
    res.json(data);
  } catch (err: any) {
    res.status(503).json({ error: 'Python DBSCAN backend offline', fallback: true });
  }
});

// Proxy: POST /api/clusters/trigger → seeds DB then runs DBSCAN
app.post('/api/clusters/trigger', async (_req, res) => {
  try {
    const r = await fetch(`${PYTHON_BACKEND}/api/clusters/run`, { method: 'POST' });
    if (!r.ok) throw new Error(`Python backend returned ${r.status}`);
    const data = await r.json();
    res.json(data);
  } catch (err: any) {
    res.status(503).json({ error: 'Python DBSCAN backend offline', fallback: true });
  }
});

import fs from 'fs';

// Helper to persist API key to .env files
function saveApiKeyToEnv(key: string) {
  process.env.GEMINI_API_KEY = key;
  const envPaths = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), '..', '.env'),
    path.resolve(process.cwd(), '.env.local'),
  ];
  for (const envPath of envPaths) {
    try {
      let content = '';
      if (fs.existsSync(envPath)) {
        content = fs.readFileSync(envPath, 'utf-8');
      }
      const regex = /^GEMINI_API_KEY=.*$/m;
      if (regex.test(content)) {
        content = content.replace(regex, `GEMINI_API_KEY="${key}"`);
      } else {
        content = (content.trim() ? content.trim() + '\n' : '') + `GEMINI_API_KEY="${key}"\n`;
      }
      fs.writeFileSync(envPath, content, 'utf-8');
    } catch {
      // ignore
    }
  }
}

// Config: Get status of Gemini API key
app.get('/api/config/gemini-key', (_req, res) => {
  const key = process.env.GEMINI_API_KEY || '';
  const configured = Boolean(key && key !== 'MY_GEMINI_API_KEY' && key.length > 8);
  res.json({
    configured,
    maskedKey: configured ? `${key.slice(0, 4)}••••••••${key.slice(-4)}` : '',
  });
});

// Config: Save/Update or disconnect Gemini API key
app.post('/api/config/gemini-key', (req, res) => {
  const { apiKey } = req.body || {};
  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === '') {
    saveApiKeyToEnv('');
    return res.json({
      success: true,
      configured: false,
      maskedKey: '',
      message: 'Gemini API key disconnected.',
    });
  }
  if (apiKey.trim().length < 8) {
    return res.status(400).json({ error: 'INVALID_KEY', message: 'Please provide a valid Gemini API key.' });
  }
  const cleanKey = apiKey.trim();
  saveApiKeyToEnv(cleanKey);
  res.json({
    success: true,
    configured: true,
    maskedKey: `${cleanKey.slice(0, 4)}••••••••${cleanKey.slice(-4)}`,
    message: 'Gemini API key saved and activated successfully.',
  });
});

// AI Statutory Enforcement Directive Generation (Gemini)
app.post('/api/recommendation', async (req, res) => {
  const { category, location, aqi, complaint_count, severity } = req.body || {};
  const clientKey = (req.headers['x-gemini-api-key'] as string) || req.body?.apiKey;
  const effectiveKey = (clientKey && clientKey.trim()) || process.env.GEMINI_API_KEY;

  if (!effectiveKey || effectiveKey === 'MY_GEMINI_API_KEY' || effectiveKey.trim().length < 8) {
    return res.status(401).json({
      error: 'MISSING_API_KEY',
      message: 'Gemini API key is not configured. Please connect a valid Gemini API key.',
      requiresApiKey: true,
    });
  }

  // If client provided a valid key that differs from current env, persist it
  if (clientKey && clientKey.trim().length > 8 && clientKey.trim() !== process.env.GEMINI_API_KEY) {
    saveApiKeyToEnv(clientKey.trim());
  }

  try {
    const aiInstance = new GoogleGenAI({
      apiKey: effectiveKey.trim(),
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const prompt = `You are a Senior Environmental Compliance Officer for the Pune Municipal Corporation (PMC), enforcing the Air (Prevention and Control of Pollution) Act 1981, Solid Waste Management Rules 2016, and CPCB Graded Action protocols.

An incident cluster has been detected by the CPCB SAMEER Citizen Air Quality monitoring system with the following telemetry:
- Dominant Category: ${category || 'Unknown emission'}
- Location / Ward: ${location || 'Pune City'}
- Current Reported AQI: ${aqi || 250}
- Citizen Complaints Count: ${complaint_count || 10}
- Severity: ${severity || 'High'}

Generate a concise, statutory-grade enforcement directive in valid JSON format with these exact fields:
{
  "targetAgency": "Precise Municipal Agency or Dept name (e.g., 'PMC Solid Waste & Works Dept' or 'MPCB Regional Environmental Cell' or 'PMC Flying Squad Team-B')",
  "directive": "Specific, actionable statutory directive (e.g., 'Deploy 2000L Anti-Smog Gun for wet dust suppression along Sinhagad Road corridor')",
  "legalProvision": "Applicable legal rule / act (e.g., 'Air Act 1981 Section 31A / SWM Rules 2016' or 'Environment Protection Act 1986 §5')",
  "rationale": "1-2 sentence operational rationale citing the AQI delta, complaint velocity, or health risk",
  "suggestedEquipment": ["2-3 specific equipment or deployment items (e.g., 'Anti-Smog Gun', 'Mechanical Sweeper', 'Water Sprinkler Truck')"]
}

Respond ONLY with raw valid JSON without markdown fences.`;

    let responseText = '';
    let usedModel = 'gemini-3.8-flash';
    const modelsToTry = [
      'gemini-3.8-flash',
      'gemini-3.7-flash',
      'gemini-3.6-flash',
      'gemini-3.5-flash',
      'gemini-flash-latest',
    ];
    let lastError: any = null;

    for (const m of modelsToTry) {
      try {
        const response = await aiInstance.models.generateContent({
          model: m,
          contents: prompt,
        });
        responseText = response.text || '';
        if (responseText) {
          usedModel = m;
          break;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`Model ${m} generation attempt failed:`, err?.message || err);
      }
    }

    if (!responseText) {
      throw lastError || new Error('All Gemini model generation attempts failed');
    }

    const cleanedJson = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
    const data = JSON.parse(cleanedJson);

    return res.json({
      ...data,
      isFallback: false,
      modelUsed: usedModel,
    });
  } catch (error: any) {
    console.warn('Gemini recommendation server error:', error?.message || error);
    const msg = error?.message || 'Failed to generate recommendation with Gemini';
    const isAuthError = msg.includes('API_KEY_INVALID') || msg.includes('403') || msg.includes('401') || msg.includes('API key');

    return res.status(isAuthError ? 401 : 500).json({
      error: msg,
      requiresApiKey: isAuthError,
      fallback: true,
    });
  }
});

// Generic passthrough proxy for every other /api/* route to the FastAPI backend.
// Keeps the frontend fetch calls simple (relative URLs) and avoids CORS entirely.
app.use('/api', async (req, res) => {
  const targetUrl = `${PYTHON_BACKEND}/api${req.url}`;
  try {
    const init: any = {
      method: req.method,
      headers: { 'Content-Type': 'application/json' },
    };
    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
      init.body = JSON.stringify(req.body);
    }
    const r = await fetch(targetUrl, init);
    const text = await r.text();
    res.status(r.status);
    try {
      res.json(JSON.parse(text));
    } catch {
      res.send(text);
    }
  } catch (err: any) {
    res.status(503).json({ error: `Python backend offline for ${targetUrl}`, fallback: true });
  }
});

async function start() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static('dist'));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve('dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server listening on port ${port}`);
  });
}

start();
