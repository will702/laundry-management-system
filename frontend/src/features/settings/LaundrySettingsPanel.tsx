import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { settingsApi } from '../../services/api';
import { parseFooterNotes } from '../../services/receipt/footerNotes';
import { PrinterSettings } from './PrinterSettings';

interface LegacySettings {
  business_name: string;
  business_address: string;
  business_phone: string;
  business_email: string;
  logo_url?: string;
  footer_notes: string;
}

export const LaundrySettingsPanel: React.FC = () => {
  const [settings, setSettings] = useState<LegacySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'business' | 'receipt' | 'printer'>('business');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // The settingsApi.get() may return camelCase from NestJS or snake_case from Express.
      // We cast to any and normalise to snake_case for the local form state.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = await settingsApi.get() as any;
      const normalised: LegacySettings = {
        business_name: data.business_name ?? data.businessName ?? '',
        business_address: data.business_address ?? data.businessAddress ?? '',
        business_phone: data.business_phone ?? data.businessPhone ?? '',
        business_email: data.business_email ?? data.businessEmail ?? '',
        logo_url: data.logo_url ?? data.logoUrl ?? '',
        footer_notes: data.footer_notes ?? data.footerNotes ?? '',
      };
      setSettings(normalised);
    } catch (err) {
      console.error('Error loading settings:', err);
      toast.error('Gagal memuat pengaturan');
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (updatedData: Partial<LegacySettings>) => {
    setSaving(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await settingsApi.update(updatedData as any) as any;
      const normalised: LegacySettings = {
        business_name: result.business_name ?? result.businessName ?? '',
        business_address: result.business_address ?? result.businessAddress ?? '',
        business_phone: result.business_phone ?? result.businessPhone ?? '',
        business_email: result.business_email ?? result.businessEmail ?? '',
        logo_url: result.logo_url ?? result.logoUrl ?? '',
        footer_notes: result.footer_notes ?? result.footerNotes ?? '',
      };
      setSettings(normalised);
      toast.success('Pengaturan berhasil disimpan!');
    } catch (err) {
      console.error('Error updating settings:', err);
      toast.error('Error menyimpan pengaturan. Silakan coba lagi.');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof LegacySettings, value: string) => {
    setSettings((prev) => prev ? { ...prev, [field]: value } : prev);
  };

  const saveSettings = () => {
    if (!settings) return;
    updateSettings({
      business_name: settings.business_name,
      business_address: settings.business_address,
      business_phone: settings.business_phone,
      business_email: settings.business_email,
      logo_url: settings.logo_url,
      footer_notes: settings.footer_notes,
    });
  };

  if (loading) {
    return <div className="text-center py-8">Memuat pengaturan...</div>;
  }

  if (!settings) {
    return <div className="text-center py-8 text-red-600">Gagal memuat pengaturan.</div>;
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
        <button
          onClick={() => setActiveTab('printer')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'printer'
              ? 'bg-white text-indigo-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Printer
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
                placeholder="Mass Laundry"
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
              rows={3}
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
              placeholder="info@masslaundry.com"
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
              rows={4}
              placeholder="Terima kasih atas kepercayaan Anda • Jam operasional: 07:00-21:00 • Komplain maks 1x24 jam"
            />
            <p className="text-xs text-gray-500 mt-1">
              Catatan ini akan muncul di bagian bawah setiap struk. Gunakan • untuk memisahkan informasi.
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium mb-3">Pratinjau Catatan Kaki:</h3>
            <div className="text-sm text-gray-600 text-center border-t border-gray-200 pt-3">
              {parseFooterNotes(settings.footer_notes).map((note, index) => (
                <p key={index} className="mb-1">{note}</p>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'printer' && (
        <PrinterSettings />
      )}

      {activeTab !== 'printer' && (
        <div className="flex justify-end pt-6 border-t">
          <button
            onClick={saveSettings}
            disabled={saving}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
          </button>
        </div>
      )}
    </div>
  );
};
