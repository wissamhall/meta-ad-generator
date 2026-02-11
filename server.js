require('dotenv').config();
const express = require('express');
const path = require('path');
const rateLimit = require('express-rate-limit');
const generateHandler = require('./api/generate');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Rate limiting: 5 requests per day per IP
const apiLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Daily limit reached. Come back tomorrow or sign up for unlimited access.' }
});

app.post('/api/generate', apiLimiter, async (req, res) => {
  await generateHandler(req, res);
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Meta Ad Copy Generator running at http://localhost:${PORT}`);
});
