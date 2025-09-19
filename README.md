# Dhantra Cron Service

A configurable cron service for the Dhantra trading system that allows creating and managing automated trading jobs with custom schedules.

## Features

- 🕐 **Configurable Cron Schedules**: Create cron jobs with custom cadence (every 5 minutes, hourly, daily, etc.)
- 📊 **Multi-Ticker Support**: Monitor multiple tickers simultaneously
- 📱 **Phone Notifications**: Send WhatsApp alerts to multiple phone numbers
- 📈 **Trading Strategies**: Support for different trading strategies (Reversal, etc.)
- 💰 **Configurable Amounts**: Set custom buy amounts for each job
- 📊 **Execution History**: Track and monitor job execution history
- 🔧 **RESTful API**: Full CRUD operations for managing cron jobs
- 🚀 **Railway Ready**: Optimized for Railway deployment

## API Endpoints

### Health Check
- `GET /health` - Service health status

### Cron Job Management
- `GET /api/cron-jobs` - List all cron jobs
- `POST /api/cron-jobs` - Create a new cron job
- `PUT /api/cron-jobs/:id` - Update a cron job
- `DELETE /api/cron-jobs/:id` - Delete a cron job
- `PATCH /api/cron-jobs/:id/toggle` - Toggle job active/inactive
- `POST /api/cron-jobs/:id/execute` - Execute job manually

### Execution History
- `GET /api/execution-history` - Get execution history

## Configuration

### Environment Variables

```bash
# Service Configuration
PORT=3000
NODE_ENV=production

# Dhantra Core API
DHANTRA_CORE_API_URL=https://dhantra-core-production.up.railway.app
DHANTRA_API_KEY=your_api_key_here

# Database (optional)
DATABASE_URL=postgresql://user:password@host:port/database

# Logging
LOG_LEVEL=info

# Security
API_SECRET=your_secret_key_here
```

## Usage Examples

### Create a 5-minute cron job
```bash
curl -X POST http://localhost:3000/api/cron-jobs \
  -H "Content-Type: application/json" \
  -d '{
    "name": "TQQQ 5min Trading",
    "schedule": "*/5 * * * *",
    "tickers": ["TQQQ"],
    "strategy": "Reversal",
    "confidenceThreshold": 0.7,
    "buyAmount": 1000.0,
    "phoneNumbers": ["+1234567890"]
  }'
```

### Create an hourly job for multiple tickers
```bash
curl -X POST http://localhost:3000/api/cron-jobs \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Multi-Ticker Hourly",
    "schedule": "0 * * * *",
    "tickers": ["TQQQ", "SPY", "QQQ"],
    "strategy": "Reversal",
    "confidenceThreshold": 0.8,
    "buyAmount": 2000.0,
    "phoneNumbers": ["+1234567890", "+0987654321"]
  }'
```

### Create a daily job
```bash
curl -X POST http://localhost:3000/api/cron-jobs \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Daily Market Open",
    "schedule": "30 9 * * 1-5",
    "tickers": ["TQQQ"],
    "strategy": "Reversal",
    "confidenceThreshold": 0.6,
    "buyAmount": 5000.0,
    "phoneNumbers": ["+1234567890"]
  }'
```

## Cron Schedule Examples

- `*/5 * * * *` - Every 5 minutes
- `*/15 * * * *` - Every 15 minutes
- `0 * * * *` - Every hour
- `0 */2 * * *` - Every 2 hours
- `30 9 * * 1-5` - 9:30 AM on weekdays (market open)
- `0 16 * * 1-5` - 4:00 PM on weekdays (market close)
- `0 0 * * *` - Daily at midnight

## Deployment

### Railway Deployment

1. Connect your GitHub repository to Railway
2. Set environment variables in Railway dashboard
3. Deploy automatically

### Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start production server
npm start
```

## Integration with Dhantra App

This service integrates with the Dhantra Flutter app to provide:

1. **Cron Job Management UI**: Create, edit, and delete cron jobs
2. **Schedule Configuration**: Visual cron schedule builder
3. **Execution Monitoring**: Real-time job status and history
4. **Phone Number Management**: Add/remove notification recipients

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Flutter App   │───▶│  Cron Service    │───▶│  Dhantra Core   │
│                 │    │  (Railway)       │    │  (Railway)      │
│ - Job Management│    │ - Schedule Jobs  │    │ - Execute Trades│
│ - UI Controls   │    │ - Call API       │    │ - Send Alerts   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Monitoring

- Health checks via `/health` endpoint
- Execution history tracking
- Error logging and monitoring
- Performance metrics

## Security

- Rate limiting on API endpoints
- Input validation and sanitization
- Secure environment variable handling
- CORS protection
