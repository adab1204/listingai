# ListingAI — Full Stack SaaS

AI-powered real estate content generation platform.
One listing input → 30 days of marketing content, auto-published.

---

## Folder Structure

```
listingai/
│
├── backend/                          # Node.js + Express API
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js           # MongoDB connection + health
│   │   ├── controllers/
│   │   │   ├── authController.js     # signup, login, refresh, logout
│   │   │   ├── contentController.js  # generate, history, getById
│   │   │   ├── userController.js     # profile, subscription, usage
│   │   │   └── paymentController.js  # createOrder, verify, webhook
│   │   ├── middleware/
│   │   │   ├── auth.js               # protect, restrictTo
│   │   │   ├── subscription.js       # requireCredits, deductCredit
│   │   │   ├── rateLimiter.js        # api, auth, generate limiters
│   │   │   └── errorHandler.js       # AppError, catchAsync, global handler
│   │   ├── models/
│   │   │   ├── User.js               # users + bcrypt + credits
│   │   │   ├── Subscription.js       # plans, credits, period tracking
│   │   │   ├── GeneratedContent.js   # AI output history
│   │   │   └── PaymentHistory.js     # Razorpay order + verification
│   │   ├── routes/
│   │   │   ├── authRoutes.js         # /api/auth/*
│   │   │   ├── contentRoutes.js      # /api/generate-content, /api/content/*
│   │   │   ├── userRoutes.js         # /api/user/*
│   │   │   └── paymentRoutes.js      # /api/payments/*
│   │   ├── services/
│   │   │   ├── aiService.js          # Anthropic SDK — all prompts live here
│   │   │   ├── paymentService.js     # Razorpay order + verify + webhook
│   │   │   └── tokenService.js       # JWT generate + verify
│   │   ├── validators/
│   │   │   └── authValidators.js     # Joi schemas for all endpoints
│   │   ├── utils/
│   │   │   └── logger.js             # Winston + daily rotate + PII scrub
│   │   ├── app.js                    # Express app setup, middleware, routes
│   │   └── server.js                 # Entry point, DB connect, graceful shutdown
│   ├── Dockerfile                    # Multi-stage production Docker image
│   ├── .env.example                  # All required environment variables
│   └── package.json
│
├── frontend/                         # React SaaS app
│   ├── src/
│   │   ├── components/
│   │   │   └── ProtectedRoute.jsx    # Auth guard for private pages
│   │   ├── context/
│   │   │   └── AuthContext.jsx       # Global auth state + user hydration
│   │   ├── hooks/
│   │   │   ├── useGenerate.js        # Content generation → calls backend
│   │   │   └── usePayment.js         # Razorpay checkout flow
│   │   └── services/
│   │       └── api.js                # Axios instance + interceptors + all API calls
│   ├── Dockerfile                    # Multi-stage build → Nginx serve
│   ├── nginx.conf                    # SPA routing + gzip + security headers
│   ├── vercel.json                   # Vercel deployment config + headers
│   └── .env.example
│
├── docker/
│   └── mongo-init.js                 # MongoDB init script (create app user)
│
├── docs/
│   └── DEPLOYMENT.md                 # Full deployment guide
│
├── .github/
│   └── workflows/
│       └── ci-cd.yml                 # GitHub Actions: test → build → deploy
│
├── docker-compose.yml                # Full stack: Mongo + Redis + Backend + Frontend
├── .gitignore
└── README.md
```

---

## API Reference

| Method | Endpoint                     | Auth | Description                        |
|--------|------------------------------|------|------------------------------------|
| POST   | /api/auth/signup             | —    | Create account                     |
| POST   | /api/auth/login              | —    | Login, get tokens                  |
| POST   | /api/auth/refresh            | —    | Rotate refresh token               |
| POST   | /api/auth/logout             | JWT  | Invalidate refresh token           |
| POST   | /api/generate-content        | JWT  | Generate AI content (costs 1 credit) |
| GET    | /api/content/history         | JWT  | Paginated generation history       |
| GET    | /api/content/:id             | JWT  | Single generated item              |
| GET    | /api/user/profile            | JWT  | Current user profile               |
| GET    | /api/user/subscription       | JWT  | Plan, credits, period              |
| GET    | /api/user/usage              | JWT  | Generation stats by type           |
| POST   | /api/payments/create-order   | JWT  | Create Razorpay order              |
| POST   | /api/payments/verify         | JWT  | Verify signature, activate plan    |
| POST   | /api/payments/webhook        | —    | Razorpay webhook (HMAC verified)   |
| GET    | /api/payments/history        | JWT  | Payment history                    |
| GET    | /health                      | —    | Server health check                |

---

## Plan Limits

| Plan      | Price (INR) | Credits/mo | Channels |
|-----------|-------------|------------|----------|
| Free      | ₹0          | 5          | All      |
| Starter   | ₹6,599      | 50         | All      |
| Agent Pro | ₹16,599     | 200        | All      |
| Brokerage | ₹49,999     | Unlimited  | All      |

1 credit = 1 content generation (any type).

---

## Quick Start

```bash
# 1. Clone
git clone https://github.com/yourname/listingai && cd listingai

# 2. Configure
cp backend/.env.example backend/.env
# Fill in: MONGODB_URI, JWT secrets, ANTHROPIC_API_KEY, RAZORPAY keys

# 3. Run
docker compose up --build

# App → http://localhost
# API → http://localhost:5000
```
