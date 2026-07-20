import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import * as yaml from 'js-yaml';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const configPath = path.join(__dirname, 'config.yaml');
const config = yaml.load(fs.readFileSync(configPath, 'utf8'));

const app = express();
app.use(cors());
app.use(express.json());

const SUPERVIELLE_API_URL = config.supervielle.api_url;
const SUPERVIELLE_API_KEY = process.env.SUPERVIELLE_API_KEY;
const TRANSMIT_TOKEN_URL = config.provider.config.token_url || 'https://api.transmitsecurity.io/cis/oidc/token';
const TRANSMIT_CLIENT_ID = process.env.TRANSMIT_CLIENT_ID;
const TRANSMIT_CLIENT_SECRET = process.env.TRANSMIT_CLIENT_SECRET;

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/auth/callback', async (req, res) => {
  const { code, journey_token } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'code is required in body' });
  }

  if (!TRANSMIT_CLIENT_ID || !TRANSMIT_CLIENT_SECRET) {
    return res.status(500).json({ error: 'Client credentials not configured in config.yaml' });
  }

  try {
    console.log('[Token Exchange] Iniciando intercambio de codigo...');
    console.log('[Token Exchange] Client ID:', TRANSMIT_CLIENT_ID);

    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('code', code);
    params.append('client_id', TRANSMIT_CLIENT_ID);
    params.append('client_secret', TRANSMIT_CLIENT_SECRET);
    params.append('redirect_uri', 'http://localhost:3000/login/callback');

    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
    };
    if (journey_token) {
      headers['Authorization'] = `Bearer ${journey_token}`;
    }

    const exchangeStart = performance.now();

    const response = await fetch(TRANSMIT_TOKEN_URL, {
      method: 'POST',
      headers,
      body: params.toString(),
    });

    const exchangeDurationMs = Math.round(performance.now() - exchangeStart);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Token Exchange] Error:', errorText);
      return res.status(response.status).json({
        error: 'Token exchange failed',
        details: errorText,
        status: response.status,
      });
    }

    const tokenData = await response.json();

    console.log('[Token Exchange] Exitoso en', exchangeDurationMs, 'ms');

    return res.json({
      ...tokenData,
      exchangeDurationMs,
    });
  } catch (error) {
    console.error('[Token Exchange] Error inesperado:', error);
    return res.status(500).json({
      error: 'Failed to exchange token',
      message: error.message || String(error),
    });
  }
});

app.post('/api/introspection', async (req, res) => {
  const token = req.body?.token;
  if (!token) {
    return res.status(400).json({ error: 'token is required in body' });
  }

  if (!SUPERVIELLE_API_KEY) {
    return res.status(500).json({ error: 'SUPERVIELLE_API_KEY is not configured' });
  }

  try {
    const introspectStart = performance.now();

    const response = await fetch(SUPERVIELLE_API_URL, {
      method: 'GET',
      headers: {
        'X-IBM-Client-Id': SUPERVIELLE_API_KEY,
        Authorization: `Bearer ${token}`,
      },
    });

    const introspectDurationMs = Math.round(performance.now() - introspectStart);

    const text = await response.text();

    return res.status(response.status).json({
      introspectDurationMs,
      body: text,
    });
  } catch (error) {
    console.error('Supervielle API call error', error);
    return res.status(502).json({
      error: 'Failed to call Supervielle API',
    });
  }
});

app.get('/api/config', (req, res) => {
  res.json({
    app: config.app,
    provider: {
      name: config.provider.name,
      config: {
        ...config.provider.config,
        client_id: TRANSMIT_CLIENT_ID,
      },
    },
    journeys: config.journeys,
    supervielle: config.supervielle,
    backend: config.backend,
  });
});

const port = config.backend.port || 3001;
app.listen(port, () => {
  console.log(`Backend running on http://localhost:${port}`);
  console.log(`Provider: ${config.provider.name}`);
});
