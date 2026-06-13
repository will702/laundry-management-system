import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import type { Employee } from '@mass-laundry/shared-types';
import { apiClient } from '../../services/api';

interface ServiceItem {
  id: string;
  name: string;
  category: string;
  price: number;
  unit: string;
  description?: string;
  is_active: boolean;
  created_at: string;
}

interface NewServiceItem {
  name: string;
  category: string;
  price: string;
  unit: string;
  description: string;
}

interface ServiceItemsManagementProps {
  employee: Employee;
}

const CATEGORIES = [
  { value: 'wash', label: 'Cuci' },
  { value: 'dry_clean', label: 'Dry Clean' },
  { value: 'iron', label: 'Setrika' },
  { value: 'special', label: 'Khusus' },
];

const UNITS = [
  { value: 'pcs', label: 'Pcs' },
  { value: 'kg', label: 'Kg' },
  { value: 'set', label: 'Set' },
];

export const ServiceItemsManagement: React.FC<ServiceItemsManagementProps> = () => {
  const [serviceItems, setServiceItems] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState<NewServiceItem>({
    name: '',
    category: 'wash',
    price: '',
    unit: 'pcs',
    description: '',
  });

  useEffect(() => {
    loadServiceItems();
  }, []);

  const loadServiceItems = async () => {
    try {
      const response = await apiClient.get<ServiceItem[]>('/service-items?active_only=false');
      setServiceItems(response.data);
    } catch (err) {
      console.error('Error loading service items:', err);
    } finally {
      setLoading(false);
    }
  };

  const createServiceItem = async () => {
    if (!newItem.name || !newItem.price) {
      toast.error('Harap isi nama layanan dan harga');
      return;
    }

    try {
      await apiClient.post('/service-items', {
        ...newItem,
        price: parseFloat(newItem.price),
      });
      setNewItem({ name: '', category: 'wash', price: '', unit: 'pcs', description: '' });
      setShowAddForm(false);
      await loadServiceItems();
      toast.success('Item layanan berhasil ditambahkan!');
    } catch (err) {
      console.error('Error creating service item:', err);
      toast.error('Error menambah item layanan. Silakan coba lagi.');
    }
  };

  const toggleItemStatus = async (itemId: string, currentStatus: boolean) => {
    try {
      if (currentStatus) {
        await apiClient.delete(`/service-items/${itemId}`);
      } else {
        toast.info('Fitur mengaktifkan kembali item akan ditambahkan');
        return;
      }
      await loadServiceItems();
    } catch (err) {
      console.error('Error toggling item status:', err);
      toast.error('Error mengubah status item.');
    }
  };

  const getCategoryLabel = (category: string) => {
    const found = CATEGORIES.find((cat) => cat.value === category);
    return found ? found.label : category;
  };

  const getUnitLabel = (unit: string) => {
    const found = UNITS.find((u) => u.value === unit);
    return found ? found.label : unit;
  };

  if (loading) {
    return <div className="text-center py-8">Memuat item layanan...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">🧽 Kelola Item Laundry</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          + Tambah Item
        </button>
      </div>

      {showAddForm && (
        <div className="bg-gray-50 p-6 rounded-lg mb-6">
          <h3 className="text-lg font-semibold mb-4">Tambah Item Layanan Baru</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nama Layanan <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                aria-label="Nama layanan"
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="Misal: Cuci Kemeja Regular"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Kategori</label>
              <select
                aria-label="Kategori layanan"
                value={newItem.category}
                onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Harga <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                aria-label="Harga layanan"
                value={newItem.price}
                onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="5000"
                min="0"
                step="500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Satuan</label>
              <select
                aria-label="Satuan layanan"
                value={newItem.unit}
                onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                {UNITS.map((unit) => (
                  <option key={unit.value} value={unit.value}>
                    {unit.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Deskripsi (Opsional)
            </label>
            <textarea
              aria-label="Deskripsi layanan"
              value={newItem.description}
              onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              rows={2}
              placeholder="Deskripsi tambahan untuk item ini..."
            />
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={createServiceItem}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Simpan Item
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {serviceItems.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Belum ada item layanan. Tambah item layanan pertama Anda!
          </div>
        ) : (
          serviceItems.map((item) => (
            <div
              key={item.id}
              className={`border rounded-lg p-4 ${
                item.is_active ? 'border-gray-200 bg-white' : 'border-red-200 bg-red-50'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{item.name}</h3>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {item.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Kategori:</span>
                      <div>{getCategoryLabel(item.category)}</div>
                    </div>
                    <div>
                      <span className="font-medium">Harga:</span>
                      <div className="text-green-600 font-semibold">
                        Rp{item.price.toLocaleString('id-ID')}
                      </div>
                    </div>
                    <div>
                      <span className="font-medium">Satuan:</span>
                      <div>{getUnitLabel(item.unit)}</div>
                    </div>
                    <div>
                      <span className="font-medium">Dibuat:</span>
                      <div>{new Date(item.created_at).toLocaleDateString('id-ID')}</div>
                    </div>
                  </div>

                  {item.description && (
                    <div className="mt-2 text-sm text-gray-600">
                      <span className="font-medium">Deskripsi:</span> {item.description}
                    </div>
                  )}
                </div>

                <div className="ml-4">
                  <button
                    onClick={() => toggleItemStatus(item.id, item.is_active)}
                    className={`px-3 py-1 text-sm rounded ${
                      item.is_active
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {item.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
