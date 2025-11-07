// Combined development server
import express from 'express';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';

const PORT = 3001;

async function startServer() {
  const app = express();
  
  // Middleware
  app.use(cors());
  app.use(express.json());
  
  // API endpoints
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.get('/api/world/defaultWorldStatus', (req, res) => {
    res.json({
      status: 'ok',
      worldId: 'test-world',
      message: 'Default world status'
    });
  });

  app.get('/api/world/gameDescriptions', (req, res) => {
    res.json({
      status: 'ok',
      descriptions: {
        game: 'AI Town Game',
        version: '1.0.0'
      }
    });
  });

  app.get('/api/world/worldState', (req, res) => {
    res.json({
      status: 'ok',
      worldState: {
        players: [],
        entities: [],
        environment: {}
      }
    });
  });

  // Create Vite server for frontend
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa'
  });
  
  // Use vite's connect instance as middleware
  app.use(vite.middlewares);

  // Start server
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Combined server running on http://0.0.0.0:${PORT}`);
    console.log(`📊 Health: http://localhost:${PORT}/health`);
    console.log(`🎮 Frontend: http://localhost:${PORT}/`);
    console.log(`🔧 API: http://localhost:${PORT}/api/`);
  });

  // Keep process alive
  setInterval(() => {}, 60000);
}

startServer().catch(console.error);