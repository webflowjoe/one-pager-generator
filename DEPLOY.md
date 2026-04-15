# Webflow One-Pager Generator — Deploy Guide

## What you need before starting
- Node.js installed (check: `node -v` in terminal — needs v18+)
- A GitHub account
- A Webflow account with a site already created
- An Anthropic API key (get one at console.anthropic.com)

---

## Step 1 — Install the Webflow CLI

```bash
npm install -g @webflow/webflow-cli
```

Verify it worked:
```bash
webflow --version
```

---

## Step 2 — Put this project on GitHub

1. Go to github.com → New repository → name it `one-pager-generator` → Create
2. In your terminal, navigate to the project folder and run:

```bash
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/YOUR_USERNAME/one-pager-generator.git
git push -u origin main
```

---

## Step 3 — Connect to Webflow Cloud

In your terminal, inside the project folder:

```bash
webflow deploy
```

This opens a browser window to authenticate. Once authenticated:
- Select your Webflow site
- When asked for a mount path, enter: `/tools/one-pager`
  (This means the app will live at yoursite.webflow.io/tools/one-pager)

The CLI creates a `.env` file with your `WEBFLOW_SITE_ID` and `WEBFLOW_API_TOKEN`. Don't commit this file — it's already in `.gitignore`.

---

## Step 4 — Add your Anthropic API key as an environment variable

In Webflow's dashboard:
1. Go to your site → Cloud → Environments → Production
2. Click "Environment variables"
3. Add: `ANTHROPIC_API_KEY` = your key from console.anthropic.com

---

## Step 5 — Deploy

```bash
git add .
git commit -m "ready to deploy"
git push
```

Webflow Cloud auto-deploys on every push to main. Watch the build logs in your Webflow dashboard under Cloud → Deployments.

---

## Step 6 — Visit your app

Once deployed, go to:
```
yoursite.webflow.io/tools/one-pager
```

---

## Running locally for testing

```bash
npm install
npm run dev
```

The app runs at http://localhost:3000

For local API calls, create a `.env.local` file:
```
ANTHROPIC_API_KEY=your-key-here
```

---

## PDF export

The downloaded HTML file is print-ready. To convert to PDF:
1. Open the downloaded `.html` file in Chrome
2. Cmd+P (Mac) or Ctrl+P (Windows)
3. Change destination to "Save as PDF"
4. Click Save

For an automated PDF option down the road, you can add a `/api/pdf` route using the `puppeteer` or `@sparticuz/chromium` package — happy to build that when you're ready.

---

## Troubleshooting

**"ANTHROPIC_API_KEY not configured"** — You haven't added the env var in Webflow Cloud dashboard yet (Step 4).

**Build fails** — Check the build logs in Webflow Cloud dashboard. Most common cause is a missing `wrangler.toml` or wrong Node version.

**Google Drive returns nothing** — The Drive MCP call requires the user running the app to be authenticated with Google. This works in Claude.ai because you're logged in. For a standalone app, you'll need to add OAuth — let's tackle that as a follow-up.
