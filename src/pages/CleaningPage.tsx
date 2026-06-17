import { useState } from 'react';
import { Droplets, Clock, User, Stethoscope, Thermometer, Timer, Beaker, CheckCircle2, Plus, Search } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import StatusBadge from '@/components/StatusBadge';
import Modal from '@/components/Modal';
import { CHAIRS, STAFF, CLEANING_STEPS } from '@/constants';
import { formatDateTime } from '@/utils/dateUtils';

const CleaningPage = () => {
  const { cleaningRecords, instrumentPacks, addCleaningRecord, updateCleaningStep, updateCleaningParams, completeCleaning } = useAppStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<string | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    packId: '',
    patientName: '',
    chairNumber: '',
    recoveredBy: STAFF[0],
  });

  const [params, setParams] = useState({
    temperature: 45,
    duration: 20,
    enzymeConcentration: '1:200',
    ph: 7.5,
  });

  const [editingParams, setEditingParams] = useState({
    temperature: 0,
    duration: 0,
    enzymeConcentration: '',
    ph: 0,
  });
  const [isEditingParams, setIsEditingParams] = useState(false);

  const availablePacks = instrumentPacks.filter(
    (pack) => pack.status === 'in_use' || pack.status === 'exception' || pack.status === 'borrowed'
  );

  const handleSubmit = () => {
    if (!formData.packId) return;
    addCleaningRecord({
      packId: formData.packId,
      recoveredAt: new Date().toISOString(),
      patientName: formData.patientName,
      chairNumber: formData.chairNumber,
      recoveredBy: formData.recoveredBy,
    });
    setIsModalOpen(false);
    setFormData({
      packId: '',
      patientName: '',
      chairNumber: '',
      recoveredBy: STAFF[0],
    });
  };

  const handleStepToggle = (recordId: string, stepId: string, completed: boolean) => {
    updateCleaningStep(recordId, stepId, completed);
  };

  const handleCompleteCleaning = (recordId: string) => {
    if (confirm('确认清洗消毒已完成？')) {
      completeCleaning(recordId);
    }
  };

  const getPackById = (packId: string) => {
    return instrumentPacks.find((p) => p.id === packId);
  };

  const viewRecordDetail = (recordId: string) => {
    setSelectedRecord(recordId);
    const record = cleaningRecords.find((r) => r.id === recordId);
    if (record) {
      setEditingParams({
        temperature: (record.params.temperature as number) || 0,
        duration: (record.params.duration as number) || 0,
        enzymeConcentration: (record.params.enzymeConcentration as string) || '',
        ph: (record.params.ph as number) || 0,
      });
    }
    setIsEditingParams(false);
    setDetailModalOpen(true);
  };

  const handleSaveParams = () => {
    if (!selectedRecord) return;
    updateCleaningParams(selectedRecord, {
      temperature: editingParams.temperature,
      duration: editingParams.duration,
      enzymeConcentration: editingParams.enzymeConcentration,
      ph: editingParams.ph,
    });
    setIsEditingParams(false);
  };

  const currentRecord = selectedRecord ? cleaningRecords.find((r) => r.id === selectedRecord) : null;
  const currentPack = currentRecord ? getPackById(currentRecord.packId) : null;

  const inProgressRecords = cleaningRecords.filter((r) => r.status === 'cleaning');
  const completedRecords = cleaningRecords.filter((r) => r.status === 'completed');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">清洗消毒登记</h1>
          <p className="text-gray-500 mt-1">记录器械回收与清洗消毒全过程</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors shadow-sm"
        >
          <Plus size={20} />
          <span>回收登记</span>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock size={18} className="text-yellow-600" />
            </div>
            <h2 className="text-lg font-semibold">清洗中</h2>
            <span className="ml-auto px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
              {inProgressRecords.length}
            </span>
          </div>

          <div className="space-y-3">
            {inProgressRecords.map((record) => {
              const pack = getPackById(record.packId);
              const completedSteps = record.steps.filter((s) => s.completed).length;
              const progress = (completedSteps / record.steps.length) * 100;

              return (
                <div
                  key={record.id}
                  className="border border-gray-100 rounded-xl p-4 hover:border-primary-200 hover:shadow-sm transition-all cursor-pointer"
                  onClick={() => viewRecordDetail(record.id)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center">
                        <Droplets size={20} className="text-primary-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{pack?.name}</p>
                        <p className="text-sm text-gray-500">{pack?.code}</p>
                      </div>
                    </div>
                    <StatusBadge type="cleaning" status={record.status} />
                  </div>

                  <div className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-500">清洗进度</span>
                      <span className="text-gray-700 font-medium">
                        {completedSteps}/{record.steps.length} 步
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary-500 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <User size={14} />
                      {record.patientName || '未登记'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Stethoscope size={14} />
                      {record.chairNumber || '未登记'}
                    </span>
                  </div>
                </div>
              );
            })}

            {inProgressRecords.length === 0 && (
              <div className="py-8 text-center text-gray-400">
                <Droplets size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">暂无清洗中的记录</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-success-50 rounded-lg flex items-center justify-center">
              <CheckCircle2 size={18} className="text-success-600" />
            </div>
            <h2 className="text-lg font-semibold">已完成</h2>
            <span className="ml-auto px-2 py-0.5 bg-success-50 text-success-600 rounded-full text-sm font-medium">
              {completedRecords.length}
            </span>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {completedRecords.map((record) => {
              const pack = getPackById(record.packId);

              return (
                <div
                  key={record.id}
                  className="border border-gray-100 rounded-xl p-4 hover:border-gray-200 transition-all cursor-pointer"
                  onClick={() => viewRecordDetail(record.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center">
                        <Droplets size={20} className="text-gray-400" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{pack?.name}</p>
                        <p className="text-sm text-gray-500">{pack?.code}</p>
                      </div>
                    </div>
                    <StatusBadge type="cleaning" status={record.status} />
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>回收: {formatDateTime(record.recoveredAt)}</span>
                    <span>完成: {record.completedAt ? formatDateTime(record.completedAt) : '-'}</span>
                  </div>
                </div>
              );
            })}

            {completedRecords.length === 0 && (
              <div className="py-8 text-center text-gray-400">
                <CheckCircle2 size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">暂无已完成的记录</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="回收登记"
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
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              确认回收
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">选择器械包 *</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <select
                value={formData.packId}
                onChange={(e) => setFormData({ ...formData, packId: e.target.value })}
                className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
              >
                <option value="">请选择器械包</option>
                {availablePacks.map((pack) => (
                  <option key={pack.id} value={pack.id}>
                    {pack.name} ({pack.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">患者姓名</label>
              <input
                type="text"
                value={formData.patientName}
                onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="请输入患者姓名"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">椅位</label>
              <select
                value={formData.chairNumber}
                onChange={(e) => setFormData({ ...formData, chairNumber: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
              >
                <option value="">请选择椅位</option>
                {CHAIRS.map((chair) => (
                  <option key={chair} value={chair}>
                    {chair}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">回收人员</label>
            <select
              value={formData.recoveredBy}
              onChange={(e) => setFormData({ ...formData, recoveredBy: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
            >
              {STAFF.map((staff) => (
                <option key={staff} value={staff}>
                  {staff}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-primary-50 rounded-lg p-3">
            <p className="text-sm text-primary-700">
              <Clock size={14} className="inline mr-1" />
              回收时间：{formatDateTime(new Date().toISOString())}
            </p>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title="清洗消毒详情"
        size="lg"
        footer={
          <>
            {isEditingParams ? (
              <button
                onClick={handleSaveParams}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                保存参数
              </button>
            ) : null}
            {currentRecord?.status === 'cleaning' ? (
              <button
                onClick={() => {
                  handleCompleteCleaning(currentRecord.id);
                  setDetailModalOpen(false);
                }}
                className="px-4 py-2 bg-success-600 text-white rounded-lg hover:bg-success-700 transition-colors"
              >
                完成清洗
              </button>
            ) : null}
          </>
        }
      >
        {currentRecord && currentPack && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
              <div className="w-14 h-14 bg-primary-50 rounded-xl flex items-center justify-center">
                <Droplets size={28} className="text-primary-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900">{currentPack.name}</h3>
                <p className="text-gray-500">{currentPack.code} · {currentPack.type}</p>
              </div>
              <StatusBadge type="cleaning" status={currentRecord.status} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-500 mb-1">患者姓名</p>
                <p className="font-medium">{currentRecord.patientName || '未登记'}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-500 mb-1">椅位</p>
                <p className="font-medium">{currentRecord.chairNumber || '未登记'}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-500 mb-1">回收人员</p>
                <p className="font-medium">{currentRecord.recoveredBy}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-500 mb-1">回收时间</p>
                <p className="font-medium">{formatDateTime(currentRecord.recoveredAt)}</p>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-3">清洗步骤</h4>
              <div className="space-y-2">
                {currentRecord.steps.map((step, index) => (
                  <div
                    key={step.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                      step.completed
                        ? 'border-success-200 bg-success-50'
                        : 'border-gray-100 bg-gray-50'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        step.completed
                          ? 'bg-success-500 text-white'
                          : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {index + 1}
                    </div>
                    <span
                      className={`flex-1 font-medium ${
                        step.completed ? 'text-success-700' : 'text-gray-600'
                      }`}
                    >
                      {step.name}
                    </span>
                    {step.completed ? (
                      <CheckCircle2 size={20} className="text-success-500" />
                    ) : (
                      <button
                        onClick={() => handleStepToggle(currentRecord.id, step.id, true)}
                        className="text-sm text-primary-600 hover:text-primary-700"
                      >
                        标记完成
                      </button>
                    )}
                    {step.completedAt && (
                      <span className="text-xs text-gray-400">
                        {formatDateTime(step.completedAt)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900">关键参数</h4>
                {!isEditingParams ? (
                  <button
                    onClick={() => setIsEditingParams(true)}
                    className="text-sm text-primary-600 hover:text-primary-700"
                  >
                    编辑参数
                  </button>
                ) : (
                  <button
                    onClick={() => setIsEditingParams(false)}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    取消编辑
                  </button>
                )}
              </div>
              {isEditingParams ? (
                <div className="grid grid-cols-4 gap-3">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-2 text-center">清洗温度 (°C)</p>
                    <input
                      type="number"
                      value={editingParams.temperature || ''}
                      onChange={(e) => setEditingParams({ ...editingParams, temperature: parseFloat(e.target.value) || 0 })}
                      className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="温度"
                    />
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-2 text-center">清洗时长 (min)</p>
                    <input
                      type="number"
                      value={editingParams.duration || ''}
                      onChange={(e) => setEditingParams({ ...editingParams, duration: parseFloat(e.target.value) || 0 })}
                      className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="时长"
                    />
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-2 text-center">酶浓度</p>
                    <input
                      type="text"
                      value={editingParams.enzymeConcentration}
                      onChange={(e) => setEditingParams({ ...editingParams, enzymeConcentration: e.target.value })}
                      className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="如 1:200"
                    />
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-2 text-center">pH值</p>
                    <input
                      type="number"
                      step="0.1"
                      value={editingParams.ph || ''}
                      onChange={(e) => setEditingParams({ ...editingParams, ph: parseFloat(e.target.value) || 0 })}
                      className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="pH"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-3">
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <Thermometer size={20} className="mx-auto mb-1 text-orange-500" />
                    <p className="text-lg font-bold text-gray-900">{currentRecord.params.temperature || '-'}°C</p>
                    <p className="text-xs text-gray-500">清洗温度</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <Timer size={20} className="mx-auto mb-1 text-blue-500" />
                    <p className="text-lg font-bold text-gray-900">{currentRecord.params.duration || '-'}min</p>
                    <p className="text-xs text-gray-500">清洗时长</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <Beaker size={20} className="mx-auto mb-1 text-green-500" />
                    <p className="text-lg font-bold text-gray-900">{currentRecord.params.enzymeConcentration || '-'}</p>
                    <p className="text-xs text-gray-500">酶浓度</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <span className="text-lg font-bold text-gray-900">pH {currentRecord.params.ph || '-'}</span>
                    <p className="text-xs text-gray-500">pH值</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CleaningPage;
