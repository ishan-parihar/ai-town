import React, { useState } from 'react';

interface PersonalDataInputProps {
  onDataAdded: () => void;
}

interface DataForm {
  dataType: 'health' | 'finance' | 'productivity' | 'relationships' | 'learning';
  source: string;
  value: string;
}

interface NotionDatabase {
  id: string;
  title: string;
  description?: string;
  url: string;
  properties: Record<string, any>;
}

export default function PersonalDataInput({ onDataAdded }: PersonalDataInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNotionIntegration, setShowNotionIntegration] = useState(false);
  const [notionConnected, setNotionConnected] = useState(false);
  const [notionDatabases, setNotionDatabases] = useState<NotionDatabase[]>([]);
  const [selectedDatabase, setSelectedDatabase] = useState<string>('');
  const [notionApiKey, setNotionApiKey] = useState('');
  const [syncingNotion, setSyncingNotion] = useState(false);
  const [showTelegramIntegration, setShowTelegramIntegration] = useState(false);
  const [telegramConnected, setTelegramConnected] = useState(false);
  const [telegramBots, setTelegramBots] = useState<any[]>([]);
  const [selectedBot, setSelectedBot] = useState<string>('');
  const [connectingTelegram, setConnectingTelegram] = useState(false);
  const [telegramBotToken, setTelegramBotToken] = useState('');
  const [formData, setFormData] = useState<DataForm>({
    dataType: 'health',
    source: 'manual',
    value: '',
  });

  const dataTypes = [
    { value: 'health', label: 'Health & Wellness', icon: '❤️' },
    { value: 'finance', label: 'Financial', icon: '💰' },
    { value: 'productivity', label: 'Productivity', icon: '⚡' },
    { value: 'relationships', label: 'Relationships', icon: '👥' },
    { value: 'learning', label: 'Learning', icon: '📚' },
  ];

  const sourceOptions = {
    health: ['manual', 'fitbit', 'apple-health', 'myfitnesspal', 'notion', 'telegram'],
    finance: ['manual', 'bank', 'credit-card', 'paypal', 'notion', 'telegram'],
    productivity: ['manual', 'calendar', 'todoist', 'notion', 'telegram'],
    relationships: ['manual', 'calendar', 'slack', 'email', 'notion', 'telegram'],
    learning: ['manual', 'coursera', 'youtube', 'books', 'notion', 'telegram'],
  };

  const getExampleValues = (dataType: string) => {
    const examples = {
      health: '{"steps": 8000, "heartRate": 72, "sleep": 7.5}',
      finance: '{"amount": 45.67, "category": "groceries", "merchant": "Whole Foods"}',
      productivity: '{"task": "Complete project proposal", "timeSpent": 120, "completed": true}',
      relationships: '{"event": "Team meeting", "attendees": 5, "duration": 60}',
      learning: '{"topic": "React programming", "duration": 45, "source": "online course"}',
    };
    return examples[dataType as keyof typeof examples] || '';
  };

  // Check Notion and Telegram connections on component mount
  React.useEffect(() => {
    checkNotionConnection();
    checkTelegramConnection();
  }, []);

  const checkNotionConnection = async () => {
    try {
      const response = await fetch('http://localhost:3002/api/notion/status');
      const data = await response.json();
      setNotionConnected(data.connected);

      if (data.connected) {
        fetchNotionDatabases();
      }
    } catch (error) {
      console.error('Failed to check Notion connection:', error);
      setNotionConnected(false);
    }
  };

  const checkTelegramConnection = async () => {
    try {
      const response = await fetch('http://localhost:3002/api/telegram/bots');
      const data = await response.json();
      setTelegramBots(data.bots || []);
      setTelegramConnected(data.bots && data.bots.length > 0);
    } catch (error) {
      console.error('Failed to check Telegram connection:', error);
      setTelegramConnected(false);
    }
  };

  const connectToNotion = async () => {
    if (!notionApiKey.trim()) {
      setError('Please enter a valid Notion API key');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:3002/api/notion/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKey: notionApiKey.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to connect to Notion');
      }

      setNotionConnected(true);
      setNotionApiKey('');
      await fetchNotionDatabases();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect to Notion');
    } finally {
      setLoading(false);
    }
  };

  const disconnectFromNotion = async () => {
    try {
      await fetch('http://localhost:3002/api/notion/disconnect', {
        method: 'POST',
      });

      setNotionConnected(false);
      setNotionDatabases([]);
      setSelectedDatabase('');
    } catch (error) {
      console.error('Failed to disconnect from Notion:', error);
    }
  };

  const fetchNotionDatabases = async () => {
    try {
      const response = await fetch('http://localhost:3002/api/notion/databases');
      if (response.ok) {
        const databases = await response.json();
        setNotionDatabases(databases);
      }
    } catch (error) {
      console.error('Failed to fetch Notion databases:', error);
    }
  };

  const syncNotionDatabase = async () => {
    if (!selectedDatabase) {
      setError('Please select a database to sync');
      return;
    }

    setSyncingNotion(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:3002/api/notion/sync-database', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          databaseId: selectedDatabase,
          dataType: formData.dataType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to sync Notion database');
      }

      // Add synced data to the system
      for (const item of data.data) {
        await fetch('http://localhost:3002/api/personal-data', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(item),
        });
      }

      setIsOpen(false);
      setShowNotionIntegration(false);
      onDataAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sync Notion database');
    } finally {
      setSyncingNotion(false);
    }
  };

  const connectTelegramBot = async () => {
    if (!telegramBotToken.trim()) {
      setError('Please enter a valid Telegram bot token');
      return;
    }

    setConnectingTelegram(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:3002/api/telegram/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: telegramBotToken.trim(),
          name: 'AI Council Bot',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to connect Telegram bot');
      }

      setTelegramConnected(true);
      setTelegramBotToken('');
      await checkTelegramConnection();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect Telegram bot');
    } finally {
      setConnectingTelegram(false);
    }
  };

  const disconnectTelegramBot = async () => {
    if (!selectedBot) return;

    try {
      const response = await fetch(`http://localhost:3002/api/telegram/unregister/${selectedBot}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setTelegramConnected(false);
        setTelegramBots([]);
        setSelectedBot('');
      }
    } catch (error) {
      console.error('Failed to disconnect Telegram bot:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Parse the JSON value
      let parsedValue: any;
      try {
        parsedValue = JSON.parse(formData.value);
      } catch (jsonError) {
        throw new Error('Invalid JSON format in value field');
      }

      const response = await fetch('http://localhost:3002/api/personal-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dataType: formData.dataType,
          source: formData.source,
          value: parsedValue,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add personal data');
      }

      // Reset form
      setFormData({
        dataType: 'health',
        source: 'manual',
        value: '',
      });
      setIsOpen(false);
      onDataAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <div className="flex space-x-2">
        <button
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Add Personal Data</span>
        </button>
        <button
          onClick={() => setShowNotionIntegration(true)}
          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.906c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046 1.121-.56 1.121-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.933.467-.933 1.027zm1.54 12.448V7.164l13.31-.793v11.775l-13.31 1.354zM5.518 1.313L18.1.237c1.355-.14 1.728-.047 2.615.7l2.997 2.332c.561.42-.046.14-.046.14s.28.047-.373.14L9.327 4.26c-.794.093-1.074.14-1.915-.327z" />
          </svg>
          <span>Sync Notion</span>
        </button>
        <button
          onClick={() => setShowTelegramIntegration(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.56c-.21 2.27-1.13 7.75-1.6 10.29-.2 1.08-.59 1.44-.97 1.47-.82.07-1.44-.54-2.23-1.06-1.24-.81-1.94-1.32-3.14-2.11-1.39-.9-.49-1.39.3-1.97.21-.15 3.86-3.53 3.93-3.83.01-.04.01-.19-.07-.27s-.2-.06-.29-.03c-.12.04-2.09 1.33-5.91 3.9-.56.38-1.06.57-1.52.56-.5-.01-1.46-.28-2.18-.51-.88-.28-1.57-.43-1.51-.91.03-.25.38-.51 1.05-.78 4.11-1.79 6.85-2.97 8.21-3.55 3.92-1.63 4.73-1.91 5.26-1.92.12 0 .37.03.53.17.14.12.18.28.2.45-.01.06.01.24 0 .36z" />
          </svg>
          <span>Telegram Bot</span>
        </button>
      </div>
    );
  }

  if (showNotionIntegration) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Sync Notion Data</h3>
            <button
              onClick={() => setShowNotionIntegration(false)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {error && <div className="bg-red-900 text-red-200 p-3 rounded-lg mb-4">{error}</div>}

          {!notionConnected ? (
            <div className="space-y-4">
              <div className="bg-gray-700 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Connect to Notion</h4>
                <p className="text-sm text-gray-300 mb-4">
                  To sync data from Notion, you need to provide your Notion API key. You can create
                  one in your Notion workspace settings under integrations.
                </p>
                <input
                  type="password"
                  value={notionApiKey}
                  onChange={(e) => setNotionApiKey(e.target.value)}
                  placeholder="Enter your Notion API key"
                  className="w-full bg-gray-600 border border-gray-500 rounded-lg px-3 py-2 mb-3 focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={connectToNotion}
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Connecting...' : 'Connect to Notion'}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-green-900 bg-opacity-50 p-4 rounded-lg flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-green-300">Connected to Notion</h4>
                  <p className="text-sm text-green-200">
                    Your workspace is connected and ready to sync
                  </p>
                </div>
                <button
                  onClick={disconnectFromNotion}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
                >
                  Disconnect
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Data Type</label>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {dataTypes.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, dataType: type.value as any })}
                      className={`p-2 rounded-lg border-2 transition-all text-sm ${
                        formData.dataType === type.value
                          ? 'border-blue-500 bg-blue-900 bg-opacity-50'
                          : 'border-gray-600 hover:border-gray-500'
                      }`}
                    >
                      <div className="text-lg mb-1">{type.icon}</div>
                      <div>{type.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {notionDatabases.length > 0 ? (
                <div>
                  <label className="block text-sm font-medium mb-2">Select Database</label>
                  <select
                    value={selectedDatabase}
                    onChange={(e) => setSelectedDatabase(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 mb-4 focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Choose a database to sync</option>
                    {notionDatabases.map((db) => (
                      <option key={db.id} value={db.id}>
                        {db.title} {db.description && `- ${db.description}`}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="bg-gray-700 p-4 rounded-lg">
                  <p className="text-sm text-gray-300">
                    No suitable databases found. Make sure you have databases with task, project, or
                    goal tracking content.
                  </p>
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowNotionIntegration(false)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={syncNotionDatabase}
                  disabled={syncingNotion || !selectedDatabase}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {syncingNotion ? 'Syncing...' : 'Sync Database'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (showTelegramIntegration) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Telegram Bot Integration</h3>
            <button
              onClick={() => setShowTelegramIntegration(false)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {error && <div className="bg-red-900 text-red-200 p-3 rounded-lg mb-4">{error}</div>}

          {!telegramConnected ? (
            <div className="space-y-4">
              <div className="bg-gray-700 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Connect Telegram Bot</h4>
                <p className="text-sm text-gray-300 mb-4">
                  To enable Telegram data logging, you need to provide your Telegram bot token.
                  Create a bot using @BotFather on Telegram to get your token.
                </p>
                <input
                  type="password"
                  value={telegramBotToken}
                  onChange={(e) => setTelegramBotToken(e.target.value)}
                  placeholder="Enter your Telegram bot token"
                  className="w-full bg-gray-600 border border-gray-500 rounded-lg px-3 py-2 mb-3 focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={connectTelegramBot}
                  disabled={connectingTelegram}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {connectingTelegram ? 'Connecting...' : 'Connect Bot'}
                </button>
              </div>

              <div className="bg-blue-900 bg-opacity-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-300 mb-2">How to use Telegram Bot</h4>
                <ul className="text-sm text-blue-200 space-y-1">
                  <li>• Send messages like "Walked 5000 steps today"</li>
                  <li>• Use commands like /log health steps 5000</li>
                  <li>• Share photos of meals for nutrition tracking</li>
                  <li>• Send locations for workout tracking</li>
                  <li>• Use /help to see all available commands</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-green-900 bg-opacity-50 p-4 rounded-lg flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-green-300">Telegram Bot Connected</h4>
                  <p className="text-sm text-green-200">
                    Your bot is active and ready to receive messages
                  </p>
                </div>
                <button
                  onClick={disconnectTelegramBot}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
                >
                  Disconnect
                </button>
              </div>

              {telegramBots.length > 0 && (
                <div>
                  <label className="block text-sm font-medium mb-2">Active Bots</label>
                  <div className="space-y-2">
                    {telegramBots.map((bot, index) => (
                      <div key={index} className="bg-gray-700 p-3 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{bot.name}</div>
                            <div className="text-sm text-gray-400">
                              Users: {bot.userCount || 0} • Registered:{' '}
                              {new Date(bot.registeredAt).toLocaleDateString()}
                            </div>
                          </div>
                          <div
                            className={`px-2 py-1 rounded text-xs ${
                              bot.isActive ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'
                            }`}
                          >
                            {bot.isActive ? 'Active' : 'Inactive'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-gray-700 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Quick Commands for Users</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="bg-gray-600 p-2 rounded">
                    <code className="text-green-400">/help</code>
                    <div className="text-gray-300">Show all commands</div>
                  </div>
                  <div className="bg-gray-600 p-2 rounded">
                    <code className="text-green-400">/log [type] [data]</code>
                    <div className="text-gray-300">Quick data logging</div>
                  </div>
                  <div className="bg-gray-600 p-2 rounded">
                    <code className="text-green-400">/status</code>
                    <div className="text-gray-300">View your stats</div>
                  </div>
                  <div className="bg-gray-600 p-2 rounded">
                    <code className="text-green-400">/insights</code>
                    <div className="text-gray-300">Get AI insights</div>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowTelegramIntegration(false)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Add Personal Data</h3>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {error && <div className="bg-red-900 text-red-200 p-3 rounded-lg mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Data Type</label>
            <div className="grid grid-cols-2 gap-2">
              {dataTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() =>
                    setFormData({ ...formData, dataType: type.value as any, source: 'manual' })
                  }
                  className={`p-3 rounded-lg border-2 transition-all ${
                    formData.dataType === type.value
                      ? 'border-blue-500 bg-blue-900 bg-opacity-50'
                      : 'border-gray-600 hover:border-gray-500'
                  }`}
                >
                  <div className="text-2xl mb-1">{type.icon}</div>
                  <div className="text-sm">{type.label}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Source</label>
            <select
              value={formData.source}
              onChange={(e) => setFormData({ ...formData, source: e.target.value })}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
            >
              {sourceOptions[formData.dataType as keyof typeof sourceOptions]?.map((source) => (
                <option key={source} value={source}>
                  {source.charAt(0).toUpperCase() + source.slice(1).replace('-', ' ')}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Value (JSON format)</label>
            <textarea
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              placeholder={getExampleValues(formData.dataType)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 h-24 font-mono text-sm focus:outline-none focus:border-blue-500"
              required
            />
            <p className="text-xs text-gray-400 mt-1">
              Example: {getExampleValues(formData.dataType)}
            </p>
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Adding...' : 'Add Data'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
