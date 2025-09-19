# Railway Deployment Guide for Dhantra Cron Service

## Prerequisites

1. **Railway Account**: Sign up at [railway.app](https://railway.app)
2. **GitHub Repository**: Push the cron service code to GitHub
3. **Dhantra Core API**: Ensure your Dhantra Core service is deployed and accessible

## Step 1: Deploy to Railway

### Option A: Deploy from GitHub

1. **Connect GitHub Repository**:
   - Go to [Railway Dashboard](https://railway.app/dashboard)
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your `dhantra-cron-service` repository

2. **Configure Deployment**:
   - Railway will automatically detect the Node.js project
   - It will use the `package.json` and `Dockerfile` for deployment
   - The service will be available at `https://dhantra-cron-service-production.up.railway.app`

### Option B: Deploy with Railway CLI

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Initialize Railway project
railway init

# Deploy
railway up
```

## Step 2: Configure Environment Variables

In the Railway dashboard, go to your project and add these environment variables:

### Required Variables

```bash
# Service Configuration
PORT=3000
NODE_ENV=production

# Dhantra Core API (replace with your actual URL)
DHANTRA_CORE_API_URL=https://dhantra-core-production.up.railway.app
DHANTRA_API_KEY=your_dhantra_core_api_key

# Security
API_SECRET=your_secure_random_string_here
```

### Optional Variables

```bash
# Logging
LOG_LEVEL=info

# Database (if you want to persist cron jobs)
DATABASE_URL=postgresql://user:password@host:port/database
```

## Step 3: Test the Deployment

### Health Check
```bash
curl https://dhantra-cron-service-production.up.railway.app/health
```

### Create a Test Cron Job
```bash
curl -X POST https://dhantra-cron-service-production.up.railway.app/api/cron-jobs \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Job",
    "schedule": "*/5 * * * *",
    "tickers": ["TQQQ"],
    "strategy": "Reversal",
    "confidenceThreshold": 0.7,
    "buyAmount": 1000.0,
    "phoneNumbers": ["+1234567890"]
  }'
```

### List Cron Jobs
```bash
curl https://dhantra-cron-service-production.up.railway.app/api/cron-jobs
```

## Step 4: Update Flutter App Configuration

Update your Flutter app's API configuration to point to the new cron service:

```dart
// In dhantra-app/lib/config/api_config.dart
class ApiConfig {
  static const String cronServiceUrl = 'https://dhantra-cron-service-production.up.railway.app';
  // ... other configurations
}
```

## Step 5: Monitor and Manage

### Railway Dashboard
- View logs in real-time
- Monitor resource usage
- Check deployment status
- Manage environment variables

### Service Endpoints
- **Health**: `GET /health`
- **Jobs**: `GET /api/cron-jobs`
- **Create**: `POST /api/cron-jobs`
- **Update**: `PUT /api/cron-jobs/:id`
- **Delete**: `DELETE /api/cron-jobs/:id`
- **Toggle**: `PATCH /api/cron-jobs/:id/toggle`
- **Execute**: `POST /api/cron-jobs/:id/execute`
- **History**: `GET /api/execution-history`

## Step 6: Production Considerations

### Security
- Use strong API keys
- Enable HTTPS (Railway provides this automatically)
- Implement rate limiting (already included)
- Validate all inputs

### Monitoring
- Set up alerts for failed executions
- Monitor cron job success rates
- Track execution times
- Log all activities

### Scaling
- Railway automatically handles scaling
- Consider database persistence for production
- Implement job queuing for high-frequency jobs

## Troubleshooting

### Common Issues

1. **Service Not Starting**:
   - Check environment variables
   - Verify port configuration
   - Check logs in Railway dashboard

2. **API Connection Issues**:
   - Verify `DHANTRA_CORE_API_URL` is correct
   - Check API key validity
   - Ensure Dhantra Core service is running

3. **Cron Jobs Not Executing**:
   - Check job schedule format
   - Verify job is active
   - Check execution history

### Debug Commands

```bash
# Check service health
curl https://your-cron-service.up.railway.app/health

# View execution history
curl https://your-cron-service.up.railway.app/api/execution-history

# Test manual execution
curl -X POST https://your-cron-service.up.railway.app/api/cron-jobs/JOB_ID/execute
```

## Cost Optimization

### Railway Pricing
- **Hobby Plan**: $5/month for 500 hours
- **Pro Plan**: $20/month for unlimited usage
- **Team Plan**: $99/month for team collaboration

### Optimization Tips
- Use Hobby plan for development/testing
- Upgrade to Pro for production with high-frequency jobs
- Monitor resource usage
- Consider job batching for efficiency

## Next Steps

1. **Integrate with Flutter App**: Add cron management UI
2. **Add Database Persistence**: Store cron jobs in PostgreSQL
3. **Implement Advanced Features**: Job dependencies, retry logic
4. **Add Monitoring**: Set up alerts and dashboards
5. **Scale for Production**: Optimize for high-frequency trading

## Support

- **Railway Documentation**: [docs.railway.app](https://docs.railway.app)
- **Railway Community**: [discord.gg/railway](https://discord.gg/railway)
- **GitHub Issues**: Create issues in your repository
