import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Search, UserPlus, X, Check } from 'lucide-react';
import type { Client } from '@mass-laundry/shared-types';
import { clientsApi } from '../../services/api';
import { Button, Input } from '../../components/ui';
import { staggerContainer, listItem } from '../../lib/motion';

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
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari pelanggan berdasarkan nama atau telepon..."
            aria-label="Cari pelanggan"
            startIcon={<Search size={16} />}
          />
        </div>
        <Button
          variant={showAddForm ? 'secondary' : 'primary'}
          onClick={() => setShowAddForm(!showAddForm)}
          icon={showAddForm ? <X size={16} /> : <UserPlus size={16} />}
          className="shrink-0"
        >
          {showAddForm ? 'Batal' : 'Tambah Baru'}
        </Button>
      </div>

      {showAddForm && (
        <div className="rounded-xl bg-surface-sunken border border-border p-4">
          <h3 className="font-semibold text-ink mb-3">Tambah Pelanggan Baru</h3>
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
          <div className="flex gap-2 mt-3">
            <Button onClick={addClient} disabled={!newClient.name || !newClient.phone} icon={<Check size={15} />}>
              Tambah Pelanggan
            </Button>
            <Button variant="ghost" onClick={() => setShowAddForm(false)}>Batal</Button>
          </div>
        </div>
      )}

      {selectedClient && (
        <div className="ring-gradient rounded-xl p-3.5">
          <div className="flex justify-between items-center gap-3">
            <div className="min-w-0">
              <span className="font-semibold text-ink">{selectedClient.name}</span>
              <span className="text-ink-muted ml-2">{selectedClient.phone}</span>
            </div>
            <Button variant="outline" size="sm" onClick={() => onClientSelect(null)}>Ubah</Button>
          </div>
        </div>
      )}

      {!selectedClient && clients.length > 0 && (
        <motion.div
          className="space-y-2 max-h-64 overflow-y-auto pr-1"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {clients.map((client) => (
            <motion.button
              key={client.id}
              variants={listItem}
              onClick={() => onClientSelect(client)}
              className="w-full text-left p-3 border border-border rounded-xl bg-surface hover:bg-surface-overlay hover:border-border-strong active:scale-[0.99] motion-reduce:active:scale-100 cursor-pointer transition-[background,border-color,transform] duration-[150ms] ease-out"
            >
              <div className="font-semibold text-ink">{client.name}</div>
              <div className="text-sm text-ink-muted">{client.phone}</div>
            </motion.button>
          ))}
        </motion.div>
      )}
    </div>
  );
};
