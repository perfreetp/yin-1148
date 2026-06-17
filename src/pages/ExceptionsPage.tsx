import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Plus, AlertCircle, CheckCircle2, Clock, User, Package, Search, ArrowRight, ExternalLink } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import StatusBadge from '@/components/StatusBadge';
import Modal from '@/components/Modal';
import { STAFF } from '@/constants';
import type { ExceptionType } from '@/types';
import { formatDateTime } from '@/utils/dateUtils';

const getStatusText = (status: string): string => {
  const map: Record<string, string> = {
    in_use: '使用中',
    cleaning: '清洗中',
    sterilizing: '灭菌中',
    sterilized: '无菌库存',
    expired: '已过期',
    exception: '异常待处理',
    borrowed: '已借出',
  };
  return map[status] || status;
};

const ExceptionsPage = () => {
  const navigate = useNavigate();
  const {
    exceptionRecords,
    instrumentPacks,
    sterilizationBatches,
    addExceptionRecord,
    handleException,
    recallBatch,
    reSterilizePack,
  } = useAppStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHandleModalOpen, setIsHandleModalOpen] = useState(false);
  const [selectedExceptionId, setSelectedExceptionId] = useState<string | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [isRecallModalOpen, setIsRecallModalOpen] = useState(false);
  const [isReSterilizeModalOpen, setIsReSterilizeModalOpen] = useState(false);
  const [reSterilizePackId, setReSterilizePackId] = useState<string | null>(null);
  const [recallOperator, setRecallOperator] = useState(STAFF[0]);
  const [reSterilizeOperator, setReSterilizeOperator] = useState(STAFF[0]);

  const [formData, setFormData] = useState({
    packId: '',
    batchId: '',
    type: 'missing' as ExceptionType,
    description: '',
    reportedBy: STAFF[0],
  });

  const [handleData, setHandleData] = useState({
    handler: STAFF[0],
    handleResult: '',
  });

  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const handleSubmit = () => {
    if (!formData.description) return;
    addExceptionRecord({
      packId: formData.packId || undefined,
      batchId: formData.batchId || undefined,
      type: formData.type,
      description: formData.description,
      reportedBy: formData.reportedBy,
    });
    setIsModalOpen(false);
    setFormData({
      packId: '',
      batchId: '',
      type: 'missing',
      description: '',
      reportedBy: STAFF[0],
    });
  };

  const handleResolve = () => {
    if (!selectedExceptionId || !handleData.handleResult) return;
    handleException(selectedExceptionId, handleData.handler, handleData.handleResult);
    setIsHandleModalOpen(false);
    setSelectedExceptionId(null);
    setHandleData({
      handler: STAFF[0],
      handleResult: '',
    });
  };

  const openHandleModal = (id: string) => {
    setSelectedExceptionId(id);
    setIsHandleModalOpen(true);
  };

  const handleRecallBatch = () => {
    if (!selectedExceptionId || !recallOperator) return;
    const exception = exceptionRecords.find((e) => e.id === selectedExceptionId);
    if (exception?.batchId) {
      recallBatch(exception.batchId, recallOperator);
    }
    setIsRecallModalOpen(false);
  };

  const handleReSterilize = () => {
    if (!reSterilizePackId || !reSterilizeOperator) return;
    reSterilizePack(reSterilizePackId, reSterilizeOperator);
    setIsReSterilizeModalOpen(false);
    setReSterilizePackId(null);
  };

  const openRecallModal = () => {
    setRecallOperator(STAFF[0]);
    setIsRecallModalOpen(true);
  };

  const openReSterilizeModal = (packId: string) => {
    setReSterilizePackId(packId);
    setReSterilizeOperator(STAFF[0]);
    setIsReSterilizeModalOpen(true);
  };

  const viewDetail = (id: string) => {
    setSelectedExceptionId(id);
    setDetailModalOpen(true);
  };

  const getPackById = (packId: string) => {
    return instrumentPacks.find((p) => p.id === packId);
  };

  const getBatchById = (batchId: string) => {
    return sterilizationBatches.find((b) => b.id === batchId);
  };

  const selectedException = selectedExceptionId ? exceptionRecords.find((e) => e.id === selectedExceptionId) : null;

  const filteredRecords = exceptionRecords.filter((record) => {
    const matchesType = filterType === 'all' || record.type === filterType;
    const matchesStatus = filterStatus === 'all' || record.status === filterStatus;
    return matchesType && matchesStatus;
  });

  const pendingCount = exceptionRecords.filter((e) => e.status === 'pending').length;
  const resolvedCount = exceptionRecords.filter((e) => e.status === 'resolved').length;

  const exceptionTypeOptions = [
    { value: 'missing', label: '缺件' },
    { value: 'damaged', label: '破损' },
    { value: 'unqualified', label: '不合格' },
    { value: 'other', label: '其他' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">异常处理</h1>
          <p className="text-gray-500 mt-1">记录和处理器械包异常情况</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-danger-600 text-white rounded-xl hover:bg-danger-700 transition-colors shadow-sm"
        >
          <Plus size={20} />
          <span>上报异常</span>
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-danger-50 rounded-xl flex items-center justify-center">
              <AlertTriangle size={24} className="text-danger-600" />
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900">{exceptionRecords.length}</p>
              <p className="text-sm text-gray-500">异常总数</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-warning-50 rounded-xl flex items-center justify-center">
              <Clock size={24} className="text-warning-600" />
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900">{pendingCount}</p>
              <p className="text-sm text-gray-500">待处理</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-success-50 rounded-xl flex items-center justify-center">
              <CheckCircle2 size={24} className="text-success-600" />
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900">{resolvedCount}</p>
              <p className="text-sm text-gray-500">已解决</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="搜索异常描述..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
            >
              <option value="all">全部类型</option>
              {exceptionTypeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
            >
              <option value="all">全部状态</option>
              <option value="pending">待处理</option>
              <option value="handling">处理中</option>
              <option value="resolved">已解决</option>
            </select>
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {filteredRecords.map((record) => {
            const pack = record.packId ? getPackById(record.packId) : null;
            const batch = record.batchId ? getBatchById(record.batchId) : null;

            return (
              <div
                key={record.id}
                className="p-5 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => viewDetail(record.id)}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      record.status === 'resolved' ? 'bg-success-100' : 'bg-warning-100'
                    }`}
                  >
                    {record.status === 'resolved' ? (
                      <CheckCircle2 size={20} className="text-success-600" />
                    ) : (
                      <AlertTriangle size={20} className="text-warning-600" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <StatusBadge type="exception-type" status={record.type} />
                      <StatusBadge type="exception-status" status={record.status} />
                    </div>

                    <p className="text-gray-900 font-medium mb-2">{record.description}</p>

                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      {pack && (
                        <span className="flex items-center gap-1">
                          <Package size={14} />
                          {pack.name}
                        </span>
                      )}
                      {batch && (
                        <span className="flex items-center gap-1">
                          <AlertCircle size={14} />
                          批次: {batch.batchNo}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <User size={14} />
                        上报人: {record.reportedBy}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {formatDateTime(record.reportedAt)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {record.status === 'pending' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openHandleModal(record.id);
                        }}
                        className="px-3 py-1.5 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 transition-colors"
                      >
                        处理
                      </button>
                    )}
                    <ArrowRight size={16} className="text-gray-400" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredRecords.length === 0 && (
          <div className="py-12 text-center text-gray-500">
            <AlertTriangle size={48} className="mx-auto mb-3 text-gray-300" />
            <p>暂无异常记录</p>
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="上报异常"
        size="md"
        footer={
          <>
            <button
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-danger-600 text-white rounded-lg hover:bg-danger-700 transition-colors"
            >
              确认上报
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">异常类型</label>
            <div className="grid grid-cols-4 gap-2">
              {exceptionTypeOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setFormData({ ...formData, type: opt.value as ExceptionType })}
                  className={`px-3 py-2 rounded-lg border text-sm transition-colors ${
                    formData.type === opt.value
                      ? 'border-danger-500 bg-danger-50 text-danger-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">关联器械包</label>
            <select
              value={formData.packId}
              onChange={(e) => setFormData({ ...formData, packId: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-danger-500 bg-white"
            >
              <option value="">无</option>
              {instrumentPacks.map((pack) => (
                <option key={pack.id} value={pack.id}>
                  {pack.name} ({pack.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">关联灭菌批次</label>
            <select
              value={formData.batchId}
              onChange={(e) => setFormData({ ...formData, batchId: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-danger-500 bg-white"
            >
              <option value="">无</option>
              {sterilizationBatches.map((batch) => (
                <option key={batch.id} value={batch.id}>
                  {batch.batchNo}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">异常描述 *</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-danger-500 resize-none"
              rows={3}
              placeholder="请详细描述异常情况"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">上报人</label>
            <select
              value={formData.reportedBy}
              onChange={(e) => setFormData({ ...formData, reportedBy: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-danger-500 bg-white"
            >
              {STAFF.map((staff) => (
                <option key={staff} value={staff}>
                  {staff}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isHandleModalOpen}
        onClose={() => setIsHandleModalOpen(false)}
        title="处理异常"
        size="md"
        footer={
          <>
            <button
              onClick={() => setIsHandleModalOpen(false)}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleResolve}
              className="px-4 py-2 bg-success-600 text-white rounded-lg hover:bg-success-700 transition-colors"
            >
              确认解决
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">处理人</label>
            <select
              value={handleData.handler}
              onChange={(e) => setHandleData({ ...handleData, handler: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-success-500 bg-white"
            >
              {STAFF.map((staff) => (
                <option key={staff} value={staff}>
                  {staff}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">处理结果 *</label>
            <textarea
              value={handleData.handleResult}
              onChange={(e) => setHandleData({ ...handleData, handleResult: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-success-500 resize-none"
              rows={4}
              placeholder="请描述处理措施和结果"
            />
          </div>

          <div className="bg-warning-50 rounded-lg p-3 text-sm text-warning-700">
            <AlertCircle size={14} className="inline mr-1" />
            处理完成后，器械包状态将恢复为"清洗中"，需要重新进行清洗消毒流程
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title="异常详情"
        size="lg"
      >
        {selectedException && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
              <div
                className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                  selectedException.status === 'resolved' ? 'bg-success-100' : 'bg-warning-100'
                }`}
              >
                {selectedException.status === 'resolved' ? (
                  <CheckCircle2 size={28} className="text-success-600" />
                ) : (
                  <AlertTriangle size={28} className="text-warning-600" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <StatusBadge type="exception-type" status={selectedException.type} />
                  <StatusBadge type="exception-status" status={selectedException.status} />
                </div>
                <p className="text-gray-500 text-sm">
                  上报时间：{formatDateTime(selectedException.reportedAt)}
                </p>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-2">异常描述</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700">{selectedException.description}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500 mb-1">上报人</p>
                <p className="font-medium">{selectedException.reportedBy}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500 mb-1">关联器械包</p>
                <p className="font-medium">
                  {selectedException.packId
                    ? getPackById(selectedException.packId)?.name || '-'
                    : '-'}
                </p>
              </div>
            </div>

            {selectedException.batchId && (
              <>
                <div className="bg-warning-50 border border-warning-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm text-warning-700 mb-1">关联灭菌批次</p>
                      <p className="font-semibold text-warning-900">
                        {
                          sterilizationBatches.find(b => b.id === selectedException.batchId)?.batchNo || '-'
                        }
                      </p>
                    </div>
                    <div className="text-sm text-warning-700">
                      含 {
                        sterilizationBatches.find(b => b.id === selectedException.batchId)?.packIds.length || 0
                      } 个器械包
                    </div>
                  </div>
                  <button
                    onClick={openRecallModal}
                    className="w-full py-2.5 bg-danger-600 text-white rounded-lg hover:bg-danger-700 transition-colors font-medium text-sm flex items-center justify-center gap-2"
                  >
                    <AlertTriangle size={16} />
                    一键召回整批次
                  </button>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <AlertTriangle size={16} className="text-warning-500" />
                    受影响器械包（院感排查范围）
                  </h4>
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="grid grid-cols-5 gap-2 px-3 py-2 bg-gray-100 text-xs font-medium text-gray-600">
                      <div>器械包</div>
                      <div>当前环节</div>
                      <div>状态</div>
                      <div className="col-span-2 text-right">操作</div>
                    </div>
                    <div className="max-h-64 overflow-y-auto divide-y divide-gray-100">
                      {(() => {
                        const batch = sterilizationBatches.find(b => b.id === selectedException.batchId);
                        const affectedPacks = batch ? instrumentPacks.filter(p => batch.packIds.includes(p.id)) : [];
                        if (affectedPacks.length === 0) {
                          return (
                            <div className="py-6 text-center text-gray-400 text-sm col-span-5">暂无器械包</div>
                          );
                        }
                        return affectedPacks.map(pack => (
                          <div
                            key={pack.id}
                            className="grid grid-cols-5 gap-2 items-center px-3 py-3 hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 bg-primary-50 rounded-lg flex items-center justify-center">
                                <Package size={14} className="text-primary-600" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900 text-sm">{pack.name}</p>
                                <p className="text-xs text-gray-500">{pack.code}</p>
                              </div>
                            </div>
                            <div className="text-sm text-gray-700">{getStatusText(pack.status)}</div>
                            <div>
                              <StatusBadge type="instrument" status={pack.status} />
                            </div>
                            <div className="col-span-2 flex justify-end gap-1">
                              <button
                                onClick={() => openReSterilizeModal(pack.id)}
                                className="px-2.5 py-1.5 text-xs bg-primary-50 text-primary-600 hover:bg-primary-100 rounded-md transition-colors"
                                title="创建新批次重新灭菌"
                              >
                                重新灭菌
                              </button>
                              <button
                                onClick={() => {
                                  navigate('/trace');
                                  setTimeout(() => {
                                    const ev = new CustomEvent('trace-pack', { detail: pack.code });
                                    window.dispatchEvent(ev);
                                  }, 100);
                                }}
                                className="p-1.5 text-primary-600 hover:bg-primary-50 rounded-lg"
                                title="查看追溯链路"
                              >
                                <ExternalLink size={16} />
                              </button>
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                </div>
              </>
            )}

            {selectedException.status === 'resolved' && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">处理记录</h4>
                <div className="bg-success-50 border border-success-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 size={18} className="text-success-600" />
                    <span className="font-medium text-success-700">已解决</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    处理人：{selectedException.handler}
                  </p>
                  <p className="text-sm text-gray-600 mb-2">
                    处理时间：{selectedException.handledAt ? formatDateTime(selectedException.handledAt) : '-'}
                  </p>
                  <p className="text-gray-700">
                    处理结果：{selectedException.handleResult}</p>
                </div>
              </div>
            )}

            {selectedException.status === 'pending' && (
              <button
                onClick={() => {
                  setDetailModalOpen(false);
                  openHandleModal(selectedException.id);
                }}
                className="w-full py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
              >
                立即处理
              </button>
            )}
          </div>
        )}
      </Modal>

      <Modal
        isOpen={isRecallModalOpen}
        onClose={() => setIsRecallModalOpen(false)}
        title="确认召回批次"
        size="md"
        footer={
          <>
            <button
              onClick={() => setIsRecallModalOpen(false)}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleRecallBatch}
              disabled={!recallOperator}
              className="px-4 py-2 bg-danger-600 text-white rounded-lg hover:bg-danger-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              确认召回
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="bg-danger-50 border border-danger-200 rounded-xl p-4">
          <div className="flex items-center gap-2 text-danger-700 font-medium mb-2">
            <AlertTriangle size={20} />
            该操作不可撤销
          </div>
          <p className="text-sm text-danger-600">
            召回后批次内所有器械包，将全部标记为异常，并为每个器械包自动生成异常记录，状态变为：灭菌不合格，需重新处理
          </p>
        </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">操作人 *</label>
            <select
              value={recallOperator}
              onChange={(e) => setRecallOperator(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-danger-500 bg-white"
            >
              {STAFF.map((staff) => (
                <option key={staff} value={staff}>
                  {staff}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isReSterilizeModalOpen}
        onClose={() => { setIsReSterilizeModalOpen(false); setReSterilizePackId(null); }}
        title="重新灭菌"
        size="md"
        footer={
          <>
            <button
              onClick={() => { setIsReSterilizeModalOpen(false); setReSterilizePackId(null); }}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleReSterilize}
              disabled={!reSterilizeOperator}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              确认创建
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="bg-primary-50 border border-primary-200 rounded-xl p-4">
          <p className="text-sm text-primary-700">
            将为该器械包创建一个新的灭菌批次，并直接开始灭菌程序，灭菌参数：134°C / 210kPa / 180s
          </p>
        </div>
          <div>
            <p className="text-sm text-gray-500 mb-2">器械包</p>
            <p className="font-medium text-gray-900">
              {reSterilizePackId ? instrumentPacks.find(p => p.id === reSterilizePackId)?.name || '' : ''}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">第一操作人 *</label>
            <select
              value={reSterilizeOperator}
              onChange={(e) => setReSterilizeOperator(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
            >
              {STAFF.map((staff) => (
                <option key={staff} value={staff}>
                  {staff}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ExceptionsPage;
