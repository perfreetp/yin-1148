import { create } from 'zustand';
import type {
  InstrumentPack,
  CleaningRecord,
  SterilizationBatch,
  ExceptionRecord,
  UsageRecord,
  BorrowRecord,
  InstrumentPackStatus,
  CleaningStep,
} from '@/types';
import {
  mockInstrumentPacks,
  mockCleaningRecords,
  mockSterilizationBatches,
  mockExceptionRecords,
  mockUsageRecords,
  mockBorrowRecords,
} from '@/data/mockData';
import { loadFromStorage, saveToStorage } from '@/utils/storageUtils';
import { generateId, generateBarcode, generateBatchNo, addDays } from '@/utils/dateUtils';
import { STERILE_VALID_DAYS, CLEANING_STEPS } from '@/constants';

interface AppState {
  instrumentPacks: InstrumentPack[];
  cleaningRecords: CleaningRecord[];
  sterilizationBatches: SterilizationBatch[];
  exceptionRecords: ExceptionRecord[];
  usageRecords: UsageRecord[];
  borrowRecords: BorrowRecord[];

  initData: () => void;

  addInstrumentPack: (pack: Omit<InstrumentPack, 'id' | 'barcode' | 'createdAt' | 'updatedAt'>) => void;
  updateInstrumentPack: (id: string, updates: Partial<InstrumentPack>) => void;
  deleteInstrumentPack: (id: string) => void;
  getInstrumentPackById: (id: string) => InstrumentPack | undefined;
  getInstrumentPacksByStatus: (status: InstrumentPackStatus) => InstrumentPack[];

  addCleaningRecord: (record: Omit<CleaningRecord, 'id' | 'steps' | 'params' | 'status'>) => void;
  updateCleaningStep: (recordId: string, stepId: string, completed: boolean) => void;
  updateCleaningParams: (recordId: string, params: Record<string, unknown>) => void;
  completeCleaning: (recordId: string) => void;

  createSterilizationBatch: (packIds: string[], operator1: string) => string;
  startSterilization: (batchId: string, operator1: string) => void;
  completeSterilization: (batchId: string) => void;
  releaseBatch: (batchId: string, operator2: string) => void;
  recallBatch: (batchId: string, operator: string) => void;
  reSterilizePack: (packId: string, operator: string) => void;

  addExceptionRecord: (record: Omit<ExceptionRecord, 'id' | 'reportedAt' | 'status'>) => void;
  handleException: (id: string, handler: string, handleResult: string) => void;

  addUsageRecord: (record: Omit<UsageRecord, 'id'>) => void;
  usePack: (packId: string, patientName: string, chairNumber: string, doctor: string, operator: string) => void;

  addBorrowRecord: (record: Omit<BorrowRecord, 'id'>) => void;
  returnBorrow: (recordId: string) => void;

  getStats: () => {
    total: number;
    inUse: number;
    cleaning: number;
    sterilizing: number;
    sterilized: number;
    expired: number;
    exception: number;
    borrowed: number;
  };
}

const STORAGE_KEY = 'dental-trace-app-data';

export const useAppStore = create<AppState>((set, get) => ({
  instrumentPacks: [],
  cleaningRecords: [],
  sterilizationBatches: [],
  exceptionRecords: [],
  usageRecords: [],
  borrowRecords: [],

  initData: () => {
    const stored = loadFromStorage<{
      instrumentPacks: InstrumentPack[];
      cleaningRecords: CleaningRecord[];
      sterilizationBatches: SterilizationBatch[];
      exceptionRecords: ExceptionRecord[];
      usageRecords: UsageRecord[];
      borrowRecords: BorrowRecord[];
    } | null>(STORAGE_KEY, null);

    if (stored) {
      set({
        instrumentPacks: stored.instrumentPacks,
        cleaningRecords: stored.cleaningRecords,
        sterilizationBatches: stored.sterilizationBatches,
        exceptionRecords: stored.exceptionRecords,
        usageRecords: stored.usageRecords,
        borrowRecords: stored.borrowRecords,
      });
    } else {
      set({
        instrumentPacks: mockInstrumentPacks,
        cleaningRecords: mockCleaningRecords,
        sterilizationBatches: mockSterilizationBatches,
        exceptionRecords: mockExceptionRecords,
        usageRecords: mockUsageRecords,
        borrowRecords: mockBorrowRecords,
      });
    }
  },

  addInstrumentPack: (pack) => {
    const newPack: InstrumentPack = {
      ...pack,
      id: generateId(),
      barcode: generateBarcode(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const newPacks = [...get().instrumentPacks, newPack];
    set({ instrumentPacks: newPacks });
    saveToStorage(STORAGE_KEY, { ...get(), instrumentPacks: newPacks });
  },

  updateInstrumentPack: (id, updates) => {
    const newPacks = get().instrumentPacks.map((pack) =>
      pack.id === id ? { ...pack, ...updates, updatedAt: new Date().toISOString() } : pack
    );
    set({ instrumentPacks: newPacks });
    saveToStorage(STORAGE_KEY, { ...get(), instrumentPacks: newPacks });
  },

  deleteInstrumentPack: (id) => {
    const newPacks = get().instrumentPacks.filter((pack) => pack.id !== id);
    set({ instrumentPacks: newPacks });
    saveToStorage(STORAGE_KEY, { ...get(), instrumentPacks: newPacks });
  },

  getInstrumentPackById: (id) => {
    return get().instrumentPacks.find((pack) => pack.id === id);
  },

  getInstrumentPacksByStatus: (status) => {
    return get().instrumentPacks.filter((pack) => pack.status === status);
  },

  addCleaningRecord: (record) => {
    const steps: CleaningStep[] = CLEANING_STEPS.map((step) => ({
      id: step.id,
      name: step.name,
      completed: false,
    }));

    const newRecord: CleaningRecord = {
      ...record,
      id: generateId(),
      steps,
      params: {},
      status: 'cleaning',
    };

    const newRecords = [...get().cleaningRecords, newRecord];
    set({ cleaningRecords: newRecords });
    saveToStorage(STORAGE_KEY, { ...get(), cleaningRecords: newRecords });

    get().updateInstrumentPack(record.packId, { status: 'cleaning' });
  },

  updateCleaningStep: (recordId, stepId, completed) => {
    const newRecords = get().cleaningRecords.map((record) => {
      if (record.id !== recordId) return record;
      const newSteps = record.steps.map((step) =>
        step.id === stepId
          ? { ...step, completed, completedAt: completed ? new Date().toISOString() : undefined }
          : step
      );
      return { ...record, steps: newSteps };
    });
    set({ cleaningRecords: newRecords });
    saveToStorage(STORAGE_KEY, { ...get(), cleaningRecords: newRecords });
  },

  updateCleaningParams: (recordId, params) => {
    const newRecords = get().cleaningRecords.map((record) =>
      record.id === recordId ? { ...record, params: { ...record.params, ...params } } : record
    );
    set({ cleaningRecords: newRecords });
    saveToStorage(STORAGE_KEY, { ...get(), cleaningRecords: newRecords });
  },

  completeCleaning: (recordId) => {
    const newRecords = get().cleaningRecords.map((record) =>
      record.id === recordId
        ? { ...record, status: 'completed' as const, completedAt: new Date().toISOString() }
        : record
    );
    set({ cleaningRecords: newRecords });
    saveToStorage(STORAGE_KEY, { ...get(), cleaningRecords: newRecords });

    const record = get().cleaningRecords.find((r) => r.id === recordId);
    if (record) {
      get().updateInstrumentPack(record.packId, { status: 'sterilizing' });
    }
  },

  createSterilizationBatch: (packIds, operator1) => {
    const batchId = generateId();
    const newBatch: SterilizationBatch = {
      id: batchId,
      batchNo: generateBatchNo(),
      temperature: 134,
      pressure: 210,
      duration: 180,
      status: 'pending',
      packIds,
      operator1,
    };

    const newBatches = [...get().sterilizationBatches, newBatch];
    set({ sterilizationBatches: newBatches });
    saveToStorage(STORAGE_KEY, { ...get(), sterilizationBatches: newBatches });

    packIds.forEach((packId) => {
      get().updateInstrumentPack(packId, { status: 'sterilizing', currentBatchId: batchId });
    });

    return batchId;
  },

  startSterilization: (batchId, operator1) => {
    const newBatches = get().sterilizationBatches.map((batch) =>
      batch.id === batchId
        ? {
            ...batch,
            status: 'sterilizing' as const,
            startedAt: new Date().toISOString(),
            operator1: batch.operator1 || operator1,
          }
        : batch
    );
    set({ sterilizationBatches: newBatches });
    saveToStorage(STORAGE_KEY, { ...get(), sterilizationBatches: newBatches });
  },

  completeSterilization: (batchId) => {
    const newBatches = get().sterilizationBatches.map((batch) =>
      batch.id === batchId
        ? { ...batch, status: 'completed' as const, endedAt: new Date().toISOString() }
        : batch
    );
    set({ sterilizationBatches: newBatches });
    saveToStorage(STORAGE_KEY, { ...get(), sterilizationBatches: newBatches });
  },

  releaseBatch: (batchId, operator2) => {
    const now = new Date();
    const newBatches = get().sterilizationBatches.map((batch) =>
      batch.id === batchId
        ? {
            ...batch,
            status: 'released' as const,
            operator2,
            releasedAt: now.toISOString(),
          }
        : batch
    );
    set({ sterilizationBatches: newBatches });
    saveToStorage(STORAGE_KEY, { ...get(), sterilizationBatches: newBatches });

    const batch = get().sterilizationBatches.find((b) => b.id === batchId);
    if (batch) {
      batch.packIds.forEach((packId) => {
        get().updateInstrumentPack(packId, {
          status: 'sterilized',
          sterilizedAt: now.toISOString(),
          expiresAt: addDays(now, STERILE_VALID_DAYS).toISOString(),
        });
      });
    }
  },

  recallBatch: (batchId, operator) => {
    const batch = get().sterilizationBatches.find((b) => b.id === batchId);
    if (!batch) return;

    const now = new Date().toISOString();
    const newExceptionRecords = [...get().exceptionRecords];

    batch.packIds.forEach((packId) => {
      newExceptionRecords.push({
        id: generateId(),
        packId,
        batchId,
        type: 'unqualified',
        description: `批次 ${batch.batchNo} 被召回，需重新处理`,
        reportedBy: operator,
        reportedAt: now,
        status: 'pending',
      });

      get().updateInstrumentPack(packId, { status: 'exception' });
    });

    set({ exceptionRecords: newExceptionRecords });
    saveToStorage(STORAGE_KEY, { ...get(), exceptionRecords: newExceptionRecords });
  },

  reSterilizePack: (packId, operator) => {
    get().updateInstrumentPack(packId, { status: 'sterilizing' });

    const newBatchId = get().createSterilizationBatch([packId], operator);
    get().startSterilization(newBatchId, operator);
  },

  addExceptionRecord: (record) => {
    const newRecord: ExceptionRecord = {
      ...record,
      id: generateId(),
      reportedAt: new Date().toISOString(),
      status: 'pending',
    };

    const newRecords = [...get().exceptionRecords, newRecord];
    set({ exceptionRecords: newRecords });
    saveToStorage(STORAGE_KEY, { ...get(), exceptionRecords: newRecords });

    if (record.packId) {
      get().updateInstrumentPack(record.packId, { status: 'exception' });
    }
  },

  handleException: (id, handler, handleResult) => {
    const newRecords = get().exceptionRecords.map((record) =>
      record.id === id
        ? {
            ...record,
            handler,
            handleResult,
            handledAt: new Date().toISOString(),
            status: 'resolved' as const,
          }
        : record
    );
    set({ exceptionRecords: newRecords });
    saveToStorage(STORAGE_KEY, { ...get(), exceptionRecords: newRecords });

    const record = get().exceptionRecords.find((r) => r.id === id);
    if (record?.packId) {
      get().updateInstrumentPack(record.packId, { status: 'cleaning' });
    }
  },

  addUsageRecord: (record) => {
    const newRecord: UsageRecord = {
      ...record,
      id: generateId(),
    };
    const newRecords = [...get().usageRecords, newRecord];
    set({ usageRecords: newRecords });
    saveToStorage(STORAGE_KEY, { ...get(), usageRecords: newRecords });
  },

  usePack: (packId, patientName, chairNumber, doctor, operator) => {
    const usageRecord: UsageRecord = {
      id: generateId(),
      packId,
      usedAt: new Date().toISOString(),
      patientName,
      chairNumber,
      doctor,
      operator,
    };

    const newRecords = [...get().usageRecords, usageRecord];
    set({ usageRecords: newRecords });
    saveToStorage(STORAGE_KEY, { ...get(), usageRecords: newRecords });

    get().updateInstrumentPack(packId, {
      status: 'in_use',
      sterilizedAt: undefined,
      expiresAt: undefined,
    });
  },

  addBorrowRecord: (record) => {
    const newRecord: BorrowRecord = {
      ...record,
      id: generateId(),
    };
    const newRecords = [...get().borrowRecords, newRecord];
    set({ borrowRecords: newRecords });
    saveToStorage(STORAGE_KEY, { ...get(), borrowRecords: newRecords });

    if (record.packId) {
      get().updateInstrumentPack(record.packId, { status: 'borrowed' });
    }
  },

  returnBorrow: (recordId) => {
    const newRecords = get().borrowRecords.map((record) =>
      record.id === recordId
        ? { ...record, returnedAt: new Date().toISOString() }
        : record
    );
    set({ borrowRecords: newRecords });
    saveToStorage(STORAGE_KEY, { ...get(), borrowRecords: newRecords });

    const record = get().borrowRecords.find((r) => r.id === recordId);
    if (record?.packId) {
      get().updateInstrumentPack(record.packId, { status: 'cleaning' });
    }
  },

  getStats: () => {
    const packs = get().instrumentPacks;
    return {
      total: packs.length,
      inUse: packs.filter((p) => p.status === 'in_use').length,
      cleaning: packs.filter((p) => p.status === 'cleaning').length,
      sterilizing: packs.filter((p) => p.status === 'sterilizing').length,
      sterilized: packs.filter((p) => p.status === 'sterilized').length,
      expired: packs.filter((p) => p.status === 'expired').length,
      exception: packs.filter((p) => p.status === 'exception').length,
      borrowed: packs.filter((p) => p.status === 'borrowed').length,
    };
  },
}));
