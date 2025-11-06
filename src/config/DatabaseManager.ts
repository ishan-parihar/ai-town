// Database Configuration Manager
// Handles environment-based database provider selection and configuration

import { createDatabaseProvider, DatabaseProvider, DatabaseConfig } from '../interfaces/DatabaseProvider';

export class DatabaseManager {
  private static instance: DatabaseManager;
  private provider: DatabaseProvider | null = null;
  private config: DatabaseConfig;

  private constructor() {
    this.config = this.loadConfiguration();
  }

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  private loadConfiguration(): DatabaseConfig {
    const provider = (process.env.DATABASE_PROVIDER || 'postgresql') as DatabaseConfig['provider'];
    
    const config: DatabaseConfig = {
      provider,
      connectionString: process.env.DATABASE_URL,
      options: {}
    };

    // Provider-specific configuration
    switch (provider) {
      case 'mongodb':
        config.connectionString = process.env.MONGODB_URL || process.env.DATABASE_URL;
        config.options = {
          maxPoolSize: parseInt(process.env.MONGODB_POOL_SIZE || '10'),
          minPoolSize: parseInt(process.env.MONGODB_MIN_POOL_SIZE || '2')
        };
        break;

      case 'postgresql':
        config.connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
        config.options = {
          max: parseInt(process.env.POSTGRES_POOL_SIZE || '10'),
          min: parseInt(process.env.POSTGRES_MIN_POOL_SIZE || '2'),
          ssl: process.env.POSTGRES_SSL === 'true'
        };
        break;

      case 'memory':
        // In-memory provider doesn't need connection string
        break;
    }

    return config;
  }

  public async getProvider(): Promise<DatabaseProvider> {
    if (!this.provider) {
      this.provider = createDatabaseProvider(this.config);
      await this.provider.connect();
    }
    return this.provider;
  }

  public getConfig(): DatabaseConfig {
    return this.config;
  }

  public async disconnect(): Promise<void> {
    if (this.provider) {
      await this.provider.disconnect();
      this.provider = null;
    }
  }

  public isSelfHosted(): boolean {
    return ['mongodb', 'postgresql', 'memory'].includes(this.config.provider);
  }

  public isPostgreSQL(): boolean {
    return this.config.provider === 'postgresql';
  }

  // Health check for the current provider
  public async healthCheck(): Promise<{status: 'healthy' | 'unhealthy', provider: string, details?: any}> {
    try {
      const provider = await this.getProvider();
      
      // Perform a simple operation to check connectivity
      await provider.query('health').limit(1).collect();
      
      return {
        status: 'healthy',
        provider: this.config.provider
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        provider: this.config.provider,
        details: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Convenience function for getting the database provider
export async function getDatabase(): Promise<DatabaseProvider> {
  return await DatabaseManager.getInstance().getProvider();
}

// Export configuration types for use in other modules
export type { DatabaseConfig };