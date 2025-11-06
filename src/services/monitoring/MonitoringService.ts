/**
 * System Monitoring Service
 * Provides comprehensive monitoring, logging, and alerting capabilities
 */

export interface SystemMetrics {
  timestamp: number;
  cpu: {
    usage: number;
    loadAverage: number[];
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
    heap: {
      used: number;
      total: number;
      limit: number;
    };
  };
  disk: {
    used: number;
    total: number;
    percentage: number;
  };
  network: {
    connections: number;
    requests: {
      total: number;
      successful: number;
      failed: number;
      averageResponseTime: number;
    };
  };
  database: {
    connections: number;
    queries: {
      total: number;
      slow: number;
      failed: number;
      averageTime: number;
    };
  };
  cache: {
    hitRate: number;
    missRate: number;
    size: number;
  };
}

export interface HealthCheck {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  message: string;
  timestamp: number;
  responseTime: number;
  details?: Record<string, any>;
}

export interface Alert {
  id: string;
  type: 'error' | 'warning' | 'critical';
  severity: 'low' | 'medium' | 'high' | 'critical' | 'warning';
  title: string;
  message: string;
  source: string;
  timestamp: number;
  resolved: boolean;
  resolvedAt?: number;
  metadata: Record<string, any>;
}

export interface LogEntry {
  timestamp: number;
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  service: string;
  message: string;
  metadata?: Record<string, any>;
  traceId?: string;
  userId?: string;
  requestId?: string;
}

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  tags: Record<string, string>;
}

export class MonitoringService {
  private static instance: MonitoringService;
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  private logs: LogEntry[] = [];
  private healthChecks: Map<string, HealthCheck> = new Map();
  private alerts: Alert[] = [];
  private alertCallbacks: ((alert: Alert) => void)[] = [];
  private metricsInterval: NodeJS.Timeout | null = null;
  private maxLogEntries = 10000;
  private maxMetricsHistory = 1000;

  private constructor() {
    this.startMetricsCollection();
  }

  static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  /**
   * Start collecting system metrics
   */
  private startMetricsCollection(): void {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }

    this.metricsInterval = setInterval(async () => {
      try {
        const metrics = await this.collectSystemMetrics();
        this.recordMetric('system.cpu.usage', metrics.cpu.usage, 'percent', { source: 'system' });
        this.recordMetric('system.memory.usage', metrics.memory.percentage, 'percent', {
          source: 'system',
        });
        this.recordMetric('system.disk.usage', metrics.disk.percentage, 'percent', {
          source: 'system',
        });
        this.recordMetric('system.requests.total', metrics.network.requests.total, 'count', {
          source: 'system',
        });
        this.recordMetric('system.requests.failed', metrics.network.requests.failed, 'count', {
          source: 'system',
        });
        this.recordMetric(
          'system.requests.response_time',
          metrics.network.requests.averageResponseTime,
          'ms',
          { source: 'system' },
        );
      } catch (error) {
        this.log('error', 'monitoring', 'Failed to collect system metrics', {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }, 30000); // Collect every 30 seconds
  }

  /**
   * Collect comprehensive system metrics
   */
  private async collectSystemMetrics(): Promise<SystemMetrics> {
    const timestamp = Date.now();

    // Get memory usage
    const memUsage = process.memoryUsage();
    const totalMem = require('os').totalmem();
    const freeMem = require('os').freemem();

    // Get CPU info
    const cpus = require('os').cpus();
    const loadAvg = require('os').loadavg();

    // Calculate CPU usage (simplified)
    let totalIdle = 0;
    let totalTick = 0;
    cpus.forEach((cpu: any) => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    });
    const idle = totalIdle / cpus.length;
    const total = totalTick / cpus.length;
    const cpuUsage = 100 - (idle / total) * 100;

    return {
      timestamp,
      cpu: {
        usage: Math.round(cpuUsage * 100) / 100,
        loadAverage: loadAvg,
      },
      memory: {
        used: totalMem - freeMem,
        total: totalMem,
        percentage: Math.round(((totalMem - freeMem) / totalMem) * 100 * 100) / 100,
        heap: {
          used: memUsage.heapUsed,
          total: memUsage.heapTotal,
          limit: memUsage.heapUsed * 2, // Approximate limit
        },
      },
      disk: {
        used: 0, // Would need disk usage library for actual values
        total: 100,
        percentage: 0,
      },
      network: {
        connections: 0,
        requests: {
          total: this.getMetricValue('system.requests.total') || 0,
          successful: this.getMetricValue('system.requests.successful') || 0,
          failed: this.getMetricValue('system.requests.failed') || 0,
          averageResponseTime: this.getMetricValue('system.requests.response_time') || 0,
        },
      },
      database: {
        connections: 0,
        queries: {
          total: this.getMetricValue('database.queries.total') || 0,
          slow: this.getMetricValue('database.queries.slow') || 0,
          failed: this.getMetricValue('database.queries.failed') || 0,
          averageTime: this.getMetricValue('database.queries.response_time') || 0,
        },
      },
      cache: {
        hitRate: 0.85, // Mock values
        missRate: 0.15,
        size: 1000,
      },
    };
  }

  /**
   * Record a performance metric
   */
  recordMetric(name: string, value: number, unit: string, tags: Record<string, string> = {}): void {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: Date.now(),
      tags,
    };

    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const metricHistory = this.metrics.get(name)!;
    metricHistory.push(metric);

    // Keep only recent metrics
    if (metricHistory.length > this.maxMetricsHistory) {
      metricHistory.shift();
    }

    // Check for threshold alerts
    this.checkMetricThresholds(metric);
  }

  /**
   * Get metric value (latest)
   */
  getMetricValue(name: string): number | null {
    const history = this.metrics.get(name);
    return history && history.length > 0 ? history[history.length - 1].value : null;
  }

  /**
   * Get metric history
   */
  getMetricHistory(name: string, limit: number = 100): PerformanceMetric[] {
    const history = this.metrics.get(name) || [];
    return history.slice(-limit);
  }

  /**
   * Check metric thresholds and create alerts
   */
  private checkMetricThresholds(metric: PerformanceMetric): void {
    const thresholds: Record<string, { warning: number; critical: number }> = {
      'system.cpu.usage': { warning: 70, critical: 90 },
      'system.memory.usage': { warning: 80, critical: 95 },
      'system.disk.usage': { warning: 80, critical: 95 },
      'system.requests.response_time': { warning: 1000, critical: 5000 },
      'database.queries.response_time': { warning: 500, critical: 2000 },
    };

    const threshold = thresholds[metric.name];
    if (threshold) {
      if (metric.value >= threshold.critical) {
        this.createAlert(
          'critical',
          'critical',
          `Critical: ${metric.name}`,
          `${metric.name} is ${metric.value}${metric.unit} (threshold: ${threshold.critical}${metric.unit})`,
          'system',
          { metric, threshold },
        );
      } else if (metric.value >= threshold.warning) {
        this.createAlert(
          'warning',
          'medium',
          `Warning: ${metric.name}`,
          `${metric.name} is ${metric.value}${metric.unit} (threshold: ${threshold.warning}${metric.unit})`,
          'system',
          { metric, threshold },
        );
      }
    }
  }

  /**
   * Create an alert
   */
  createAlert(
    type: Alert['type'],
    severity: Alert['severity'],
    title: string,
    message: string,
    source: string,
    metadata: Record<string, any> = {},
  ): void {
    const alert: Alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      severity,
      title,
      message,
      source,
      timestamp: Date.now(),
      resolved: false,
      metadata,
    };

    this.alerts.push(alert);
    this.log('warn', 'alert', `Alert created: ${title}`, { alertId: alert.id, severity, source });

    // Notify callbacks
    this.alertCallbacks.forEach((callback) => callback(alert));

    // Keep only recent alerts
    if (this.alerts.length > 1000) {
      this.alerts = this.alerts.slice(-1000);
    }
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string): void {
    const alert = this.alerts.find((a) => a.id === alertId);
    if (alert && !alert.resolved) {
      alert.resolved = true;
      alert.resolvedAt = Date.now();
      this.log('info', 'alert', `Alert resolved: ${alert.title}`, { alertId });
    }
  }

  /**
   * Add alert callback
   */
  onAlert(callback: (alert: Alert) => void): void {
    this.alertCallbacks.push(callback);
  }

  /**
   * Log a structured message
   */
  log(
    level: LogEntry['level'],
    service: string,
    message: string,
    metadata: Record<string, any> = {},
    traceId?: string,
  ): void {
    const logEntry: LogEntry = {
      timestamp: Date.now(),
      level,
      service,
      message,
      metadata,
      traceId,
    };

    this.logs.push(logEntry);

    // Keep only recent logs
    if (this.logs.length > this.maxLogEntries) {
      this.logs = this.logs.slice(-this.maxLogEntries);
    }

    // Output to console for development
    const consoleMessage = `[${new Date(logEntry.timestamp).toISOString()}] ${level.toUpperCase()} ${service}: ${message}`;
    if (metadata && Object.keys(metadata).length > 0) {
      console.log(consoleMessage, metadata);
    } else {
      console.log(consoleMessage);
    }

    // Create alert for error/fatal logs
    if (level === 'error' || level === 'fatal') {
      this.createAlert(
        'error',
        level === 'fatal' ? 'critical' : 'high',
        `${level.toUpperCase()}: ${service}`,
        message,
        service,
        { logEntry, level },
      );
    }
  }

  /**
   * Get logs with filtering
   */
  getLogs(
    filter: {
      level?: LogEntry['level'];
      service?: string;
      startTime?: number;
      endTime?: number;
      limit?: number;
    } = {},
  ): LogEntry[] {
    let filteredLogs = [...this.logs];

    if (filter.level) {
      filteredLogs = filteredLogs.filter((log) => log.level === filter.level);
    }

    if (filter.service) {
      filteredLogs = filteredLogs.filter((log) => log.service === filter.service);
    }

    if (filter.startTime) {
      filteredLogs = filteredLogs.filter((log) => log.timestamp >= filter.startTime!);
    }

    if (filter.endTime) {
      filteredLogs = filteredLogs.filter((log) => log.timestamp <= filter.endTime!);
    }

    if (filter.limit) {
      filteredLogs = filteredLogs.slice(-filter.limit);
    }

    return filteredLogs.reverse(); // Most recent first
  }

  /**
   * Perform health check
   */
  async performHealthCheck(
    name: string,
    checkFunction: () => Promise<{ healthy: boolean; message: string; details?: any }>,
  ): Promise<void> {
    const startTime = Date.now();

    try {
      const result = await checkFunction();
      const responseTime = Date.now() - startTime;

      const healthCheck: HealthCheck = {
        name,
        status: result.healthy ? 'healthy' : 'unhealthy',
        message: result.message,
        timestamp: Date.now(),
        responseTime,
        details: result.details,
      };

      this.healthChecks.set(name, healthCheck);

      if (!result.healthy) {
        this.createAlert(
          'error',
          'high',
          `Health Check Failed: ${name}`,
          result.message,
          'health-check',
          { responseTime },
        );
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;

      const healthCheck: HealthCheck = {
        name,
        status: 'unhealthy',
        message: `Health check error: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: Date.now(),
        responseTime,
      };

      this.healthChecks.set(name, healthCheck);
      this.createAlert(
        'critical',
        'critical',
        `Health Check Error: ${name}`,
        error instanceof Error ? error.message : String(error),
        'health-check',
        { error, responseTime },
      );
    }
  }

  /**
   * Get all health checks
   */
  getHealthChecks(): Map<string, HealthCheck> {
    return new Map(this.healthChecks);
  }

  /**
   * Get alerts
   */
  getAlerts(
    filter: { resolved?: boolean; severity?: Alert['severity']; limit?: number } = {},
  ): Alert[] {
    let filteredAlerts = [...this.alerts];

    if (filter.resolved !== undefined) {
      filteredAlerts = filteredAlerts.filter((alert) => alert.resolved === filter.resolved);
    }

    if (filter.severity) {
      filteredAlerts = filteredAlerts.filter((alert) => alert.severity === filter.severity);
    }

    if (filter.limit) {
      filteredAlerts = filteredAlerts.slice(0, filter.limit);
    }

    return filteredAlerts.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Get system overview
   */
  async getSystemOverview(): Promise<{
    metrics: SystemMetrics;
    healthChecks: HealthCheck[];
    recentAlerts: Alert[];
    recentLogs: LogEntry[];
  }> {
    const metrics = await this.collectSystemMetrics();
    const healthChecks = Array.from(this.healthChecks.values());
    const recentAlerts = this.getAlerts({ resolved: false, limit: 10 });
    const recentLogs = this.getLogs({ limit: 50 });

    return {
      metrics,
      healthChecks,
      recentAlerts,
      recentLogs,
    };
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }
  }
}

export const monitoring = MonitoringService.getInstance();
