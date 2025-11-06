import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { DatabaseManager } from '../config/DatabaseManager';
import { DatabaseProvider as IDatabaseProvider } from '../interfaces/DatabaseProvider';

interface DatabaseContextType {
  database: IDatabaseProvider;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

export function useDatabase() {
  const context = useContext(DatabaseContext);
  if (context === undefined) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
}

interface DatabaseProviderProps {
  children: ReactNode;
}

export function DatabaseProvider({ children }: DatabaseProviderProps) {
  const [database, setDatabase] = useState<IDatabaseProvider | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initDatabase = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const dbManager = DatabaseManager.getInstance();
        const db = await dbManager.getProvider();
        
        setDatabase(db);
        setIsConnected(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize database');
        setIsConnected(false);
      } finally {
        setIsLoading(false);
      }
    };

    initDatabase();
  }, []);

  const contextValue: DatabaseContextType = {
    database: database!,
    isConnected,
    isLoading,
    error,
  };

  return (
    <DatabaseContext.Provider value={contextValue}>
      {children}
    </DatabaseContext.Provider>
  );
}