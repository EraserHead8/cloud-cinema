# AI Review Autopilot (MVP)

Autonomous SaaS MVP for local businesses:
1. Ingest new reviews
2. Generate AI reply
3. Auto-publish reply (mock provider now)
4. Track revenue and processing metrics

## Stack
- FastAPI
- SQLite + SQLAlchemy
- JWT auth
- OpenAI Responses API (optional)

## Run
```bash
cd /Users/eraserhead/Documents/openclaw-cinema/review-autopilot
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8010
```

## Run with Docker
```bash
cd /Users/eraserhead/Documents/openclaw-cinema/review-autopilot
cp .env.example .env
docker compose up -d --build
curl http://127.0.0.1:8010/health
```

## API demo flow

### 1) Register
```bash
curl -s -X POST http://127.0.0.1:8010/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"owner@example.com","password":"StrongPass123"}'
```

### 2) Create business
```bash
TOKEN='<access_token>'
curl -s -X POST http://127.0.0.1:8010/api/businesses \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"name":"Nova Dental","tone":"friendly","locale":"en","plan":"starter"}'
```

### 3) Ingest review (auto pipeline)
```bash
curl -s -X POST http://127.0.0.1:8010/api/reviews/ingest \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "business_id":1,
    "external_review_id":"g-1001",
    "author_name":"John",
    "rating":5,
    "text":"Great service and fast appointment",
    "source":"google"
  }'
```

### 4) Metrics
```bash
curl -s "http://127.0.0.1:8010/api/metrics" -H "Authorization: Bearer $TOKEN"
```

## What is autonomous already
- Review ingestion triggers generation and publication automatically.
- Revenue estimation is automatic from active subscriptions.
- Google sync endpoint can pull reviews and process all new items automatically.
- Stripe checkout/webhook endpoints are available (mock in dev, live in prod with keys).
- Background autosync loop runs continuously for connected Google businesses.

## What to connect for production
- Google Business Profile OAuth + Review notifications (Pub/Sub)
- Real publish endpoint instead of mock publisher
- Stripe subscriptions and webhook sync
- Queue/worker (Celery/RQ) for high throughput

## New integration endpoints
- `GET /api/integrations/google/auth-url?business_id=<id>`
- `POST /api/integrations/google/callback`
- `POST /api/integrations/google/sync-reviews?business_id=<id>`
- `POST /api/integrations/stripe/checkout-session`
- `POST /api/integrations/stripe/webhook`
- `GET /api/integrations/status?business_id=<id>`
- `POST /api/system/run-autosync-now`

## Autosync settings
- `AUTO_SYNC_ENABLED=1`
- `SYNC_INTERVAL_SECONDS=120`

## VPS test deploy (without domain)
```bash
# On server
git clone <your-repo-url> /opt/review-autopilot
cd /opt/review-autopilot/review-autopilot
cp .env.example .env
docker compose up -d --build

# Verify from your browser:
# http://<SERVER_IP>:8010/health
```
