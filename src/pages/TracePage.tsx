import { useState } from 'react';
import {
  Search,
  Package,
  User,
  Armchair,
  Calendar,
  Clock,
  CheckCircle2,
  ArrowRight,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import StatusBadge from '@/components/StatusBadge';
import Modal from '@/components/Modal';
import { CHAIRS } from '@/constants';
import type { TraceEvent } from '@/types';
import { formatDateTime, formatDateTimeFull } from '@/utils/dateUtils';

type QueryType = 'pack' | 'patient' | 'chair' | 'date' | null;

const TracePage = () => {
  const { instrumentPacks, cleaningRecords, sterilizationBatches, usageRecords, exceptionRecords } = useAppStore();
  const [queryType, setQueryType] = useState<QueryType>(null);
  const [searchValue, setSearchValue] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedPackId, setSelectedPackId] = useState<string | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [traceEvents, setTraceEvents] = useState<TraceEvent[]>([]);

  const entryCards = [
    {
      type: 'pack' as const,
      icon: Package,
      title: '按器械包查询',
      description: '输入器械包编号或条码',
      color: 'primary',
    },
    {
      type: 'patient' as const,
      icon: User,
      title: '按患者查询',
      description: '输入患者姓名',
      color: 'success',
    },
    {
      type: 'chair' as const,
      icon: Armchair,
      title: '按椅位查询',
      description: '选择椅位号',
      color: 'warning',
    },
    {
      type: 'date' as const,
      icon: Calendar,
      title: '按日期查询',
      description: '选择日期范围',
      color: 'purple',
    },
  ];

  const colorClasses = {
    primary: 'bg-primary-50 text-primary-600 hover:border-primary-300',
    success: 'bg-success-50 text-success-600 hover:border-success-300',
    warning: 'bg-warning-50 text-warning-600 hover:border-warning-300',
    purple: 'bg-purple-50 text-purple-600 hover:border-purple-300',
  };

  const handleSelectEntry = (type: QueryType) => {
    setQueryType(type);
    setSearchValue('');
    setSearchResults([]);
  };

  const handleSearch = () => {
    if (!queryType || !searchValue) return;

    let results: any[] = [];

    switch (queryType) {
      case 'pack':
        results = instrumentPacks.filter(
          (pack) =>
            pack.name.toLowerCase().includes(searchValue.toLowerCase()) ||
            pack.code.toLowerCase().includes(searchValue.toLowerCase()) ||
            pack.barcode.toLowerCase().includes(searchValue.toLowerCase())
        );
        break;
      case 'patient':
        const usages = usageRecords.filter((u) =>
          u.patientName?.toLowerCase().includes(searchValue.toLowerCase())
        );
        const cleanings = cleaningRecords.filter((c) =>
          c.patientName?.toLowerCase().includes(searchValue.toLowerCase())
        );
        const packIds = new Set([
          ...usages.map((u) => u.packId),
          ...cleanings.map((c) => c.packId),
        ]);
        results = instrumentPacks.filter((p) => packIds.has(p.id));
        break;
      case 'chair':
        const chairUsages = usageRecords.filter((u) => u.chairNumber === searchValue);
        const chairCleanings = cleaningRecords.filter((c) => c.chairNumber === searchValue);
        const chairPackIds = new Set([
          ...chairUsages.map((u) => u.packId),
          ...chairCleanings.map((c) => c.packId),
        ]);
        results = instrumentPacks.filter((p) => chairPackIds.has(p.id));
        break;
      case 'date':
        results = instrumentPacks;
        break;
    }

    setSearchResults(results);
  };

  const buildTraceChain = (packId: string): TraceEvent[] => {
    const events: TraceEvent[] = [];
    const pack = instrumentPacks.find((p) => p.id === packId);
    if (!pack) return events;

    const packCleanings = cleaningRecords.filter((c) => c.packId === packId);
    const packUsages = usageRecords.filter((u) => u.packId === packId);
    const packExceptions = exceptionRecords.filter((e) => e.packId === packId);
    const packBatches = sterilizationBatches.filter((b) => b.packIds.includes(packId));

    packUsages.forEach((usage) => {
      events.push({
        id: `usage-${usage.id}`,
        type: 'usage',
        title: '开包使用',
        description: `${usage.patientName || '未登记患者'} · ${usage.chairNumber || '未登记椅位'}`,
        timestamp: usage.usedAt,
        operator: usage.operator,
        details: {
          doctor: usage.doctor,
        },
      });
    });

    packCleanings.forEach((cleaning) => {
      events.push({
        id: `cleaning-${cleaning.id}`,
        type: 'cleaning',
        title: '回收清洗',
        description: `${cleaning.steps.filter((s) => s.completed).length}/${cleaning.steps.length} 步完成`,
        timestamp: cleaning.recoveredAt,
        operator: cleaning.recoveredBy,
        details: {
          patientName: cleaning.patientName,
          chairNumber: cleaning.chairNumber,
          status: cleaning.status,
        },
      });
    });

    packBatches.forEach((batch) => {
      events.push({
        id: `sterilization-${batch.id}`,
        type: 'sterilization',
        title: '灭菌处理',
        description: `批次 ${batch.batchNo} · ${batch.temperature}°C · ${batch.duration}s`,
        timestamp: batch.startedAt || batch.releasedAt || new Date().toISOString(),
        operator: batch.operator1 || '',
        details: {
          batchNo: batch.batchNo,
          temperature: batch.temperature,
          pressure: batch.pressure,
          duration: batch.duration,
          status: batch.status,
          operator2: batch.operator2,
        },
      });
    });

    packExceptions.forEach((exception) => {
      events.push({
        id: `exception-${exception.id}`,
        type: 'exception',
        title: '异常记录',
        description: exception.description,
        timestamp: exception.reportedAt,
        operator: exception.reportedBy,
        details: {
          type: exception.type,
          status: exception.status,
          handler: exception.handler,
          handleResult: exception.handleResult,
        },
      });
    });

    events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return events;
  };

  const viewTraceDetail = (packId: string) => {
    setSelectedPackId(packId);
    setTraceEvents(buildTraceChain(packId));
    setDetailModalOpen(true);
  };

  const selectedPack = selectedPackId ? instrumentPacks.find((p) => p.id === selectedPackId) : null;

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'usage':
        return <User size={16} />;
      case 'cleaning':
        return <Package size={16} />;
      case 'sterilization':
        return <CheckCircle2 size={16} />;
      case 'exception':
        return <Clock size={16} />;
      default:
        return <Clock size={16} />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'usage':
        return 'bg-blue-500';
      case 'cleaning':
        return 'bg-primary-500';
      case 'sterilization':
        return 'bg-success-500';
      case 'exception':
        return 'bg-danger-500';
      default:
        return 'bg-gray-500';
    }
  };

  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">追溯查询</h1>
        <p className="text-gray-500 mt-1">从四个入口快速查清器械去向与责任环节</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {entryCards.map((card) => {
          const Icon = card.icon;
          const isActive = queryType === card.type;
          return (
            <button
              key={card.type}
              onClick={() => handleSelectEntry(isActive ? null : card.type)}
              className={`p-5 rounded-xl border-2 transition-all text-left ${
                isActive
                  ? `border-${card.color}-500 ${colorClasses[card.color]}`
                  : 'border-gray-100 bg-white hover:border-gray-200'
              }`}
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${
                  isActive ? colorClasses[card.color] : 'bg-gray-100 text-gray-500'
                }`}
              >
                <Icon size={24} />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{card.title}</h3>
              <p className="text-sm text-gray-500">{card.description}</p>
            </button>
          );
        })}
      </div>

      {queryType && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              {queryType === 'chair' ? (
                <select
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white text-lg"
                >
                  <option value="">请选择椅位</option>
                  {CHAIRS.map((chair) => (
                    <option key={chair} value={chair}>
                      {chair}
                    </option>
                  ))}
                </select>
              ) : queryType === 'date' ? (
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    className="flex-1 pl-4 pr-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-lg"
                  />
                </div>
              ) : (
                <input
                  type="text"
                  placeholder={
                    queryType === 'pack'
                      ? '请输入器械包名称、编号或条码...'
                      : '请输入患者姓名...'
                  }
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-lg"
                />
              )}
            </div>
            <button
              onClick={handleSearch}
              className="px-8 py-3.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors font-medium text-lg flex items-center gap-2"
            >
              <Search size={20} />
              查询
            </button>
          </div>
        </div>
      )}

      {searchResults.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center justify-between">
              <p className="font-medium text-gray-900">
                查询结果
                <span className="text-gray-500 font-normal ml-2">
                  共 {searchResults.length} 条记录
                </span>
              </p>
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {searchResults.map((pack) => (
              <div
                key={pack.id}
                className="px-5 py-4 hover:bg-gray-50 transition-colors cursor-pointer flex items-center gap-4"
                onClick={() => viewTraceDetail(pack.id)}
              >
                <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center">
                  <Package size={24} className="text-primary-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <p className="font-semibold text-gray-900">{pack.name}</p>
                    <StatusBadge type="instrument" status={pack.status} />
                  </div>
                  <p className="text-sm text-gray-500">
                    {pack.code} · {pack.type} · 条码: {pack.barcode}
                  </p>
                </div>
                <div className="text-right">
                  {pack.sterilizedAt && (
                    <p className="text-sm text-gray-500">
                      灭菌: {formatDateTime(pack.sterilizedAt)}
                    </p>
                  )}
                  {pack.expiresAt && (
                    <p
                      className={`text-sm font-medium ${
                        new Date(pack.expiresAt) < new Date()
                          ? 'text-danger-600'
                          : 'text-success-600'
                      }`}
                    >
                      有效期: {formatDateTime(pack.expiresAt)}
                    </p>
                  )}
                </div>
                <ArrowRight size={20} className="text-gray-400" />
              </div>
            ))}
          </div>
        </div>
      )}

      {queryType && searchResults.length === 0 && searchValue && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 py-12 text-center">
          <Search size={48} className="mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500">未找到相关记录</p>
        </div>
      )}

      {!queryType && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 py-16 text-center">
          <Search size={64} className="mx-auto mb-4 text-gray-200" />
          <p className="text-gray-500 text-lg">请选择上方查询入口开始追溯</p>
          <p className="text-gray-400 text-sm mt-2">
            支持按器械包、患者、椅位、日期四个维度查询
          </p>
        </div>
      )}

      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title="追溯详情"
        size="lg"
      >
        {selectedPack && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
              <div className="w-14 h-14 bg-primary-50 rounded-xl flex items-center justify-center">
                <Package size={28} className="text-primary-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900">{selectedPack.name}</h3>
                <p className="text-gray-500">
                  {selectedPack.code} · {selectedPack.type}
                </p>
              </div>
              <StatusBadge type="instrument" status={selectedPack.status} />
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-4">追溯链路</h4>
              <div className="relative">
                {traceEvents.length > 0 ? (
                  <div className="space-y-1">
                    {traceEvents.map((event, index) => {
                      const isExpanded = expandedEvent === event.id;
                      const isLast = index === traceEvents.length - 1;

                      return (
                        <div key={event.id} className="relative">
                          {!isLast && (
                            <div className="absolute left-5 top-12 bottom-0 w-0.5 bg-gray-200" />
                          )}
                          <div
                            className={`relative flex gap-4 p-4 rounded-xl cursor-pointer transition-colors ${
                              isExpanded ? 'bg-gray-50' : 'hover:bg-gray-50'
                            }`}
                            onClick={() =>
                              setExpandedEvent(isExpanded ? null : event.id)
                            }
                          >
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center text-white flex-shrink-0 z-10 ${getEventColor(
                                event.type
                              )}`}
                            >
                              {getEventIcon(event.type)}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="font-medium text-gray-900">{event.title}</p>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-gray-500">
                                    {formatDateTimeFull(event.timestamp)}
                                  </span>
                                  {isExpanded ? (
                                    <ChevronUp size={16} className="text-gray-400" />
                                  ) : (
                                    <ChevronDown size={16} className="text-gray-400" />
                                  )}
                                </div>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                              {event.operator && (
                                <p className="text-xs text-gray-400 mt-1">
                                  操作人: {event.operator}
                                </p>
                              )}

                              {isExpanded && event.details && (
                                <div className="mt-3 p-3 bg-white rounded-lg border border-gray-100">
                                  <div className="grid grid-cols-2 gap-3 text-sm">
                                    {Object.entries(event.details).map(([key, value]) => (
                                      <div key={key}>
                                        <span className="text-gray-500">
                                          {key === 'batchNo'
                                            ? '批次号'
                                            : key === 'temperature'
                                            ? '温度'
                                            : key === 'pressure'
                                            ? '压力'
                                            : key === 'duration'
                                            ? '时长'
                                            : key === 'status'
                                            ? '状态'
                                            : key === 'doctor'
                                            ? '医生'
                                            : key === 'patientName'
                                            ? '患者'
                                            : key === 'chairNumber'
                                            ? '椅位'
                                            : key === 'type'
                                            ? '类型'
                                            : key === 'handler'
                                            ? '处理人'
                                            : key === 'handleResult'
                                            ? '处理结果'
                                            : key === 'operator2'
                                            ? '操作人2'
                                            : key}
                                          :
                                        </span>
                                        <span className="text-gray-700 ml-2">
                                          {String(value || '-')}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-8 text-center text-gray-400">
                    <Clock size={32} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">暂无追溯记录</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TracePage;
