// Combined development server - serves both API and frontend
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { DatabaseManager } from './src/config/DatabaseManager';
import { createServer } from 'http';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class DevServer {
  private app: express.Application;
  private server: any;
  private dbManager: DatabaseManager;
  private port: number;

  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    
    // Use memory provider for development
    if (!process.env.DATABASE_URL && !process.env.DATABASE_PROVIDER) {
      console.log('📝 Using memory database for development');
      process.env.DATABASE_PROVIDER = 'memory';
    }
    
    this.dbManager = DatabaseManager.getInstance();
    this.port = parseInt(process.env.PORT || '5177');
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
    // Security
    this.app.use(helmet({
      contentSecurityPolicy: false,
    }));

    // CORS
    this.app.use(cors({
      origin: true,
      credentials: true
    }));

    // Compression
    this.app.use(compression());

    // Logging
    this.app.use(morgan('dev'));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 1000, // limit each IP to 1000 requests per windowMs
    });
    this.app.use('/api/', limiter);

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Serve static files (frontend)
    this.app.use(express.static(join(__dirname, '..', 'dist')));
    this.app.use(express.static(join(__dirname, '..', 'public')));
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (_req, res) => {
      res.json({ 
        status: 'healthy',
        timestamp: new Date().toISOString(),
        port: this.port
      });
    });

    // API test endpoint
    this.app.get('/api/test', (_req, res) => {
      res.json({ status: 'ok', message: 'API is working' });
    });

    // Mock council members data
    const councilMembers = [
      {
        id: '1',
        playerId: '1',
        name: 'Aria',
        role: 'Life Coach',
        expertise: ['goal setting', 'motivation', 'personal growth'],
        color: '#4CAF50',
        dataFocus: ['goals', 'habits', 'productivity'],
        status: 'active',
        lastInsight: Date.now() - 3600000,
        insightCount: 15,
      },
      {
        id: '2',
        playerId: '2',
        name: 'Marcus',
        role: 'Financial Analyst',
        expertise: ['budgeting', 'investments', 'financial planning'],
        color: '#2196F3',
        dataFocus: ['finance', 'spending', 'savings'],
        status: 'idle',
        lastInsight: Date.now() - 7200000,
        insightCount: 8,
      },
      // ... add other council members as needed
    ];

    // World status for Game component
    this.app.get('/api/world/defaultWorldStatus', (_req, res) => {
      res.json({
        worldId: 'default-world',
        engineId: 'default-engine'
      });
    });

    // World state for Game component  
    this.app.get('/api/world/worldState', (_req, res) => {
      res.json({
        engine: {
          tick: 0,
          startTime: Date.now() - 60000,
          lastUpdate: Date.now()
        }
      });
    });

    // Game descriptions
    this.app.get('/api/world/gameDescriptions', (_req, res) => {
      res.json([
        {
          id: 'council-lifeos',
          name: 'AI Council LifeOS',
          description: 'Your personal AI council for life management',
          map: 'council-chamber'
        }
      ]);
    });

    // Background music
    this.app.get('/api/music/background', (_req, res) => {
      res.json({
        playing: false,
        track: null,
        volume: 0.5
      });
    });

    // Testing controls
    this.app.get('/api/testing/stopAllowed', (_req, res) => {
      res.json({ allowed: true });
    });

    this.app.post('/api/testing/resume', (_req, res) => {
      res.json({ status: 'resumed' });
    });

    this.app.post('/api/testing/stop', (_req, res) => {
      res.json({ status: 'stopped' });
    });

    // World endpoint
    this.app.get('/api/world', async (_req, res) => {
      try {
        const db = await this.dbManager.getProvider();
        const worlds = await db.query('worlds').collect();
        res.json(worlds[0] || { 
          id: 'default-world',
          name: 'AI Council LifeOS',
          players: [],
          agents: councilMembers,
          conversations: [],
          mapData: null
        });
      } catch (error) {
        res.status(500).json({ error: (error as Error).message });
      }
    });

    // Council members
    this.app.get('/api/council-members', (_req, res) => {
      res.json(councilMembers);
    });

    // Messages
    this.app.get('/api/messages', async (_req, res) => {
      try {
        const db = await this.dbManager.getProvider();
        const messages = await db.query('messages').collect();
        res.json(messages || []);
      } catch (error) {
        res.json([]); // Return empty array on error
      }
    });

    this.app.post('/api/messages', async (req, res) => {
      try {
        const { conversationId, author, text } = req.body;
        const db = await this.dbManager.getProvider();
        
        const message = {
          conversationId,
          messageUuid: crypto.randomUUID(),
          author,
          text,
          worldId: 'default-world',
          created_at: new Date()
        };
        
        const messageId = await db.insert('messages', message);
        res.json({ id: messageId, ...message });
      } catch (error) {
        res.status(500).json({ error: (error as Error).message });
      }
    });

    // Serve frontend for any other routes (SPA fallback)
    this.app.use((_req, res) => {
      res.sendFile(join(__dirname, '..', 'index.html'));
    });
  }

  private setupErrorHandling(): void {
    // 404 handler
    this.app.use((_req, res) => {
      res.status(404).json({
        error: 'Not Found',
        message: `Route not found`
      });
    });

    // Global error handler
    this.app.use((error: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      console.error('Unhandled error:', error);
      
      res.status(error.status || 500).json({
        error: error.name || 'Internal Server Error',
        message: error.message || 'Something went wrong',
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
      });
    });
  }

  public async start(): Promise<void> {
    try {
      // Initialize database
      console.log('🔌 Initializing database connection...');
      await this.dbManager.getProvider();
      console.log('✅ Database connected successfully');

      // Start HTTP server
      this.server.listen(this.port, () => {
        console.log(`🚀 AI Town Dev Server running on port ${this.port}`);
        console.log(`📱 Application: http://localhost:${this.port}`);
        console.log(`📊 Health check: http://localhost:${this.port}/health`);
        console.log(`🔧 Database provider: ${this.dbManager.getConfig().provider}`);
        console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`✨ Features: API + Frontend in one server`);
      });

    } catch (error) {
      console.error('❌ Failed to start server:', error);
      process.exit(1);
    }
  }
}

// Start server
const server = new DevServer();
server.start().catch(console.error);