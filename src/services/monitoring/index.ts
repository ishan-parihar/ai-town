/**
 * Monitoring System Initialization
 * Sets up and starts all monitoring services
 */

import { monitoring } from './MonitoringService';
import { healthCheckService } from './HealthCheckService';
import { alertingService } from './AlertingService';
import { errorHandler } from './ErrorHandlerService';

export function initializeMonitoring() {
  console.log('🚀 Initializing AI Council Monitoring System...');

  try {
    // Start health monitoring
    healthCheckService.startHealthMonitoring(30000); // Check every 30 seconds
    console.log('✅ Health check monitoring started');

    // Setup alert callbacks
    monitoring.onAlert((alert) => {
      console.log(`🚨 Alert [${alert.severity.toUpperCase()}]: ${alert.title}`);

      // Log critical alerts to console
      if (alert.severity === 'critical') {
        console.error(`🔴 CRITICAL ALERT: ${alert.message}`);
      }
    });

    // Initialize metrics collection
    monitoring.recordMetric('system.startup', 1, 'count', {
      service: 'monitoring',
      timestamp: new Date().toISOString(),
    });

    // Setup error handling
    process.on('SIGTERM', () => {
      console.log('📊 Shutting down monitoring system...');
      healthCheckService.stopHealthMonitoring();
      monitoring.destroy();
      process.exit(0);
    });

    process.on('SIGINT', () => {
      console.log('📊 Shutting down monitoring system...');
      healthCheckService.stopHealthMonitoring();
      monitoring.destroy();
      process.exit(0);
    });

    // Log successful initialization
    monitoring.log('info', 'monitoring', 'Monitoring system initialized successfully', {
      services: ['metrics', 'health-checks', 'alerting', 'error-handling'],
      timestamp: new Date().toISOString(),
    });

    console.log('✅ Monitoring system initialized successfully');

    // Return monitoring services for external access
    return {
      monitoring,
      healthCheckService,
      alertingService,
      errorHandler,
    };
  } catch (error) {
    console.error('❌ Failed to initialize monitoring system:', error);
    throw error;
  }
}

export async function performHealthCheck() {
  try {
    const health = await healthCheckService.getSystemHealth();
    console.log(`📊 System Health: ${health.status.toUpperCase()}`);
    console.log(`   - Total services: ${health.summary.total}`);
    console.log(`   - Healthy: ${health.summary.healthy}`);
    console.log(`   - Degraded: ${health.summary.degraded}`);
    console.log(`   - Unhealthy: ${health.summary.unhealthy}`);

    return health;
  } catch (error) {
    console.error('❌ Health check failed:', error);
    throw error;
  }
}

export function getMonitoringStats() {
  const stats = alertingService.getAlertStatistics();
  const errorReports = errorHandler.getErrorReports({ limit: 10 });

  return {
    alerts: stats,
    recentErrors: errorReports,
    timestamp: Date.now(),
  };
}

// Graceful shutdown handler
export function setupGracefulShutdown() {
  const shutdown = (signal: string) => {
    console.log(`\n📊 Received ${signal}. Shutting down monitoring system gracefully...`);

    try {
      healthCheckService.stopHealthMonitoring();
      monitoring.destroy();

      // Log shutdown
      monitoring.log('info', 'monitoring', `Monitoring system shutdown via ${signal}`, {
        timestamp: new Date().toISOString(),
      });

      console.log('✅ Monitoring system shut down successfully');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

export default {
  initializeMonitoring,
  performHealthCheck,
  getMonitoringStats,
  setupGracefulShutdown,
};
