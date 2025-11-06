import { ReactNode } from 'react';
import { DatabaseProvider } from '../contexts/DatabaseContext';

/**
 * Self-hosted provider that replaces ConvexClientProvider
 * Uses our own PostgreSQL-based backend instead of Convex
 */
export default function SelfHostedProvider({ children }: { children: ReactNode }) {
  return <DatabaseProvider>{children}</DatabaseProvider>;
}