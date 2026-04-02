# ListingAI — Full Stack Deployment Guide

## Prerequisites
- Node.js 20+, Docker, Git
- MongoDB Atlas account (or self-hosted)
- Razorpay account (live keys)
- Render.com account (backend)
- Vercel account (frontend)
- GitHub account (CI/CD)

---

## 1. LOCAL DEVELOPMENT (Docker)

```bash
# Clone and enter project
git clone https://github.com/yourname/listingai.git
cd listingai

# Copy and fill environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local

# Edit backend/.env — fill in all values:
#   MONGODB_URI, JWT secrets, ANTHROPIC_API_KEY, RAZORPAY keys

# Start everything with Docker Compose
docker compose up --build

# Services available at:
#   Frontend  → http://localhost:80
#   Backend   → http://localhost:5000
#   Mongo     → localhost:27017

# Run without Docker (development mode):
cd backend && npm install && npm run dev
cd frontend && npm install && npm run dev
```

---

## 2. MONGODB ATLAS SETUP

```
1. Create free cluster at cloud.mongodb.com
2. Create database user with readWrite role
3. Whitelist your server IP (or 0.0.0.0/0 for Render)
4. Get connection string:
   mongodb+srv://<user>:<password>@cluster.mongodb.net/listingai
5. Paste into MONGODB_URI in backend/.env
```

**Required indexes (run once in Atlas shell):**
```javascript
use listingai

db.users.createIndex({ email: 1 }, { unique: true })
db.users.createIndex({ createdAt: -1 })

db.subscriptions.createIndex({ userId: 1, status: 1 })
db.subscriptions.createIndex({ currentPeriodEnd: 1 })

db.generatedcontents.createIndex({ userId: 1, createdAt: -1 })
db.generatedcontents.createIndex({ userId: 1, contentType: 1 })

db.paymenthistories.createIndex({ razorpayOrderId: 1 }, { unique: true })
db.paymenthistories.createIndex({ userId: 1, createdAt: -1 })
```

---

## 3. BACKEND DEPLOYMENT (Render)

```
1. Go to render.com → New → Web Service
2. Connect your GitHub repo
3. Configure:
   Root Directory : backend
   Build Command  : npm install
   Start Command  : node src/server.js
   Instance Type  : Starter ($7/mo) or Standard for production

4. Add Environment Variables in Render dashboard:
   NODE_ENV                = production
   PORT                    = 5000
   MONGODB_URI             = <Atlas URI>
   JWT_ACCESS_SECRET       = <64-char random string>
   JWT_REFRESH_SECRET      = <64-char random string>
   JWT_ACCESS_EXPIRES_IN   = 15m
   JWT_REFRESH_EXPIRES_IN  = 7d
   ANTHROPIC_API_KEY       = sk-ant-...
   RAZORPAY_KEY_ID         = rzp_live_...
   RAZORPAY_KEY_SECRET     = <secret>
   RAZORPAY_WEBHOOK_SECRET = <webhook secret>
   FRONTEND_URL            = https://your-app.vercel.app

5. Deploy. Your API URL: https://listingai-api.onrender.com

# Generate secure JWT secrets:
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## 4. FRONTEND DEPLOYMENT (Vercel)

```
1. Go to vercel.com → New Project → Import GitHub repo
2. Configure:
   Framework Preset : Vite
   Root Directory   : frontend
   Build Command    : npm run build
   Output Directory : dist

3. Add Environment Variables:
   VITE_API_URL = https://listingai-api.onrender.com

4. Deploy → your app is live at https://listingai.vercel.app

# Connect custom domain:
   Vercel Dashboard → Domains → Add → listingai.com
   Update DNS: CNAME @ → cname.vercel-dns.com
```

---

## 5. RAZORPAY WEBHOOK SETUP

```
1. Razorpay Dashboard → Settings → Webhooks → Add New
2. Webhook URL: https://listingai-api.onrender.com/api/payments/webhook
3. Select events:
   ✓ payment.captured
   ✓ payment.failed
   ✓ refund.created
4. Set a Webhook Secret — paste into RAZORPAY_WEBHOOK_SECRET env var
5. Save and test with Razorpay's test simulator
```

---

## 6. CI/CD — GitHub Actions

```
Add these secrets in GitHub → Settings → Secrets → Actions:

RENDER_DEPLOY_HOOK_BACKEND  = (Render → Service → Deploy Hook URL)
VERCEL_TOKEN                = (Vercel → Account → Tokens)
VERCEL_ORG_ID               = (Vercel project settings)
VERCEL_PROJECT_ID           = (Vercel project settings)
VITE_API_URL                = https://listingai-api.onrender.com

On every push to main:
  → Tests run
  → Docker images built and pushed to GitHub Container Registry
  → Backend auto-deploys to Render
  → Frontend auto-deploys to Vercel
```

---

## 7. DOCKER PRODUCTION COMMANDS

```bash
# Build images
docker compose build

# Run in production mode
docker compose up -d

# View logs
docker compose logs -f backend
docker compose logs -f mongo

# Stop all services
docker compose down

# Stop and remove volumes (wipes database)
docker compose down -v

# Scale backend horizontally
docker compose up -d --scale backend=3
```

---

## 8. SECURITY CHECKLIST

```
✓ .env never committed — in .gitignore
✓ JWT secrets minimum 64 characters
✓ Passwords hashed with bcrypt (cost 12)
✓ Refresh tokens rotated on every use
✓ Rate limiting on all endpoints
✓ Helmet.js security headers enabled
✓ CORS locked to FRONTEND_URL only
✓ Input validated with Joi on all routes
✓ MongoDB query injection prevented (Mongoose)
✓ Payload size limited to 10kb
✓ Razorpay signature verified server-side
✓ Webhook signature verified with HMAC-SHA256
✓ Sensitive fields excluded from DB queries (select: false)
✓ Non-root Docker user
✓ Winston logs scrub passwords/tokens before writing
✓ Graceful shutdown on SIGTERM
```

---

## 9. MONITORING (OPTIONAL — RECOMMENDED FOR PRODUCTION)

```bash
# Sentry error tracking (add to backend)
npm install @sentry/node
# Add to src/server.js:
# const Sentry = require('@sentry/node');
# Sentry.init({ dsn: process.env.SENTRY_DSN });

# Uptime monitoring
# → uptimerobot.com → Monitor → https://your-api.onrender.com/health

# Log aggregation
# → Render has built-in log streaming
# → Or ship Winston logs to Datadog / Papertrail via transport
```
