import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Save } from 'lucide-react';
import { settingsApi } from '../../services/api';
import { parseFooterNotes } from '../../services/receipt/footerNotes';
import { PrinterSettings } from './PrinterSettings';
import {
  Card, PageHeader, Tabs, Button, Input, Textarea, EmptyState,
} from '../../components/ui';

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

  useEffect(() => { loadSettings(); }, []);

  const loadSettings = async () => {
    try {
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
    return <div className="text-center py-8 text-ink-faint">Memuat pengaturan...</div>;
  }

  if (!settings) {
    return (
      <Card>
        <EmptyState title="Gagal memuat pengaturan" description="Silakan muat ulang halaman." />
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader kicker="Pengaturan" title="Pengaturan Laundry" description="Kelola info bisnis, struk, dan printer." />

      <Tabs
        id="settings"
        value={activeTab}
        onChange={(v) => setActiveTab(v as 'business' | 'receipt' | 'printer')}
        tabs={[
          { value: 'business', label: 'Info Bisnis' },
          { value: 'receipt', label: 'Pengaturan Struk' },
          { value: 'printer', label: 'Printer' },
        ]}
      />

      <div id="settings-tab-panel" role="tabpanel" aria-live="polite">
        {activeTab === 'business' && (
          <Card>
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Input
                  label="Nama Bisnis"
                  value={settings.business_name}
                  onChange={(e) => handleInputChange('business_name', e.target.value)}
                  placeholder="Mass Laundry"
                />
                <Input
                  label="Nomor Telepon"
                  value={settings.business_phone}
                  onChange={(e) => handleInputChange('business_phone', e.target.value)}
                  placeholder="(021) 1234-5678"
                />
              </div>
              <Textarea
                label="Alamat Bisnis"
                value={settings.business_address}
                onChange={(e) => handleInputChange('business_address', e.target.value)}
                rows={3}
                placeholder="Jl. Bersih No. 123, Kota Laundry"
              />
              <Input
                label="Email Bisnis"
                type="email"
                value={settings.business_email}
                onChange={(e) => handleInputChange('business_email', e.target.value)}
                placeholder="info@masslaundry.com"
              />
              <Input
                label="URL Logo (Opsional)"
                type="url"
                value={settings.logo_url || ''}
                onChange={(e) => handleInputChange('logo_url', e.target.value)}
                placeholder="https://example.com/logo.png"
                hint="Masukkan URL gambar logo untuk ditampilkan di struk"
              />
            </div>
            <div className="flex justify-end pt-6 mt-6 border-t border-border">
              <Button onClick={saveSettings} loading={saving} icon={<Save size={15} />}>Simpan Pengaturan</Button>
            </div>
          </Card>
        )}

        {activeTab === 'receipt' && (
          <Card>
            <div className="space-y-5">
              <Textarea
                label="Catatan Kaki Struk"
                value={settings.footer_notes}
                onChange={(e) => handleInputChange('footer_notes', e.target.value)}
                rows={4}
                placeholder="Terima kasih atas kepercayaan Anda • Jam operasional: 07:00-21:00 • Komplain maks 1x24 jam"
                hint="Catatan ini akan muncul di bagian bawah setiap struk. Gunakan • untuk memisahkan informasi."
              />

              <div className="rounded-xl bg-surface-sunken border border-border p-4">
                <h3 className="font-semibold text-ink mb-3">Pratinjau Catatan Kaki</h3>
                <div className="text-sm text-ink-muted text-center border-t border-border pt-3">
                  {parseFooterNotes(settings.footer_notes).map((note, index) => (
                    <p key={index} className="mb-1">{note}</p>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end pt-6 mt-6 border-t border-border">
              <Button onClick={saveSettings} loading={saving} icon={<Save size={15} />}>Simpan Pengaturan</Button>
            </div>
          </Card>
        )}

        {activeTab === 'printer' && <PrinterSettings />}
      </div>
    </div>
  );
};
