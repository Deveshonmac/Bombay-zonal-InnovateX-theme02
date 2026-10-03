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

app.post('/api/recommendation', async (req, res) => {
  const { category, location, aqi, complaint_count, severity } = req.body;

  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not configured on server');
    }

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

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
    });

    const responseText = response.text || '';
    const cleanedJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const data = JSON.parse(cleanedJson);

    return res.json(data);
  } catch (error: any) {
    console.warn('Gemini recommendation server error:', error?.message || error);
    return res.status(500).json({
      error: error?.message || 'Failed to generate recommendation',
      fallback: true,
    });
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
