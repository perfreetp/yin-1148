export type InstrumentPackStatus =
  | 'in_use'
  | 'cleaning'
  | 'sterilizing'
  | 'sterilized'
  | 'expired'
  | 'exception'
  | 'borrowed';

export type CleaningStatus = 'pending' | 'cleaning' | 'completed' | 'failed';

export type SterilizationStatus =
  | 'pending'
  | 'sterilizing'
  | 'completed'
  | 'released'
  | 'failed';

export type ExceptionType = 'missing' | 'damaged' | 'unqualified' | 'other';

export type ExceptionStatus = 'pending' | 'handling' | 'resolved';

export interface InstrumentItem {
  id: string;
  name: string;
  quantity: number;
  specification?: string;
}

export interface InstrumentPack {
  id: string;
  name: string;
  code: string;
  barcode: string;
  type: string;
  items: InstrumentItem[];
  status: InstrumentPackStatus;
  sterilizedAt?: string;
  expiresAt?: string;
  currentBatchId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CleaningStep {
  id: string;
  name: string;
  completed: boolean;
  completedAt?: string;
}

export interface CleaningParams {
  temperature?: number;
  duration?: number;
  enzymeConcentration?: string;
  ph?: number;
}

export interface CleaningRecord {
  id: string;
  packId: string;
  recoveredAt: string;
  patientName?: string;
  chairNumber?: string;
  recoveredBy: string;
  steps: CleaningStep[];
  params: CleaningParams;
  status: CleaningStatus;
  completedAt?: string;
  notes?: string;
}

export interface SterilizationBatch {
  id: string;
  batchNo: string;
  startedAt?: string;
  endedAt?: string;
  temperature: number;
  pressure: number;
  duration: number;
  operator1?: string;
  operator2?: string;
  releasedAt?: string;
  status: SterilizationStatus;
  packIds: string[];
  notes?: string;
}

export interface UsageRecord {
  id: string;
  packId: string;
  usedAt: string;
  patientName?: string;
  chairNumber?: string;
  doctor?: string;
  operator: string;
}

export interface BorrowRecord {
  id: string;
  packId: string;
  borrower: string;
  purpose: string;
  borrowedAt: string;
  returnedAt?: string;
  operator: string;
}

export interface ExceptionRecord {
  id: string;
  packId?: string;
  batchId?: string;
  type: ExceptionType;
  description: string;
  reportedBy: string;
  reportedAt: string;
  handler?: string;
  handleResult?: string;
  handledAt?: string;
  status: ExceptionStatus;
}

export interface TraceEvent {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  operator?: string;
  details?: Record<string, unknown>;
}

export interface TraceChain {
  packId: string;
  packName: string;
  events: TraceEvent[];
}
