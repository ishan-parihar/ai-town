import React, { useState, useEffect } from 'react';
import { OAuthConnectionManager } from './OAuthConnectionManager.js';
import { DataSyncManager } from './DataSyncManager.js';
import { toast } from 'react-toastify';

interface OAuthConnection {
  id: string;
  providerId: string;
  providerName: string;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
  lastSyncAt?: number;
  userInfo?: any;
  scopes: string[];
}

interface SystemStatus {
  oauth: { isValid: boolean; errors: string[] };
  providers: { isValid: boolean; providerErrors: Record<string, string[]> };
  sync: {
    totalJobs: number;
    activeJobs: number;
    completedJobs: number;
    failedJobs: number;
    totalRecordsProcessed: number;
  };
}

interface OAuthDashboardProps {
  userId: string;
}

export const OAuthDashboard: React.FC<OAuthDashboardProps> = ({ userId }) => {
  const [activeTab, setActiveTab] = useState<'connections' | 'sync' | 'status'>('connections');
  const [connections, setConnections] = useState<OAuthConnection[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSystemStatus();
  }, []);

  const fetchSystemStatus = async () => {
    try {
      const response = await fetch('/api/oauth/status');
      const data = await response.json();

      if (data.success) {
        setSystemStatus(data.data);
      } else {
        toast.error('Failed to fetch system status');
      }
    } catch (error) {
      console.error('Error fetching system status:', error);
      toast.error('Failed to fetch system status');
    } finally {
      setLoading(false);
    }
  };

  const handleConnectionUpdate = (newConnections: OAuthConnection[]) => {
    setConnections(newConnections);
    fetchSystemStatus(); // Refresh status when connections change
  };

  const formatDate = (timestamp: number) => {
    return (
      new Date(timestamp).toLocaleDateString() + ' ' + new Date(timestamp).toLocaleTimeString()
    );
  };

  const getStatusColor = (isValid: boolean) => {
    return isValid ? 'text-green-600' : 'text-red-600';
  };

  const getProviderIcon = (providerId: string) => {
    const icons: Record<string, string> = {
      google: '🔍',
      microsoft: '🪟',
      fitbit: '💪',
      generic: '🔗',
    };
    return icons[providerId] || '🔗';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">OAuth Integration Dashboard</h1>
        <p className="text-gray-600">
          Manage your third-party service connections and data synchronization
        </p>
      </div>

      {/* System Status Alert */}
      {systemStatus && (!systemStatus.oauth.isValid || !systemStatus.providers.isValid) && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-yellow-400">⚠️</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">System Configuration Issues</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <ul className="list-disc list-inside space-y-1">
                  {systemStatus.oauth.errors.map((error, index) => (
                    <li key={`oauth-${index}`}>{error}</li>
                  ))}
                  {Object.entries(systemStatus.providers.providerErrors).map(([provider, errors]) =>
                    errors.map((error, index) => (
                      <li key={`${provider}-${index}`}>
                        {provider}: {error}
                      </li>
                    )),
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      {systemStatus && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-2xl">🔗</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Active Connections</p>
                <p className="text-lg font-semibold text-gray-900">
                  {connections.filter((c) => c.isActive).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-2xl">🔄</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Active Sync Jobs</p>
                <p className="text-lg font-semibold text-gray-900">
                  {systemStatus.sync.activeJobs}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-2xl">📊</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Records Processed</p>
                <p className="text-lg font-semibold text-gray-900">
                  {systemStatus.sync.totalRecordsProcessed.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-2xl">✅</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Completed Jobs</p>
                <p className="text-lg font-semibold text-gray-900">
                  {systemStatus.sync.completedJobs}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('connections')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'connections'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Connections
          </button>
          <button
            onClick={() => setActiveTab('sync')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'sync'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Data Sync
          </button>
          <button
            onClick={() => setActiveTab('status')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'status'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            System Status
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'connections' && (
          <OAuthConnectionManager userId={userId} onConnectionUpdate={handleConnectionUpdate} />
        )}

        {activeTab === 'sync' && <DataSyncManager userId={userId} connections={connections} />}

        {activeTab === 'status' && systemStatus && (
          <div className="space-y-6">
            {/* OAuth Configuration Status */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">OAuth Configuration</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">OAuth Service</span>
                  <span
                    className={`text-sm font-medium ${getStatusColor(systemStatus.oauth.isValid)}`}
                  >
                    {systemStatus.oauth.isValid ? '✅ Valid' : '❌ Invalid'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Providers</span>
                  <span
                    className={`text-sm font-medium ${getStatusColor(systemStatus.providers.isValid)}`}
                  >
                    {systemStatus.providers.isValid ? '✅ Valid' : '❌ Invalid'}
                  </span>
                </div>
              </div>
            </div>

            {/* Connected Services */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Connected Services</h3>
              {connections.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No connected services found. Go to the Connections tab to add services.
                </p>
              ) : (
                <div className="space-y-3">
                  {connections.map((connection) => (
                    <div
                      key={connection.id}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-xl">{getProviderIcon(connection.providerId)}</span>
                        <div>
                          <p className="font-medium text-gray-900">{connection.providerName}</p>
                          <p className="text-sm text-gray-500">
                            Connected {formatDate(connection.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            connection.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {connection.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sync Statistics */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Synchronization Statistics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{systemStatus.sync.totalJobs}</p>
                  <p className="text-sm text-gray-500">Total Jobs</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{systemStatus.sync.activeJobs}</p>
                  <p className="text-sm text-gray-500">Active</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {systemStatus.sync.completedJobs}
                  </p>
                  <p className="text-sm text-gray-500">Completed</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">{systemStatus.sync.failedJobs}</p>
                  <p className="text-sm text-gray-500">Failed</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">System Actions</h3>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={fetchSystemStatus}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Refresh Status
                </button>
                <button
                  onClick={() => toast.info('System cleanup scheduled')}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                >
                  Cleanup Old Jobs
                </button>
                <button
                  onClick={() => toast.info('Export functionality coming soon')}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  Export Configuration
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
