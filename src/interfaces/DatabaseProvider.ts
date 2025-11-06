// Database Provider Interface for Self-Hosting Solution
// This abstraction layer allows switching between Convex, MongoDB, PostgreSQL, etc.

export interface DatabaseProvider {
  // Connection management
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  
  // Basic CRUD operations
  get<T>(table: string, id: string): Promise<T | null>;
  insert<T>(table: string, data: T): Promise<string>;
  update<T>(table: string, id: string, data: Partial<T>): Promise<T>;
  delete(table: string, id: string): Promise<void>;
  
  // Query operations
  query<T>(table: string): QueryBuilder<T>;
  
  // Vector operations for embeddings
  upsertVector(embedding: number[], metadata: any, dimension?: number): Promise<string>;
  searchVectors(queryEmbedding: number[], limit: number, threshold?: number): Promise<VectorSearchResult[]>;
  deleteVector(id: string): Promise<void>;
  
  // Batch operations
  batchInsert<T>(table: string, items: T[]): Promise<string[]>;
  batchUpdate<T>(table: string, updates: Array<{id: string, data: Partial<T>}>): Promise<T[]>;
  
  // Transaction support
  transaction<T>(fn: (tx: Transaction) => Promise<T>): Promise<T>;
}

export interface QueryBuilder<T> {
  filter(predicate: (item: T) => boolean): QueryBuilder<T>;
  orderBy(field: keyof T, direction?: 'asc' | 'desc'): QueryBuilder<T>;
  limit(n: number): QueryBuilder<T>;
  offset(n: number): QueryBuilder<T>;
  collect(): Promise<T[]>;
  first(): Promise<T | null>;
  unique(): Promise<T | null>;
}

export interface VectorSearchResult {
  id: string;
  similarity: number;
  metadata: any;
  embedding?: number[];
}

export interface Transaction {
  get<T>(table: string, id: string): Promise<T | null>;
  insert<T>(table: string, data: T): Promise<string>;
  update<T>(table: string, id: string, data: Partial<T>): Promise<T>;
  delete(table: string, id: string): Promise<void>;
}

// Database configuration
export interface DatabaseConfig {
  provider: 'mongodb' | 'postgresql' | 'memory';
  connectionString?: string;
  options?: Record<string, any>;
}

// Factory function for creating database providers
import { PostgreSQLProvider } from '../providers/PostgreSQLProvider.js';

export function createDatabaseProvider(config: DatabaseConfig): DatabaseProvider {
  switch (config.provider) {
    case 'mongodb':
      return new MongoDBProvider(config.connectionString!, config.options);
    case 'postgresql':
      return new PostgreSQLProvider(config.connectionString!, config.options);
    case 'memory':
      return new MemoryProvider();
    default:
      throw new Error(`Unsupported database provider: ${config.provider}`);
  }
}

// Export provider classes (to be implemented)
export { PostgreSQLProvider } from '../providers/PostgreSQLProvider.js';

export class ConvexProvider implements DatabaseProvider {
  async connect(): Promise<void> {
    // Convex automatically manages connections
  }
  
  async disconnect(): Promise<void> {
    // Convex automatically manages connections
  }
  
  async get<T>(table: string, id: string): Promise<T | null> {
    // Implementation using Convex client
    throw new Error('ConvexProvider not implemented yet');
  }
  
  async insert<T>(table: string, data: T): Promise<string> {
    throw new Error('ConvexProvider not implemented yet');
  }
  
  async update<T>(table: string, id: string, data: Partial<T>): Promise<T> {
    throw new Error('ConvexProvider not implemented yet');
  }
  
  async delete(table: string, id: string): Promise<void> {
    throw new Error('ConvexProvider not implemented yet');
  }
  
  query<T>(table: string): QueryBuilder<T> {
    throw new Error('ConvexProvider not implemented yet');
  }
  
  async upsertVector(embedding: number[], metadata: any, dimension?: number): Promise<string> {
    throw new Error('ConvexProvider not implemented yet');
  }
  
  async searchVectors(queryEmbedding: number[], limit: number, threshold?: number): Promise<VectorSearchResult[]> {
    throw new Error('ConvexProvider not implemented yet');
  }
  
  async deleteVector(id: string): Promise<void> {
    throw new Error('ConvexProvider not implemented yet');
  }
  
  async batchInsert<T>(table: string, items: T[]): Promise<string[]> {
    throw new Error('ConvexProvider not implemented yet');
  }
  
  async batchUpdate<T>(table: string, updates: Array<{id: string, data: Partial<T>}>): Promise<T[]> {
    throw new Error('ConvexProvider not implemented yet');
  }
  
  async transaction<T>(fn: (tx: Transaction) => Promise<T>): Promise<T> {
    throw new Error('ConvexProvider not implemented yet');
  }
}

export class MongoDBProvider implements DatabaseProvider {
  constructor(connectionString: string, options?: Record<string, any>) {
    // MongoDB implementation
  }
  
  async connect(): Promise<void> {
    throw new Error('MongoDBProvider not implemented yet');
  }
  
  async disconnect(): Promise<void> {
    throw new Error('MongoDBProvider not implemented yet');
  }
  
  async get<T>(table: string, id: string): Promise<T | null> {
    throw new Error('MongoDBProvider not implemented yet');
  }
  
  async insert<T>(table: string, data: T): Promise<string> {
    throw new Error('MongoDBProvider not implemented yet');
  }
  
  async update<T>(table: string, id: string, data: Partial<T>): Promise<T> {
    throw new Error('MongoDBProvider not implemented yet');
  }
  
  async delete(table: string, id: string): Promise<void> {
    throw new Error('MongoDBProvider not implemented yet');
  }
  
  query<T>(table: string): QueryBuilder<T> {
    throw new Error('MongoDBProvider not implemented yet');
  }
  
  async upsertVector(embedding: number[], metadata: any, dimension?: number): Promise<string> {
    throw new Error('MongoDBProvider not implemented yet');
  }
  
  async searchVectors(queryEmbedding: number[], limit: number, threshold?: number): Promise<VectorSearchResult[]> {
    throw new Error('MongoDBProvider not implemented yet');
  }
  
  async deleteVector(id: string): Promise<void> {
    throw new Error('MongoDBProvider not implemented yet');
  }
  
  async batchInsert<T>(table: string, items: T[]): Promise<string[]> {
    throw new Error('MongoDBProvider not implemented yet');
  }
  
  async batchUpdate<T>(table: string, updates: Array<{id: string, data: Partial<T>}>): Promise<T[]> {
    throw new Error('MongoDBProvider not implemented yet');
  }
  
  async transaction<T>(fn: (tx: Transaction) => Promise<T>): Promise<T> {
    throw new Error('MongoDBProvider not implemented yet');
  }
}

// In-memory provider for testing and development
export class MemoryProvider implements DatabaseProvider {
  private data: Map<string, Map<string, any>> = new Map();
  private vectors: Array<{id: string, embedding: number[], metadata: any}> = [];
  
  async connect(): Promise<void> {
    // Nothing to connect for in-memory
  }
  
  async disconnect(): Promise<void> {
    this.data.clear();
    this.vectors = [];
  }
  
  async get<T>(table: string, id: string): Promise<T | null> {
    const tableData = this.data.get(table);
    return tableData?.get(id) || null;
  }
  
  async insert<T>(table: string, data: T): Promise<string> {
    const id = this.generateId();
    const tableData = this.data.get(table) || new Map();
    tableData.set(id, { _id: id, ...data });
    this.data.set(table, tableData);
    return id;
  }
  
  async update<T>(table: string, id: string, data: Partial<T>): Promise<T> {
    const tableData = this.data.get(table);
    if (!tableData?.has(id)) {
      throw new Error(`Document with id ${id} not found in table ${table}`);
    }
    
    const existing = tableData.get(id);
    const updated = { ...existing, ...data };
    tableData.set(id, updated);
    return updated;
  }
  
  async delete(table: string, id: string): Promise<void> {
    const tableData = this.data.get(table);
    if (tableData) {
      tableData.delete(id);
    }
  }
  
  query<T>(table: string): QueryBuilder<T> {
    const tableData = this.data.get(table) || new Map();
    const items = Array.from(tableData.values()) as T[];
    
    return new MemoryQueryBuilder<T>(items);
  }
  
  async upsertVector(embedding: number[], metadata: any, dimension?: number): Promise<string> {
    const id = this.generateId();
    this.vectors.push({ id, embedding, metadata });
    return id;
  }
  
  async searchVectors(queryEmbedding: number[], limit: number, threshold: number = 0.7): Promise<VectorSearchResult[]> {
    const results = this.vectors
      .map(vector => ({
        id: vector.id,
        similarity: this.cosineSimilarity(queryEmbedding, vector.embedding),
        metadata: vector.metadata
      }))
      .filter(result => result.similarity >= threshold)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
    
    return results;
  }
  
  async deleteVector(id: string): Promise<void> {
    this.vectors = this.vectors.filter(v => v.id !== id);
  }
  
  async batchInsert<T>(table: string, items: T[]): Promise<string[]> {
    const ids: string[] = [];
    for (const item of items) {
      const id = await this.insert(table, item);
      ids.push(id);
    }
    return ids;
  }
  
  async batchUpdate<T>(table: string, updates: Array<{id: string, data: Partial<T>}>): Promise<T[]> {
    const results: T[] = [];
    for (const { id, data } of updates) {
      const updated = await this.update(table, id, data);
      results.push(updated);
    }
    return results;
  }
  
  async transaction<T>(fn: (tx: Transaction) => Promise<T>): Promise<T> {
    // For memory provider, just execute the function directly
    const tx: Transaction = {
      get: (table, id) => this.get(table, id),
      insert: (table, data) => this.insert(table, data),
      update: (table, id, data) => this.update(table, id, data),
      delete: (table, id) => this.delete(table, id)
    };
    return fn(tx);
  }
  
  private generateId(): string {
    return Math.random().toString(36).substring(2, 15);
  }
  
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}

class MemoryQueryBuilder<T> implements QueryBuilder<T> {
  private items: T[];
  
  constructor(items: T[]) {
    this.items = items;
  }
  
  filter(predicate: (item: T) => boolean): QueryBuilder<T> {
    return new MemoryQueryBuilder(this.items.filter(predicate));
  }
  
  orderBy(field: keyof T, direction: 'asc' | 'desc' = 'asc'): QueryBuilder<T> {
    const sorted = [...this.items].sort((a, b) => {
      const aVal = a[field];
      const bVal = b[field];
      
      if (aVal < bVal) return direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return direction === 'asc' ? 1 : -1;
      return 0;
    });
    return new MemoryQueryBuilder(sorted);
  }
  
  limit(n: number): QueryBuilder<T> {
    return new MemoryQueryBuilder(this.items.slice(0, n));
  }
  
  offset(n: number): QueryBuilder<T> {
    return new MemoryQueryBuilder(this.items.slice(n));
  }
  
  async collect(): Promise<T[]> {
    return this.items;
  }
  
  async first(): Promise<T | null> {
    return this.items[0] || null;
  }
  
  async unique(): Promise<T | null> {
    return this.items.length === 1 ? this.items[0] : null;
  }
}