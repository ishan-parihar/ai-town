# Convex Dependency Audit & Self-Hosting Solution

## 🔍 **Dependency Analysis**

### Current Convex Usage:
- **Backend Runtime**: All game logic, agent operations, and data persistence
- **Real-time Database**: World state, player data, conversations, embeddings cache
- **Function Execution**: LLM calls, agent conversations, game engine
- **Vector Database**: Embeddings storage and similarity search

### Critical Dependencies:
```json
{
  "convex": "^1.19.2",
  "convex dev": Required for development
}
```

## ⚠️ **Concerns for Open Source**

### 1. **Vendor Lock-in**
- All backend logic tied to Convex's proprietary runtime
- Database schema uses Convex-specific types
- Function execution model is Convex-specific

### 2. **Cost Implications**
- Convex Starter plan limits: 1GB storage, 500K function runs/month
- Pro plan required for production usage
- No self-hosting option available

### 3. **Deployment Limitations**
- Must deploy to Convex's cloud
- No on-premise deployment option
- Data stored on Convex's infrastructure

## 🛠️ **Self-Hosting Solution**

### Architecture Migration Plan:

#### Phase 1: Database Abstraction Layer
```typescript
// interfaces/DatabaseProvider.ts
export interface DatabaseProvider {
  // Basic CRUD operations
  get<T>(id: string): Promise<T | null>;
  insert<T>(table: string, data: T): Promise<string>;
  update<T>(id: string, data: Partial<T>): Promise<T>;
  delete(id: string): Promise<void>;
  
  // Query operations
  query<T>(table: string): QueryBuilder<T>;
  
  // Vector operations
  upsertVector(embedding: number[], metadata: any): Promise<string>;
  searchVectors(queryEmbedding: number[], limit: number): Promise<VectorSearchResult[]>;
}
```

#### Phase 2: Provider Implementations

**MongoDB Provider:**
```typescript
// providers/MongoDBProvider.ts
export class MongoDBProvider implements DatabaseProvider {
  private client: MongoClient;
  private db: Db;
  
  constructor(connectionString: string) {
    this.client = new MongoClient(connectionString);
  }
  
  async upsertVector(embedding: number[], metadata: any): Promise<string> {
    // Use MongoDB Atlas Vector Search or local hnswlib
  }
}
```

**PostgreSQL + pgvector Provider:**
```typescript
// providers/PostgreSQLProvider.ts
export class PostgreSQLProvider implements DatabaseProvider {
  private pool: Pool;
  
  async upsertVector(embedding: number[], metadata: any): Promise<string> {
    const query = `
      INSERT INTO embeddings (embedding, metadata) 
      VALUES ($1, $2) 
      RETURNING id
    `;
    // Implementation with pgvector
  }
}
```

#### Phase 3: Function Runtime Migration

**Express.js Function Server:**
```typescript
// server/functions/index.ts
import express from 'express';
import { DatabaseProvider } from '../interfaces/DatabaseProvider';

export class FunctionServer {
  constructor(private db: DatabaseProvider) {}
  
  registerRoutes(app: express.Application) {
    app.post('/functions/aiTown/agentOperations:agentGenerateMessage', 
      async (req, res) => {
        // Migrated Convex function logic
    });
    
    app.post('/functions/aiTown/main:startEngine', async (req, res) => {
        // Migrated engine logic
    });
  }
}
```

#### Phase 4: Real-time Subscriptions

**WebSocket Provider:**
```typescript
// services/RealtimeService.ts
export class RealtimeService {
  private wss: WebSocketServer;
  private subscriptions: Map<string, Set<WebSocket>>;
  
  subscribe(query: string, ws: WebSocket) {
    if (!this.subscriptions.has(query)) {
      this.subscriptions.set(query, new Set());
    }
    this.subscriptions.get(query)!.add(ws);
  }
  
  notify(query: string, data: any) {
    const subscribers = this.subscriptions.get(query);
    if (subscribers) {
      subscribers.forEach(ws => ws.send(JSON.stringify(data)));
    }
  }
}
```

## 📦 **Alternative Stack Options**

### Option 1: Node.js + PostgreSQL + pgvector
```json
{
  "dependencies": {
    "express": "^4.18.0",
    "pg": "^8.8.0",
    "pgvector": "^0.1.0",
    "ws": "^8.12.0",
    "node-cron": "^3.0.0"
  }
}
```

### Option 2: Fastify + MongoDB + Atlas Vector Search
```json
{
  "dependencies": {
    "fastify": "^4.21.0",
    "mongodb": "^4.13.0",
    "ws": "^8.12.0",
    "@fastify/websocket": "^8.0.0"
  }
}
```

### Option 3: Self-Hosted Convex Alternative
```typescript
// Using Appwrite + Supabase + custom function runner
{
  "database": "Appwrite (self-hosted)",
  "functions": "Custom Node.js runner",
  "realtime": "Appwrite realtime",
  "vectors": "Supabase pgvector"
}
```

## 🚀 **Migration Strategy**

### Step 1: Create Abstraction Layer
1. Define database provider interfaces
2. Create Convex adapter implementation
3. Implement MongoDB/PostgreSQL providers
4. Switch between providers with environment variable

### Step 2: Migrate Function Execution
1. Extract function logic from Convex files
2. Create Express.js function server
3. Implement authentication middleware
4. Add rate limiting and error handling

### Step 3: Replace Real-time System
1. Implement WebSocket server
2. Create subscription management
3. Migrate client-side Convex client
4. Update React hooks

### Step 4: Vector Database Migration
1. Export existing embeddings from Convex
2. Import to chosen vector database
3. Update similarity search logic
4. Verify embedding operations

## 💾 **Data Migration Plan**

### Export from Convex:
```typescript
// scripts/export-convex-data.ts
async function exportConvexData() {
  const worlds = await convex.query('worlds').collect();
  const players = await convex.query('players').collect();
  const conversations = await convex.query('conversations').collect();
  const embeddings = await convex.query('embeddingsCache').collect();
  
  return {
    worlds,
    players,
    conversations,
    embeddings
  };
}
```

### Import to New Database:
```typescript
// scripts/import-to-mongodb.ts
async function importToMongoDB(data: any) {
  const client = new MongoClient(process.env.MONGODB_URL);
  await client.connect();
  
  const db = client.db('aiTown');
  
  await db.collection('worlds').insertMany(data.worlds);
  await db.collection('players').insertMany(data.players);
  await db.collection('conversations').insertMany(data.conversations);
  
  // Migrate embeddings with vector indexing
  for (const embedding of data.embeddings) {
    await db.collection('embeddings').insertOne({
      ...embedding,
      vector: embedding.embedding // Convert to proper format
    });
  }
}
```

## 🔧 **Configuration Management**

### Environment-Based Provider Selection:
```typescript
// config/database.ts
export function createDatabaseProvider(): DatabaseProvider {
  const provider = process.env.DATABASE_PROVIDER || 'convex';
  
  switch (provider) {
    case 'mongodb':
      return new MongoDBProvider(process.env.MONGODB_URL!);
    case 'postgresql':
      return new PostgreSQLProvider(process.env.POSTGRES_URL!);
    case 'convex':
    default:
      return new ConvexProvider();
  }
}
```

### Docker Compose for Self-Hosting:
```yaml
# docker-compose.self-hosted.yml
version: '3.8'
services:
  app:
    build: .
    environment:
      - DATABASE_PROVIDER=postgresql
      - POSTGRES_URL=postgresql://user:pass@postgres:5432/aitown
    depends_on:
      - postgres
      - redis
  
  postgres:
    image: pgvector/pgvector:pg15
    environment:
      - POSTGRES_DB=aitown
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
    volumes:
      - postgres_data:/var/lib/postgresql/data
  
  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

## 🎯 **Recommendations**

### For Open Source Project:

1. **Implement Abstraction Layer**: Start immediately to reduce vendor lock-in
2. **Provide Multiple Options**: Support Convex (cloud), PostgreSQL (self-hosted), MongoDB (hybrid)
3. **Docker-ize Everything**: Make self-hosting as easy as `docker-compose up`
4. **Migration Scripts**: Provide automated data export/import tools
5. **Documentation**: Detailed setup guides for each option

### Implementation Priority:
1. **High**: Database abstraction layer
2. **High**: Function runtime extraction  
3. **Medium**: Real-time WebSocket system
4. **Medium**: Vector database abstraction
5. **Low**: Full Convex replacement (keep as option)

This approach ensures the project remains truly open source while maintaining the excellent developer experience that Convex provides.