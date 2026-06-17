import type { InstrumentPackStatus, CleaningStatus, SterilizationStatus, ExceptionType, ExceptionStatus } from '@/types';
import {
  INSTRUMENT_STATUS_LABELS,
  INSTRUMENT_STATUS_COLORS,
  CLEANING_STATUS_LABELS,
  CLEANING_STATUS_COLORS,
  STERILIZATION_STATUS_LABELS,
  STERILIZATION_STATUS_COLORS,
  EXCEPTION_TYPE_LABELS,
  EXCEPTION_TYPE_COLORS,
  EXCEPTION_STATUS_LABELS,
  EXCEPTION_STATUS_COLORS,
} from '@/constants';

type StatusType = 'instrument' | 'cleaning' | 'sterilization' | 'exception-type' | 'exception-status';

interface StatusBadgeProps {
  type: StatusType;
  status: string;
}

const StatusBadge = ({ type, status }: StatusBadgeProps) => {
  let label = '';
  let colorClass = '';

  switch (type) {
    case 'instrument':
      label = INSTRUMENT_STATUS_LABELS[status as InstrumentPackStatus] || status;
      colorClass = INSTRUMENT_STATUS_COLORS[status as InstrumentPackStatus] || 'bg-gray-100 text-gray-600';
      break;
    case 'cleaning':
      label = CLEANING_STATUS_LABELS[status as CleaningStatus] || status;
      colorClass = CLEANING_STATUS_COLORS[status as CleaningStatus] || 'bg-gray-100 text-gray-600';
      break;
    case 'sterilization':
      label = STERILIZATION_STATUS_LABELS[status as SterilizationStatus] || status;
      colorClass = STERILIZATION_STATUS_COLORS[status as SterilizationStatus] || 'bg-gray-100 text-gray-600';
      break;
    case 'exception-type':
      label = EXCEPTION_TYPE_LABELS[status as ExceptionType] || status;
      colorClass = EXCEPTION_TYPE_COLORS[status as ExceptionType] || 'bg-gray-100 text-gray-600';
      break;
    case 'exception-status':
      label = EXCEPTION_STATUS_LABELS[status as ExceptionStatus] || status;
      colorClass = EXCEPTION_STATUS_COLORS[status as ExceptionStatus] || 'bg-gray-100 text-gray-600';
      break;
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
      {label}
    </span>
  );
};

export default StatusBadge;
