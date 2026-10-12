import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Search, UserPlus, X, Check } from 'lucide-react';
import type { Client } from '@mass-laundry/shared-types';
import { clientsApi } from '../../services/api';
import { Button, Input, EmptyState } from '../../components/ui';

export interface ClientSelectorProps {
  selectedClient: Client | null;
  onClientSelect: (client: Client | null) => void;
}

export const ClientSelector: React.FC<ClientSelectorProps> = ({ onClientSelect, selectedClient }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newClient, setNewClient] = useState({ name: '', phone: '' });

  useEffect(() => {
    if (searchTerm) {
      searchClients();
    } else {
      loadClients();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  const searchClients = async () => {
    try {
      const data = await clientsApi.search(searchTerm);
      setClients(data);
    } catch (err) {
      console.error('Error searching clients:', err);
    }
  };

  const loadClients = async () => {
    try {
      const data = await clientsApi.list();
      setClients(data.slice(0, 10));
    } catch (err) {
      console.error('Error loading clients:', err);
    }
  };

  const addClient = async () => {
    if (!newClient.name || !newClient.phone) return;
    try {
      const created = await clientsApi.create(newClient);
      setClients([created, ...clients]);
      setNewClient({ name: '', phone: '' });
      setShowAddForm(false);
      onClientSelect(created);
      toast.success('Pelanggan berhasil ditambahkan');
    } catch (err) {
      console.error('Error adding client:', err);
      toast.error('Gagal menambahkan pelanggan');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <div className="min-w-0 flex-1">
          <Input
            className="h-12"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari pelanggan berdasarkan nama atau telepon..."
            aria-label="Cari pelanggan"
            startIcon={<Search size={16} />}
          />
        </div>
        <Button
          variant="secondary"
          size="lg"
          onClick={() => setShowAddForm(!showAddForm)}
          icon={showAddForm ? <X size={16} /> : <UserPlus size={16} />}
          className="shrink-0"
        >
          {showAddForm ? 'Batal' : 'Tambah pelanggan'}
        </Button>
      </div>

      {showAddForm && (
        <div className="rounded-xl border border-border p-4">
          <h3 className="mb-3 font-semibold text-ink">Pelanggan baru</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              type="text"
              placeholder="Nama Pelanggan"
              aria-label="Nama pelanggan baru"
              value={newClient.name}
              onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
            />
            <Input
              type="text"
              placeholder="Nomor Telepon"
              aria-label="Nomor telepon pelanggan baru"
              value={newClient.phone}
              onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
            />
          </div>
          <div className="flex gap-3 mt-3">
            <Button onClick={addClient} disabled={!newClient.name || !newClient.phone} icon={<Check size={15} />}>
              Simpan pelanggan
            </Button>
            <Button variant="ghost" onClick={() => setShowAddForm(false)}>Batal</Button>
          </div>
        </div>
      )}

      {selectedClient && (
        <div className="rounded-xl border border-brand-600 bg-brand-50 p-4">
          <div className="flex justify-between items-center gap-3">
            <div className="min-w-0">
              <span className="flex items-center gap-2 font-semibold text-ink"><Check size={16} className="text-brand-700" />{selectedClient.name}</span>
              <span className="stamp block text-sm text-ink-muted">{selectedClient.phone}</span>
            </div>
            <Button variant="secondary" size="lg" onClick={() => onClientSelect(null)}>Ubah</Button>
          </div>
        </div>
      )}

      {!selectedClient && clients.length > 0 && (
        <div className="ledger max-h-[28rem] overflow-y-auto" aria-label="Daftar pelanggan">
          {clients.map((client) => (
            <button
              type="button"
              key={client.id}
              onClick={() => onClientSelect(client)}
              aria-pressed={false}
              className="ledger-row flex min-h-14 w-full items-center justify-between gap-4 px-2 py-2 text-left text-ink active:bg-surface-overlay"
            >
              <span className="min-w-0 truncate text-base font-semibold">{client.name}</span>
              <span className="stamp shrink-0 text-ink-muted">{client.phone}</span>
            </button>
          ))}
        </div>
      )}
      {!selectedClient && clients.length === 0 && (
        <EmptyState title="Belum ada pelanggan yang cocok" description="Coba nama atau nomor telepon lain, atau tambah pelanggan untuk mulai membuat bon." />
      )}
    </div>
  );
};
