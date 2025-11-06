import { useMutation } from './useApi';

// Define input types locally since we're removing Convex dependencies
export interface InputArgs<Name> {
  [key: string]: any;
}

export interface InputReturnValue<Name> {
  success: boolean;
  data?: any;
  error?: string;
}

export interface Inputs {
  // Define your input types here
  [key: string]: any;
}

export async function waitForInput(inputId: string): Promise<any> {
  // Poll for input completion via our API
  const maxAttempts = 30; // 30 seconds timeout
  const delay = 1000; // 1 second
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const response = await fetch(`/api/inputs/${inputId}/status`);
      const result = await response.json();
      
      if (result.status === 'completed') {
        if (result.kind === 'error') {
          throw new Error(result.message);
        }
        return result.value;
      }
      
      if (result.status === 'failed') {
        throw new Error(`Input ${inputId} failed to process.`);
      }
      
      // Still processing, wait and try again
      await new Promise(resolve => setTimeout(resolve, delay));
    } catch (error) {
      if (attempt === maxAttempts - 1) {
        throw new Error(`Input ${inputId} was never processed.`);
      }
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error(`Input ${inputId} timed out.`);
}

export function useSendInput<Name extends keyof Inputs>(
  engineId: string,
  name: Name,
): (args: InputArgs<Name>) => Promise<InputReturnValue<Name>> {
  const { mutate } = useMutation();
  
  return async (args) => {
    try {
      // Send input via our API
      const inputId = await mutate('world/sendWorldInput', { engineId, name, args });
      
      // Wait for the input to be processed
      const result = await waitForInput(inputId as string);
      
      return {
        success: true,
        data: result
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  };
}