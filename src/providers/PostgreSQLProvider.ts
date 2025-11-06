// PostgreSQL Provider Implementation
// Implements the DatabaseProvider interface for PostgreSQL with pgvector

import { DatabaseProvider, QueryBuilder, VectorSearchResult, Transaction } from '../interfaces/DatabaseProvider';
import { Pool, Client } from 'pg';

export class PostgreSQLProvider implements DatabaseProvider {
  private pool: Pool;
  private connectionString: string;
  private options: any;

  constructor(connectionString: string, options?: Record<string, any>) {
    this.connectionString = connectionString;
    this.options = options || {};
    this.pool = new Pool({
      connectionString,
      max: this.options.max || 10,
      min: this.options.min || 2,
      ssl: this.options.ssl || false
    });
  }

  async connect(): Promise<void> {
    try {
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();
      
      // Initialize pgvector extension
      await this.initializeVectorExtension();
    } catch (error) {
      throw new Error(`Failed to connect to PostgreSQL: ${error}`);
    }
  }

  async disconnect(): Promise<void> {
    await this.pool.end();
  }

  private async initializeVectorExtension(): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('CREATE EXTENSION IF NOT EXISTS vector');
    } catch (error) {
      console.warn('Failed to create vector extension:', error);
    } finally {
      client.release();
    }
  }

  async get<T>(table: string, id: string): Promise<T | null> {
    const client = await this.pool.connect();
    try {
      const query = `SELECT * FROM ${this.escapeIdentifier(table)} WHERE id = $1`;
      const result = await client.query(query, [id]);
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }

  async insert<T>(table: string, data: T): Promise<string> {
    const client = await this.pool.connect();
    try {
      const keys = Object.keys(data as any);
      const values = Object.values(data as any);
      const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
      
      const query = `
        INSERT INTO ${this.escapeIdentifier(table)} (${keys.map(k => this.escapeIdentifier(k)).join(', ')})
        VALUES (${placeholders})
        RETURNING id
      `;
      
      const result = await client.query(query, values);
      return result.rows[0].id;
    } finally {
      client.release();
    }
  }

  async update<T>(table: string, id: string, data: Partial<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      const keys = Object.keys(data as any);
      const values = Object.values(data as any);
      const setClause = keys.map((key, i) => `${this.escapeIdentifier(key)} = $${i + 2}`).join(', ');
      
      const query = `
        UPDATE ${this.escapeIdentifier(table)}
        SET ${setClause}
        WHERE id = $1
        RETURNING *
      `;
      
      const result = await client.query(query, [id, ...values]);
      if (result.rows.length === 0) {
        throw new Error(`Document with id ${id} not found in table ${table}`);
      }
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  async delete(table: string, id: string): Promise<void> {
    const client = await this.pool.connect();
    try {
      const query = `DELETE FROM ${this.escapeIdentifier(table)} WHERE id = $1`;
      await client.query(query, [id]);
    } finally {
      client.release();
    }
  }

  query<T>(table: string): QueryBuilder<T> {
    return new PostgreSQLQueryBuilder<T>(table, this.pool);
  }

  async upsertVector(embedding: number[], metadata: any, dimension?: number): Promise<string> {
    const client = await this.pool.connect();
    try {
      // Ensure the vectors table exists
      await this.ensureVectorsTable(dimension || embedding.length);
      
      const query = `
        INSERT INTO vectors (embedding, metadata)
        VALUES ($1, $2)
        RETURNING id
      `;
      
      const result = await client.query(query, [JSON.stringify(embedding), JSON.stringify(metadata)]);
      return result.rows[0].id;
    } finally {
      client.release();
    }
  }

  async searchVectors(queryEmbedding: number[], limit: number, threshold: number = 0.7): Promise<VectorSearchResult[]> {
    const client = await this.pool.connect();
    try {
      const query = `
        SELECT 
          id,
          metadata,
          1 - (embedding <=> $1) as similarity
        FROM vectors
        WHERE 1 - (embedding <=> $1) >= $2
        ORDER BY similarity DESC
        LIMIT $3
      `;
      
      const result = await client.query(query, [JSON.stringify(queryEmbedding), threshold, limit]);
      
      return result.rows.map(row => ({
        id: row.id,
        similarity: row.similarity,
        metadata: JSON.parse(row.metadata)
      }));
    } finally {
      client.release();
    }
  }

  async deleteVector(id: string): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('DELETE FROM vectors WHERE id = $1', [id]);
    } finally {
      client.release();
    }
  }

  async batchInsert<T>(table: string, items: T[]): Promise<string[]> {
    const client = await this.pool.connect();
    try {
      const keys = Object.keys(items[0] as any);
      const placeholders = items.map((_, itemIndex) => 
        keys.map((_, keyIndex) => `$${itemIndex * keys.length + keyIndex + 1}`).join(', ')
      );
      const values = items.flatMap(item => Object.values(item as any));
      
      const query = `
        INSERT INTO ${this.escapeIdentifier(table)} (${keys.map(k => this.escapeIdentifier(k)).join(', ')})
        VALUES ${placeholders.map(p => `(${p})`).join(', ')}
        RETURNING id
      `;
      
      const result = await client.query(query, values);
      return result.rows.map(row => row.id);
    } finally {
      client.release();
    }
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
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      
      const tx: Transaction = {
        get: async (table, id) => {
          const query = `SELECT * FROM ${this.escapeIdentifier(table)} WHERE id = $1`;
          const result = await client.query(query, [id]);
          return result.rows[0] || null;
        },
        insert: async (table, data) => {
          const keys = Object.keys(data as any);
          const values = Object.values(data as any);
          const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
          
          const query = `
            INSERT INTO ${this.escapeIdentifier(table)} (${keys.map(k => this.escapeIdentifier(k)).join(', ')})
            VALUES (${placeholders})
            RETURNING id
          `;
          
          const result = await client.query(query, values);
          return result.rows[0].id;
        },
        update: async (table, id, data) => {
          const keys = Object.keys(data as any);
          const values = Object.values(data as any);
          const setClause = keys.map((key, i) => `${this.escapeIdentifier(key)} = $${i + 2}`).join(', ');
          
          const query = `
            UPDATE ${this.escapeIdentifier(table)}
            SET ${setClause}
            WHERE id = $1
            RETURNING *
          `;
          
          const result = await client.query(query, [id, ...values]);
          if (result.rows.length === 0) {
            throw new Error(`Document with id ${id} not found in table ${table}`);
          }
          return result.rows[0];
        },
        delete: async (table, id) => {
          await client.query(`DELETE FROM ${this.escapeIdentifier(table)} WHERE id = $1`, [id]);
        }
      };
      
      const result = await fn(tx);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  private async ensureVectorsTable(dimension: number): Promise<void> {
    const client = await this.pool.connect();
    try {
      const query = `
        CREATE TABLE IF NOT EXISTS vectors (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          embedding vector(${dimension}),
          metadata JSONB,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `;
      await client.query(query);
      
      // Create index for vector search
      const indexQuery = `
        CREATE INDEX IF NOT EXISTS vectors_embedding_idx ON vectors 
        USING ivfflat (embedding vector_cosine_ops)
      `;
      await client.query(indexQuery);
    } finally {
      client.release();
    }
  }

  private escapeIdentifier(str: string): string {
    return `"${str.replace(/"/g, '""')}"`;
  }
}

class PostgreSQLQueryBuilder<T> implements QueryBuilder<T> {
  private table: string;
  private pool: Pool;
  private whereClause: string = '';
  private orderClause: string = '';
  private limitClause: string = '';
  private offsetClause: string = '';
  private params: any[] = [];

  constructor(table: string, pool: Pool) {
    this.table = table;
    this.pool = pool;
  }

  filter(predicate: (item: T) => boolean): QueryBuilder<T> {
    // For simplicity, we'll implement basic filtering
    // In a real implementation, you'd want to parse the predicate
    // and convert it to SQL WHERE clause
    return this;
  }

  orderBy(field: keyof T, direction: 'asc' | 'desc' = 'asc'): QueryBuilder<T> {
    this.orderClause = `ORDER BY ${this.escapeIdentifier(String(field))} ${direction.toUpperCase()}`;
    return this;
  }

  limit(n: number): QueryBuilder<T> {
    this.limitClause = `LIMIT $${this.params.length + 1}`;
    this.params.push(n);
    return this;
  }

  offset(n: number): QueryBuilder<T> {
    this.offsetClause = `OFFSET $${this.params.length + 1}`;
    this.params.push(n);
    return this;
  }

  async collect(): Promise<T[]> {
    const client = await this.pool.connect();
    try {
      const query = `
        SELECT * FROM ${this.escapeIdentifier(this.table)}
        ${this.whereClause}
        ${this.orderClause}
        ${this.limitClause}
        ${this.offsetClause}
      `;
      const result = await client.query(query, this.params);
      return result.rows;
    } finally {
      client.release();
    }
  }

  async first(): Promise<T | null> {
    this.limit(1);
    const results = await this.collect();
    return results[0] || null;
  }

  async unique(): Promise<T | null> {
    const results = await this.collect();
    return results.length === 1 ? results[0] : null;
  }

  private escapeIdentifier(str: string): string {
    return `"${str.replace(/"/g, '""')}"`;
  }
}