/**
 * Global Error Handler Service
 * Provides comprehensive error handling, recovery, and reporting
 */

import { monitoring } from './MonitoringService';

export interface ErrorContext {
  userId?: string;
  requestId?: string;
  service: string;
  operation?: string;
  metadata?: Record<string, any>;
}

export interface ErrorReport {
  id: string;
  error: Error;
  context: ErrorContext;
  timestamp: number;
  stack: string;
  userAgent?: string;
  ip?: string;
  resolved: boolean;
  occurrences: number;
  lastOccurrence: number;
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeout: number;
  monitoringPeriod: number;
  expectedRecoveryTime?: number;
}

export enum CircuitBreakerState {
  CLOSED = 'closed',
  OPEN = 'open',
  HALF_OPEN = 'half_open',
}

export class CircuitBreaker {
  private state: CircuitBreakerState = CircuitBreakerState.CLOSED;
  private failures = 0;
  private lastFailureTime = 0;
  private successCount = 0;

  constructor(
    private name: string,
    private config: CircuitBreakerConfig,
    private operation: () => Promise<any>,
  ) {}

  async execute(): Promise<any> {
    if (this.state === CircuitBreakerState.OPEN) {
      if (Date.now() - this.lastFailureTime > this.config.resetTimeout) {
        this.state = CircuitBreakerState.HALF_OPEN;
        this.successCount = 0;
        monitoring.log(
          'info',
          'circuit-breaker',
          `Circuit breaker ${this.name} entering half-open state`,
        );
      } else {
        throw new Error(`Circuit breaker ${this.name} is OPEN`);
      }
    }

    try {
      const result = await this.operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;

    if (this.state === CircuitBreakerState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= 3) {
        // Need 3 consecutive successes to close
        this.state = CircuitBreakerState.CLOSED;
        monitoring.log(
          'info',
          'circuit-breaker',
          `Circuit breaker ${this.name} closed after successful recovery`,
        );
      }
    }
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.config.failureThreshold) {
      this.state = CircuitBreakerState.OPEN;
      monitoring.createAlert(
        'error',
        'high',
        `Circuit Breaker Open: ${this.name}`,
        `Circuit breaker ${this.name} opened after ${this.failures} failures`,
        'circuit-breaker',
        { failures: this.failures, state: this.state },
      );
    }
  }

  getState(): CircuitBreakerState {
    return this.state;
  }

  getFailures(): number {
    return this.failures;
  }
}

export class RetryManager {
  static async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000,
    context: ErrorContext,
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        if (attempt === maxRetries) {
          monitoring.log('error', context.service, `Operation failed after ${maxRetries} retries`, {
            ...context.metadata,
            error: lastError.message,
            attempts: attempt + 1,
          });
          throw lastError;
        }

        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000; // Exponential backoff with jitter

        monitoring.log('warn', context.service, `Operation failed, retrying in ${delay}ms`, {
          ...context.metadata,
          error: lastError.message,
          attempt: attempt + 1,
          maxRetries: maxRetries + 1,
        });

        await this.sleep(delay);
      }
    }

    throw lastError!;
  }

  private static sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export class ErrorHandlerService {
  private static instance: ErrorHandlerService;
  private errorReports: Map<string, ErrorReport> = new Map();
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();

  private constructor() {
    this.setupGlobalErrorHandlers();
  }

  static getInstance(): ErrorHandlerService {
    if (!ErrorHandlerService.instance) {
      ErrorHandlerService.instance = new ErrorHandlerService();
    }
    return ErrorHandlerService.instance;
  }

  /**
   * Setup global error handlers
   */
  private setupGlobalErrorHandlers(): void {
    // Uncaught exceptions
    process.on('uncaughtException', (error: Error) => {
      this.handleError(error, {
        service: 'system',
        operation: 'uncaughtException',
      });

      // Graceful shutdown
      monitoring.log('fatal', 'system', 'Uncaught exception', {
        error: error.message,
        stack: error.stack,
      });
      process.exit(1);
    });

    // Unhandled promise rejections
    process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
      const error = reason instanceof Error ? reason : new Error(String(reason));
      this.handleError(error, {
        service: 'system',
        operation: 'unhandledRejection',
        metadata: { promise: promise.toString() },
      });
    });

    // Warning handler
    process.on('warning', (warning: Error) => {
      this.handleError(warning, {
        service: 'system',
        operation: 'warning',
      });
    });
  }

  /**
   * Handle an error with context
   */
  handleError(error: Error, context: ErrorContext): ErrorReport {
    const errorId = this.generateErrorId(error, context);
    const existingReport = this.errorReports.get(errorId);

    if (existingReport) {
      // Update existing error report
      existingReport.occurrences++;
      existingReport.lastOccurrence = Date.now();
      return existingReport;
    }

    // Create new error report
    const report: ErrorReport = {
      id: errorId,
      error,
      context,
      timestamp: Date.now(),
      stack: error.stack || '',
      resolved: false,
      occurrences: 1,
      lastOccurrence: Date.now(),
    };

    this.errorReports.set(errorId, report);

    // Log to monitoring
    monitoring.log('error', context.service, error.message, {
      ...context.metadata,
      errorId,
      stack: error.stack,
      operation: context.operation,
    });

    // Create alert for critical errors
    if (this.isCriticalError(error, context)) {
      monitoring.createAlert(
        'critical',
        'critical',
        `Critical Error: ${context.service}`,
        error.message,
        context.service,
        { errorId, context, stack: error.stack },
      );
    }

    return report;
  }

  /**
   * Generate unique error ID based on error and context
   */
  private generateErrorId(error: Error, context: ErrorContext): string {
    const key = `${context.service}:${context.operation || 'unknown'}:${error.name}:${error.message}`;
    return Buffer.from(key)
      .toString('base64')
      .replace(/[^a-zA-Z0-9]/g, '')
      .substring(0, 16);
  }

  /**
   * Determine if error is critical
   */
  private isCriticalError(error: Error, context: ErrorContext): boolean {
    const criticalServices = ['database', 'auth', 'payment'];
    const criticalOperations = ['startup', 'shutdown', 'security'];

    return (
      criticalServices.includes(context.service) ||
      criticalOperations.includes(context.operation || '') ||
      error.name === 'TypeError' ||
      error.message.includes('ECONNREFUSED') ||
      error.message.includes('ENOTFOUND')
    );
  }

  /**
   * Create circuit breaker for operation
   */
  createCircuitBreaker(
    name: string,
    operation: () => Promise<any>,
    config: Partial<CircuitBreakerConfig> = {},
  ): CircuitBreaker {
    const defaultConfig: CircuitBreakerConfig = {
      failureThreshold: 5,
      resetTimeout: 60000, // 1 minute
      monitoringPeriod: 30000, // 30 seconds
      expectedRecoveryTime: 30000, // 30 seconds
    };

    const circuitBreaker = new CircuitBreaker(name, { ...defaultConfig, ...config }, operation);
    this.circuitBreakers.set(name, circuitBreaker);

    monitoring.log('info', 'circuit-breaker', `Created circuit breaker: ${name}`, { config });

    return circuitBreaker;
  }

  /**
   * Get circuit breaker
   */
  getCircuitBreaker(name: string): CircuitBreaker | undefined {
    return this.circuitBreakers.get(name);
  }

  /**
   * Execute operation with circuit breaker and retry
   */
  async executeWithResilience<T>(
    name: string,
    operation: () => Promise<T>,
    context: ErrorContext,
    circuitBreakerConfig?: Partial<CircuitBreakerConfig>,
    maxRetries: number = 3,
  ): Promise<T> {
    const circuitBreaker =
      this.circuitBreakers.get(name) ||
      this.createCircuitBreaker(name, operation, circuitBreakerConfig);

    return await RetryManager.withRetry(() => circuitBreaker.execute(), maxRetries, 1000, context);
  }

  /**
   * Graceful error recovery
   */
  async attemptRecovery(errorReport: ErrorReport): Promise<boolean> {
    const { context, error } = errorReport;

    monitoring.log('info', 'recovery', `Attempting recovery for error in ${context.service}`, {
      errorId: errorReport.id,
      operation: context.operation,
    });

    try {
      // Service-specific recovery strategies
      switch (context.service) {
        case 'database':
          return await this.recoverDatabaseConnection(error);

        case 'external-api':
          return await this.recoverExternalService(error);

        default:
          return await this.genericRecovery(error);
      }
    } catch (recoveryError) {
      monitoring.log('error', 'recovery', `Recovery failed for error in ${context.service}`, {
        errorId: errorReport.id,
        recoveryError:
          recoveryError instanceof Error ? recoveryError.message : String(recoveryError),
      });
      return false;
    }
  }

  /**
   * Database connection recovery
   */
  private async recoverDatabaseConnection(error: Error): Promise<boolean> {
    // Implementation would depend on database type
    monitoring.log('info', 'recovery', 'Attempting database connection recovery');

    // Simulate recovery attempt
    await new Promise((resolve) => setTimeout(resolve, 2000));

    return Math.random() > 0.3; // 70% success rate for demo
  }

  /**
   * External service recovery
   */
  private async recoverExternalService(error: Error): Promise<boolean> {
    monitoring.log('info', 'recovery', 'Attempting external service recovery');

    // Implement service-specific recovery logic
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return Math.random() > 0.2; // 80% success rate for demo
  }

  /**
   * Generic recovery strategy
   */
  private async genericRecovery(error: Error): Promise<boolean> {
    monitoring.log('info', 'recovery', 'Attempting generic recovery');

    // Generic recovery attempts
    await new Promise((resolve) => setTimeout(resolve, 500));

    return true; // Always succeed for generic recovery
  }

  /**
   * Resolve error report
   */
  resolveError(errorId: string): void {
    const report = this.errorReports.get(errorId);
    if (report) {
      report.resolved = true;
      monitoring.log('info', 'error-handler', `Error resolved: ${errorId}`, { errorId });
    }
  }

  /**
   * Get error reports
   */
  getErrorReports(
    filter: {
      service?: string;
      resolved?: boolean;
      limit?: number;
    } = {},
  ): ErrorReport[] {
    let reports = Array.from(this.errorReports.values());

    if (filter.service) {
      reports = reports.filter((report) => report.context.service === filter.service);
    }

    if (filter.resolved !== undefined) {
      reports = reports.filter((report) => report.resolved === filter.resolved);
    }

    if (filter.limit) {
      reports = reports.slice(0, filter.limit);
    }

    return reports.sort((a, b) => b.lastOccurrence - a.lastOccurrence);
  }

  /**
   * Get circuit breaker status
   */
  getCircuitBreakersStatus(): Array<{
    name: string;
    state: CircuitBreakerState;
    failures: number;
  }> {
    return Array.from(this.circuitBreakers.entries()).map(([name, breaker]) => ({
      name,
      state: breaker.getState(),
      failures: breaker.getFailures(),
    }));
  }

  /**
   * Cleanup old error reports
   */
  cleanupOldReports(maxAge: number = 7 * 24 * 60 * 60 * 1000): void {
    // 7 days
    const cutoff = Date.now() - maxAge;

    for (const [id, report] of this.errorReports.entries()) {
      if (report.lastOccurrence < cutoff && report.resolved) {
        this.errorReports.delete(id);
      }
    }

    monitoring.log('info', 'error-handler', `Cleaned up old error reports`, {
      totalReports: this.errorReports.size,
      cutoff,
    });
  }
}

// Express error handling middleware
export function expressErrorHandler(err: Error, req: any, res: any, next: any): void {
  const errorHandler = ErrorHandlerService.getInstance();

  const context: ErrorContext = {
    userId: req.user?.id,
    requestId: req.id,
    service: 'express',
    operation: `${req.method} ${req.path}`,
    metadata: {
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      body: req.body,
      params: req.params,
      query: req.query,
    },
  };

  const report = errorHandler.handleError(err, context);

  // Don't send error details in production
  const isDevelopment = process.env.NODE_ENV !== 'production';

  res.status(500).json({
    error: {
      message: isDevelopment ? err.message : 'Internal Server Error',
      id: report.id,
      timestamp: report.timestamp,
    },
  });
}

// Async error wrapper
export function asyncErrorHandler(context: ErrorContext) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      try {
        return await method.apply(this, args);
      } catch (error) {
        const errorHandler = ErrorHandlerService.getInstance();
        errorHandler.handleError(error as Error, {
          ...context,
          operation: context.operation || propertyName,
        });
        throw error;
      }
    };

    return descriptor;
  };
}

export const errorHandler = ErrorHandlerService.getInstance();
