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
        
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500 mb-3">Belum punya akses admin?</p>
          <button 
            onClick={() => alert('Hubungi administrator sistem untuk mendapatkan kode admin')}
            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium underline transition-colors"
          >
            Daftar sebagai Admin
          </button>
        </div>
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
    { service_item_id: '', service_name: '', item_type: 'shirt', quantity: 1, price_per_item: 10, total_price: 10 }
  ]);
  const [notes, setNotes] = useState('');
  const [discount, setDiscount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [serviceItems, setServiceItems] = useState([]);
  const [loadingServices, setLoadingServices] = useState(true);

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

  useEffect(() => {
    loadServiceItems();
  }, []);

  const loadServiceItems = async () => {
    try {
      const response = await axios.get(`${API}/service-items?active_only=true`);
      setServiceItems(response.data);
      
      // Update first item with first service if available
      if (response.data.length > 0) {
        const firstService = response.data[0];
        setItems([{
          service_item_id: firstService.id,
          service_name: firstService.name,
          item_type: 'shirt',
          quantity: 1,
          price_per_item: firstService.price,
          total_price: firstService.price
        }]);
      }
    } catch (err) {
      console.error('Error loading service items:', err);
    } finally {
      setLoadingServices(false);
    }
  };

  const updateItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    
    // If service changed, update price and service name
    if (field === 'service_item_id') {
      const selectedService = serviceItems.find(s => s.id === value);
      if (selectedService) {
        newItems[index].service_name = selectedService.name;
        newItems[index].price_per_item = selectedService.price;
        newItems[index].total_price = newItems[index].quantity * selectedService.price;
      }
    }
    
    if (field === 'quantity' || field === 'price_per_item') {
      newItems[index].total_price = newItems[index].quantity * newItems[index].price_per_item;
    }
    
    setItems(newItems);
  };

  const addItem = () => {
    const firstService = serviceItems[0] || { id: '', name: '', price: 10 };
    setItems([...items, {
      service_item_id: firstService.id,
      service_name: firstService.name,
      item_type: 'shirt',
      quantity: 1,
      price_per_item: firstService.price,
      total_price: firstService.price
    }]);
  };

  const removeItem = (index) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + item.total_price, 0);
  };

  const calculateDiscountAmount = () => {
    return calculateSubtotal() * (discount / 100);
  };

  const calculateTotal = () => {
    return calculateSubtotal() - calculateDiscountAmount();
  };

  const createReceipt = async () => {
    setLoading(true);
    try {
      // Convert items to the format expected by backend
      const backendItems = items.map(item => ({
        service: item.service_name,
        item_type: item.item_type,
        quantity: item.quantity,
        price_per_item: item.price_per_item,
        total_price: item.total_price
      }));

      const receiptData = {
        client_id: client.id,
        employee_id: employee.id,
        items: backendItems,
        discount_percent: discount,
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
                  ${printResponse.data.logo_url ? `<img src="${printResponse.data.logo_url}" alt="Logo" style="height: 60px; margin-bottom: 10px;">` : ''}
                  <h1>${printResponse.data.business_name}</h1>
                  <h2>Layanan Laundry Profesional</h2>
                  <p>${printResponse.data.business_address}<br>Telepon: ${printResponse.data.business_phone}</p>
                  ${printResponse.data.business_email ? `<p>Email: ${printResponse.data.business_email}</p>` : ''}
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
                        <td>${item.service}</td>
                        <td>${item.item_type}</td>
                        <td style="text-align: center;">${item.quantity}</td>
                        <td style="text-align: right;">Rp${item.price_per_item.toLocaleString('id-ID')}</td>
                        <td style="text-align: right;">Rp${item.total_price.toLocaleString('id-ID')}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
                
                <div class="total">
                  <p>Subtotal: Rp${(printResponse.data.subtotal || printResponse.data.total_amount).toLocaleString('id-ID')}</p>
                  ${printResponse.data.discount_amount ? `<p>Diskon (${printResponse.data.discount_percent}%): -Rp${printResponse.data.discount_amount.toLocaleString('id-ID')}</p>` : ''}
                  <h3>TOTAL BAYAR: Rp${printResponse.data.total_amount.toLocaleString('id-ID')}</h3>
                </div>
                
                ${printResponse.data.notes ? `
                  <div style="margin: 20px 0; padding: 10px; background: #f9f9f9; border-left: 4px solid #333;">
                    <strong>Instruksi Khusus:</strong><br>
                    ${printResponse.data.notes}
                  </div>
                ` : ''}
                
                <div class="footer">
                  ${printResponse.data.footer_notes.split('•').map(note => `<p>${note.trim()}</p>`).join('')}
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

  if (loadingServices) {
    return <div className="text-center py-8">Memuat layanan...</div>;
  }

  if (serviceItems.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center py-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Belum Ada Layanan</h3>
          <p className="text-gray-600 mb-6">
            Anda perlu menambahkan layanan laundry terlebih dahulu sebelum membuat bon.
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Pergi ke menu "🧽 Kelola Layanan" untuk menambahkan layanan seperti:
            <br />• Cuci Kemeja - Rp 8.000
            <br />• Setrika Celana - Rp 5.000
            <br />• Dry Clean Jas - Rp 25.000
          </p>
        </div>
      </div>
    );
  }

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
            <div className="col-span-4">
              <label className="block text-xs font-medium text-gray-700 mb-1">Layanan</label>
              <select
                value={item.service_item_id}
                onChange={(e) => updateItem(index, 'service_item_id', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
              >
                {serviceItems.map(service => (
                  <option key={service.id} value={service.id}>
                    {service.name} - Rp{service.price.toLocaleString('id-ID')}/{service.unit}
                  </option>
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

            <div className="col-span-1">
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

        {/* Discount Section */}
        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Diskon (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={discount}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Jumlah Diskon</label>
              <div className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg font-medium">
                Rp{calculateDiscountAmount().toLocaleString('id-ID')}
              </div>
            </div>
          </div>
        </div>

        <div className="border-t pt-4 bg-gray-50 p-4 rounded-lg">
          <div className="space-y-2 text-right">
            <div className="flex justify-between items-center">
              <span className="text-lg">Subtotal:</span>
              <span className="text-lg font-semibold">Rp{calculateSubtotal().toLocaleString('id-ID')}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between items-center text-red-600">
                <span>Diskon ({discount}%):</span>
                <span>-Rp{calculateDiscountAmount().toLocaleString('id-ID')}</span>
              </div>
            )}
            <div className="flex justify-between items-center border-t pt-2">
              <span className="text-xl font-bold">Total Bayar:</span>
              <span className="text-2xl font-bold text-indigo-600">Rp{calculateTotal().toLocaleString('id-ID')}</span>
            </div>
          </div>

          <button
            onClick={createReceipt}
            disabled={loading}
            className="w-full mt-4 bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
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
            {receiptData.logo_url && (
              <img src={receiptData.logo_url} alt="Logo" className="h-16 mx-auto mb-3" />
            )}
            <h1 className="text-3xl font-bold text-gray-800">{receiptData.business_name}</h1>
            <h2 className="text-lg font-semibold text-gray-600">Layanan Laundry Profesional</h2>
            <p className="text-sm text-gray-500">{receiptData.business_address}</p>
            <p className="text-sm text-gray-500">Telepon: {receiptData.business_phone}</p>
            {receiptData.business_email && (
              <p className="text-sm text-gray-500">Email: {receiptData.business_email}</p>
            )}
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
            {receiptData.footer_notes.split('•').map((note, index) => (
              <p key={index} className="mb-1">{note.trim()}</p>
            ))}
            <p className="text-xs mt-2">Dicetak pada: {formatDateTime(receiptData.print_timestamp)}</p>
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

// Settings Management Component
const LaundrySettings = ({ employee }) => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('business');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await axios.get(`${API}/settings`);
      setSettings(response.data);
    } catch (err) {
      console.error('Error loading settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (updatedData) => {
    setSaving(true);
    try {
      const response = await axios.put(`${API}/settings`, updatedData);
      setSettings(response.data);
      alert('Pengaturan berhasil disimpan!');
    } catch (err) {
      console.error('Error updating settings:', err);
      alert('Error menyimpan pengaturan. Silakan coba lagi.');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const saveSettings = () => {
    const updateData = {
      business_name: settings.business_name,
      business_address: settings.business_address,
      business_phone: settings.business_phone,
      business_email: settings.business_email,
      logo_url: settings.logo_url,
      footer_notes: settings.footer_notes
    };
    updateSettings(updateData);
  };

  if (loading) {
    return <div className="text-center py-8">Memuat pengaturan...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">⚙️ Pengaturan Laundry</h2>

      <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 mb-6">
        <button
          onClick={() => setActiveTab('business')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'business' 
              ? 'bg-white text-indigo-600 shadow-sm' 
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Info Bisnis
        </button>
        <button
          onClick={() => setActiveTab('receipt')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'receipt' 
              ? 'bg-white text-indigo-600 shadow-sm' 
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Pengaturan Struk
        </button>
      </div>

      {activeTab === 'business' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nama Bisnis <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={settings.business_name}
                onChange={(e) => handleInputChange('business_name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="LaundryPro"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nomor Telepon <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={settings.business_phone}
                onChange={(e) => handleInputChange('business_phone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="(021) 1234-5678"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Alamat Bisnis <span className="text-red-500">*</span>
            </label>
            <textarea
              value={settings.business_address}
              onChange={(e) => handleInputChange('business_address', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              rows="3"
              placeholder="Jl. Bersih No. 123, Kota Laundry"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Bisnis
            </label>
            <input
              type="email"
              value={settings.business_email}
              onChange={(e) => handleInputChange('business_email', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="info@laundrypro.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              URL Logo (Opsional)
            </label>
            <input
              type="url"
              value={settings.logo_url || ''}
              onChange={(e) => handleInputChange('logo_url', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="https://example.com/logo.png"
            />
            <p className="text-xs text-gray-500 mt-1">
              Masukkan URL gambar logo untuk ditampilkan di struk
            </p>
          </div>
        </div>
      )}

      {activeTab === 'receipt' && (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Catatan Kaki Struk
            </label>
            <textarea
              value={settings.footer_notes}
              onChange={(e) => handleInputChange('footer_notes', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              rows="4"
              placeholder="Terima kasih atas kepercayaan Anda • Jam operasional: 07:00-21:00 • Komplain maks 1x24 jam"
            />
            <p className="text-xs text-gray-500 mt-1">
              Catatan ini akan muncul di bagian bawah setiap struk. Gunakan • untuk memisahkan informasi.
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium mb-3">Pratinjau Catatan Kaki:</h3>
            <div className="text-sm text-gray-600 text-center border-t border-gray-200 pt-3">
              {settings.footer_notes.split('•').map((note, index) => (
                <p key={index} className="mb-1">{note.trim()}</p>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end pt-6 border-t">
        <button
          onClick={saveSettings}
          disabled={saving}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
        </button>
      </div>
    </div>
  );
};

// Service Items Management Component
const ServiceItemsManagement = ({ employee }) => {
  const [serviceItems, setServiceItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '',
    category: 'wash',
    price: '',
    unit: 'pcs',
    description: ''
  });

  const categories = [
    { value: 'wash', label: 'Cuci' },
    { value: 'dry_clean', label: 'Dry Clean' },
    { value: 'iron', label: 'Setrika' },
    { value: 'special', label: 'Khusus' }
  ];

  const units = [
    { value: 'pcs', label: 'Pcs' },
    { value: 'kg', label: 'Kg' },
    { value: 'set', label: 'Set' }
  ];

  useEffect(() => {
    loadServiceItems();
  }, []);

  const loadServiceItems = async () => {
    try {
      const response = await axios.get(`${API}/service-items?active_only=false`);
      setServiceItems(response.data);
    } catch (err) {
      console.error('Error loading service items:', err);
    } finally {
      setLoading(false);
    }
  };

  const createServiceItem = async () => {
    if (!newItem.name || !newItem.price) {
      alert('Harap isi nama layanan dan harga');
      return;
    }

    try {
      const itemData = {
        ...newItem,
        price: parseFloat(newItem.price)
      };
      
      await axios.post(`${API}/service-items`, itemData);
      setNewItem({ name: '', category: 'wash', price: '', unit: 'pcs', description: '' });
      setShowAddForm(false);
      loadServiceItems();
      alert('Item layanan berhasil ditambahkan!');
    } catch (err) {
      console.error('Error creating service item:', err);
      alert('Error menambah item layanan. Silakan coba lagi.');
    }
  };

  const toggleItemStatus = async (itemId, currentStatus) => {
    try {
      if (currentStatus) {
        await axios.delete(`${API}/service-items/${itemId}`);
      } else {
        // In a real app, you'd have a reactivate endpoint
        alert('Fitur mengaktifkan kembali item akan ditambahkan');
        return;
      }
      loadServiceItems();
    } catch (err) {
      console.error('Error toggling item status:', err);
      alert('Error mengubah status item.');
    }
  };

  const getCategoryLabel = (category) => {
    const found = categories.find(cat => cat.value === category);
    return found ? found.label : category;
  };

  const getUnitLabel = (unit) => {
    const found = units.find(u => u.value === unit);
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
                value={newItem.name}
                onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="Misal: Cuci Kemeja Regular"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kategori
              </label>
              <select
                value={newItem.category}
                onChange={(e) => setNewItem({...newItem, category: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Harga <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={newItem.price}
                onChange={(e) => setNewItem({...newItem, price: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="5000"
                min="0"
                step="500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Satuan
              </label>
              <select
                value={newItem.unit}
                onChange={(e) => setNewItem({...newItem, unit: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                {units.map(unit => (
                  <option key={unit.value} value={unit.value}>{unit.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Deskripsi (Opsional)
            </label>
            <textarea
              value={newItem.description}
              onChange={(e) => setNewItem({...newItem, description: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              rows="2"
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
            <div key={item.id} className={`border rounded-lg p-4 ${
              item.is_active ? 'border-gray-200 bg-white' : 'border-red-200 bg-red-50'
            }`}>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{item.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      item.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
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

// Client Management Component (Admin Only)
const ClientManagement = ({ employee }) => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const isAdmin = employee?.role === 'admin';

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      if (isAdmin) {
        // Admin gets detailed stats
        const response = await axios.get(`${API}/admin/clients-with-stats?admin_id=${employee.id}`);
        setClients(response.data);
      } else {
        // Regular employee gets basic list
        const response = await axios.get(`${API}/clients`);
        setClients(response.data.map(client => ({ ...client, total_receipts: 0, active_receipts: 0, total_spent: 0 })));
      }
    } catch (err) {
      console.error('Error loading clients:', err);
    } finally {
      setLoading(false);
    }
  };

  const openDeleteModal = (client) => {
    setClientToDelete(client);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setClientToDelete(null);
  };

  const confirmDelete = async () => {
    if (!clientToDelete || !isAdmin) return;

    setDeleteLoading(true);
    try {
      await axios.delete(`${API}/clients/${clientToDelete.id}?admin_id=${employee.id}`);
      
      // Remove from local state
      setClients(clients.filter(c => c.id !== clientToDelete.id));
      
      closeDeleteModal();
      alert(`Pelanggan ${clientToDelete.name} berhasil dihapus`);
    } catch (err) {
      console.error('Error deleting client:', err);
      const errorMsg = err.response?.data?.detail || 'Error menghapus pelanggan. Silakan coba lagi.';
      alert(errorMsg);
    } finally {
      setDeleteLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Belum pernah';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return <div className="text-center py-8">Memuat data pelanggan...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          👥 Manajemen Pelanggan
          {isAdmin && <span className="text-sm font-normal text-gray-600 ml-2">(Admin)</span>}
        </h2>
        <div className="text-sm text-gray-600">
          Total: {clients.length} pelanggan
        </div>
      </div>

      {!isAdmin && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <span className="text-yellow-600 mr-2">⚠️</span>
            <span className="text-yellow-800 text-sm">
              Hanya admin yang dapat menghapus pelanggan. Hubungi administrator untuk akses penuh.
            </span>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {clients.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Belum ada pelanggan terdaftar.
          </div>
        ) : (
          clients.map((client) => (
            <div key={client.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{client.name}</h3>
                    <span className="text-sm text-gray-500">{client.phone}</span>
                  </div>
                  
                  {isAdmin && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-2">
                      <div>
                        <span className="font-medium">Total Bon:</span>
                        <div className="text-indigo-600 font-semibold">{client.total_receipts || 0}</div>
                      </div>
                      <div>
                        <span className="font-medium">Bon Aktif:</span>
                        <div className={`font-semibold ${client.active_receipts > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                          {client.active_receipts || 0}
                        </div>
                      </div>
                      <div>
                        <span className="font-medium">Total Transaksi:</span>
                        <div className="text-green-600 font-semibold">
                          {formatCurrency(client.total_spent || 0)}
                        </div>
                      </div>
                      <div>
                        <span className="font-medium">Kunjungan Terakhir:</span>
                        <div className="text-gray-700">{formatDate(client.last_visit)}</div>
                      </div>
                    </div>
                  )}

                  <div className="text-xs text-gray-500">
                    Terdaftar: {formatDate(client.created_at)}
                  </div>
                </div>

                <div className="ml-4 flex flex-col gap-2">
                  {isAdmin && (
                    <button
                      onClick={() => openDeleteModal(client)}
                      disabled={client.active_receipts > 0}
                      className={`px-3 py-1 text-sm rounded transition-colors ${
                        client.active_receipts > 0
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-red-600 text-white hover:bg-red-700'
                      }`}
                      title={client.active_receipts > 0 ? `Tidak dapat dihapus: ${client.active_receipts} bon aktif` : 'Hapus pelanggan'}
                    >
                      {client.active_receipts > 0 ? '🔒 Terkunci' : '🗑️ Hapus'}
                    </button>
                  )}
                  
                  <div className={`px-2 py-1 text-xs rounded text-center ${
                    client.active_receipts > 0 
                      ? 'bg-orange-100 text-orange-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {client.active_receipts > 0 ? 'Ada Bon Aktif' : 'Bersih'}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && isAdmin && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border max-w-md shadow-lg rounded-md bg-white">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                ⚠️ Konfirmasi Hapus Pelanggan
              </h3>
              
              <div className="mb-4 p-4 bg-red-50 rounded-lg">
                <p className="text-sm text-red-800 mb-2">
                  <strong>Pelanggan:</strong> {clientToDelete?.name}
                </p>
                <p className="text-sm text-red-800 mb-2">
                  <strong>Telepon:</strong> {clientToDelete?.phone}
                </p>
                {isAdmin && (
                  <p className="text-sm text-red-800">
                    <strong>Total Bon:</strong> {clientToDelete?.total_receipts || 0}
                  </p>
                )}
              </div>

              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>⚠️ Peringatan:</strong> Aksi ini tidak dapat dibatalkan. 
                  Data pelanggan akan dihapus permanen dari sistem.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={confirmDelete}
                  disabled={deleteLoading}
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {deleteLoading ? 'Menghapus...' : 'Ya, Hapus Pelanggan'}
                </button>
                <button
                  onClick={closeDeleteModal}
                  disabled={deleteLoading}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isAdmin && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">ℹ️ Informasi Admin:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>✅ Pelanggan hanya bisa dihapus jika tidak memiliki bon aktif</li>
            <li>✅ Data statistik menampilkan riwayat transaksi lengkap</li>
            <li>✅ Penghapusan bersifat permanen dan tidak dapat dibatalkan</li>
            <li>⚠️ Pastikan backup data sudah dilakukan sebelum menghapus</li>
          </ul>
        </div>
      )}
    </div>
  );
};

// Excel Export Report Component
const ExcelReportExport = ({ employee }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [loading, setLoading] = useState(false);

  // Set default dates (last 30 days)
  useEffect(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
    
    setEndDate(today.toISOString().split('T')[0]);
    setStartDate(thirtyDaysAgo.toISOString().split('T')[0]);
  }, []);

  const downloadExcelReport = async () => {
    if (!startDate || !endDate) {
      alert('Harap pilih tanggal mulai dan tanggal akhir');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      alert('Tanggal mulai tidak boleh lebih besar dari tanggal akhir');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(
        `${API}/reports/excel-export?start_date=${startDate}&end_date=${endDate}&include_deleted=${includeDeleted}`,
        { responseType: 'blob' }
      );

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Laporan_Laundry_${startDate}_to_${endDate}.xlsx`);
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      link.remove();
      window.URL.revokeObjectURL(url);
      
      alert('File Excel berhasil didownload!');
    } catch (err) {
      console.error('Error downloading Excel report:', err);
      if (err.response?.status === 404) {
        alert('Tidak ada transaksi ditemukan pada periode tersebut');
      } else {
        alert('Error mengunduh laporan Excel. Silakan coba lagi.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">📊 Export Laporan Excel</h2>
      
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <h3 className="font-medium text-blue-900 mb-2">📋 Kolom yang Tersedia di Excel:</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-blue-800">
          <div>✓ ID Transaksi</div>
          <div>✓ Tanggal & Waktu</div>
          <div>✓ Nama Pelanggan</div>
          <div>✓ Telepon Pelanggan</div>
          <div>✓ Item Laundry</div>
          <div>✓ Karyawan</div>
          <div>✓ Subtotal</div>
          <div>✓ Diskon (%)</div>
          <div>✓ Jumlah Diskon</div>
          <div>✓ Total Bayar</div>
          <div>✓ Status</div>
          <div>✓ Catatan</div>
        </div>
        <div className="mt-3 text-sm text-blue-700">
          <strong>Bonus:</strong> Lembar terpisah dengan ringkasan total dan laporan per karyawan!
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tanggal Mulai <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tanggal Akhir <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div className="mb-6">
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={includeDeleted}
            onChange={(e) => setIncludeDeleted(e.target.checked)}
            className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500"
          />
          <span className="text-sm text-gray-700">
            Sertakan transaksi yang dihapus (untuk audit lengkap)
          </span>
        </label>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h4 className="font-medium text-gray-800 mb-2">Pratinjau Laporan:</h4>
        <div className="text-sm text-gray-600 space-y-1">
          <p><strong>Periode:</strong> {startDate || 'Belum dipilih'} s/d {endDate || 'Belum dipilih'}</p>
          <p><strong>Include Deleted:</strong> {includeDeleted ? 'Ya' : 'Tidak'}</p>
          <p><strong>Format:</strong> Excel (.xlsx) dengan 2 lembar kerja</p>
          <p><strong>Nama File:</strong> Laporan_Laundry_{startDate}_to_{endDate}.xlsx</p>
        </div>
      </div>

      <div className="space-y-3">
        <button
          onClick={downloadExcelReport}
          disabled={loading || !startDate || !endDate}
          className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Sedang Membuat Excel...</span>
            </>
          ) : (
            <>
              <span>📋</span>
              <span>Download Laporan Excel</span>
            </>
          )}
        </button>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            onClick={() => {
              const today = new Date();
              setStartDate(today.toISOString().split('T')[0]);
              setEndDate(today.toISOString().split('T')[0]);
            }}
            className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
          >
            Hari Ini
          </button>
          
          <button
            onClick={() => {
              const today = new Date();
              const sevenDaysAgo = new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000));
              setStartDate(sevenDaysAgo.toISOString().split('T')[0]);
              setEndDate(today.toISOString().split('T')[0]);
            }}
            className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
          >
            7 Hari Terakhir
          </button>
          
          <button
            onClick={() => {
              const today = new Date();
              const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
              setStartDate(thirtyDaysAgo.toISOString().split('T')[0]);
              setEndDate(today.toISOString().split('T')[0]);
            }}
            className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
          >
            30 Hari Terakhir
          </button>
        </div>
      </div>

      <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
        <h4 className="font-medium text-yellow-800 mb-2">💡 Tips Penggunaan Excel:</h4>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• File Excel berisi 2 lembar: "Laporan Transaksi" dan "Ringkasan"</li>
          <li>• Gunakan filter Excel untuk analisis lebih detail</li>
          <li>• Kolom dapat disortir berdasarkan tanggal, karyawan, atau total</li>
          <li>• Lembar ringkasan berisi total pendapatan dan breakdown per karyawan</li>
        </ul>
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
      alert('Error memperbarui status. Silakan coba lagi.');
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
      alert('Harap berikan alasan penghapusan');
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
      alert('Bon berhasil dihapus');
    } catch (err) {
      console.error('Error deleting receipt:', err);
      alert('Error menghapus bon. Silakan coba lagi.');
    }
  };

  const openPrintModal = async (receipt) => {
    try {
      const response = await axios.get(`${API}/receipts/${receipt.id}/print`);
      setPrintReceiptData(response.data);
      setPrintModalOpen(true);
    } catch (err) {
      console.error('Error loading print data:', err);
      alert('Error menyiapkan bon untuk cetak. Silakan coba lagi.');
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
    return <div className="text-center py-8">Memuat bon...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Manajemen Bon</h2>
        
        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={showDeleted}
              onChange={(e) => setShowDeleted(e.target.checked)}
              className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500"
            />
            <span className="text-sm text-gray-700">Tampilkan yang Dihapus</span>
          </label>
        </div>
      </div>
      
      <div className="space-y-4">
        {receipts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {showDeleted ? 'Tidak ada bon yang dihapus.' : 'Tidak ada bon ditemukan. Buat bon pertama Anda!'}
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
                    Dibuat oleh: {receipt.employee_name} • {formatDateTime(receipt.created_at)}
                  </p>
                  {receipt.is_deleted && receipt.deleted_at && (
                    <p className="text-xs text-red-600 font-medium">
                      🗑️ Dihapus oleh: {receipt.deleted_by_employee_name} • {formatDateTime(receipt.deleted_at)}
                      {receipt.deletion_reason && ` • Alasan: ${receipt.deletion_reason}`}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-green-600">Rp{receipt.total_amount.toLocaleString('id-ID')}</div>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(receipt.status)}`}>
                    {receipt.status === 'pending' ? 'menunggu' : 
                     receipt.status === 'ready' ? 'siap' : 
                     receipt.status === 'completed' ? 'selesai' : 
                     receipt.status === 'deleted' ? 'dihapus' : receipt.status}
                  </span>
                </div>
              </div>

              <div className="mb-3">
                <h4 className="text-sm font-medium mb-2">Item:</h4>
                <div className="space-y-1">
                  {receipt.items.map((item, index) => (
                    <div key={index} className="text-sm text-gray-600 flex justify-between">
                      <span>{item.quantity}x {item.item_type} ({item.service})</span>
                      <span>Rp{item.total_price.toLocaleString('id-ID')}</span>
                    </div>
                  ))}
                </div>
              </div>

              {receipt.notes && (
                <div className="mb-3 text-sm text-gray-600">
                  <strong>Catatan:</strong> {receipt.notes}
                </div>
              )}

              <div className="flex gap-2 flex-wrap">
                {/* Print button - always available */}
                <button
                  onClick={() => openPrintModal(receipt)}
                  className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
                >
                  🖨️ Cetak
                </button>

                {/* Status management buttons - only for non-deleted receipts */}
                {!receipt.is_deleted && (
                  <>
                    {receipt.status === 'pending' && (
                      <button
                        onClick={() => updateStatus(receipt.id, 'ready')}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                      >
                        Tandai Siap
                      </button>
                    )}
                    {receipt.status === 'ready' && (
                      <button
                        onClick={() => updateStatus(receipt.id, 'completed')}
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                      >
                        Selesai
                      </button>
                    )}
                    {receipt.status !== 'completed' && (
                      <button
                        onClick={() => openDeleteModal(receipt)}
                        className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                      >
                        Hapus
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
              <h3 className="text-lg font-medium text-gray-900 mb-4">Hapus Bon</h3>
              
              <div className="mb-4 p-3 bg-yellow-50 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>⚠️ Penting:</strong> Tindakan ini akan dilacak untuk tujuan audit. 
                  Bon akan ditandai sebagai dihapus tetapi disimpan dalam sistem untuk pencegahan penipuan.
                </p>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-700 mb-2">
                  <strong>Bon:</strong> {receiptToDelete?.client_name} - Rp{receiptToDelete?.total_amount.toLocaleString('id-ID')}
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alasan penghapusan: <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  placeholder="Contoh: Pelanggan salah, jumlah salah, duplikat..."
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
                  Hapus Bon
                </button>
                <button
                  onClick={closeDeleteModal}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400"
                >
                  Batal
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
  const [showAdminRegistration, setShowAdminRegistration] = useState(false);

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
  };

  const handleAdminRegistrationSuccess = (admin) => {
    setShowAdminRegistration(false);
    alert(`Admin ${admin.name} berhasil didaftarkan! Silakan login dengan PIN admin.`);
    loadEmployees(); // Refresh employee list
  };

  const handleShowAdminRegistration = () => {
    setShowAdminRegistration(true);
  };

  if (!currentEmployee) {
    return (
      <>
        <EmployeeLogin 
          onLogin={handleLogin} 
          employees={employees} 
          onShowAdminRegistration={handleShowAdminRegistration}
        />
        {showAdminRegistration && (
          <AdminRegistration
            onCancel={() => setShowAdminRegistration(false)}
            onSuccess={handleAdminRegistrationSuccess}
          />
        )}
      </>
    );
  }

  const isAdmin = currentEmployee.role === 'admin';

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <h1 className="text-lg sm:text-2xl font-bold text-indigo-600">🧺 LaundryPro</h1>
              <span className="hidden sm:inline text-gray-500">|</span>
              <div className="hidden sm:inline text-gray-700 text-sm">
                <span>Selamat datang, {currentEmployee.name}</span>
                {isAdmin && <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">👑 Admin</span>}
              </div>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Mobile Navigation - Hidden on desktop */}
              <div className="sm:hidden">
                <button
                  onClick={handleLogout}
                  className="px-3 py-2 text-xs font-medium text-red-600 hover:text-red-800 transition-colors"
                >
                  Keluar
                </button>
              </div>
              
              {/* Desktop Navigation - Hidden on mobile */}
              <div className="hidden sm:flex space-x-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setActiveTab('create')}
                  className={`px-2 lg:px-4 py-2 rounded-lg text-xs lg:text-sm font-medium transition-colors ${
                    activeTab === 'create' 
                      ? 'bg-white text-indigo-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Bon Baru
                </button>
                <button
                  onClick={() => setActiveTab('receipts')}
                  className={`px-2 lg:px-4 py-2 rounded-lg text-xs lg:text-sm font-medium transition-colors ${
                    activeTab === 'receipts' 
                      ? 'bg-white text-indigo-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Semua Bon
                </button>
                <button
                  onClick={() => setActiveTab('audit')}
                  className={`px-2 lg:px-4 py-2 rounded-lg text-xs lg:text-sm font-medium transition-colors ${
                    activeTab === 'audit' 
                      ? 'bg-white text-indigo-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  🔍 Audit
                </button>
                <button
                  onClick={() => setActiveTab('services')}
                  className={`px-2 lg:px-4 py-2 rounded-lg text-xs lg:text-sm font-medium transition-colors ${
                    activeTab === 'services' 
                      ? 'bg-white text-indigo-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  🧽 Layanan
                </button>
                {isAdmin && (
                  <button
                    onClick={() => setActiveTab('clients')}
                    className={`px-2 lg:px-4 py-2 rounded-lg text-xs lg:text-sm font-medium transition-colors ${
                      activeTab === 'clients' 
                        ? 'bg-white text-indigo-600 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    👥 Pelanggan
                  </button>
                )}
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`px-2 lg:px-4 py-2 rounded-lg text-xs lg:text-sm font-medium transition-colors ${
                    activeTab === 'settings' 
                      ? 'bg-white text-indigo-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  ⚙️ Settings
                </button>
                <button
                  onClick={() => setActiveTab('reports')}
                  className={`px-2 lg:px-4 py-2 rounded-lg text-xs lg:text-sm font-medium transition-colors ${
                    activeTab === 'reports' 
                      ? 'bg-white text-indigo-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  📊 Laporan
                </button>
              </div>
              
              <button
                onClick={handleLogout}
                className="hidden sm:block px-4 py-2 text-sm font-medium text-red-600 hover:text-red-800 transition-colors"
              >
                Keluar
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-10">
        <div className={`flex ${isAdmin ? 'justify-between' : 'justify-around'} px-2`}>
          <button
            onClick={() => setActiveTab('create')}
            className={`flex flex-col items-center py-2 px-1 text-xs transition-colors ${
              activeTab === 'create' 
                ? 'text-indigo-600' 
                : 'text-gray-600'
            }`}
          >
            <span className="text-lg mb-1">📝</span>
            <span>Bon Baru</span>
          </button>
          <button
            onClick={() => setActiveTab('receipts')}
            className={`flex flex-col items-center py-2 px-1 text-xs transition-colors ${
              activeTab === 'receipts' 
                ? 'text-indigo-600' 
                : 'text-gray-600'
            }`}
          >
            <span className="text-lg mb-1">📋</span>
            <span>Semua Bon</span>
          </button>
          {!isAdmin && (
            <>
              <button
                onClick={() => setActiveTab('audit')}
                className={`flex flex-col items-center py-2 px-1 text-xs transition-colors ${
                  activeTab === 'audit' 
                    ? 'text-indigo-600' 
                    : 'text-gray-600'
                }`}
              >
                <span className="text-lg mb-1">🔍</span>
                <span>Audit</span>
              </button>
              <button
                onClick={() => setActiveTab('services')}
                className={`flex flex-col items-center py-2 px-1 text-xs transition-colors ${
                  activeTab === 'services' 
                    ? 'text-indigo-600' 
                    : 'text-gray-600'
                }`}
              >
                <span className="text-lg mb-1">🧽</span>
                <span>Layanan</span>
              </button>
              <button
                onClick={() => setActiveTab('reports')}
                className={`flex flex-col items-center py-2 px-1 text-xs transition-colors ${
                  activeTab === 'reports' 
                    ? 'text-indigo-600' 
                    : 'text-gray-600'
                }`}
              >
                <span className="text-lg mb-1">📊</span>
                <span>Laporan</span>
              </button>
            </>
          )}
          {isAdmin && (
            <>
              <button
                onClick={() => setActiveTab('clients')}
                className={`flex flex-col items-center py-2 px-1 text-xs transition-colors ${
                  activeTab === 'clients' 
                    ? 'text-indigo-600' 
                    : 'text-gray-600'
                }`}
              >
                <span className="text-lg mb-1">👥</span>
                <span>Pelanggan</span>
              </button>
              <button
                onClick={() => setActiveTab('audit')}
                className={`flex flex-col items-center py-2 px-1 text-xs transition-colors ${
                  activeTab === 'audit' 
                    ? 'text-indigo-600' 
                    : 'text-gray-600'
                }`}
              >
                <span className="text-lg mb-1">🔍</span>
                <span>Audit</span>
              </button>
              <button
                onClick={() => setActiveTab('reports')}
                className={`flex flex-col items-center py-2 px-1 text-xs transition-colors ${
                  activeTab === 'reports' 
                    ? 'text-indigo-600' 
                    : 'text-gray-600'
                }`}
              >
                <span className="text-lg mb-1">📊</span>
                <span>Laporan</span>
              </button>
            </>
          )}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 pb-20 sm:pb-8">
        {activeTab === 'create' && (
          <div className="space-y-4 sm:space-y-8">
            {!selectedClient ? (
              <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">Pilih atau Tambah Pelanggan</h2>
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

        {activeTab === 'services' && (
          <ServiceItemsManagement employee={currentEmployee} />
        )}

        {activeTab === 'settings' && (
          <LaundrySettings employee={currentEmployee} />
        )}

        {activeTab === 'reports' && (
          <ExcelReportExport employee={currentEmployee} />
        )}
      </main>
    </div>
  );
}

// Admin Registration Component
const AdminRegistration = ({ onCancel, onSuccess }) => {
  const [formData, setFormData] = useState({ name: '', pin: '', adminCode: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.pin || !formData.adminCode) {
      setError('Semua field harus diisi');
      return;
    }

    if (formData.pin.length !== 4) {
      setError('PIN harus 4 digit');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API}/admin/register`, {
        name: formData.name,
        pin: formData.pin,
        admin_code: formData.adminCode
      });
      
      onSuccess(response.data);
    } catch (err) {
      if (err.response?.status === 403) {
        setError('Kode admin tidak valid');
      } else if (err.response?.status === 400) {
        setError('PIN sudah digunakan');
      } else {
        setError('Error registrasi admin. Silakan coba lagi.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border max-w-md shadow-lg rounded-md bg-white">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">👑 Daftar Admin</h2>
          <p className="text-gray-600 mt-2">Registrasi akun administrator</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nama Lengkap
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="Masukkan nama lengkap"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              PIN Admin (4 digit)
            </label>
            <input
              type="password"
              value={formData.pin}
              onChange={(e) => setFormData({...formData, pin: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-center text-xl font-mono"
              placeholder="••••"
              maxLength="4"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kode Admin Rahasia
            </label>
            <input
              type="password"
              value={formData.adminCode}
              onChange={(e) => setFormData({...formData, adminCode: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="Masukkan kode admin rahasia"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Hubungi sistem administrator untuk mendapatkan kode ini
            </p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Mendaftar...' : 'Daftar sebagai Admin'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-400 transition-colors"
            >
              Batal
            </button>
          </div>
        </form>

        <div className="mt-6 p-3 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">🔑 Hak Akses Admin:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>✅ Menghapus data pelanggan</li>
            <li>✅ Mengakses semua laporan</li>
            <li>✅ Mengelola karyawan</li>
            <li>✅ Audit penuh sistem</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default App;