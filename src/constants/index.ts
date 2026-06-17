import type { InstrumentPackStatus, CleaningStatus, SterilizationStatus, ExceptionType, ExceptionStatus } from '@/types';

export const INSTRUMENT_STATUS_LABELS: Record<InstrumentPackStatus, string> = {
  in_use: '使用中',
  cleaning: '清洗中',
  sterilizing: '灭菌中',
  sterilized: '已灭菌',
  expired: '已过期',
  exception: '异常',
  borrowed: '已借出',
};

export const INSTRUMENT_STATUS_COLORS: Record<InstrumentPackStatus, string> = {
  in_use: 'bg-blue-100 text-blue-700',
  cleaning: 'bg-yellow-100 text-yellow-700',
  sterilizing: 'bg-purple-100 text-purple-700',
  sterilized: 'bg-success-50 text-success-600',
  expired: 'bg-gray-100 text-gray-600',
  exception: 'bg-danger-50 text-danger-600',
  borrowed: 'bg-orange-100 text-orange-700',
};

export const CLEANING_STATUS_LABELS: Record<CleaningStatus, string> = {
  pending: '待清洗',
  cleaning: '清洗中',
  completed: '已完成',
  failed: '不合格',
};

export const CLEANING_STATUS_COLORS: Record<CleaningStatus, string> = {
  pending: 'bg-gray-100 text-gray-600',
  cleaning: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-success-50 text-success-600',
  failed: 'bg-danger-50 text-danger-600',
};

export const STERILIZATION_STATUS_LABELS: Record<SterilizationStatus, string> = {
  pending: '待灭菌',
  sterilizing: '灭菌中',
  completed: '已完成',
  released: '已放行',
  failed: '不合格',
};

export const STERILIZATION_STATUS_COLORS: Record<SterilizationStatus, string> = {
  pending: 'bg-gray-100 text-gray-600',
  sterilizing: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-blue-100 text-blue-700',
  released: 'bg-success-50 text-success-600',
  failed: 'bg-danger-50 text-danger-600',
};

export const EXCEPTION_TYPE_LABELS: Record<ExceptionType, string> = {
  missing: '缺件',
  damaged: '破损',
  unqualified: '不合格',
  other: '其他',
};

export const EXCEPTION_TYPE_COLORS: Record<ExceptionType, string> = {
  missing: 'bg-warning-50 text-warning-600',
  damaged: 'bg-danger-50 text-danger-600',
  unqualified: 'bg-red-100 text-red-700',
  other: 'bg-gray-100 text-gray-600',
};

export const EXCEPTION_STATUS_LABELS: Record<ExceptionStatus, string> = {
  pending: '待处理',
  handling: '处理中',
  resolved: '已解决',
};

export const EXCEPTION_STATUS_COLORS: Record<ExceptionStatus, string> = {
  pending: 'bg-warning-50 text-warning-600',
  handling: 'bg-blue-100 text-blue-700',
  resolved: 'bg-success-50 text-success-600',
};

export const CLEANING_STEPS = [
  { id: 'initial-wash', name: '初洗' },
  { id: 'enzyme-wash', name: '酶洗' },
  { id: 'rinse', name: '漂洗' },
  { id: 'final-rinse', name: '终末漂洗' },
  { id: 'disinfection', name: '消毒' },
  { id: 'drying', name: '干燥' },
];

export const INSTRUMENT_TYPES = [
  '基础检查包',
  '拔牙包',
  '种植包',
  '修复包',
  '正畸包',
  '根管治疗包',
  '牙周治疗包',
  '外科手术包',
];

export const CHAIRS = ['1号椅位', '2号椅位', '3号椅位', '4号椅位', '5号椅位', '6号椅位'];

export const STAFF = ['张护士长', '李护士', '王护士', '赵护士', '陈医生', '刘医生'];

export const STERILIZATION_DURATION = 180;
export const STERILIZATION_TEMPERATURE = 134;
export const STERILIZATION_PRESSURE = 210;

export const STERILE_VALID_DAYS = 7;
export const EXPIRING_WARNING_DAYS = 3;
