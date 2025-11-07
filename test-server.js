// Simple test server
import express from 'express';

const app = express();
const port = 3001;

app.get('/api/test', (req, res) => {
  res.json({ status: 'ok', message: 'Test server is running' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

const server = app.listen(port, () => {
  console.log(`🚀 Test server running on port ${port}`);
});

// Don't add graceful shutdown for testing