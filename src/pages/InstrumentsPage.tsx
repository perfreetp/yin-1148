import { useState } from 'react';
import { Package, Plus, Search, Edit, Trash2, Eye, Barcode } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import StatCard from '@/components/StatCard';
import StatusBadge from '@/components/StatusBadge';
import Modal from '@/components/Modal';
import type { InstrumentPack, InstrumentItem } from '@/types';
import { INSTRUMENT_TYPES } from '@/constants';
import { generateId } from '@/utils/dateUtils';
import { formatDateTime } from '@/utils/dateUtils';

const InstrumentsPage = () => {
  const { instrumentPacks, addInstrumentPack, updateInstrumentPack, deleteInstrumentPack, getStats } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingPack, setEditingPack] = useState<InstrumentPack | null>(null);
  const [viewingPack, setViewingPack] = useState<InstrumentPack | null>(null);

  const stats = getStats();

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: INSTRUMENT_TYPES[0],
    items: [{ id: generateId(), name: '', quantity: 1, specification: '' }],
  });

  const filteredPacks = instrumentPacks.filter((pack) => {
    const matchesSearch =
      pack.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pack.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pack.barcode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || pack.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAdd = () => {
    setEditingPack(null);
    setFormData({
      name: '',
      code: '',
      type: INSTRUMENT_TYPES[0],
      items: [{ id: generateId(), name: '', quantity: 1, specification: '' }],
    });
    setIsModalOpen(true);
  };

  const handleEdit = (pack: InstrumentPack) => {
    setEditingPack(pack);
    setFormData({
      name: pack.name,
      code: pack.code,
      type: pack.type,
      items: pack.items,
    });
    setIsModalOpen(true);
  };

  const handleView = (pack: InstrumentPack) => {
    setViewingPack(pack);
    setIsViewModalOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.code) return;

    if (editingPack) {
      updateInstrumentPack(editingPack.id, {
        name: formData.name,
        code: formData.code,
        type: formData.type,
        items: formData.items,
      });
    } else {
      addInstrumentPack({
        name: formData.name,
        code: formData.code,
        type: formData.type,
        items: formData.items,
        status: 'sterilized',
      });
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('确定要删除这个器械包吗？')) {
      deleteInstrumentPack(id);
    }
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { id: generateId(), name: '', quantity: 1, specification: '' }],
    });
  };

  const updateItem = (index: number, field: keyof InstrumentItem, value: string | number) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  };

  const removeItem = (index: number) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">器械包台账</h1>
          <p className="text-gray-500 mt-1">管理所有器械包的基本信息和状态</p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors shadow-sm"
        >
          <Plus size={20} />
          <span>新增器械包</span>
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <StatCard title="器械包总数" value={stats.total} icon={Package} color="primary" />
        <StatCard title="已灭菌库存" value={stats.sterilized} icon={Package} color="success" />
        <StatCard title="清洗/灭菌中" value={stats.cleaning + stats.sterilizing} icon={Package} color="warning" />
        <StatCard title="异常/借出" value={stats.exception + stats.borrowed} icon={Package} color="danger" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="搜索名称、编号、条码..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
            >
              <option value="all">全部状态</option>
              <option value="in_use">使用中</option>
              <option value="cleaning">清洗中</option>
              <option value="sterilizing">灭菌中</option>
              <option value="sterilized">已灭菌</option>
              <option value="expired">已过期</option>
              <option value="exception">异常</option>
              <option value="borrowed">已借出</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">器械包名称</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">编号</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">类型</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">条码</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">状态</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">灭菌日期</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">有效期至</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredPacks.map((pack) => (
                <tr key={pack.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center">
                        <Package size={20} className="text-primary-600" />
                      </div>
                      <span className="font-medium text-gray-900">{pack.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-gray-600">{pack.code}</td>
                  <td className="px-4 py-4 text-gray-600">{pack.type}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1 text-gray-500">
                      <Barcode size={14} />
                      <span className="text-sm font-mono">{pack.barcode}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <StatusBadge type="instrument" status={pack.status} />
                  </td>
                  <td className="px-4 py-4 text-gray-600 text-sm">
                    {pack.sterilizedAt ? formatDateTime(pack.sterilizedAt) : '-'}
                  </td>
                  <td className="px-4 py-4 text-sm">
                    {pack.expiresAt ? (
                      <span
                        className={
                          new Date(pack.expiresAt) < new Date()
                            ? 'text-danger-600 font-medium'
                            : new Date(pack.expiresAt).getTime() - Date.now() < 3 * 24 * 60 * 60 * 1000
                            ? 'text-warning-600 font-medium'
                            : 'text-gray-600'
                        }
                      >
                        {formatDateTime(pack.expiresAt)}
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleView(pack)}
                        className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        title="查看"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => handleEdit(pack)}
                        className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        title="编辑"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(pack.id)}
                        className="p-2 text-gray-400 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
                        title="删除"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredPacks.length === 0 && (
          <div className="py-12 text-center text-gray-500">
            <Package size={48} className="mx-auto mb-3 text-gray-300" />
            <p>暂无器械包数据</p>
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPack ? '编辑器械包' : '新增器械包'}
        size="lg"
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
              确定
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">器械包名称 *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="请输入器械包名称"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">编号 *</label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="请输入编号"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">类型</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
            >
              {INSTRUMENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">器械清单</label>
              <button
                onClick={addItem}
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                + 添加器械
              </button>
            </div>
            <div className="space-y-2">
              {formData.items.map((item, index) => (
                <div key={item.id} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => updateItem(index, 'name', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="器械名称"
                  />
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                    className="w-20 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="数量"
                  />
                  <input
                    type="text"
                    value={item.specification}
                    onChange={(e) => updateItem(index, 'specification', e.target.value)}
                    className="w-32 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="规格"
                  />
                  <button
                    onClick={() => removeItem(index)}
                    className="p-2 text-gray-400 hover:text-danger-600"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="器械包详情"
        size="lg"
      >
        {viewingPack && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
              <div className="w-16 h-16 bg-primary-50 rounded-xl flex items-center justify-center">
                <Package size={32} className="text-primary-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">{viewingPack.name}</h3>
                <p className="text-gray-500">{viewingPack.type}</p>
              </div>
              <StatusBadge type="instrument" status={viewingPack.status} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">编号</p>
                <p className="font-medium">{viewingPack.code}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">条码</p>
                <p className="font-mono">{viewingPack.barcode}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">灭菌日期</p>
                <p>{viewingPack.sterilizedAt ? formatDateTime(viewingPack.sterilizedAt) : '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">有效期至</p>
                <p
                  className={
                    viewingPack.expiresAt && new Date(viewingPack.expiresAt) < new Date()
                      ? 'text-danger-600 font-medium'
                      : ''
                  }
                >
                  {viewingPack.expiresAt ? formatDateTime(viewingPack.expiresAt) : '-'}
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-500 mb-2">器械清单</p>
              <div className="border border-gray-100 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-gray-500">名称</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-500">数量</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-500">规格</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {viewingPack.items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-3 py-2">{item.name}</td>
                        <td className="px-3 py-2">{item.quantity}</td>
                        <td className="px-3 py-2 text-gray-500">{item.specification || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default InstrumentsPage;
