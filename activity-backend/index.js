require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: [
    'http://localhost:5173',
    process.env.FRONTEND_URL || 'https://frontend-sage-sigma-u4aaj02dwa.vercel.app',
    /\.discordsays\.com$/,
  ],
}));
app.use(express.json());

// Health check
app.get('/', (req, res) => res.json({ status: 'ok', service: 'ScreenShare Hub Activity Backend' }));

// Troca o OAuth2 code por access_token
app.post('/api/token', async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'code is required' });

  try {
    const response = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID || '',
        client_secret: process.env.DISCORD_CLIENT_SECRET || '',
        grant_type: 'authorization_code',
        code,
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      console.error('[token] Erro do Discord:', data);
      return res.status(response.status).json(data);
    }
    return res.json({ access_token: data.access_token });
  } catch (err) {
    console.error('[token] Erro interno:', err);
    return res.status(500).json({ error: 'Erro interno ao trocar token' });
  }
});

app.listen(PORT, () => {
  console.log(`[Activity Backend] Rodando na porta ${PORT}`);
});
