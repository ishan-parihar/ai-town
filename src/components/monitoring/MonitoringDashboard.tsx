/**
 * Enhanced Monitoring Dashboard Component
 * Comprehensive monitoring and alerting visualization using Chart.js
 */

import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend as ChartLegend,
  Filler,
  ArcElement,
} from 'chart.js';
import { Line, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  ChartLegend,
  Filler,
  ArcElement,
);

interface SystemMetrics {
  cpu: number;
  memory: number;
  disk: number;
  network: {
    requests: number;
    responseTime: number;
  };
  timestamp: number;
}

interface AlertData {
  id: string;
  type: string;
  severity: string;
  title: string;
  message: string;
  timestamp: number;
  resolved: boolean;
}

interface HealthStatus {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  message: string;
}

interface MonitoringDashboardProps {
  className?: string;
}

export default function MonitoringDashboard({ className = '' }: MonitoringDashboardProps) {
  const [metrics, setMetrics] = useState<SystemMetrics[]>([]);
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [healthStatus, setHealthStatus] = useState<HealthStatus[]>([]);
  const [selectedTimeRange, setSelectedTimeRange] = useState('1h');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Colors for charts
  const colors = {
    primary: '#3b82f6',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#8b5cf6',
    gray: '#6b7280',
  };

  const severityColors = {
    low: colors.success,
    medium: colors.warning,
    high: colors.danger,
    critical: '#7c2d12',
    warning: colors.warning,
  };

  const statusColors = {
    healthy: colors.success,
    degraded: colors.warning,
    unhealthy: colors.danger,
  };

  // Fetch monitoring data
  const fetchMonitoringData = async () => {
    try {
      setLoading(true);

      // Fetch metrics
      const metricsResponse = await fetch('/api/monitoring/metrics');
      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json();
        setMetrics(metricsData.history || []);
      }

      // Fetch alerts
      const alertsResponse = await fetch('/api/monitoring/alerts');
      if (alertsResponse.ok) {
        const alertsData = await alertsResponse.json();
        setAlerts(alertsData.alerts || []);
      }

      // Fetch health status
      const healthResponse = await fetch('/api/monitoring/health');
      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        setHealthStatus(healthData.checks || []);
      }

      setError(null);
    } catch (err) {
      console.error('Failed to fetch monitoring data:', err);
      setError('Failed to load monitoring data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonitoringData();

    if (autoRefresh) {
      const interval = setInterval(fetchMonitoringData, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh, selectedTimeRange]);

  // Get latest metrics
  const latestMetrics = metrics[metrics.length - 1] || {
    cpu: 0,
    memory: 0,
    disk: 0,
    network: { requests: 0, responseTime: 0 },
    timestamp: Date.now(),
  };

  // Get active alerts
  const activeAlerts = alerts.filter((alert) => !alert.resolved);
  const criticalAlerts = activeAlerts.filter((alert) => alert.severity === 'critical');

  // Get system health summary
  const healthSummary = {
    total: healthStatus.length,
    healthy: healthStatus.filter((h) => h.status === 'healthy').length,
    degraded: healthStatus.filter((h) => h.status === 'degraded').length,
    unhealthy: healthStatus.filter((h) => h.status === 'unhealthy').length,
  };

  // Prepare data for Chart.js

  // Resource usage chart data
  const resourceUsageData = {
    labels: metrics.slice(-20).map((m) => new Date(m.timestamp).toLocaleTimeString()),
    datasets: [
      {
        label: 'CPU %',
        data: metrics.slice(-20).map((m) => m.cpu),
        borderColor: colors.primary,
        backgroundColor: colors.primary + '40',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Memory %',
        data: metrics.slice(-20).map((m) => m.memory),
        borderColor: colors.info,
        backgroundColor: colors.info + '40',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  // Alert severity distribution data
  const alertSeverityData = alerts.reduce(
    (acc, alert) => {
      acc[alert.severity] = (acc[alert.severity] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const alertDistributionData = {
    labels: Object.keys(alertSeverityData),
    datasets: [
      {
        data: Object.values(alertSeverityData),
        backgroundColor: Object.keys(alertSeverityData).map(
          (severity) => severityColors[severity as keyof typeof severityColors] || colors.gray,
        ),
        borderWidth: 0,
      },
    ],
  };

  // Response time trends data
  const responseTimeData = {
    labels: metrics.slice(-30).map((m) => new Date(m.timestamp).toLocaleTimeString()),
    datasets: [
      {
        label: 'Response Time (ms)',
        data: metrics.slice(-30).map((m) => m.network.responseTime),
        borderColor: colors.warning,
        backgroundColor: colors.warning + '20',
        tension: 0.4,
        fill: false,
      },
    ],
  };

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#9ca3af',
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: '#9ca3af',
        },
        grid: {
          color: '#374151',
        },
      },
      y: {
        ticks: {
          color: '#9ca3af',
        },
        grid: {
          color: '#374151',
        },
        beginAtZero: true,
        max: 100,
      },
    },
  };

  const responseTimeChartOptions = {
    ...chartOptions,
    scales: {
      ...chartOptions.scales,
      y: {
        ...chartOptions.scales.y,
        max: undefined,
      },
    },
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: '#9ca3af',
          padding: 20,
        },
      },
    },
  };

  if (loading && metrics.length === 0) {
    return (
      <div className={`bg-gray-800 rounded-lg p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-700 rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-700 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-gray-800 rounded-lg p-6 ${className}`}>
        <div className="text-red-400 text-center">
          <div className="text-xl mb-2">⚠️ Monitoring Error</div>
          <div className="text-sm">{error}</div>
          <button
            onClick={fetchMonitoringData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-800 rounded-lg p-6 space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">System Monitoring</h2>
        <div className="flex items-center space-x-4">
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="bg-gray-700 text-white px-3 py-1 rounded border border-gray-600"
          >
            <option value="15m">Last 15 minutes</option>
            <option value="1h">Last hour</option>
            <option value="6h">Last 6 hours</option>
            <option value="24h">Last 24 hours</option>
          </select>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-1 rounded border ${
              autoRefresh
                ? 'bg-green-600 border-green-600 text-white'
                : 'bg-gray-700 border-gray-600 text-gray-300'
            }`}
          >
            Auto-refresh: {autoRefresh ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={fetchMonitoringData}
            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* System Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CPU Usage */}
        <div className="bg-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-300 text-sm">CPU Usage</span>
            <span
              className={`text-lg font-bold ${
                latestMetrics.cpu > 80
                  ? 'text-red-400'
                  : latestMetrics.cpu > 60
                    ? 'text-yellow-400'
                    : 'text-green-400'
              }`}
            >
              {latestMetrics.cpu.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-gray-600 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                latestMetrics.cpu > 80
                  ? 'bg-red-500'
                  : latestMetrics.cpu > 60
                    ? 'bg-yellow-500'
                    : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(latestMetrics.cpu, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Memory Usage */}
        <div className="bg-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-300 text-sm">Memory Usage</span>
            <span
              className={`text-lg font-bold ${
                latestMetrics.memory > 85
                  ? 'text-red-400'
                  : latestMetrics.memory > 70
                    ? 'text-yellow-400'
                    : 'text-green-400'
              }`}
            >
              {latestMetrics.memory.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-gray-600 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                latestMetrics.memory > 85
                  ? 'bg-red-500'
                  : latestMetrics.memory > 70
                    ? 'bg-yellow-500'
                    : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(latestMetrics.memory, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Active Alerts */}
        <div className="bg-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-300 text-sm">Active Alerts</span>
            <span
              className={`text-lg font-bold ${
                criticalAlerts.length > 0
                  ? 'text-red-400'
                  : activeAlerts.length > 0
                    ? 'text-yellow-400'
                    : 'text-green-400'
              }`}
            >
              {activeAlerts.length}
            </span>
          </div>
          <div className="text-xs text-gray-400">{criticalAlerts.length} critical</div>
        </div>

        {/* System Health */}
        <div className="bg-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-300 text-sm">System Health</span>
            <span
              className={`text-lg font-bold ${
                healthSummary.unhealthy > 0
                  ? 'text-red-400'
                  : healthSummary.degraded > 0
                    ? 'text-yellow-400'
                    : 'text-green-400'
              }`}
            >
              {healthSummary.healthy}/{healthSummary.total}
            </span>
          </div>
          <div className="text-xs text-gray-400">
            {healthSummary.unhealthy} unhealthy, {healthSummary.degraded} degraded
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Resource Usage Chart */}
        <div className="bg-gray-700 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-4">Resource Usage</h3>
          <div style={{ height: '250px' }}>
            <Line data={resourceUsageData} options={chartOptions} />
          </div>
        </div>

        {/* Alert Severity Distribution */}
        <div className="bg-gray-700 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-4">Alert Distribution</h3>
          <div style={{ height: '250px' }}>
            <Pie data={alertDistributionData} options={pieChartOptions} />
          </div>
        </div>
      </div>

      {/* Health Status and Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Service Health Status */}
        <div className="bg-gray-700 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-4">Service Health</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {healthStatus.map((service, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-gray-600 rounded"
              >
                <div className="flex items-center space-x-2">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      service.status === 'healthy'
                        ? 'bg-green-500'
                        : service.status === 'degraded'
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                    }`}
                  ></div>
                  <span className="text-white text-sm">{service.name}</span>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-400">{service.responseTime}ms</div>
                  <div className="text-xs text-gray-300">{service.status}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Alerts */}
        <div className="bg-gray-700 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Alerts</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {alerts.slice(0, 10).map((alert, index) => (
              <div
                key={index}
                className={`p-2 rounded ${alert.resolved ? 'bg-gray-600' : 'bg-gray-650'}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <div
                        className={`w-2 h-2 rounded-full`}
                        style={{
                          backgroundColor:
                            severityColors[alert.severity as keyof typeof severityColors],
                        }}
                      ></div>
                      <span className="text-white text-sm font-medium">{alert.title}</span>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">{alert.message}</div>
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-gray-700 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-white mb-4">Response Time Trends</h3>
        <div style={{ height: '200px' }}>
          <Line data={responseTimeData} options={responseTimeChartOptions} />
        </div>
      </div>
    </div>
  );
}
