/**
 * Enhanced SystemStats Component
 * Integrates with comprehensive monitoring system
 */

import { useState, useEffect } from 'react';

interface SystemStats {
  totalDataPoints: number;
  processedDataPoints: number;
  pendingDataPoints: number;
  totalInsights: number;
  pendingInsights: number;
  reviewedInsights: number;
  actedUponInsights: number;
  councilMemberStats: Array<{
    name: string;
    insightCount: number;
    status: string;
    lastInsight: number;
  }>;
}

interface MonitoringMetrics {
  cpu: number;
  memory: number;
  disk: number;
  network: {
    requests: number;
    responseTime: number;
  };
}

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  total: number;
  healthy: number;
  degraded: number;
  unhealthy: number;
}

interface AlertSummary {
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export default function SystemStats() {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [metrics, setMetrics] = useState<MonitoringMetrics | null>(null);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [alerts, setAlerts] = useState<AlertSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number>(Date.now());

  // Fetch all monitoring data
  const fetchAllData = async () => {
    try {
      setLoading(true);

      // Fetch original stats
      const statsResponse = await fetch('http://localhost:3002/api/stats');
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      // Fetch monitoring metrics
      const metricsResponse = await fetch('/api/monitoring/metrics');
      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json();
        setMetrics(metricsData.data);
      }

      // Fetch health status
      const healthResponse = await fetch('/api/monitoring/health');
      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        setHealth(healthData.data);
      }

      // Fetch alerts summary
      const alertsResponse = await fetch('/api/monitoring/alerts?limit=100');
      if (alertsResponse.ok) {
        const alertsData = await alertsResponse.json();
        const alertsList = alertsData.data.alerts;
        const summary = alertsList.reduce(
          (acc: AlertSummary, alert: any) => {
            acc.total++;
            acc[alert.severity as keyof AlertSummary]++;
            return acc;
          },
          { total: 0, critical: 0, high: 0, medium: 0, low: 0 },
        );
        setAlerts(summary);
      }

      setError(null);
      setLastUpdated(Date.now());
    } catch (err) {
      console.error('Error fetching system data:', err);
      setError('Failed to fetch system data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 15000); // Refresh every 15 seconds
    return () => clearInterval(interval);
  }, []);

  const triggerProcessing = async () => {
    try {
      const response = await fetch('http://localhost:3002/api/process-data', {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to trigger processing');
      }
      const result = await response.json();

      // Show success message
      const toast = document.createElement('div');
      toast.className =
        'fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded shadow-lg z-50';
      toast.textContent = result.message;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);

      // Refresh data
      fetchAllData();
    } catch (err) {
      console.error('Error triggering processing:', err);

      // Show error message
      const toast = document.createElement('div');
      toast.className =
        'fixed top-4 right-4 bg-red-600 text-white px-4 py-2 rounded shadow-lg z-50';
      toast.textContent = 'Failed to trigger data processing';
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);
    }
  };

  if (loading && !stats) {
    return (
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-700 rounded mb-2"></div>
          <div className="h-4 bg-gray-700 rounded mb-2"></div>
          <div className="h-4 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="text-red-400 text-sm">System monitoring unavailable</div>
          <button
            onClick={fetchAllData}
            className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'healthy':
        return 'text-green-400';
      case 'processing':
      case 'degraded':
        return 'text-yellow-400';
      case 'idle':
      case 'unhealthy':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getMetricColor = (value: number, type: string) => {
    const thresholds = {
      cpu: { warning: 70, critical: 90 },
      memory: { warning: 80, critical: 95 },
      disk: { warning: 80, critical: 95 },
    };

    const threshold = thresholds[type as keyof typeof thresholds];
    if (!threshold) return 'text-gray-400';

    if (value >= threshold.critical) return 'text-red-400';
    if (value >= threshold.warning) return 'text-yellow-400';
    return 'text-green-400';
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">System Overview</h3>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-400">Last updated: {formatDate(lastUpdated)}</span>
          <button
            onClick={triggerProcessing}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
          >
            Process Data
          </button>
        </div>
      </div>

      {/* System Metrics */}
      {metrics && (
        <div className="grid grid-cols-3 gap-4 p-3 bg-gray-700 rounded-lg">
          <div className="text-center">
            <div className={`text-lg font-bold ${getMetricColor(metrics.cpu, 'cpu')}`}>
              {metrics.cpu.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-400">CPU</div>
          </div>
          <div className="text-center">
            <div className={`text-lg font-bold ${getMetricColor(metrics.memory, 'memory')}`}>
              {metrics.memory.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-400">Memory</div>
          </div>
          <div className="text-center">
            <div
              className={`text-lg font-bold ${getMetricColor(metrics.network.responseTime, 'response')}`}
            >
              {metrics.network.responseTime}ms
            </div>
            <div className="text-xs text-gray-400">Response Time</div>
          </div>
        </div>
      )}

      {/* Health Status */}
      {health && (
        <div className="p-3 bg-gray-700 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-300">System Health</span>
            <span className={`text-sm font-bold ${getStatusColor(health.status)}`}>
              {health.status.toUpperCase()}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="text-center">
              <div className="text-green-400 font-medium">{health.healthy}</div>
              <div className="text-gray-400">Healthy</div>
            </div>
            <div className="text-center">
              <div className="text-yellow-400 font-medium">{health.degraded}</div>
              <div className="text-gray-400">Degraded</div>
            </div>
            <div className="text-center">
              <div className="text-red-400 font-medium">{health.unhealthy}</div>
              <div className="text-gray-400">Unhealthy</div>
            </div>
          </div>
        </div>
      )}

      {/* Data Processing Stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-2xl font-bold text-blue-400">{stats.totalDataPoints}</div>
            <div className="text-xs text-gray-400">Total Data Points</div>
            <div className="text-xs text-green-400">{stats.processedDataPoints} processed</div>
            <div className="text-xs text-yellow-400">{stats.pendingDataPoints} pending</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-400">{stats.totalInsights}</div>
            <div className="text-xs text-gray-400">Total Insights</div>
            <div className="text-xs text-yellow-400">{stats.pendingInsights} pending</div>
            <div className="text-xs text-blue-400">{stats.reviewedInsights} reviewed</div>
            <div className="text-xs text-green-400">{stats.actedUponInsights} acted upon</div>
          </div>
        </div>
      )}

      {/* Alerts Summary */}
      {alerts && (
        <div className="p-3 bg-gray-700 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-300">Active Alerts</span>
            <span
              className={`text-sm font-bold ${
                alerts.critical > 0
                  ? 'text-red-400'
                  : alerts.high > 0
                    ? 'text-yellow-400'
                    : 'text-green-400'
              }`}
            >
              {alerts.total}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-2 text-xs">
            <div className="text-center">
              <div className="text-red-400 font-medium">{alerts.critical}</div>
              <div className="text-gray-400">Critical</div>
            </div>
            <div className="text-center">
              <div className="text-orange-400 font-medium">{alerts.high}</div>
              <div className="text-gray-400">High</div>
            </div>
            <div className="text-center">
              <div className="text-yellow-400 font-medium">{alerts.medium}</div>
              <div className="text-gray-400">Medium</div>
            </div>
            <div className="text-center">
              <div className="text-blue-400 font-medium">{alerts.low}</div>
              <div className="text-gray-400">Low</div>
            </div>
          </div>
        </div>
      )}

      {/* Council Member Activity */}
      {stats && stats.councilMemberStats && (
        <div className="border-t border-gray-700 pt-3">
          <h4 className="text-sm font-semibold mb-2 text-gray-300">Council Activity</h4>
          <div className="space-y-1">
            {stats.councilMemberStats.slice(0, 4).map((member, index) => (
              <div key={index} className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${getStatusColor(member.status)}`}></div>
                  <span className="text-gray-300">{member.name}</span>
                </div>
                <div className="text-gray-400">
                  {member.insightCount} insights • {formatDate(member.lastInsight)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status Indicators */}
      <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-gray-700">
        <div className="flex items-center space-x-4">
          <span>System: {health ? health.status : 'Unknown'}</span>
          <span>Alerts: {alerts ? alerts.total : 0}</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span>Monitoring Active</span>
        </div>
      </div>

      {/* Processing Status */}
      {stats && stats.pendingDataPoints > 0 && (
        <div className="p-2 bg-yellow-900 bg-opacity-30 rounded border border-yellow-700">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-yellow-300">
              {stats.pendingDataPoints} data points awaiting processing
            </span>
          </div>
        </div>
      )}

      {/* Critical Alerts */}
      {alerts && alerts.critical > 0 && (
        <div className="p-2 bg-red-900 bg-opacity-30 rounded border border-red-700">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-red-300">
              {alerts.critical} critical alerts require immediate attention
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
