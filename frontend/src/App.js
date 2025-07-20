import React, { useState, useEffect } from 'react';
import './App.css';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Employee Login Component
const EmployeeLogin = ({ onLogin, employees }) => {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!pin) return;

    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API}/employees/login`, { pin });
      onLogin(response.data);
    } catch (err) {
      setError('PIN tidak valid. Silakan coba lagi.');
    } finally {
      setLoading(false);
      setPin('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full mx-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">🧺 LaundryPro</h1>
          <p className="text-gray-600">Akses Karyawan</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Masukkan PIN Anda
            </label>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-center text-xl font-mono"
              placeholder="••••"
              maxLength="4"
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !pin}
            className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Masuk...' : 'Masuk'}
          </button>
        </form>

        {employees.length === 0 && (
          <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
            <p className="text-sm text-yellow-800">
              Tidak ada karyawan ditemukan. Silakan tambah karyawan terlebih dahulu.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// Client Search/Add Component
const ClientSelector = ({ onClientSelect, selectedClient }) => {
  const [clients, setClients] = useState([]);
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
      const response = await axios.get(`${API}/clients/search?q=${searchTerm}`);
      setClients(response.data);
    } catch (err) {
      console.error('Error searching clients:', err);
    }
  };

  const loadClients = async () => {
    try {
      const response = await axios.get(`${API}/clients`);
      setClients(response.data.slice(0, 10)); // Show recent 10
    } catch (err) {
      console.error('Error loading clients:', err);
    }
  };

  const addClient = async () => {
    if (!newClient.name || !newClient.phone) return;

    try {
      const response = await axios.post(`${API}/clients`, newClient);
      setClients([response.data, ...clients]);
      setNewClient({ name: '', phone: '' });
      setShowAddForm(false);
      onClientSelect(response.data);
    } catch (err) {
      console.error('Error adding client:', err);
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
              value={newClient.name}
              onChange={(e) => setNewClient({...newClient, name: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="text"
              placeholder="Nomor Telepon"
              value={newClient.phone}
              onChange={(e) => setNewClient({...newClient, phone: e.target.value})}
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

// Receipt Creation Component
const ReceiptForm = ({ employee, client, onReceiptCreated }) => {
  const [items, setItems] = useState([
    { service: 'wash', item_type: 'shirt', quantity: 1, price_per_item: 10, total_price: 10 }
  ]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const serviceOptions = [
    { value: 'wash', label: 'Cuci Saja' },
    { value: 'dry_clean', label: 'Dry Clean' },
    { value: 'wash_iron', label: 'Cuci & Setrika' },
    { value: 'iron_only', label: 'Setrika Saja' }
  ];

  const itemTypes = [
    { value: 'shirt', label: 'Kemeja' },
    { value: 'pants', label: 'Celana' },
    { value: 'dress', label: 'Gaun' },
    { value: 'suit', label: 'Jas' },
    { value: 'jacket', label: 'Jaket' },
    { value: 'skirt', label: 'Rok' },
    { value: 'blouse', label: 'Blus' },
    { value: 'curtains', label: 'Gorden' },
    { value: 'bedsheet', label: 'Seprai' },
    { value: 'other', label: 'Lainnya' }
  ];

  const updateItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    
    if (field === 'quantity' || field === 'price_per_item') {
      newItems[index].total_price = newItems[index].quantity * newItems[index].price_per_item;
    }
    
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, {
      service: 'wash',
      item_type: 'shirt',
      quantity: 1,
      price_per_item: 10,
      total_price: 10
    }]);
  };

  const removeItem = (index) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.total_price, 0);
  };

  const createReceipt = async () => {
    setLoading(true);
    try {
      const receiptData = {
        client_id: client.id,
        employee_id: employee.id,
        items,
        notes: notes || null
      };

      const response = await axios.post(`${API}/receipts`, receiptData);
      
      // Show success message with option to print
      const shouldPrint = window.confirm(
        `Bon berhasil dibuat!\n\nApakah Anda ingin mencetak bon untuk ${client.name}?`
      );
      
      if (shouldPrint) {
        // Get print data and print
        try {
          const printResponse = await axios.get(`${API}/receipts/${response.data.id}/print`);
          
          // Create a temporary print window
          const printWindow = window.open('', '_blank', 'width=800,height=600');
          printWindow.document.write(`
            <!DOCTYPE html>
            <html>
              <head>
                <title>Bon - ${client.name}</title>
                <style>
                  body { font-family: Arial, sans-serif; margin: 20px; }
                  .header { text-center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
                  .header h1 { margin: 0; font-size: 24px; }
                  .header h2 { margin: 5px 0; font-size: 16px; color: #666; }
                  .info { display: flex; justify-content: space-between; margin-bottom: 20px; }
                  .info div { flex: 1; }
                  table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                  th, td { border: 1px solid #333; padding: 8px; text-align: left; }
                  th { background-color: #f0f0f0; font-weight: bold; }
                  .total { border-top: 2px solid #333; margin-top: 20px; padding-top: 10px; text-align: right; }
                  .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
                </style>
              </head>
              <body>
                <div class="header">
                  <h1>🧺 LaundryPro</h1>
                  <h2>Layanan Laundry Profesional</h2>
                  <p>Jl. Bersih No. 123, Kota Laundry, LC 12345<br>Telepon: (021) LAUNDRY</p>
                </div>
                
                <div class="info">
                  <div>
                    <strong>ID Bon:</strong> #${printResponse.data.receipt_id.slice(-8).toUpperCase()}<br>
                    <strong>Tanggal:</strong> ${new Date(printResponse.data.created_at).toLocaleString('id-ID')}<br>
                    <strong>Status:</strong> ${printResponse.data.status}
                  </div>
                  <div>
                    <strong>Pelanggan:</strong> ${printResponse.data.client_name}<br>
                    <strong>Telepon:</strong> ${printResponse.data.client_phone}<br>
                    <strong>Dilayani:</strong> ${printResponse.data.employee_name}
                  </div>
                </div>
                
                <table>
                  <thead>
                    <tr>
                      <th>Layanan</th>
                      <th>Barang</th>
                      <th>Qty</th>
                      <th>Harga</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${printResponse.data.items.map(item => `
                      <tr>
                        <td>${item.service.replace('_', ' ')}</td>
                        <td>${item.item_type}</td>
                        <td style="text-align: center;">${item.quantity}</td>
                        <td style="text-align: right;">Rp${item.price_per_item.toLocaleString('id-ID')}</td>
                        <td style="text-align: right;">Rp${item.total_price.toLocaleString('id-ID')}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
                
                <div class="total">
                  <h3>TOTAL BAYAR: Rp${printResponse.data.total_amount.toLocaleString('id-ID')}</h3>
                </div>
                
                ${printResponse.data.notes ? `
                  <div style="margin: 20px 0; padding: 10px; background: #f9f9f9; border-left: 4px solid #333;">
                    <strong>Instruksi Khusus:</strong><br>
                    ${printResponse.data.notes}
                  </div>
                ` : ''}
                
                <div class="footer">
                  <p>Terima kasih telah memilih LaundryPro!</p>
                  <p>Simpan bon ini untuk pengambilan</p>
                  <p>Pertanyaan? Hubungi: (021) LAUNDRY</p>
                  <p>Dicetak pada: ${new Date().toLocaleString('id-ID')}</p>
                </div>
              </body>
            </html>
          `);
          
          printWindow.document.close();
          printWindow.focus();
          
          // Wait a bit for content to load, then print
          setTimeout(() => {
            printWindow.print();
            printWindow.close();
          }, 1000);
          
        } catch (printErr) {
          console.error('Error printing receipt:', printErr);
          alert('Bon berhasil dibuat tapi tidak dapat dicetak. Anda bisa cetak nanti dari daftar bon.');
        }
      }
      
      onReceiptCreated();
    } catch (err) {
      console.error('Error creating receipt:', err);
      alert('Error membuat bon. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Bon Baru</h2>
        <div className="text-right">
          <div className="text-sm text-gray-600">Karyawan: {employee.name}</div>
          <div className="text-sm text-gray-600">Pelanggan: {client.name}</div>
        </div>
      </div>

      <div className="space-y-4">
        {items.map((item, index) => (
          <div key={index} className="grid grid-cols-12 gap-3 p-4 bg-gray-50 rounded-lg">
            <div className="col-span-3">
              <label className="block text-xs font-medium text-gray-700 mb-1">Layanan</label>
              <select
                value={item.service}
                onChange={(e) => updateItem(index, 'service', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
              >
                {serviceOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Barang</label>
              <select
                value={item.item_type}
                onChange={(e) => updateItem(index, 'item_type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
              >
                {itemTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Qty</label>
              <input
                type="number"
                min="1"
                value={item.quantity}
                onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Harga</label>
              <input
                type="number"
                min="0"
                step="500"
                value={item.price_per_item}
                onChange={(e) => updateItem(index, 'price_per_item', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Total</label>
              <div className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-sm font-medium">
                Rp{item.total_price.toLocaleString('id-ID')}
              </div>
            </div>

            <div className="col-span-1 flex items-end">
              <button
                onClick={() => removeItem(index)}
                disabled={items.length === 1}
                className="w-full px-2 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
              >
                ×
              </button>
            </div>
          </div>
        ))}

        <button
          onClick={addItem}
          className="w-full py-3 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-indigo-400 hover:text-indigo-600 transition-colors"
        >
          + Tambah Item
        </button>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Catatan (Opsional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Instruksi khusus, tanggal ambil, dll."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            rows="3"
          />
        </div>

        <div className="border-t pt-4">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xl font-bold">Total Bayar:</span>
            <span className="text-2xl font-bold text-indigo-600">Rp{calculateTotal().toLocaleString('id-ID')}</span>
          </div>

          <button
            onClick={createReceipt}
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Membuat Bon...' : 'Buat Bon'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Print Receipt Component
const PrintReceipt = ({ receiptData, onClose }) => {
  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 print:bg-white print:relative print:inset-auto print:overflow-visible">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white print:shadow-none print:border-none print:top-0 print:max-w-none">
        
        {/* Print Header - Only show on screen */}
        <div className="flex justify-between items-center mb-6 no-print">
          <h2 className="text-xl font-bold">Print Receipt</h2>
          <div className="space-x-2">
            <button
              onClick={handlePrint}
              className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
            >
              🖨️ Print
            </button>
            <button
              onClick={onClose}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
            >
              Close
            </button>
          </div>
        </div>

        {/* Receipt Content */}
        <div className="receipt-content bg-white p-8 print:p-0">
          {/* Business Header */}
          <div className="text-center border-b-2 border-gray-300 pb-4 mb-6">
            <h1 className="text-3xl font-bold text-gray-800">🧺 LaundryPro</h1>
            <h2 className="text-lg font-semibold text-gray-600">Professional Laundry Services</h2>
            <p className="text-sm text-gray-500">123 Clean Street, Laundry City, LC 12345</p>
            <p className="text-sm text-gray-500">Phone: (555) LAUNDRY</p>
          </div>

          {/* Receipt Info */}
          <div className="grid grid-cols-2 gap-6 mb-6 text-sm">
            <div>
              <p><strong>Receipt ID:</strong> #{receiptData.receipt_id.slice(-8).toUpperCase()}</p>
              <p><strong>Date:</strong> {formatDateTime(receiptData.created_at)}</p>
              <p><strong>Status:</strong> <span className="capitalize">{receiptData.status}</span></p>
            </div>
            <div>
              <p><strong>Customer:</strong> {receiptData.client_name}</p>
              <p><strong>Phone:</strong> {receiptData.client_phone}</p>
              <p><strong>Served by:</strong> {receiptData.employee_name}</p>
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-6">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-300">
                  <th className="text-left py-2 font-semibold">Service</th>
                  <th className="text-left py-2 font-semibold">Item</th>
                  <th className="text-center py-2 font-semibold">Qty</th>
                  <th className="text-right py-2 font-semibold">Price</th>
                  <th className="text-right py-2 font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {receiptData.items.map((item, index) => (
                  <tr key={index} className="border-b border-gray-200">
                    <td className="py-2 capitalize">{item.service.replace('_', ' ')}</td>
                    <td className="py-2 capitalize">{item.item_type}</td>
                    <td className="py-2 text-center">{item.quantity}</td>
                    <td className="py-2 text-right">${item.price_per_item.toFixed(2)}</td>
                    <td className="py-2 text-right font-semibold">${item.total_price.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Total */}
          <div className="border-t-2 border-gray-300 pt-4 mb-6">
            <div className="flex justify-between items-center">
              <span className="text-xl font-bold">TOTAL AMOUNT:</span>
              <span className="text-2xl font-bold text-green-600">${receiptData.total_amount.toFixed(2)}</span>
            </div>
          </div>

          {/* Notes */}
          {receiptData.notes && (
            <div className="mb-6 p-3 bg-gray-50 rounded print:bg-white print:border">
              <p className="text-sm"><strong>Special Instructions:</strong></p>
              <p className="text-sm">{receiptData.notes}</p>
            </div>
          )}

          {/* Footer */}
          <div className="text-center text-sm text-gray-500 border-t border-gray-200 pt-4">
            <p className="mb-2">Thank you for choosing LaundryPro!</p>
            <p className="mb-1">Please keep this receipt for pickup</p>
            <p className="mb-1">Questions? Call us at (555) LAUNDRY</p>
            <p className="text-xs">Printed on: {formatDateTime(receiptData.print_timestamp)}</p>
          </div>

          {/* Deleted Receipt Warning */}
          {receiptData.is_deleted && (
            <div className="mt-4 p-3 bg-red-100 border border-red-400 rounded text-center">
              <p className="text-red-700 font-bold">⚠️ THIS RECEIPT HAS BEEN CANCELLED ⚠️</p>
              <p className="text-red-600 text-sm">This is a copy for record purposes only</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
const AuditDashboard = ({ employee }) => {
  const [auditData, setAuditData] = useState(null);
  const [deletedReceipts, setDeletedReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeAuditTab, setActiveAuditTab] = useState('summary');

  useEffect(() => {
    loadAuditData();
  }, []);

  const loadAuditData = async () => {
    try {
      const [summaryResponse, deletedResponse] = await Promise.all([
        axios.get(`${API}/audit/receipts-by-employee?include_deleted=true`),
        axios.get(`${API}/audit/deleted-receipts`)
      ]);
      
      setAuditData(summaryResponse.data);
      setDeletedReceipts(deletedResponse.data);
    } catch (err) {
      console.error('Error loading audit data:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return <div className="text-center py-8">Loading audit data...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">🔍 Fraud Prevention Audit Dashboard</h2>
        
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 mb-6">
          <button
            onClick={() => setActiveAuditTab('summary')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeAuditTab === 'summary' 
                ? 'bg-white text-indigo-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Employee Summary
          </button>
          <button
            onClick={() => setActiveAuditTab('deleted')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeAuditTab === 'deleted' 
                ? 'bg-white text-indigo-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Deleted Receipts
          </button>
        </div>

        {activeAuditTab === 'summary' && (
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <h3 className="font-medium text-blue-900 mb-2">🛡️ Anti-Fraud Features Active</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>✅ Every receipt creation is permanently linked to employee</li>
                <li>✅ All deletions are tracked with reasons and timestamps</li>
                <li>✅ Complete audit trail prevents unauthorized changes</li>
                <li>✅ Employee activity monitoring and reporting</li>
              </ul>
            </div>

            {auditData && auditData.length > 0 ? (
              <div className="grid gap-4">
                {auditData.map((empData) => (
                  <div key={empData._id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">{empData.employee_name}</h3>
                        <p className="text-sm text-gray-600">Employee ID: {empData._id}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">
                          ${empData.total_amount.toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-600">
                          {empData.total_receipts} receipts • {empData.deleted_receipts} deleted
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-3">
                      <h4 className="font-medium mb-2">Recent Activity:</h4>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {empData.receipts.slice(0, 5).map((receipt, index) => (
                          <div key={index} className={`flex justify-between text-sm ${
                            receipt.is_deleted ? 'text-red-600' : 'text-gray-700'
                          }`}>
                            <span>
                              {receipt.is_deleted ? '🗑️ ' : '📝 '}
                              {receipt.client_name} - ${receipt.total_amount.toFixed(2)}
                            </span>
                            <span className="text-xs">
                              {formatDateTime(receipt.created_at)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No audit data available yet. Create some receipts to see employee activity.
              </div>
            )}
          </div>
        )}

        {activeAuditTab === 'deleted' && (
          <div className="space-y-4">
            <div className="bg-red-50 p-4 rounded-lg mb-6">
              <h3 className="font-medium text-red-900 mb-2">🗑️ Deleted Receipts Audit Trail</h3>
              <p className="text-sm text-red-800">
                All deleted receipts are preserved for fraud prevention. This ensures complete transparency 
                and prevents employees from hiding transactions.
              </p>
            </div>

            {deletedReceipts.length > 0 ? (
              <div className="space-y-4">
                {deletedReceipts.map((receipt) => (
                  <div key={receipt.id} className="border border-red-200 bg-red-50 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">{receipt.client_name}</h3>
                        <p className="text-sm text-gray-600">{receipt.client_phone}</p>
                        <div className="text-xs text-gray-500 space-y-1">
                          <p>📝 Created by: {receipt.employee_name} • {formatDateTime(receipt.created_at)}</p>
                          <p className="text-red-600">
                            🗑️ Deleted by: {receipt.deleted_by_employee_name} • {formatDateTime(receipt.deleted_at)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-red-600">${receipt.total_amount.toFixed(2)}</div>
                        <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          DELETED
                        </span>
                      </div>
                    </div>

                    {receipt.deletion_reason && (
                      <div className="mb-3 p-3 bg-yellow-50 rounded-lg">
                        <p className="text-sm">
                          <strong>Deletion Reason:</strong> {receipt.deletion_reason}
                        </p>
                      </div>
                    )}

                    <div className="mb-3">
                      <h4 className="text-sm font-medium mb-2">Items:</h4>
                      <div className="space-y-1">
                        {receipt.items.map((item, index) => (
                          <div key={index} className="text-sm text-gray-600 flex justify-between">
                            <span>{item.quantity}x {item.item_type} ({item.service})</span>
                            <span>${item.total_price.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No deleted receipts found. This is good - it means no receipts have been deleted.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
const RecentReceipts = ({ employee }) => {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeleted, setShowDeleted] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [receiptToDelete, setReceiptToDelete] = useState(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [printReceiptData, setPrintReceiptData] = useState(null);

  useEffect(() => {
    loadReceipts();
  }, [showDeleted]);

  const loadReceipts = async () => {
    try {
      const response = await axios.get(`${API}/receipts?limit=50&include_deleted=${showDeleted}`);
      setReceipts(response.data);
    } catch (err) {
      console.error('Error loading receipts:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (receiptId, newStatus) => {
    try {
      await axios.put(`${API}/receipts/${receiptId}/status?status=${newStatus}&employee_id=${employee.id}`);
      loadReceipts(); // Refresh
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Error updating status. Please try again.');
    }
  };

  const openDeleteModal = (receipt) => {
    setReceiptToDelete(receipt);
    setDeleteModalOpen(true);
    setDeleteReason('');
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setReceiptToDelete(null);
    setDeleteReason('');
  };

  const confirmDelete = async () => {
    if (!deleteReason.trim()) {
      alert('Please provide a reason for deletion');
      return;
    }

    try {
      await axios.delete(`${API}/receipts/${receiptToDelete.id}`, {
        data: {
          employee_id: employee.id,
          deletion_reason: deleteReason
        }
      });
      
      closeDeleteModal();
      loadReceipts(); // Refresh
      alert('Receipt deleted successfully');
    } catch (err) {
      console.error('Error deleting receipt:', err);
      alert('Error deleting receipt. Please try again.');
    }
  };

  const openPrintModal = async (receipt) => {
    try {
      const response = await axios.get(`${API}/receipts/${receipt.id}/print`);
      setPrintReceiptData(response.data);
      setPrintModalOpen(true);
    } catch (err) {
      console.error('Error loading print data:', err);
      alert('Error preparing receipt for print. Please try again.');
    }
  };

  const closePrintModal = () => {
    setPrintModalOpen(false);
    setPrintReceiptData(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'ready': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'deleted': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return <div className="text-center py-8">Loading receipts...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Receipt Management</h2>
        
        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={showDeleted}
              onChange={(e) => setShowDeleted(e.target.checked)}
              className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500"
            />
            <span className="text-sm text-gray-700">Show Deleted</span>
          </label>
        </div>
      </div>
      
      <div className="space-y-4">
        {receipts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {showDeleted ? 'No deleted receipts found.' : 'No receipts found. Create your first receipt!'}
          </div>
        ) : (
          receipts.map((receipt) => (
            <div key={receipt.id} className={`border rounded-lg p-4 transition-shadow ${
              receipt.is_deleted ? 'border-red-200 bg-red-50' : 'border-gray-200 hover:shadow-md'
            }`}>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-lg">{receipt.client_name}</h3>
                  <p className="text-sm text-gray-600">{receipt.client_phone}</p>
                  <p className="text-xs text-gray-500">
                    Created by: {receipt.employee_name} • {formatDateTime(receipt.created_at)}
                  </p>
                  {receipt.is_deleted && receipt.deleted_at && (
                    <p className="text-xs text-red-600 font-medium">
                      🗑️ Deleted by: {receipt.deleted_by_employee_name} • {formatDateTime(receipt.deleted_at)}
                      {receipt.deletion_reason && ` • Reason: ${receipt.deletion_reason}`}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-green-600">${receipt.total_amount.toFixed(2)}</div>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(receipt.status)}`}>
                    {receipt.status}
                  </span>
                </div>
              </div>

              <div className="mb-3">
                <h4 className="text-sm font-medium mb-2">Items:</h4>
                <div className="space-y-1">
                  {receipt.items.map((item, index) => (
                    <div key={index} className="text-sm text-gray-600 flex justify-between">
                      <span>{item.quantity}x {item.item_type} ({item.service})</span>
                      <span>${item.total_price.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {receipt.notes && (
                <div className="mb-3 text-sm text-gray-600">
                  <strong>Notes:</strong> {receipt.notes}
                </div>
              )}

              <div className="flex gap-2 flex-wrap">
                {/* Print button - always available */}
                <button
                  onClick={() => openPrintModal(receipt)}
                  className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
                >
                  🖨️ Print
                </button>

                {/* Status management buttons - only for non-deleted receipts */}
                {!receipt.is_deleted && (
                  <>
                    {receipt.status === 'pending' && (
                      <button
                        onClick={() => updateStatus(receipt.id, 'ready')}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                      >
                        Mark Ready
                      </button>
                    )}
                    {receipt.status === 'ready' && (
                      <button
                        onClick={() => updateStatus(receipt.id, 'completed')}
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                      >
                        Complete
                      </button>
                    )}
                    {receipt.status !== 'completed' && (
                      <button
                        onClick={() => openDeleteModal(receipt)}
                        className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                      >
                        Delete
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Delete Receipt</h3>
              
              <div className="mb-4 p-3 bg-yellow-50 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>⚠️ Important:</strong> This action will be tracked for audit purposes. 
                  The receipt will be marked as deleted but kept in the system for fraud prevention.
                </p>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-700 mb-2">
                  <strong>Receipt:</strong> {receiptToDelete?.client_name} - ${receiptToDelete?.total_amount.toFixed(2)}
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for deletion: <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  placeholder="e.g., Wrong client, incorrect amount, duplicate entry..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  rows="3"
                  required
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={confirmDelete}
                  disabled={!deleteReason.trim()}
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Delete Receipt
                </button>
                <button
                  onClick={closeDeleteModal}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Print Modal */}
      {printModalOpen && printReceiptData && (
        <PrintReceipt
          receiptData={printReceiptData}
          onClose={closePrintModal}
        />
      )}
    </div>
  );
};

// Main App Component
function App() {
  const [currentEmployee, setCurrentEmployee] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [activeTab, setActiveTab] = useState('create');

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      const response = await axios.get(`${API}/employees`);
      setEmployees(response.data);
    } catch (err) {
      console.error('Error loading employees:', err);
    }
  };

  const handleLogin = (employee) => {
    setCurrentEmployee(employee);
  };

  const handleLogout = () => {
    setCurrentEmployee(null);
    setSelectedClient(null);
    setActiveTab('create');
  };

  const handleReceiptCreated = () => {
    setSelectedClient(null);
    setActiveTab('receipts');
    // Could add success notification here
  };

  if (!currentEmployee) {
    return <EmployeeLogin onLogin={handleLogin} employees={employees} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-indigo-600">🧺 LaundryPro</h1>
              <span className="text-gray-500">|</span>
              <span className="text-gray-700">Selamat datang, {currentEmployee.name}</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setActiveTab('create')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'create' 
                      ? 'bg-white text-indigo-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Bon Baru
                </button>
                <button
                  onClick={() => setActiveTab('receipts')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'receipts' 
                      ? 'bg-white text-indigo-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Semua Bon
                </button>
                <button
                  onClick={() => setActiveTab('audit')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'audit' 
                      ? 'bg-white text-indigo-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  🔍 Jejak Audit
                </button>
              </div>
              
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-800 transition-colors"
              >
                Keluar
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'create' && (
          <div className="space-y-8">
            {!selectedClient ? (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Select or Add Client</h2>
                <ClientSelector onClientSelect={setSelectedClient} selectedClient={selectedClient} />
              </div>
            ) : (
              <ReceiptForm 
                employee={currentEmployee} 
                client={selectedClient} 
                onReceiptCreated={handleReceiptCreated}
              />
            )}
          </div>
        )}

        {activeTab === 'receipts' && (
          <RecentReceipts employee={currentEmployee} />
        )}

        {activeTab === 'audit' && (
          <AuditDashboard employee={currentEmployee} />
        )}
      </main>
    </div>
  );
}

export default App;