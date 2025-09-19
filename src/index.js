const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cron = require('node-cron');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const winston = require('winston');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configure logging
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: [
    'https://dhantra-web-app.web.app',
    'https://dhantra-web-app.firebaseapp.com',
    'http://localhost:3000',
    'http://localhost:8080',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:8080'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// In-memory storage for cron jobs (in production, use a database)
const cronJobs = new Map();
const jobHistory = [];

// Cron job execution function
async function executeCronJob(jobConfig) {
  const startTime = Date.now();
  const executionId = uuidv4();
  
  try {
    logger.info(`Executing cron job: ${jobConfig.name} (${executionId})`);
    
    // Prepare the request payload
    const payload = {
      tickers: jobConfig.tickers || [jobConfig.ticker],
      strategy: jobConfig.strategy || 'Reversal',
      confidenceThreshold: jobConfig.confidenceThreshold || 0.7,
      buyAmount: jobConfig.buyAmount || 1000.0,
      phoneNumbers: jobConfig.phoneNumbers || [jobConfig.phoneNumber],
      apiKey: process.env.DHANTRA_API_KEY
    };

    // Call the Dhantra Core API
    const response = await axios.post(
      `${process.env.DHANTRA_CORE_API_URL}/api/external-cron/execute`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.DHANTRA_API_KEY}`
        },
        timeout: 30000 // 30 second timeout
      }
    );

    const executionTime = Date.now() - startTime;
    
    // Log successful execution
    const executionLog = {
      id: executionId,
      jobId: jobConfig.id,
      jobName: jobConfig.name,
      status: 'SUCCESS',
      executionTime: `${executionTime}ms`,
      timestamp: new Date().toISOString(),
      response: response.data
    };
    
    jobHistory.push(executionLog);
    logger.info(`Cron job ${jobConfig.name} executed successfully in ${executionTime}ms`);
    
    return executionLog;
    
  } catch (error) {
    const executionTime = Date.now() - startTime;
    
    // Log failed execution
    const executionLog = {
      id: executionId,
      jobId: jobConfig.id,
      jobName: jobConfig.name,
      status: 'FAILED',
      executionTime: `${executionTime}ms`,
      timestamp: new Date().toISOString(),
      error: error.message
    };
    
    jobHistory.push(executionLog);
    logger.error(`Cron job ${jobConfig.name} failed: ${error.message}`);
    
    return executionLog;
  }
}

// API Routes

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    activeJobs: cronJobs.size
  });
});

// Get all cron jobs
app.get('/api/cron-jobs', (req, res) => {
  const jobs = Array.from(cronJobs.values()).map(job => ({
    id: job.id,
    name: job.name,
    schedule: job.schedule,
    tickers: job.tickers,
    strategy: job.strategy,
    confidenceThreshold: job.confidenceThreshold,
    buyAmount: job.buyAmount,
    phoneNumbers: job.phoneNumbers,
    isActive: job.isActive,
    createdAt: job.createdAt,
    lastExecuted: job.lastExecuted
  }));
  
  res.json({
    success: true,
    jobs,
    total: jobs.length
  });
});

// Create a new cron job
app.post('/api/cron-jobs', (req, res) => {
  try {
    const {
      name,
      schedule,
      tickers,
      strategy = 'Reversal',
      confidenceThreshold = 0.7,
      buyAmount = 1000.0,
      phoneNumbers
    } = req.body;

    // Validate required fields
    if (!name || !schedule || !tickers || !phoneNumbers) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, schedule, tickers, phoneNumbers'
      });
    }

    // Validate cron schedule
    if (!cron.validate(schedule)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid cron schedule format'
      });
    }

    const jobId = uuidv4();
    const jobConfig = {
      id: jobId,
      name,
      schedule,
      tickers: Array.isArray(tickers) ? tickers : [tickers],
      strategy,
      confidenceThreshold,
      buyAmount,
      phoneNumbers: Array.isArray(phoneNumbers) ? phoneNumbers : [phoneNumbers],
      isActive: true,
      createdAt: new Date().toISOString(),
      lastExecuted: null
    };

    // Create the cron job
    const task = cron.schedule(schedule, async () => {
      jobConfig.lastExecuted = new Date().toISOString();
      await executeCronJob(jobConfig);
    }, {
      scheduled: false
    });

    // Store the job
    cronJobs.set(jobId, jobConfig);
    
    // Start the job
    task.start();
    
    logger.info(`Created cron job: ${name} with schedule: ${schedule}`);
    
    res.status(201).json({
      success: true,
      message: 'Cron job created successfully',
      job: {
        id: jobId,
        name,
        schedule,
        tickers: jobConfig.tickers,
        strategy,
        confidenceThreshold,
        buyAmount,
        phoneNumbers: jobConfig.phoneNumbers,
        isActive: true,
        createdAt: jobConfig.createdAt
      }
    });
    
  } catch (error) {
    logger.error(`Error creating cron job: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to create cron job'
    });
  }
});

// Update a cron job
app.put('/api/cron-jobs/:id', (req, res) => {
  try {
    const { id } = req.params;
    const job = cronJobs.get(id);
    
    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Cron job not found'
      });
    }

    const updates = req.body;
    
    // Update job configuration
    Object.assign(job, updates, {
      updatedAt: new Date().toISOString()
    });

    // If schedule changed, restart the job
    if (updates.schedule && updates.schedule !== job.schedule) {
      if (!cron.validate(updates.schedule)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid cron schedule format'
        });
      }
      
      // Stop old job and create new one
      // Note: In a real implementation, you'd need to track and stop the old task
      job.schedule = updates.schedule;
    }

    logger.info(`Updated cron job: ${job.name}`);
    
    res.json({
      success: true,
      message: 'Cron job updated successfully',
      job
    });
    
  } catch (error) {
    logger.error(`Error updating cron job: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to update cron job'
    });
  }
});

// Delete a cron job
app.delete('/api/cron-jobs/:id', (req, res) => {
  try {
    const { id } = req.params;
    const job = cronJobs.get(id);
    
    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Cron job not found'
      });
    }

    // Stop and remove the job
    cronJobs.delete(id);
    
    logger.info(`Deleted cron job: ${job.name}`);
    
    res.json({
      success: true,
      message: 'Cron job deleted successfully'
    });
    
  } catch (error) {
    logger.error(`Error deleting cron job: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to delete cron job'
    });
  }
});

// Toggle cron job active status
app.patch('/api/cron-jobs/:id/toggle', (req, res) => {
  try {
    const { id } = req.params;
    const job = cronJobs.get(id);
    
    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Cron job not found'
      });
    }

    job.isActive = !job.isActive;
    job.updatedAt = new Date().toISOString();
    
    logger.info(`Toggled cron job ${job.name} to ${job.isActive ? 'active' : 'inactive'}`);
    
    res.json({
      success: true,
      message: `Cron job ${job.isActive ? 'activated' : 'deactivated'}`,
      job: {
        id: job.id,
        name: job.name,
        isActive: job.isActive
      }
    });
    
  } catch (error) {
    logger.error(`Error toggling cron job: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to toggle cron job'
    });
  }
});

// Get execution history
app.get('/api/execution-history', (req, res) => {
  const { limit = 50, jobId } = req.query;
  
  let history = jobHistory;
  
  if (jobId) {
    history = history.filter(execution => execution.jobId === jobId);
  }
  
  // Sort by timestamp (newest first) and limit
  history = history
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, parseInt(limit));
  
  res.json({
    success: true,
    history,
    total: history.length
  });
});

// Execute a cron job manually
app.post('/api/cron-jobs/:id/execute', async (req, res) => {
  try {
    const { id } = req.params;
    const job = cronJobs.get(id);
    
    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Cron job not found'
      });
    }

    logger.info(`Manually executing cron job: ${job.name}`);
    const result = await executeCronJob(job);
    
    res.json({
      success: true,
      message: 'Cron job executed manually',
      execution: result
    });
    
  } catch (error) {
    logger.error(`Error executing cron job manually: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to execute cron job'
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(`Unhandled error: ${err.message}`, err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`Dhantra Cron Service running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`Dhantra Core API: ${process.env.DHANTRA_CORE_API_URL}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

module.exports = app;
