import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

interface SyncJob {
  id: string;
  connectionId: string;
  providerId: string;
  serviceType: string;
  syncType: 'full' | 'incremental';
  status: 'pending' | 'running' | 'completed' | 'failed';
  lastSyncAt?: number;
  nextSyncAt?: number;
  errorCount: number;
  lastError?: string;
  dataCount?: number;
  config: SyncJobConfig;
  createdAt: number;
  updatedAt: number;
}

interface SyncJobConfig {
  interval: string;
  enabled: boolean;
  maxRetries: number;
  batchSize: number;
  syncWindow: number;
  webhookUrl?: string;
}

interface SyncProvider {
  id: string;
  name: string;
}

interface OAuthConnection {
  id: string;
  providerId: string;
  providerName: string;
  isActive: boolean;
}

interface DataSyncManagerProps {
  userId: string;
  connections: OAuthConnection[];
}

export const DataSyncManager: React.FC<DataSyncManagerProps> = ({ userId, connections }) => {
  const [jobs, setJobs] = useState<SyncJob[]>([]);
  const [providers, setProviders] = useState<SyncProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [syncConfig, setSyncConfig] = useState<SyncJobConfig>({
    interval: '0 */6 * * *', // Every 6 hours
    enabled: true,
    maxRetries: 3,
    batchSize: 100,
    syncWindow: 24,
  });

  useEffect(() => {
    fetchJobs();
    fetchProviders();
  }, [userId]);

  const fetchJobs = async () => {
    try {
      const response = await fetch(`/api/sync/jobs?userId=${userId}`);
      const data = await response.json();

      if (data.success) {
        setJobs(data.data);
      } else {
        toast.error('Failed to fetch sync jobs');
      }
    } catch (error) {
      console.error('Error fetching sync jobs:', error);
      toast.error('Failed to fetch sync jobs');
    } finally {
      setLoading(false);
    }
  };

  const fetchProviders = async () => {
    try {
      const response = await fetch('/api/sync/providers');
      const data = await response.json();

      if (data.success) {
        setProviders(data.data);
      }
    } catch (error) {
      console.error('Error fetching sync providers:', error);
    }
  };

  const createSyncJob = async () => {
    if (!selectedConnection || !selectedService) {
      toast.error('Please select a connection and service type');
      return;
    }

    try {
      const response = await fetch('/api/sync/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          connectionId: selectedConnection,
          serviceType: selectedService,
          userId,
          config: syncConfig,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Sync job created successfully');
        setShowCreateForm(false);
        fetchJobs();
        resetForm();
      } else {
        toast.error('Failed to create sync job');
      }
    } catch (error) {
      console.error('Error creating sync job:', error);
      toast.error('Failed to create sync job');
    }
  };

  const updateSyncJob = async (jobId: string, updates: Partial<SyncJob>) => {
    try {
      const response = await fetch(`/api/sync/jobs/${jobId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Sync job updated successfully');
        fetchJobs();
      } else {
        toast.error('Failed to update sync job');
      }
    } catch (error) {
      console.error('Error updating sync job:', error);
      toast.error('Failed to update sync job');
    }
  };

  const deleteSyncJob = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this sync job?')) {
      return;
    }

    try {
      const response = await fetch(`/api/sync/jobs/${jobId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Sync job deleted successfully');
        fetchJobs();
      } else {
        toast.error('Failed to delete sync job');
      }
    } catch (error) {
      console.error('Error deleting sync job:', error);
      toast.error('Failed to delete sync job');
    }
  };

  const executeSyncJob = async (jobId: string) => {
    try {
      const response = await fetch(`/api/sync/jobs/${jobId}/execute`, {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Sync job executed successfully');
        fetchJobs();
      } else {
        toast.error('Failed to execute sync job');
      }
    } catch (error) {
      console.error('Error executing sync job:', error);
      toast.error('Failed to execute sync job');
    }
  };

  const resetForm = () => {
    setSelectedConnection('');
    setSelectedService('');
    setSyncConfig({
      interval: '0 */6 * * *',
      enabled: true,
      maxRetries: 3,
      batchSize: 100,
      syncWindow: 24,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (timestamp: number) => {
    return (
      new Date(timestamp).toLocaleDateString() + ' ' + new Date(timestamp).toLocaleTimeString()
    );
  };

  const getConnectionName = (connectionId: string) => {
    const connection = connections.find((c) => c.id === connectionId);
    return connection ? `${connection.providerName} (${connection.id.slice(0, 8)}...)` : 'Unknown';
  };

  const getAvailableServices = (connectionId: string) => {
    const connection = connections.find((c) => c.id === connectionId);
    if (!connection) return [];

    const serviceMap: Record<string, string[]> = {
      google: ['calendar', 'gmail', 'drive'],
      microsoft: ['calendar', 'outlook', 'onedrive'],
      fitbit: ['activity', 'health'],
    };

    return serviceMap[connection.providerId] || [];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Data Synchronization</h3>
        <button
          onClick={() => setShowCreateForm(true)}
          disabled={connections.length === 0}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          Create Sync Job
        </button>
      </div>

      {/* Create Sync Job Form */}
      {showCreateForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="text-md font-semibold mb-4">Create New Sync Job</h4>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Connection</label>
              <select
                value={selectedConnection}
                onChange={(e) => {
                  setSelectedConnection(e.target.value);
                  setSelectedService('');
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a connection...</option>
                {connections
                  .filter((c) => c.isActive)
                  .map((connection) => (
                    <option key={connection.id} value={connection.id}>
                      {connection.providerName} ({connection.id.slice(0, 12)}...)
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Service Type</label>
              <select
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
                disabled={!selectedConnection}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              >
                <option value="">Select a service...</option>
                {getAvailableServices(selectedConnection).map((service) => (
                  <option key={service} value={service}>
                    {service.charAt(0).toUpperCase() + service.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sync Interval (Cron)
                </label>
                <input
                  type="text"
                  value={syncConfig.interval}
                  onChange={(e) => setSyncConfig((prev) => ({ ...prev, interval: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0 */6 * * *"
                />
                <p className="text-xs text-gray-500 mt-1">Default: Every 6 hours</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Batch Size</label>
                <input
                  type="number"
                  value={syncConfig.batchSize}
                  onChange={(e) =>
                    setSyncConfig((prev) => ({
                      ...prev,
                      batchSize: parseInt(e.target.value) || 100,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                  max="1000"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Max Retries</label>
                <input
                  type="number"
                  value={syncConfig.maxRetries}
                  onChange={(e) =>
                    setSyncConfig((prev) => ({
                      ...prev,
                      maxRetries: parseInt(e.target.value) || 3,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  max="10"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sync Window (hours)
                </label>
                <input
                  type="number"
                  value={syncConfig.syncWindow}
                  onChange={(e) =>
                    setSyncConfig((prev) => ({
                      ...prev,
                      syncWindow: parseInt(e.target.value) || 24,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                  max="168"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Webhook URL (Optional)
              </label>
              <input
                type="url"
                value={syncConfig.webhookUrl || ''}
                onChange={(e) => setSyncConfig((prev) => ({ ...prev, webhookUrl: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://your-webhook-url.com/endpoint"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="enabled"
                checked={syncConfig.enabled}
                onChange={(e) => setSyncConfig((prev) => ({ ...prev, enabled: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="enabled" className="text-sm text-gray-700">
                Enable sync job
              </label>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={createSyncJob}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Create Job
              </button>
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  resetForm();
                }}
                className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sync Jobs List */}
      <div className="bg-white rounded-lg shadow p-6">
        <h4 className="text-md font-semibold mb-4">Active Sync Jobs</h4>

        {jobs.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No sync jobs found. Create a sync job to start synchronizing data.
          </p>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h5 className="font-semibold text-gray-900">
                        {job.serviceType.charAt(0).toUpperCase() + job.serviceType.slice(1)} Sync
                      </h5>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${getStatusColor(job.status)}`}
                      >
                        {job.status}
                      </span>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${job.config.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
                      >
                        {job.config.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>

                    <p className="text-sm text-gray-600 mt-1">
                      Connection: {getConnectionName(job.connectionId)}
                    </p>

                    <div className="mt-2 text-xs text-gray-500 grid grid-cols-2 gap-4">
                      <div>Created: {formatDate(job.createdAt)}</div>
                      <div>Interval: {job.config.interval}</div>
                      {job.lastSyncAt && <div>Last sync: {formatDate(job.lastSyncAt)}</div>}
                      {job.nextSyncAt && <div>Next sync: {formatDate(job.nextSyncAt)}</div>}
                      {job.dataCount !== undefined && <div>Records: {job.dataCount}</div>}
                      {job.errorCount > 0 && (
                        <div className="text-red-600">Errors: {job.errorCount}</div>
                      )}
                    </div>

                    {job.lastError && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                        Error: {job.lastError}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => executeSyncJob(job.id)}
                      disabled={job.status === 'running'}
                      className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:bg-gray-100 disabled:text-gray-400 transition-colors"
                    >
                      Run Now
                    </button>
                    <button
                      onClick={() =>
                        updateSyncJob(job.id, {
                          config: { ...job.config, enabled: !job.config.enabled },
                        })
                      }
                      className="px-3 py-1 text-sm bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 transition-colors"
                    >
                      {job.config.enabled ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      onClick={() => deleteSyncJob(job.id)}
                      className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
