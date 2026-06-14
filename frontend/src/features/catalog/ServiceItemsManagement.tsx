import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Plus, X, Save } from 'lucide-react';
import type { Employee } from '@mass-laundry/shared-types';
import { apiClient } from '../../services/api';
import {
  Card, PageHeader, Button, Input, Select, Textarea, Badge, EmptyState, Money, SkeletonCard,
} from '../../components/ui';
import { staggerContainer, listItem } from '../../lib/motion';

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
    name: '', category: 'wash', price: '', unit: 'pcs', description: '',
  });

  useEffect(() => { loadServiceItems(); }, []);

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
      await apiClient.post('/service-items', { ...newItem, price: parseFloat(newItem.price) });
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

  const getCategoryLabel = (category: string) =>
    CATEGORIES.find((cat) => cat.value === category)?.label ?? category;
  const getUnitLabel = (unit: string) =>
    UNITS.find((u) => u.value === unit)?.label ?? unit;

  if (loading) {
    return (
      <div className="space-y-4">
        <SkeletonCard lines={2} />
        <SkeletonCard lines={3} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Katalog"
        title="Item Laundry"
        description="Kelola daftar item layanan dan harganya."
        action={
          <Button
            variant={showAddForm ? 'secondary' : 'primary'}
            size="sm"
            onClick={() => setShowAddForm(!showAddForm)}
            icon={showAddForm ? <X size={15} /> : <Plus size={15} />}
          >
            {showAddForm ? 'Batal' : 'Tambah Item'}
          </Button>
        }
      />

      {showAddForm && (
        <Card className="bg-surface-sunken">
          <h3 className="text-lg font-bold text-ink mb-4">Tambah Item Layanan Baru</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nama Layanan"
              value={newItem.name}
              onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
              placeholder="Misal: Cuci Kemeja Regular"
              required
            />
            <Select
              label="Kategori"
              value={newItem.category}
              onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
              options={CATEGORIES}
            />
            <Input
              label="Harga"
              type="number"
              value={newItem.price}
              onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
              placeholder="5000"
              min="0"
              step="500"
              required
            />
            <Select
              label="Satuan"
              value={newItem.unit}
              onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
              options={UNITS}
            />
          </div>
          <div className="mt-4">
            <Textarea
              label="Deskripsi (Opsional)"
              value={newItem.description}
              onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
              rows={2}
              placeholder="Deskripsi tambahan untuk item ini..."
            />
          </div>
          <div className="flex gap-3 mt-6">
            <Button onClick={createServiceItem} icon={<Save size={15} />}>Simpan Item</Button>
            <Button variant="ghost" onClick={() => setShowAddForm(false)}>Batal</Button>
          </div>
        </Card>
      )}

      {serviceItems.length === 0 ? (
        <Card>
          <EmptyState title="Belum ada item layanan" description="Tambah item layanan pertama Anda." />
        </Card>
      ) : (
        <motion.div
          className="space-y-3"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {serviceItems.map((item) => (
            <motion.div key={item.id} variants={listItem}>
              <Card className={item.is_active ? undefined : 'border-danger/40 bg-danger-light/40'}>
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="text-lg font-semibold text-ink">{item.name}</h3>
                      <Badge variant={item.is_active ? 'success' : 'danger'}>
                        {item.is_active ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-semibold text-ink-muted">Kategori</span>
                        <div className="text-ink">{getCategoryLabel(item.category)}</div>
                      </div>
                      <div>
                        <span className="font-semibold text-ink-muted">Harga</span>
                        <div><Money value={item.price} /></div>
                      </div>
                      <div>
                        <span className="font-semibold text-ink-muted">Satuan</span>
                        <div className="text-ink">{getUnitLabel(item.unit)}</div>
                      </div>
                      <div>
                        <span className="font-semibold text-ink-muted">Dibuat</span>
                        <div className="text-ink tabular-nums">{new Date(item.created_at).toLocaleDateString('id-ID')}</div>
                      </div>
                    </div>
                    {item.description && (
                      <div className="mt-2 text-sm text-ink-muted">
                        <span className="font-semibold text-ink-muted">Deskripsi:</span> {item.description}
                      </div>
                    )}
                  </div>
                  <Button
                    variant={item.is_active ? 'danger' : 'primary'}
                    size="sm"
                    className="shrink-0"
                    onClick={() => toggleItemStatus(item.id, item.is_active)}
                  >
                    {item.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
};
