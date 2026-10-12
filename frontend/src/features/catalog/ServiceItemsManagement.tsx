import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Plus, X, Save, Trash2, RotateCcw } from 'lucide-react';
import type { Employee } from '@mass-laundry/shared-types';
import { apiClient } from '../../services/api';
import {
  Card, PageHeader, Button, Input, Select, Textarea, EmptyState, Money, SkeletonCard,
  Table, THead, TBody, Tr, Th, Td,
} from '../../components/ui';

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

  const hideSm = 'hidden sm:table-cell';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Item laundry"
        description="Daftar item layanan dan harganya."
        action={
          <Button
            variant={showAddForm ? 'secondary' : 'primary'}
            size="sm"
            className="min-h-11"
            onClick={() => setShowAddForm(!showAddForm)}
            icon={showAddForm ? <X size={15} /> : <Plus size={15} />}
          >
            {showAddForm ? 'Batal' : 'Tambah item'}
          </Button>
        }
      />

      <Card noPadding>
        {showAddForm && (
          <div className="border-b border-border-strong bg-surface-sunken px-4 py-4 md:px-5 space-y-4">
            <h2 className="text-lg font-bold tracking-tight text-ink">Item baru</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Nama layanan"
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                placeholder="mis. Cuci kemeja reguler"
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
            <Textarea
              label="Deskripsi (opsional)"
              value={newItem.description}
              onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
              rows={2}
              placeholder="Catatan tambahan untuk item ini"
            />
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setShowAddForm(false)}>Batal</Button>
              <Button onClick={createServiceItem} icon={<Save size={15} />}>Simpan item</Button>
            </div>
          </div>
        )}

        {serviceItems.length === 0 ? (
          <EmptyState
            title="Belum ada item layanan"
            description="Tambah item pertama untuk mulai membuat bon."
            action={!showAddForm && <Button size="sm" className="min-h-11" onClick={() => setShowAddForm(true)} icon={<Plus size={15} />}>Tambah item</Button>}
          />
        ) : (
          <Table>
            <THead>
              <Tr noHover>
                <Th>Nama</Th>
                <Th className={hideSm}>Kategori</Th>
                <Th className={hideSm}>Satuan</Th>
                <Th numeric>Harga</Th>
                <Th className="w-14"><span className="sr-only">Aksi</span></Th>
              </Tr>
            </THead>
            <TBody>
              {serviceItems.map((item) => (
                <Tr key={item.id} className={item.is_active ? undefined : 'opacity-60'}>
                  <Td className="font-semibold break-words">
                    {item.name}
                    {!item.is_active && <span className="ml-2 text-sm font-normal text-ink-muted">Nonaktif</span>}
                    {item.description && <span className="block text-sm font-normal text-ink-muted">{item.description}</span>}
                    <span className="block text-sm font-normal text-ink-muted sm:hidden">
                      {getCategoryLabel(item.category)} · {getUnitLabel(item.unit)}
                    </span>
                  </Td>
                  <Td className={`${hideSm} text-ink-muted`}>{getCategoryLabel(item.category)}</Td>
                  <Td className={`${hideSm} text-ink-muted`}>{getUnitLabel(item.unit)}</Td>
                  <Td numeric><Money value={item.price} /></Td>
                  <Td className="w-14 px-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="hover:text-danger"
                      aria-label={`${item.is_active ? 'Nonaktifkan' : 'Aktifkan'} ${item.name}`}
                      iconOnly
                      icon={item.is_active ? <Trash2 size={16} /> : <RotateCcw size={16} />}
                      onClick={() => toggleItemStatus(item.id, item.is_active)}
                    />
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        )}
      </Card>
    </div>
  );
};
