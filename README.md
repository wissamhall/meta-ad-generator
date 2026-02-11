# Meta Ad Copy Generator

AI-powered Meta (Facebook & Instagram) ad copy generator for [AdAdvisor.ai](https://adadvisor.ai).

## Features

- Generates 5 unique ad copy variations per request
- Optimized for Meta's character limits (Primary: 125, Headline: 40, Description: 30)
- Multiple campaign goals: Awareness, Traffic, Engagement, Leads, Conversions, Sales
- Multiple tones: Professional, Casual, Urgent, Inspiring, Educational
- Copy-to-clipboard functionality
- Rate limiting: 5 free generations per day
- Optional email capture after 3 generations
- Mobile responsive design
- SEO optimized

## Tech Stack

- **Frontend:** Vanilla HTML, CSS, JavaScript
- **Backend:** Node.js + Express
- **AI:** Claude API (Anthropic)
- **Deployment:** Vercel-ready

## Setup

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/meta-ad-generator.git
cd meta-ad-generator
npm install
```

### 2. Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and add your Anthropic API key:

```
ANTHROPIC_API_KEY=your_key_here
```

### 3. Run Locally

```bash
npm start
```

Visit `http://localhost:3000`

### 4. Deploy to Vercel

```bash
npm install -g vercel
vercel
```

Add `ANTHROPIC_API_KEY` in Vercel project settings under Environment Variables.

## Project Structure

```
meta-ad-generator/
├── api/
│   └── generate.js        # API endpoint (Vercel serverless function)
├── public/
│   ├── index.html          # Main page
│   ├── css/style.css       # Styles
│   └── js/app.js           # Frontend logic
├── server.js               # Local Express server
├── vercel.json             # Vercel deployment config
├── package.json
└── .env.example
```

## API

### POST /api/generate

**Request:**
```json
{
  "productName": "FitTrack Pro",
  "description": "AI-powered fitness app",
  "targetAudience": "Busy professionals 25-45",
  "goal": "Conversions",
  "tone": "Casual",
  "count": 5
}
```

**Response:**
```json
{
  "variations": [
    {
      "primaryText": "...",
      "headline": "...",
      "description": "...",
      "angle": "Problem-Solution"
    }
  ],
  "meta": {
    "count": 5,
    "goal": "Conversions",
    "tone": "Casual",
    "timestamp": "..."
  }
}
```
