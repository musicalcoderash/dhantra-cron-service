/**
 * Firebase Logging Service for Dhantra Cron Service
 * Comprehensive logging for cron job execution and monitoring
 */

const axios = require('axios');

class FirebaseLoggingService {
    constructor() {
        this.firebaseProjectId = process.env.FIREBASE_PROJECT_ID || 'dhantra-web-app';
        this.firebaseApiKey = process.env.FIREBASE_API_KEY || 'AIzaSyC5D5h8iOLzeDxwc95JirP49n_OLJhlbyk';
        this.firebaseBaseUrl = `https://firestore.googleapis.com/v1/projects/${this.firebaseProjectId}/databases/(default)/documents`;
    }

    /**
     * Send data to Firebase Firestore
     */
    async _sendToFirebase(collection, documentId, data) {
        try {
            const url = `${this.firebaseBaseUrl}/${collection}/${documentId}`;
            
            const response = await axios.patch(url, data, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.firebaseApiKey}`
                },
                timeout: 5000 // 5 second timeout
            });

            if (response.status === 200) {
                console.log(`✅ Firebase log sent successfully: ${collection}/${documentId}`);
                return true;
            } else {
                console.warn(`⚠️ Firebase log failed: ${response.status} - ${response.data}`);
                return false;
            }
        } catch (error) {
            console.error(`❌ Firebase logging error: ${error.message}`);
            return false;
        }
    }

    /**
     * Log cron job creation
     */
    async logCronJobCreated(jobId, jobName, schedule, tickers, strategy, confidenceThreshold, buyAmount, phoneNumbers) {
        const data = {
            jobId,
            jobName,
            schedule,
            tickers,
            strategy,
            confidenceThreshold,
            buyAmount,
            phoneNumbers,
            status: 'CREATED',
            timestamp: new Date().toISOString(),
            service: 'dhantra-cron-service',
            logType: 'cron_job_created'
        };

        await this._sendToFirebase('cron_jobs', jobId, data);
    }

    /**
     * Log cron job execution start
     */
    async logCronJobStart(jobId, executionId, jobName, tickers, strategy, confidenceThreshold, buyAmount, phoneNumbers) {
        const data = {
            jobId,
            executionId,
            jobName,
            tickers,
            strategy,
            confidenceThreshold,
            buyAmount,
            phoneNumbers,
            status: 'STARTED',
            timestamp: new Date().toISOString(),
            service: 'dhantra-cron-service',
            logType: 'cron_job_execution'
        };

        await this._sendToFirebase('cron_job_executions', executionId, data);
    }

    /**
     * Log cron job execution completion
     */
    async logCronJobComplete(jobId, executionId, success, message, executionTime, responseData) {
        const data = {
            jobId,
            executionId,
            status: success ? 'COMPLETED' : 'FAILED',
            message,
            executionTime,
            responseData,
            timestamp: new Date().toISOString(),
            service: 'dhantra-cron-service',
            logType: 'cron_job_execution'
        };

        await this._sendToFirebase('cron_job_executions', executionId, data);
    }

    /**
     * Log core API communication
     */
    async logCoreApiCall(executionId, endpoint, requestPayload, responseStatus, responseTime, success, errorMessage) {
        const data = {
            executionId,
            endpoint,
            requestPayload,
            responseStatus,
            responseTime,
            success,
            errorMessage: errorMessage || 'N/A',
            timestamp: new Date().toISOString(),
            service: 'dhantra-cron-service',
            logType: 'core_api_call'
        };

        const documentId = `${executionId}_${Date.now()}`;
        await this._sendToFirebase('core_api_calls', documentId, data);
    }

    /**
     * Log job schedule validation
     */
    async logScheduleValidation(schedule, isValid, errorMessage) {
        const data = {
            schedule,
            isValid,
            errorMessage: errorMessage || 'N/A',
            timestamp: new Date().toISOString(),
            service: 'dhantra-cron-service',
            logType: 'schedule_validation'
        };

        const documentId = `schedule_${Date.now()}`;
        await this._sendToFirebase('schedule_validations', documentId, data);
    }

    /**
     * Log job management operations
     */
    async logJobManagement(operation, jobId, jobName, success, details) {
        const data = {
            operation, // CREATE, UPDATE, DELETE, TOGGLE
            jobId,
            jobName,
            success,
            details: details || {},
            timestamp: new Date().toISOString(),
            service: 'dhantra-cron-service',
            logType: 'job_management'
        };

        const documentId = `${operation}_${jobId}_${Date.now()}`;
        await this._sendToFirebase('job_management', documentId, data);
    }

    /**
     * Log system health metrics
     */
    async logSystemHealth(activeJobs, totalExecutions, successRate, averageExecutionTime, memoryUsage, cpuUsage) {
        const data = {
            activeJobs,
            totalExecutions,
            successRate,
            averageExecutionTime,
            memoryUsage,
            cpuUsage,
            timestamp: new Date().toISOString(),
            service: 'dhantra-cron-service',
            logType: 'system_health'
        };

        const documentId = `health_${Date.now()}`;
        await this._sendToFirebase('system_health', documentId, data);
    }

    /**
     * Log error occurrences
     */
    async logError(executionId, errorType, errorMessage, stackTrace, context) {
        const data = {
            executionId,
            errorType,
            errorMessage,
            stackTrace,
            context,
            timestamp: new Date().toISOString(),
            service: 'dhantra-cron-service',
            logType: 'error'
        };

        const documentId = `${executionId}_${errorType}_${Date.now()}`;
        await this._sendToFirebase('errors', documentId, data);
    }

    /**
     * Log job execution history
     */
    async logExecutionHistory(jobId, executionId, jobName, startTime, endTime, duration, success, results) {
        const data = {
            jobId,
            executionId,
            jobName,
            startTime,
            endTime,
            duration,
            success,
            results,
            timestamp: new Date().toISOString(),
            service: 'dhantra-cron-service',
            logType: 'execution_history'
        };

        await this._sendToFirebase('execution_history', executionId, data);
    }

    /**
     * Log notification delivery
     */
    async logNotificationDelivery(executionId, phoneNumbers, message, deliveryStatus, responseTime) {
        const data = {
            executionId,
            phoneNumbers,
            message,
            deliveryStatus,
            responseTime,
            timestamp: new Date().toISOString(),
            service: 'dhantra-cron-service',
            logType: 'notification_delivery'
        };

        const documentId = `${executionId}_notification_${Date.now()}`;
        await this._sendToFirebase('notification_deliveries', documentId, data);
    }
}

// Export singleton instance
module.exports = new FirebaseLoggingService();
