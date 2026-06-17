import { useState } from 'react';
import { Flame, Plus, Users, Clock, Thermometer, Gauge, Timer, CheckCircle2, AlertCircle, Package } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import StatusBadge from '@/components/StatusBadge';
import Modal from '@/components/Modal';
import { STAFF, STERILE_VALID_DAYS } from '@/constants';
import { formatDateTime, addDays } from '@/utils/dateUtils';

const SterilizationPage = () => {
  const {
    sterilizationBatches,
    instrumentPacks,
    createSterilizationBatch,
    startSterilization,
    completeSterilization,
    releaseBatch,
  } = useAppStore();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isReleaseModalOpen, setIsReleaseModalOpen] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedPacks, setSelectedPacks] = useState<string[]>([]);
  const [releaseOperator2, setReleaseOperator2] = useState('');

  const availablePacks = instrumentPacks.filter((pack) => pack.status === 'sterilizing');

  const handleCreateBatch = () => {
    if (selectedPacks.length === 0) return;
    const batchId = createSterilizationBatch(selectedPacks);
    startSterilization(batchId);
    setIsCreateModalOpen(false);
    setSelectedPacks([]);
  };

  const handleStartSterilization = (batchId: string) => {
    startSterilization(batchId);
  };

  const handleCompleteSterilization = (batchId: string) => {
    if (confirm('确认灭菌已完成？')) {
      completeSterilization(batchId);
    }
  };

  const handleRelease = (batchId: string) => {
    setSelectedBatchId(batchId);
    setIsReleaseModalOpen(true);
  };

  const confirmRelease = () => {
    if (!selectedBatchId || !releaseOperator2) return;
    releaseBatch(selectedBatchId, releaseOperator2);
    setIsReleaseModalOpen(false);
    setReleaseOperator2('');
    setSelectedBatchId(null);
  };

  const viewBatchDetail = (batchId: string) => {
    setSelectedBatchId(batchId);
    setDetailModalOpen(true);
  };

  const togglePackSelection = (packId: string) => {
    if (selectedPacks.includes(packId)) {
      setSelectedPacks(selectedPacks.filter((id) => id !== packId));
    } else {
      setSelectedPacks([...selectedPacks, packId]);
    }
  };

  const getPackById = (packId: string) => {
    return instrumentPacks.find((p) => p.id === packId);
  };

  const selectedBatch = selectedBatchId ? sterilizationBatches.find((b) => b.id === selectedBatchId) : null;

  const pendingBatches = sterilizationBatches.filter((b) => b.status === 'pending');
  const sterilizingBatches = sterilizationBatches.filter((b) => b.status === 'sterilizing');
  const completedBatches = sterilizationBatches.filter((b) => b.status === 'completed');
  const releasedBatches = sterilizationBatches.filter((b) => b.status === 'released');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">灭菌放行</h1>
          <p className="text-gray-500 mt-1">灭菌批次管理与双人放行确认</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors shadow-sm"
        >
          <Plus size={20} />
          <span>创建灭菌批次</span>
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <Clock size={20} className="text-gray-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{pendingBatches.length}</p>
              <p className="text-sm text-gray-500">待灭菌</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Flame size={20} className="text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{sterilizingBatches.length}</p>
              <p className="text-sm text-gray-500">灭菌中</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <CheckCircle2 size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{completedBatches.length}</p>
              <p className="text-sm text-gray-500">待放行</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-success-50 rounded-lg flex items-center justify-center">
              <CheckCircle2 size={20} className="text-success-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{releasedBatches.length}</p>
              <p className="text-sm text-gray-500">已放行</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {sterilizingBatches.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 bg-yellow-50/50">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <Flame size={18} className="text-yellow-600" />
                灭菌中批次
              </h2>
            </div>
            <div className="p-5 grid grid-cols-2 gap-4">
              {sterilizingBatches.map((batch) => (
                <div
                  key={batch.id}
                  className="border border-yellow-200 rounded-xl p-4 bg-yellow-50/30 hover:shadow-md transition-all cursor-pointer"
                  onClick={() => viewBatchDetail(batch.id)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-semibold text-gray-900">{batch.batchNo}</p>
                      <p className="text-sm text-gray-500">{batch.packIds.length} 个器械包</p>
                    </div>
                    <StatusBadge type="sterilization" status={batch.status} />
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="text-center">
                      <p className="text-lg font-bold text-gray-900">{batch.temperature}°C</p>
                      <p className="text-xs text-gray-500">温度</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-gray-900">{batch.pressure}kPa</p>
                      <p className="text-xs text-gray-500">压力</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-gray-900">{batch.duration}s</p>
                      <p className="text-xs text-gray-500">时长</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">开始: {batch.startedAt ? formatDateTime(batch.startedAt) : '-'}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCompleteSterilization(batch.id);
                      }}
                      className="px-3 py-1.5 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 transition-colors"
                    >
                      完成灭菌
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {completedBatches.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 bg-blue-50/50">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <AlertCircle size={18} className="text-blue-600" />
                待放行批次
              </h2>
            </div>
            <div className="p-5 grid grid-cols-2 gap-4">
              {completedBatches.map((batch) => (
                <div
                  key={batch.id}
                  className="border border-blue-200 rounded-xl p-4 bg-blue-50/30 hover:shadow-md transition-all cursor-pointer"
                  onClick={() => viewBatchDetail(batch.id)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-semibold text-gray-900">{batch.batchNo}</p>
                      <p className="text-sm text-gray-500">{batch.packIds.length} 个器械包</p>
                    </div>
                    <StatusBadge type="sterilization" status={batch.status} />
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                    <Users size={14} />
                    <span>操作人1: {batch.operator1 || '-'}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      结束: {batch.endedAt ? formatDateTime(batch.endedAt) : '-'}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRelease(batch.id);
                      }}
                      className="px-3 py-1.5 bg-success-600 text-white rounded-lg text-sm hover:bg-success-700 transition-colors flex items-center gap-1"
                    >
                      <CheckCircle2 size={14} />
                      双人放行
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <CheckCircle2 size={18} className="text-success-600" />
              已放行批次
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">批次号</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">器械包数量</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">灭菌参数</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">操作人</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">放行时间</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">有效期至</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {releasedBatches.map((batch) => {
                  const expiresAt = batch.releasedAt ? addDays(batch.releasedAt, STERILE_VALID_DAYS) : null;
                  return (
                    <tr key={batch.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4 font-medium text-gray-900">{batch.batchNo}</td>
                      <td className="px-4 py-4 text-gray-600">{batch.packIds.length} 个</td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Thermometer size={12} />{batch.temperature}°C
                          </span>
                          <span className="flex items-center gap-1">
                            <Gauge size={12} />{batch.pressure}kPa
                          </span>
                          <span className="flex items-center gap-1">
                            <Timer size={12} />{batch.duration}s
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-gray-600 text-sm">
                        <p>{batch.operator1}</p>
                        <p className="text-gray-400">{batch.operator2}</p>
                      </td>
                      <td className="px-4 py-4 text-gray-600 text-sm">
                        {batch.releasedAt ? formatDateTime(batch.releasedAt) : '-'}
                      </td>
                      <td className="px-4 py-4 text-sm text-success-600 font-medium">
                        {expiresAt ? formatDateTime(expiresAt) : '-'}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <button
                          onClick={() => viewBatchDetail(batch.id)}
                          className="text-primary-600 hover:text-primary-700 text-sm"
                        >
                          查看详情
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {releasedBatches.length === 0 && (
            <div className="py-12 text-center text-gray-500">
              <Flame size={48} className="mx-auto mb-3 text-gray-300" />
              <p>暂无已放行批次</p>
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="创建灭菌批次"
        size="lg"
        footer={
          <>
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleCreateBatch}
              disabled={selectedPacks.length === 0}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              创建并开始灭菌
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="bg-primary-50 rounded-lg p-3 flex items-center justify-between">
            <span className="text-sm text-primary-700">已选择器械包</span>
            <span className="font-semibold text-primary-700">{selectedPacks.length} 个</span>
          </div>

          <div className="border border-gray-200 rounded-xl max-h-80 overflow-y-auto">
            {availablePacks.length === 0 ? (
              <div className="py-8 text-center text-gray-400">
                <Package size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">暂无可灭菌的器械包</p>
              </div>
            ) : (
              availablePacks.map((pack) => (
                <div
                  key={pack.id}
                  onClick={() => togglePackSelection(pack.id)}
                  className={`flex items-center gap-3 p-3 border-b border-gray-100 last:border-b-0 cursor-pointer transition-colors ${
                    selectedPacks.includes(pack.id)
                      ? 'bg-primary-50 border-l-4 border-l-primary-500'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      selectedPacks.includes(pack.id)
                        ? 'bg-primary-500 border-primary-500'
                        : 'border-gray-300'
                    }`}
                  >
                    {selectedPacks.includes(pack.id) && (
                      <CheckCircle2 size={14} className="text-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{pack.name}</p>
                    <p className="text-sm text-gray-500">{pack.code} · {pack.type}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isReleaseModalOpen}
        onClose={() => setIsReleaseModalOpen(false)}
        title="双人放行确认"
        size="md"
        footer={
          <>
            <button
              onClick={() => setIsReleaseModalOpen(false)}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              onClick={confirmRelease}
              disabled={!releaseOperator2}
              className="px-4 py-2 bg-success-600 text-white rounded-lg hover:bg-success-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              确认放行
            </button>
          </>
        }
      >
        {selectedBatch && (
          <div className="space-y-4">
            <div className="bg-success-50 border border-success-200 rounded-xl p-4">
              <div className="flex items-center gap-2 text-success-700 font-medium mb-2">
                <CheckCircle2 size={20} />
                灭菌合格，准备放行
              </div>
              <p className="text-sm text-success-600">
                批次 {selectedBatch.batchNo}，共 {selectedBatch.packIds.length} 个器械包
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">操作人 1</label>
                <div className="px-3 py-2.5 bg-gray-100 rounded-lg text-gray-700">
                  {selectedBatch.operator1 || '-'}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">操作人 2 *</label>
                <select
                  value={releaseOperator2}
                  onChange={(e) => setReleaseOperator2(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-success-500 bg-white"
                >
                  <option value="">请选择第二操作人</option>
                  {STAFF.filter((s) => s !== selectedBatch.operator1).map((staff) => (
                    <option key={staff} value={staff}>
                      {staff}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="bg-warning-50 rounded-lg p-3 text-sm text-warning-700">
              <AlertCircle size={14} className="inline mr-1" />
              放行后器械包进入无菌库存，有效期 {STERILE_VALID_DAYS} 天
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title="灭菌批次详情"
        size="lg"
      >
        {selectedBatch && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
              <div className="w-14 h-14 bg-primary-50 rounded-xl flex items-center justify-center">
                <Flame size={28} className="text-primary-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900">{selectedBatch.batchNo}</h3>
                <p className="text-gray-500">{selectedBatch.packIds.length} 个器械包</p>
              </div>
              <StatusBadge type="sterilization" status={selectedBatch.status} />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <Thermometer size={24} className="mx-auto mb-2 text-orange-500" />
                <p className="text-2xl font-bold text-gray-900">{selectedBatch.temperature}°C</p>
                <p className="text-sm text-gray-500">灭菌温度</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <Gauge size={24} className="mx-auto mb-2 text-blue-500" />
                <p className="text-2xl font-bold text-gray-900">{selectedBatch.pressure}kPa</p>
                <p className="text-sm text-gray-500">灭菌压力</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <Timer size={24} className="mx-auto mb-2 text-green-500" />
                <p className="text-2xl font-bold text-gray-900">{selectedBatch.duration}s</p>
                <p className="text-sm text-gray-500">持续时间</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-500 mb-1">操作人 1</p>
                <p className="font-medium">{selectedBatch.operator1 || '-'}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-500 mb-1">操作人 2</p>
                <p className="font-medium">{selectedBatch.operator2 || '-'}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-500 mb-1">开始时间</p>
                <p className="font-medium">{selectedBatch.startedAt ? formatDateTime(selectedBatch.startedAt) : '-'}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-500 mb-1">结束时间</p>
                <p className="font-medium">{selectedBatch.endedAt ? formatDateTime(selectedBatch.endedAt) : '-'}</p>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-3">包含器械包</h4>
              <div className="border border-gray-100 rounded-xl overflow-hidden">
                <div className="divide-y divide-gray-100">
                  {selectedBatch.packIds.map((packId) => {
                    const pack = getPackById(packId);
                    return (
                      <div key={packId} className="flex items-center gap-3 p-3 hover:bg-gray-50">
                        <div className="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center">
                          <Package size={16} className="text-primary-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{pack?.name}</p>
                          <p className="text-sm text-gray-500">{pack?.code}</p>
                        </div>
                        <StatusBadge type="instrument" status={pack?.status || 'sterilizing'} />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SterilizationPage;
