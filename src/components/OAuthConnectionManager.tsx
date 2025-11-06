import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

interface OAuthProvider {
  id: string;
  name: string;
  displayName: string;
  scopes: string[];
}

interface OAuthConnection {
  id: string;
  providerId: string;
  providerName: string;
  scopes: string[];
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
  lastSyncAt?: number;
  userInfo?: any;
}

interface OAuthConnectionManagerProps {
  userId: string;
  onConnectionUpdate?: (connections: OAuthConnection[]) => void;
}

export const OAuthConnectionManager: React.FC<OAuthConnectionManagerProps> = ({
  userId,
  onConnectionUpdate,
}) => {
  const [providers, setProviders] = useState<OAuthProvider[]>([]);
  const [connections, setConnections] = useState<OAuthConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectingProvider, setConnectingProvider] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [selectedScopes, setSelectedScopes] = useState<string[]>([]);

  useEffect(() => {
    fetchProviders();
    fetchConnections();
  }, [userId]);

  const fetchProviders = async () => {
    try {
      const response = await fetch('/api/oauth/providers');
      const data = await response.json();

      if (data.success) {
        setProviders(data.data);
      } else {
        toast.error('Failed to fetch OAuth providers');
      }
    } catch (error) {
      console.error('Error fetching providers:', error);
      toast.error('Failed to fetch OAuth providers');
    }
  };

  const fetchConnections = async () => {
    try {
      const response = await fetch(`/api/oauth/connections?userId=${userId}`);
      const data = await response.json();

      if (data.success) {
        setConnections(data.data);
        onConnectionUpdate?.(data.data);
      } else {
        toast.error('Failed to fetch OAuth connections');
      }
    } catch (error) {
      console.error('Error fetching connections:', error);
      toast.error('Failed to fetch OAuth connections');
    } finally {
      setLoading(false);
    }
  };

  const initiateOAuthConnection = async (providerId: string, scopes: string[]) => {
    try {
      setConnectingProvider(providerId);

      const response = await fetch('/api/oauth/authorize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          providerId,
          userId,
          scopes,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Redirect to OAuth provider
        window.location.href = data.data.authUrl;
      } else {
        toast.error('Failed to initiate OAuth connection');
      }
    } catch (error) {
      console.error('Error initiating OAuth connection:', error);
      toast.error('Failed to initiate OAuth connection');
    } finally {
      setConnectingProvider(null);
    }
  };

  const handleConnectProvider = () => {
    if (!selectedProvider) {
      toast.error('Please select a provider');
      return;
    }

    const provider = providers.find((p) => p.id === selectedProvider);
    if (!provider) {
      toast.error('Provider not found');
      return;
    }

    const scopesToUse = selectedScopes.length > 0 ? selectedScopes : provider.scopes;
    initiateOAuthConnection(selectedProvider, scopesToUse);
  };

  const handleRefreshConnection = async (connectionId: string) => {
    try {
      const response = await fetch(`/api/oauth/connections/${connectionId}/refresh`, {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Connection refreshed successfully');
        fetchConnections();
      } else {
        toast.error('Failed to refresh connection');
      }
    } catch (error) {
      console.error('Error refreshing connection:', error);
      toast.error('Failed to refresh connection');
    }
  };

  const handleRevokeConnection = async (connectionId: string) => {
    if (
      !confirm(
        'Are you sure you want to revoke this connection? This will remove access to the connected service.',
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/oauth/connections/${connectionId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Connection revoked successfully');
        fetchConnections();
      } else {
        toast.error('Failed to revoke connection');
      }
    } catch (error) {
      console.error('Error revoking connection:', error);
      toast.error('Failed to revoke connection');
    }
  };

  const handleTestConnection = async (connectionId: string) => {
    try {
      const response = await fetch(`/api/oauth/connections/${connectionId}/test`, {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Connection test successful');
      } else {
        toast.error(`Connection test failed: ${data.message}`);
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      toast.error('Failed to test connection');
    }
  };

  const handleScopeChange = (scope: string) => {
    setSelectedScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope],
    );
  };

  const formatDate = (timestamp: number) => {
    return (
      new Date(timestamp).toLocaleDateString() + ' ' + new Date(timestamp).toLocaleTimeString()
    );
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
      {/* Add New Connection */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Add New Connection</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Provider</label>
            <select
              value={selectedProvider}
              onChange={(e) => {
                setSelectedProvider(e.target.value);
                setSelectedScopes([]);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Choose a provider...</option>
              {providers.map((provider) => (
                <option key={provider.id} value={provider.id}>
                  {provider.displayName}
                </option>
              ))}
            </select>
          </div>

          {selectedProvider && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Permissions (Scopes)
              </label>
              <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded p-3">
                {providers
                  .find((p) => p.id === selectedProvider)
                  ?.scopes.map((scope) => (
                    <label key={scope} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedScopes.includes(scope)}
                        onChange={() => handleScopeChange(scope)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{scope}</span>
                    </label>
                  ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Leave all unchecked to use default permissions
              </p>
            </div>
          )}

          <button
            onClick={handleConnectProvider}
            disabled={!selectedProvider || connectingProvider !== null}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {connectingProvider ? 'Connecting...' : 'Connect Provider'}
          </button>
        </div>
      </div>

      {/* Existing Connections */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Connected Services</h3>

        {connections.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No connected services found. Connect a provider above to get started.
          </p>
        ) : (
          <div className="space-y-4">
            {connections.map((connection) => (
              <div
                key={connection.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h4 className="font-semibold text-gray-900">{connection.providerName}</h4>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          connection.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {connection.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    {connection.userInfo?.email && (
                      <p className="text-sm text-gray-600 mt-1">
                        Connected to: {connection.userInfo.email}
                      </p>
                    )}

                    <div className="mt-2 text-xs text-gray-500">
                      Connected: {formatDate(connection.createdAt)}
                      {connection.lastSyncAt && (
                        <span className="ml-4">Last sync: {formatDate(connection.lastSyncAt)}</span>
                      )}
                    </div>

                    {connection.scopes.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-500 mb-1">Permissions:</p>
                        <div className="flex flex-wrap gap-1">
                          {connection.scopes.map((scope) => (
                            <span
                              key={scope}
                              className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                            >
                              {scope}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleTestConnection(connection.id)}
                      className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                    >
                      Test
                    </button>
                    <button
                      onClick={() => handleRefreshConnection(connection.id)}
                      disabled={!connection.isActive}
                      className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 disabled:bg-gray-100 disabled:text-gray-400 transition-colors"
                    >
                      Refresh
                    </button>
                    <button
                      onClick={() => handleRevokeConnection(connection.id)}
                      className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                    >
                      Revoke
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
