import React, { createContext, useContext, ReactNode, useState } from 'react';

interface DatabaseContextType {
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
  const [isConnected] = useState(true);
  const [isLoading] = useState(false);
  const [error] = useState<string | null>(null);

  const contextValue: DatabaseContextType = {
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