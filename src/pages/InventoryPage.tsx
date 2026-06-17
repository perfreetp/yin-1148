import { useState } from 'react';
import {
  Warehouse,
  Package,
  Clock,
  AlertTriangle,
  ArrowRightLeft,
  User,
  Stethoscope,
  Plus,
  CheckCircle2,
  XCircle,
  Search,
  Calendar,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import StatusBadge from '@/components/StatusBadge';
import Modal from '@/components/Modal';
import { CHAIRS, STAFF, EXPIRING_WARNING_DAYS } from '@/constants';
import { formatDateTime, getDaysUntilExpiry } from '@/utils/dateUtils';

const InventoryPage = () => {
  const {
    instrumentPacks,
    borrowRecords,
    usageRecords,
    usePack,
    addBorrowRecord,
    returnBorrow,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'inventory' | 'borrow' | 'usage'>('inventory');
  const [isUseModalOpen, setIsUseModalOpen] = useState(false);
  const [isBorrowModalOpen, setIsBorrowModalOpen] = useState(false);
  const [selectedPackId, setSelectedPackId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [useForm, setUseForm] = useState({
    patientName: '',
    chairNumber: '',
    doctor: '',
    operator: STAFF[0],
  });

  const [borrowForm, setBorrowForm] = useState({
    borrower: '',
    purpose: '',
    operator: STAFF[0],
  });

  const sterilizedPacks = instrumentPacks.filter((p) => p.status === 'sterilized');
  const borrowedPacks = instrumentPacks.filter((p) => p.status === 'borrowed');

  const expiringSoon = sterilizedPacks.filter(
    (p) => p.expiresAt && getDaysUntilExpiry(p.expiresAt) <= EXPIRING_WARNING_DAYS && getDaysUntilExpiry(p.expiresAt) >= 0
  );
  const expiredPacks = sterilizedPacks.filter((p) => p.expiresAt && getDaysUntilExpiry(p.expiresAt) < 0);

  const filteredInventory = sterilizedPacks.filter(
    (pack) =>
      pack.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pack.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedInventory = [...filteredInventory].sort((a, b) => {
    if (!a.expiresAt) return 1;
    if (!b.expiresAt) return -1;
    return new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime();
  });

  const handleOpenUseModal = (packId: string) => {
    setSelectedPackId(packId);
    setIsUseModalOpen(true);
  };

  const handleUsePack = () => {
    if (!selectedPackId) return;
    usePack(
      selectedPackId,
      useForm.patientName,
      useForm.chairNumber,
      useForm.doctor,
      useForm.operator
    );
    setIsUseModalOpen(false);
    setUseForm({
      patientName: '',
      chairNumber: '',
      doctor: '',
      operator: STAFF[0],
    });
    setSelectedPackId(null);
  };

  const handleOpenBorrowModal = (packId: string) => {
    setSelectedPackId(packId);
    setIsBorrowModalOpen(true);
  };

  const handleBorrow = () => {
    if (!selectedPackId || !borrowForm.borrower) return;
    addBorrowRecord({
      packId: selectedPackId,
      borrower: borrowForm.borrower,
      purpose: borrowForm.purpose,
      borrowedAt: new Date().toISOString(),
      operator: borrowForm.operator,
    });
    setIsBorrowModalOpen(false);
    setBorrowForm({
      borrower: '',
      purpose: '',
      operator: STAFF[0],
    });
    setSelectedPackId(null);
  };

  const handleReturn = (recordId: string) => {
    if (confirm('确认归还？')) {
      returnBorrow(recordId);
    }
  };

  const getExpiryStatusColor = (expiresAt?: string) => {
    if (!expiresAt) return 'text-gray-400';
    const daysLeft = getDaysUntilExpiry(expiresAt);
    if (daysLeft < 0) return 'text-danger-600 bg-danger-50';
    if (daysLeft <= EXPIRING_WARNING_DAYS) return 'text-warning-600 bg-warning-50';
    return 'text-success-600 bg-success-50';
  };

  const selectedPack = selectedPackId ? instrumentPacks.find((p) => p.id === selectedPackId) : null;

  const activeBorrowRecords = borrowRecords.filter((r) => !r.returnedAt);
  const returnedBorrowRecords = borrowRecords.filter((r) => r.returnedAt);

  const getPackById = (packId: string) => instrumentPacks.find((p) => p.id === packId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">库存与借还</h1>
          <p className="text-gray-500 mt-1">无菌库存管理、借还登记与开包使用</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-success-50 rounded-xl flex items-center justify-center">
              <Warehouse size={24} className="text-success-600" />
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900">{sterilizedPacks.length}</p>
              <p className="text-sm text-gray-500">无菌库存</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-warning-50 rounded-xl flex items-center justify-center">
              <Clock size={24} className="text-warning-600" />
            </div>
            <div>
              <p className="text-3xl font-bold text-warning-600">{expiringSoon.length}</p>
              <p className="text-sm text-gray-500">临期预警</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-danger-50 rounded-xl flex items-center justify-center">
              <AlertTriangle size={24} className="text-danger-600" />
            </div>
            <div>
              <p className="text-3xl font-bold text-danger-600">{expiredPacks.length}</p>
              <p className="text-sm text-gray-500">已过期</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <ArrowRightLeft size={24} className="text-blue-600" />
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900">{activeBorrowRecords.length}</p>
              <p className="text-sm text-gray-500">借出中</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-6 py-4 font-medium transition-colors ${
              activeTab === 'inventory'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Package size={16} className="inline mr-2" />
            无菌库存
          </button>
          <button
            onClick={() => setActiveTab('borrow')}
            className={`px-6 py-4 font-medium transition-colors ${
              activeTab === 'borrow'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <ArrowRightLeft size={16} className="inline mr-2" />
            借还管理
          </button>
          <button
            onClick={() => setActiveTab('usage')}
            className={`px-6 py-4 font-medium transition-colors ${
              activeTab === 'usage'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Stethoscope size={16} className="inline mr-2" />
            使用记录
          </button>
        </div>

        <div className="p-5">
          {activeTab === 'inventory' && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="搜索器械包名称、编号..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {sortedInventory.map((pack) => {
                  const daysLeft = pack.expiresAt ? getDaysUntilExpiry(pack.expiresAt) : null;
                  const isExpiring = daysLeft !== null && daysLeft <= EXPIRING_WARNING_DAYS && daysLeft >= 0;
                  const isExpired = daysLeft !== null && daysLeft < 0;

                  return (
                    <div
                      key={pack.id}
                      className={`border rounded-xl p-4 transition-all hover:shadow-md ${
                        isExpired
                          ? 'border-danger-200 bg-danger-50/30'
                          : isExpiring
                          ? 'border-warning-200 bg-warning-50/30'
                          : 'border-gray-100 hover:border-primary-200'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              isExpired
                                ? 'bg-danger-100'
                                : isExpiring
                                ? 'bg-warning-100'
                                : 'bg-success-100'
                            }`}
                          >
                            <Package
                              size={20}
                              className={
                                isExpired
                                  ? 'text-danger-600'
                                  : isExpiring
                                  ? 'text-warning-600'
                                  : 'text-success-600'
                              }
                            />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{pack.name}</p>
                            <p className="text-sm text-gray-500">{pack.code}</p>
                          </div>
                        </div>
                        {isExpired ? (
                          <XCircle size={20} className="text-danger-500" />
                        ) : isExpiring ? (
                          <AlertTriangle size={20} className="text-warning-500" />
                        ) : (
                          <CheckCircle2 size={20} className="text-success-500" />
                        )}
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">类型</span>
                          <span className="text-gray-700">{pack.type}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">灭菌日期</span>
                          <span className="text-gray-700">
                            {pack.sterilizedAt ? formatDateTime(pack.sterilizedAt) : '-'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">有效期至</span>
                          <span
                            className={`font-medium px-2 py-0.5 rounded ${getExpiryStatusColor(
                              pack.expiresAt
                            )}`}
                          >
                            {pack.expiresAt ? formatDateTime(pack.expiresAt) : '-'}
                          </span>
                        </div>
                        {daysLeft !== null && daysLeft >= 0 && (
                          <div className="text-xs text-gray-500 text-right">
                            剩余 {daysLeft} 天
                          </div>
                        )}
                        {daysLeft !== null && daysLeft < 0 && (
                          <div className="text-xs text-danger-600 text-right font-medium">
                            已过期 {Math.abs(daysLeft)} 天
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleOpenUseModal(pack.id)}
                          disabled={isExpired}
                          className="flex-1 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          开包使用
                        </button>
                        <button
                          onClick={() => handleOpenBorrowModal(pack.id)}
                          disabled={isExpired}
                          className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          借出
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {sortedInventory.length === 0 && (
                <div className="py-12 text-center text-gray-500">
                  <Warehouse size={48} className="mx-auto mb-3 text-gray-300" />
                  <p>暂无无菌库存</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'borrow' && (
            <div className="space-y-6">
              {activeBorrowRecords.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <ArrowRightLeft size={18} className="text-blue-600" />
                    借出中 ({activeBorrowRecords.length})
                  </h3>
                  <div className="space-y-3">
                    {activeBorrowRecords.map((record) => {
                      const pack = getPackById(record.packId);
                      return (
                        <div
                          key={record.id}
                          className="flex items-center gap-4 p-4 border border-blue-200 bg-blue-50/30 rounded-xl"
                        >
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Package size={20} className="text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{pack?.name}</p>
                            <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                              <span className="flex items-center gap-1">
                                <User size={12} />
                                借用人: {record.borrower}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar size={12} />
                                {formatDateTime(record.borrowedAt)}
                              </span>
                              <span>用途: {record.purpose || '-'}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleReturn(record.id)}
                            className="px-4 py-2 bg-success-600 text-white rounded-lg text-sm hover:bg-success-700 transition-colors"
                          >
                            归还
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {returnedBorrowRecords.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <CheckCircle2 size={18} className="text-success-600" />
                    已归还 ({returnedBorrowRecords.length})
                  </h3>
                  <div className="space-y-3">
                    {returnedBorrowRecords.map((record) => {
                      const pack = getPackById(record.packId);
                      return (
                        <div
                          key={record.id}
                          className="flex items-center gap-4 p-4 border border-gray-100 rounded-xl opacity-70"
                        >
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                            <Package size={20} className="text-gray-400" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{pack?.name}</p>
                            <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                              <span>借用人: {record.borrower}</span>
                              <span>借出: {formatDateTime(record.borrowedAt)}</span>
                              <span>归还: {record.returnedAt ? formatDateTime(record.returnedAt) : '-'}</span>
                            </div>
                          </div>
                          <StatusBadge type="instrument" status="sterilized" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {borrowRecords.length === 0 && (
                <div className="py-12 text-center text-gray-500">
                  <ArrowRightLeft size={48} className="mx-auto mb-3 text-gray-300" />
                  <p>暂无借还记录</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'usage' && (
            <div className="space-y-4">
              {usageRecords.length > 0 ? (
                <div className="border border-gray-100 rounded-xl overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">器械包</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">患者</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">椅位</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">医生</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">操作人员</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">使用时间</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {usageRecords.map((record) => {
                        const pack = getPackById(record.packId);
                        return (
                          <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-2">
                                <Package size={16} className="text-primary-500" />
                                <span className="font-medium text-gray-900">{pack?.name}</span>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-gray-600">{record.patientName || '-'}</td>
                            <td className="px-4 py-4 text-gray-600">{record.chairNumber || '-'}</td>
                            <td className="px-4 py-4 text-gray-600">{record.doctor || '-'}</td>
                            <td className="px-4 py-4 text-gray-600">{record.operator}</td>
                            <td className="px-4 py-4 text-gray-600">{formatDateTime(record.usedAt)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-12 text-center text-gray-500">
                  <Stethoscope size={48} className="mx-auto mb-3 text-gray-300" />
                  <p>暂无使用记录</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={isUseModalOpen}
        onClose={() => setIsUseModalOpen(false)}
        title="开包使用登记"
        size="md"
        footer={
          <>
            <button
              onClick={() => setIsUseModalOpen(false)}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleUsePack}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              确认开包
            </button>
          </>
        }
      >
        <div className="space-y-4">
          {selectedPack && (
            <div className="bg-primary-50 rounded-lg p-3 flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                <Package size={20} className="text-primary-600" />
              </div>
              <div>
                <p className="font-medium text-primary-900">{selectedPack.name}</p>
                <p className="text-sm text-primary-600">{selectedPack.code} · {selectedPack.type}</p>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">患者姓名</label>
            <input
              type="text"
              value={useForm.patientName}
              onChange={(e) => setUseForm({ ...useForm, patientName: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="请输入患者姓名"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">椅位</label>
              <select
                value={useForm.chairNumber}
                onChange={(e) => setUseForm({ ...useForm, chairNumber: e.target.value })}
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">医生</label>
              <input
                type="text"
                value={useForm.doctor}
                onChange={(e) => setUseForm({ ...useForm, doctor: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="请输入医生姓名"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">操作护士</label>
            <select
              value={useForm.operator}
              onChange={(e) => setUseForm({ ...useForm, operator: e.target.value })}
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

      <Modal
        isOpen={isBorrowModalOpen}
        onClose={() => setIsBorrowModalOpen(false)}
        title="借出登记"
        size="md"
        footer={
          <>
            <button
              onClick={() => setIsBorrowModalOpen(false)}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleBorrow}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              确认借出
            </button>
          </>
        }
      >
        <div className="space-y-4">
          {selectedPack && (
            <div className="bg-blue-50 rounded-lg p-3 flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-blue-900">{selectedPack.name}</p>
                <p className="text-sm text-blue-600">{selectedPack.code}</p>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">借用人 / 部门 *</label>
            <input
              type="text"
              value={borrowForm.borrower}
              onChange={(e) => setBorrowForm({ ...borrowForm, borrower: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="请输入借用人或部门名称"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">借出用途</label>
            <textarea
              value={borrowForm.purpose}
              onChange={(e) => setBorrowForm({ ...borrowForm, purpose: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              rows={2}
              placeholder="请输入借出用途"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">登记人</label>
            <select
              value={borrowForm.operator}
              onChange={(e) => setBorrowForm({ ...borrowForm, operator: e.target.value })}
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

export default InventoryPage;
