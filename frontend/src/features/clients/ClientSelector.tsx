import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import type { Client } from '@mass-laundry/shared-types';
import { clientsApi } from '../../services/api';

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
      setClients(data.slice(0, 10)); // Show recent 10
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
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Cari pelanggan berdasarkan nama atau telepon..."
          aria-label="Cari pelanggan"
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          Tambah Baru
        </button>
      </div>

      {showAddForm && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium mb-3">Tambah Pelanggan Baru</h3>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Nama Pelanggan"
              aria-label="Nama pelanggan baru"
              value={newClient.name}
              onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="text"
              placeholder="Nomor Telepon"
              aria-label="Nomor telepon pelanggan baru"
              value={newClient.phone}
              onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={addClient}
              disabled={!newClient.name || !newClient.phone}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400"
            >
              Tambah Pelanggan
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {selectedClient && (
        <div className="bg-indigo-50 p-3 rounded-lg">
          <div className="flex justify-between items-center">
            <div>
              <span className="font-medium">{selectedClient.name}</span>
              <span className="text-gray-600 ml-2">{selectedClient.phone}</span>
            </div>
            <button
              onClick={() => onClientSelect(null)}
              className="text-indigo-600 hover:text-indigo-800"
            >
              Ubah
            </button>
          </div>
        </div>
      )}

      {!selectedClient && clients.length > 0 && (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {clients.map((client) => (
            <div
              key={client.id}
              onClick={() => onClientSelect(client)}
              className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <div className="font-medium">{client.name}</div>
              <div className="text-sm text-gray-600">{client.phone}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
