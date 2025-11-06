/**
 * Monitoring API Routes
 * Provides endpoints for monitoring, health checks, and system metrics
 */

import express from 'express';
import { monitoring } from '../services/monitoring/MonitoringService';
import { healthCheckService } from '../services/monitoring/HealthCheckService';
import { alertingService } from '../services/monitoring/AlertingService';
import { errorHandler } from '../services/monitoring/ErrorHandlerService';

const router = express.Router();

/**
 * GET /api/monitoring/overview
 * Get system overview with metrics, health checks, alerts, and logs
 */
router.get('/overview', async (req, res) => {
  try {
    const overview = await monitoring.getSystemOverview();
    res.json({
      success: true,
      data: overview,
      timestamp: Date.now(),
    });
  } catch (error) {
    errorHandler.handleError(error as Error, {
      service: 'monitoring-api',
      operation: 'get-overview',
      metadata: { ip: req.ip, userAgent: req.get('User-Agent') },
    });

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve system overview',
    });
  }
});

/**
 * GET /api/monitoring/metrics
 * Get system metrics with optional time range
 */
router.get('/metrics', (req, res) => {
  try {
    const { timeRange = '1h', metric } = req.query;

    let data;
    if (metric && typeof metric === 'string') {
      // Get specific metric history
      const history = monitoring.getMetricHistory(metric, 100);
      data = {
        metric,
        history: history.map((m) => ({
          timestamp: m.timestamp,
          value: m.value,
          unit: m.unit,
        })),
      };
    } else {
      // Get all current metrics
      data = {
        cpu: monitoring.getMetricValue('system.cpu.usage'),
        memory: monitoring.getMetricValue('system.memory.usage'),
        disk: monitoring.getMetricValue('system.disk.usage'),
        requests: {
          total: monitoring.getMetricValue('system.requests.total'),
          failed: monitoring.getMetricValue('system.requests.failed'),
          responseTime: monitoring.getMetricValue('system.requests.response_time'),
        },
        database: {
          connections: monitoring.getMetricValue('database.connections'),
          queries: {
            total: monitoring.getMetricValue('database.queries.total'),
            slow: monitoring.getMetricValue('database.queries.slow'),
            failed: monitoring.getMetricValue('database.queries.failed'),
            averageTime: monitoring.getMetricValue('database.queries.response_time'),
          },
        },
        cache: {
          hitRate: monitoring.getMetricValue('cache.hit.rate'),
          size: monitoring.getMetricValue('cache.size'),
        },
      };
    }

    res.json({
      success: true,
      data,
      timestamp: Date.now(),
    });
  } catch (error) {
    errorHandler.handleError(error as Error, {
      service: 'monitoring-api',
      operation: 'get-metrics',
      metadata: { query: req.query },
    });

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve metrics',
    });
  }
});

/**
 * GET /api/monitoring/health
 * Get health status of all services
 */
router.get('/health', async (req, res) => {
  try {
    const health = await healthCheckService.getSystemHealth();
    res.json({
      success: true,
      data: health,
      timestamp: Date.now(),
    });
  } catch (error) {
    errorHandler.handleError(error as Error, {
      service: 'monitoring-api',
      operation: 'get-health',
    });

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve health status',
    });
  }
});

/**
 * GET /api/monitoring/health/:service
 * Get health status for specific service
 */
router.get('/health/:service', async (req, res) => {
  try {
    const { service } = req.params;
    const health = healthCheckService.getServiceHealth(service);

    if (!health) {
      return res.status(404).json({
        success: false,
        error: `Health check not found for service: ${service}`,
      });
    }

    res.json({
      success: true,
      data: health,
      timestamp: Date.now(),
    });
  } catch (error) {
    errorHandler.handleError(error as Error, {
      service: 'monitoring-api',
      operation: 'get-service-health',
      metadata: { service: req.params.service },
    });

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve service health',
    });
  }
});

/**
 * POST /api/monitoring/health/:service/check
 * Manually trigger health check for a service
 */
router.post('/health/:service/check', async (req, res) => {
  try {
    const { service } = req.params;
    const dependencies = healthCheckService.getDependencies();
    const dependency = dependencies.find((d) => d.name === service);

    if (!dependency) {
      return res.status(404).json({
        success: false,
        error: `Service not found: ${service}`,
      });
    }

    await monitoring.performHealthCheck(service, dependency.checkFunction);

    const health = healthCheckService.getServiceHealth(service);

    res.json({
      success: true,
      data: health,
      message: `Health check completed for ${service}`,
      timestamp: Date.now(),
    });
  } catch (error) {
    errorHandler.handleError(error as Error, {
      service: 'monitoring-api',
      operation: 'manual-health-check',
      metadata: { service: req.params.service },
    });

    res.status(500).json({
      success: false,
      error: 'Failed to perform health check',
    });
  }
});

/**
 * GET /api/monitoring/alerts
 * Get alerts with optional filters
 */
router.get('/alerts', (req, res) => {
  try {
    const { resolved, severity, limit = 50 } = req.query;

    const filters: any = {};
    if (resolved !== undefined) {
      filters.resolved = resolved === 'true';
    }
    if (severity && typeof severity === 'string') {
      filters.severity = severity;
    }
    if (limit && typeof limit === 'string') {
      filters.limit = parseInt(limit);
    }

    const alerts = monitoring.getAlerts(filters);
    const statistics = alertingService.getAlertStatistics();

    res.json({
      success: true,
      data: {
        alerts,
        statistics,
        total: alerts.length,
      },
      timestamp: Date.now(),
    });
  } catch (error) {
    errorHandler.handleError(error as Error, {
      service: 'monitoring-api',
      operation: 'get-alerts',
      metadata: { query: req.query },
    });

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve alerts',
    });
  }
});

/**
 * POST /api/monitoring/alerts/:id/resolve
 * Resolve an alert
 */
router.post('/alerts/:id/resolve', (req, res) => {
  try {
    const { id } = req.params;
    monitoring.resolveAlert(id);

    res.json({
      success: true,
      message: `Alert ${id} resolved`,
      timestamp: Date.now(),
    });
  } catch (error) {
    errorHandler.handleError(error as Error, {
      service: 'monitoring-api',
      operation: 'resolve-alert',
      metadata: { alertId: req.params.id },
    });

    res.status(500).json({
      success: false,
      error: 'Failed to resolve alert',
    });
  }
});

/**
 * GET /api/monitoring/logs
 * Get logs with optional filters
 */
router.get('/logs', (req, res) => {
  try {
    const { level, service, startTime, endTime, limit = 100 } = req.query;

    const filters: any = { limit: parseInt(limit as string) };

    if (level && typeof level === 'string') {
      filters.level = level;
    }
    if (service && typeof service === 'string') {
      filters.service = service;
    }
    if (startTime && typeof startTime === 'string') {
      filters.startTime = parseInt(startTime);
    }
    if (endTime && typeof endTime === 'string') {
      filters.endTime = parseInt(endTime);
    }

    const logs = monitoring.getLogs(filters);

    res.json({
      success: true,
      data: {
        logs,
        total: logs.length,
      },
      timestamp: Date.now(),
    });
  } catch (error) {
    errorHandler.handleError(error as Error, {
      service: 'monitoring-api',
      operation: 'get-logs',
      metadata: { query: req.query },
    });

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve logs',
    });
  }
});

/**
 * GET /api/monitoring/alerting/statistics
 * Get alerting statistics and configuration
 */
router.get('/alerting/statistics', (req, res) => {
  try {
    const statistics = alertingService.getAlertStatistics();

    res.json({
      success: true,
      data: statistics,
      timestamp: Date.now(),
    });
  } catch (error) {
    errorHandler.handleError(error as Error, {
      service: 'monitoring-api',
      operation: 'get-alerting-statistics',
    });

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve alerting statistics',
    });
  }
});

/**
 * POST /api/monitoring/alerting/test-channel
 * Test a notification channel
 */
router.post('/alerting/test-channel', async (req, res) => {
  try {
    const { channel } = req.body;

    if (!channel) {
      return res.status(400).json({
        success: false,
        error: 'Channel name is required',
      });
    }

    const success = await alertingService.testChannel(channel);

    res.json({
      success: true,
      data: {
        channel,
        success,
      },
      message: success
        ? `Test notification sent to ${channel}`
        : `Failed to send test notification to ${channel}`,
      timestamp: Date.now(),
    });
  } catch (error) {
    errorHandler.handleError(error as Error, {
      service: 'monitoring-api',
      operation: 'test-channel',
      metadata: { body: req.body },
    });

    res.status(500).json({
      success: false,
      error: 'Failed to test notification channel',
    });
  }
});

/**
 * GET /api/monitoring/errors
 * Get error reports
 */
router.get('/errors', (req, res) => {
  try {
    const { service, resolved, limit = 50 } = req.query;

    const filters: any = {};
    if (service && typeof service === 'string') {
      filters.service = service;
    }
    if (resolved !== undefined) {
      filters.resolved = resolved === 'true';
    }
    if (limit && typeof limit === 'string') {
      filters.limit = parseInt(limit);
    }

    const errors = errorHandler.getErrorReports(filters);

    res.json({
      success: true,
      data: {
        errors,
        total: errors.length,
      },
      timestamp: Date.now(),
    });
  } catch (error) {
    errorHandler.handleError(error as Error, {
      service: 'monitoring-api',
      operation: 'get-errors',
      metadata: { query: req.query },
    });

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve error reports',
    });
  }
});

/**
 * POST /api/monitoring/errors/:id/resolve
 * Resolve an error report
 */
router.post('/errors/:id/resolve', (req, res) => {
  try {
    const { id } = req.params;
    errorHandler.resolveError(id);

    res.json({
      success: true,
      message: `Error ${id} resolved`,
      timestamp: Date.now(),
    });
  } catch (error) {
    errorHandler.handleError(error as Error, {
      service: 'monitoring-api',
      operation: 'resolve-error',
      metadata: { errorId: req.params.id },
    });

    res.status(500).json({
      success: false,
      error: 'Failed to resolve error',
    });
  }
});

/**
 * GET /api/monitoring/circuit-breakers
 * Get circuit breaker status
 */
router.get('/circuit-breakers', (req, res) => {
  try {
    const circuitBreakers = errorHandler.getCircuitBreakersStatus();

    res.json({
      success: true,
      data: circuitBreakers,
      timestamp: Date.now(),
    });
  } catch (error) {
    errorHandler.handleError(error as Error, {
      service: 'monitoring-api',
      operation: 'get-circuit-breakers',
    });

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve circuit breaker status',
    });
  }
});

/**
 * GET /api/monitoring/report
 * Generate comprehensive health report
 */
router.get('/report', async (req, res) => {
  try {
    const report = await healthCheckService.generateHealthReport();

    res.json({
      success: true,
      data: report,
      timestamp: Date.now(),
    });
  } catch (error) {
    errorHandler.handleError(error as Error, {
      service: 'monitoring-api',
      operation: 'generate-report',
    });

    res.status(500).json({
      success: false,
      error: 'Failed to generate health report',
    });
  }
});

/**
 * POST /api/monitoring/metrics/:name
 * Record a custom metric
 */
router.post('/metrics/:name', (req, res) => {
  try {
    const { name } = req.params;
    const { value, unit = 'count', tags = {} } = req.body;

    if (typeof value !== 'number') {
      return res.status(400).json({
        success: false,
        error: 'Metric value must be a number',
      });
    }

    monitoring.recordMetric(name, value, unit, tags);

    res.json({
      success: true,
      message: `Metric ${name} recorded`,
      data: { name, value, unit, tags },
      timestamp: Date.now(),
    });
  } catch (error) {
    errorHandler.handleError(error as Error, {
      service: 'monitoring-api',
      operation: 'record-metric',
      metadata: { metricName: req.params.name, body: req.body },
    });

    res.status(500).json({
      success: false,
      error: 'Failed to record metric',
    });
  }
});

/**
 * GET /api/monitoring/status
 * Simple status endpoint for load balancers
 */
router.get('/status', async (req, res) => {
  try {
    const health = await healthCheckService.getSystemHealth();
    const isHealthy = health.status === 'healthy';

    res.status(isHealthy ? 200 : 503).json({
      status: health.status,
      healthy: isHealthy,
      timestamp: Date.now(),
      version: process.env.npm_package_version || '1.0.0',
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      healthy: false,
      timestamp: Date.now(),
      error: 'Health check failed',
    });
  }
});

export default router;
