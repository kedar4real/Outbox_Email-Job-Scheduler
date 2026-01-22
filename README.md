ReachInbox Email Scheduler Backend
=================================

Project overview
----------------
Backend API + worker for scheduling email campaigns. Campaigns and jobs are stored in Postgres, scheduled through BullMQ, and sent via SMTP.

Key features
- Google OAuth login and JWT-based API access
- Recipient validation and de-duplication
- BullMQ delayed jobs for scheduling
- Idempotent job processing (DB status transition + BullMQ jobId)
- Rate limiting per sender using Redis
- Configurable worker concurrency and minimum delay between sends
- Request correlation IDs in logs

Tech stack
- TypeScript, Express
- Prisma + PostgreSQL
- BullMQ + Redis
- Nodemailer (Ethereal SMTP)
- Zod validation
- Pino logging

Prerequisites
-------------
- Node.js 18+
- Docker and Docker Compose
- npm or pnpm

Setup instructions
------------------
1) Install dependencies
   - `cd backend`
   - `npm install`

2) Configure environment
   - Copy `backend/.env.example` to `backend/.env`
   - Fill in Google OAuth and Ethereal SMTP credentials

3) Get Ethereal Email credentials
   - Visit https://ethereal.email/create
   - Click "Create Ethereal Account"
   - Copy the credentials:
     * SMTP_HOST=smtp.ethereal.email
     * SMTP_PORT=587
     * SMTP_USER=<generated username>
     * SMTP_PASS=<generated password>
   - Paste into `.env`
   - View sent emails at https://ethereal.email/messages

4) Start infrastructure
   - `docker compose -f backend/docker-compose.yml up -d`

5) Run Prisma migrations
   - `npm run prisma:migrate`

6) Start API and worker
   - Terminal 1: `npm run dev`
   - Terminal 2: `npm run worker`
   - Or run both: `npm run dev:all`
   - The worker must be running for emails to send

7) Start frontend
   - `cd frontend`
   - Copy `frontend/.env.example` to `frontend/.env.local`
   - Set `NEXT_PUBLIC_BACKEND_URL` to the backend base URL
   - `npm install`
   - `npm run dev`

Available scripts
-----------------
- `npm run dev` - start the API with hot reload
- `npm run worker` - start the BullMQ worker with hot reload
- `npm run dev:all` - run API and worker in parallel
- `npm run build` - compile TypeScript
- `npm run start` - run compiled server
- `npm run prisma:generate` - generate Prisma client
- `npm run prisma:migrate` - run migrations
- `npm run prisma:reset` - reset database
- `npm run prisma:studio` - open Prisma Studio
- `npm run prisma:seed` - run seed script

Environment variables
---------------------
Application
- `NODE_ENV` - development | production | test
- `PORT` - API port

Database
- `DATABASE_URL` - Postgres connection string

Redis
- `REDIS_HOST`
- `REDIS_PORT`

Google OAuth
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_CALLBACK_URL`

JWT
- `JWT_SECRET` - at least 32 chars in production

SMTP (Ethereal)
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`

Queue configuration
- `WORKER_CONCURRENCY`
- `MIN_DELAY_BETWEEN_EMAILS`
- `MAX_EMAILS_PER_HOUR`

CORS
- `FRONTEND_URL`

Logging
- `LOG_LEVEL` - debug | info | warn | error

Optional seed data
- `SEED_GOOGLE_ID`
- `SEED_EMAIL`
- `SEED_NAME`
- `SEED_SENDER_EMAIL`
- `SEED_SENDER_NAME`

Frontend environment variables
------------------------------
- `NEXT_PUBLIC_BACKEND_URL` - backend base URL for API calls
- `NEXT_PUBLIC_API_URL` - optional backend base URL for NextAuth (if enabled)
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` - optional NextAuth credentials

Architecture overview
---------------------
System components
- API server: Express app with validation, auth, and campaign/job endpoints
- Database: Postgres for users, campaigns, jobs, and rate limit windows
- Queue: BullMQ with Redis backing for delayed job scheduling
- Worker: Separate process that sends emails and enforces rate limits

System diagram (text)
---------------------
Client (Next.js)
  |
  v
API (Express) -> PostgreSQL (Campaigns, Jobs, Senders)
  |
  v
BullMQ (Redis) -> Worker -> SMTP (Ethereal)

Scheduling data flow
1) Client submits campaign
2) Campaign and jobs are stored in Postgres
3) Jobs are enqueued to BullMQ with a delay based on schedule
4) Worker picks jobs, checks rate limits, and sends emails
5) Job status updated to SENT or FAILED

Restart persistence
- BullMQ stores job state in Redis; delayed jobs survive restarts
- EmailJob status in Postgres ensures idempotency
- Worker uses atomic status transitions to prevent double sends

Rate limiting
- Redis sorted set per sender: `rate-limit:{senderId}`
- Sliding window of 1 hour; if limit exceeded, job is rescheduled

Rate limiting details
---------------------
Strategy
- Sliding window with Redis sorted sets, keyed by sender.
- Each successful send adds a timestamp entry.
- On limit hit, we compute the next available hour from the oldest entry.

Rescheduling behavior
- Jobs are rescheduled into the next available hour window.
- Order is preserved by assigning a per-window sequence offset using
  `MIN_DELAY_BETWEEN_EMAILS`.

Trade-offs
- Redis provides fast window checks but requires TTL hygiene.
- Large backlogs can push rescheduled jobs beyond the next hour window.

Idempotency
- BullMQ jobId is set to EmailJob.id
- DB update from SCHEDULED/RESCHEDULED to SENDING is atomic

API endpoints
-------------
Auth
- `GET /api/auth/google` - start Google OAuth
- `POST /api/auth/google` - start Google OAuth (alternative)
- `GET /api/auth/google/callback` - OAuth callback
- `POST /api/auth/logout` - logout
- `GET /api/auth/me` - current user

Campaigns
- `POST /api/campaigns` - create campaign
- `GET /api/campaigns` - list campaigns
- `GET /api/campaigns/:id` - campaign detail

Jobs
- `GET /api/jobs/scheduled` - scheduled/rescheduled jobs
- `GET /api/jobs/sent` - sent/failed jobs

Health
- `GET /api/health` - basic health
- `GET /api/health/detailed` - detailed health
- `GET /api/config` - worker configuration

CSV
- `POST /api/csv/validate` - validate CSV or email array

Senders
- `POST /api/senders` - create sender
- `GET /api/senders` - list senders
- `DELETE /api/senders/:id` - delete sender

Features checklist
------------------
- Google OAuth 2.0 login + JWT auth
- Campaign scheduling via BullMQ delayed jobs
- Per-sender rate limiting with Redis
- Rescheduling on rate limit with order preservation
- Idempotent job processing via DB status + BullMQ jobId
- Structured logging with correlation IDs
- Scheduled and sent job dashboards

Development workflow
--------------------
- Run `npm run dev:all` for API + worker
- Use `docker compose -f backend/docker-compose.yml up -d` for infra
- Inspect DB with Prisma Studio (`npm run prisma:studio`)
- Inspect Redis with Redis Commander (`http://localhost:8081`)
- Logs are structured JSON in production and pretty in development

Testing
-------
- Ethereal: use credentials in `.env` and check preview URLs logged by the worker
- Rate limiting: set `MAX_EMAILS_PER_HOUR` low and schedule multiple jobs
- Restart behavior: stop the worker and API, then restart; delayed jobs should still send

Behavior under load
-------------------
- Jobs are enqueued with calculated delays (`scheduledAt + delayBetweenEmails * index`).
- Worker runs with configured concurrency and a BullMQ limiter.
- Rate limit is checked before each send; on hit, jobs are rescheduled.

Behavior under load (1000+ emails)
---------------------------------
- The API inserts jobs in a single transaction and enqueues in bulk.
- BullMQ uses delayed jobs; Redis persists them across restarts.
- If rate limits are exceeded, jobs are rescheduled into future windows
  while preserving order per sender.

Production considerations
-------------------------
- Use a managed Postgres and Redis
- Scale workers horizontally (BullMQ supports multiple workers)
- Set strong `JWT_SECRET` and secure OAuth credentials
- Centralize logs and add monitoring/alerting

OAuth deployment notes
----------------------
- Google OAuth Console:
  - Authorized JavaScript origins: deployed frontend domain
  - Authorized redirect URIs: backend `GOOGLE_CALLBACK_URL`
- Login is Google-only; the app does not collect passwords.
  Recruiters should sign in with their own Google account.

Security and hardening notes
----------------------------
- CORS is restricted to `FRONTEND_URL` in `backend/src/server.ts`.
- API rate limiting is enabled via `express-rate-limit`.
- Request validation is enforced with Zod on endpoints that accept payloads or query params.
- Sensitive headers (Authorization, cookies) are redacted in request logs.

Demo video
----------
- Add a demo video at `./demo/demo-video.mp4` or provide a link.
- Suggested flow:
  1) Create a campaign with CSV upload
  2) Scheduled emails dashboard
  3) Restart API/worker; jobs persist
  4) Sent emails tab

Submission guidelines
---------------------
- Create a private GitHub repository
- Grant access to user: Mitrajit
- Ensure this README includes setup, architecture, and endpoints
- Include a short demo video (max 5 minutes)
- Note assumptions, shortcuts, and trade-offs

Known limitations
-----------------
- CSV drag-and-drop is not implemented; file upload is supported.
- Rescheduling offsets can push jobs beyond the immediate next hour window under heavy load.

Assumptions / trade-offs
------------------------
- Rate limits are enforced per sender (not per campaign).
- Worker relies on BullMQ retry backoff for transient SMTP failures.

Future enhancements
-------------------
- Add CSV drag-and-drop with client-side validation.
- Add richer pagination controls and server-driven filters for dashboards.
- Add email template variables and preview rendering.
