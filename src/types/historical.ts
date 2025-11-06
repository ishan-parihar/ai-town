// Types for historical objects

export interface FieldConfig {
  [key: string]: any;
}

export interface HistorySample {
  time: number;
  value: number;
}

export interface History {
  initialValue: number;
  samples: HistorySample[];
}

export function unpackSampleRecord(fields: FieldConfig, buffer: ArrayBuffer): Record<string, History> {
  // Simplified implementation for now
  return {};
}