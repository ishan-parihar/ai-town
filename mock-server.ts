// Simple mock API server for testing
const express = require('express');
const cors = require('cors');

const app = express();
const port = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Mock data
const mockWorldStatus = {
  worldId: 'default-world',
  engineId: 'engine-123'
};

const mockWorldState = {
  engine: {
    tick: 100,
    startTime: Date.now() - 100000,
    lastUpdate: Date.now()
  }
};

const mockGameDescriptions = {
  games: [
    {
      id: 'default',
      name: 'AI Council LifeOS',
      description: 'A comprehensive personal life management system'
    }
  ]
};

// API endpoints
app.get('/api/world/defaultWorldStatus', (req, res) => {
  console.log('GET /api/world/defaultWorldStatus');
  res.json(mockWorldStatus);
});

app.get('/api/world/worldState', (req, res) => {
  console.log('GET /api/world/worldState');
  res.json(mockWorldState);
});

app.get('/api/world/gameDescriptions', (req, res) => {
  console.log('GET /api/world/gameDescriptions');
  res.json(mockGameDescriptions);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'Mock API server is running!' });
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Mock API server running on port ${port}`);
  console.log(`📊 Available endpoints:`);
  console.log(`   GET  /api/world/defaultWorldStatus`);
  console.log(`   GET  /api/world/worldState`);
  console.log(`   GET  /api/world/gameDescriptions`);
  console.log(`   GET  /health`);
  console.log(`   GET  /api/test`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down mock server...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down mock server...');
  process.exit(0);
});