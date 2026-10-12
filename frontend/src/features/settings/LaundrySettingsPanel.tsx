import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Save } from 'lucide-react';
import { settingsApi } from '../../services/api';
import { parseFooterNotes } from '../../services/receipt/footerNotes';
import { PrinterSettings } from './PrinterSettings';
import {
  Card, PageHeader, Tabs, Button, Input, Textarea, EmptyState, SkeletonCard,
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
    return <div aria-label="Memuat pengaturan" className="grid gap-4 lg:grid-cols-2"><SkeletonCard lines={4} /><SkeletonCard lines={4} /></div>;
  }

  if (!settings) {
    return (
      <Card>
        <EmptyState title="Gagal memuat pengaturan" description="Silakan muat ulang halaman." />
      </Card>
    );
  }

  const saveBar = (
    <div className="flex justify-end pt-5 mt-5 border-t border-border">
      <Button onClick={saveSettings} loading={saving} icon={<Save size={15} />}>Simpan pengaturan</Button>
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Pengaturan" description="Info usaha, catatan bon, dan printer." />

      <Tabs
        id="settings"
        value={activeTab}
        onChange={(v) => setActiveTab(v as 'business' | 'receipt' | 'printer')}
        tabs={[
          { value: 'business', label: 'Info usaha' },
          { value: 'receipt', label: 'Catatan bon' },
          { value: 'printer', label: 'Printer' },
        ]}
      />

      <div id="settings-tab-panel" role="tabpanel" aria-live="polite">
        {activeTab === 'business' && (
          <Card>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <Input
                label="Nama usaha"
                value={settings.business_name}
                onChange={(e) => handleInputChange('business_name', e.target.value)}
                placeholder="Mass Laundry"
              />
              <Input
                label="Nomor telepon"
                value={settings.business_phone}
                onChange={(e) => handleInputChange('business_phone', e.target.value)}
                placeholder="(021) 1234-5678"
              />
              <div className="md:col-span-2">
                <Textarea
                  label="Alamat"
                  value={settings.business_address}
                  onChange={(e) => handleInputChange('business_address', e.target.value)}
                  rows={3}
                  placeholder="Jl. Bersih No. 123, Kota Laundry"
                />
              </div>
              <Input
                label="Email"
                type="email"
                value={settings.business_email}
                onChange={(e) => handleInputChange('business_email', e.target.value)}
                placeholder="info@masslaundry.com"
              />
              <Input
                label="URL logo (opsional)"
                type="url"
                value={settings.logo_url || ''}
                onChange={(e) => handleInputChange('logo_url', e.target.value)}
                placeholder="https://example.com/logo.png"
                hint="Alamat gambar logo yang tampil di bon"
              />
            </div>
            {saveBar}
          </Card>
        )}

        {activeTab === 'receipt' && (
          <Card>
            <div className="grid gap-x-6 gap-y-4 md:grid-cols-2">
              <Textarea
                label="Catatan kaki bon"
                value={settings.footer_notes}
                onChange={(e) => handleInputChange('footer_notes', e.target.value)}
                rows={5}
                placeholder="Terima kasih atas kepercayaan Anda • Jam operasional: 07:00-21:00 • Komplain maks 1x24 jam"
                hint="Tampil di bagian bawah setiap bon. Pisahkan butir dengan •"
              />

              <div className="md:border-l md:border-border md:pl-6">
                <h3 className="text-sm font-medium text-ink-muted mb-2">Pratinjau</h3>
                <ul className="list-disc pl-4 space-y-1 text-sm text-ink-muted">
                  {parseFooterNotes(settings.footer_notes).map((note, index) => (
                    <li key={index}>{note}</li>
                  ))}
                </ul>
              </div>
            </div>
            {saveBar}
          </Card>
        )}

        {activeTab === 'printer' && <PrinterSettings />}
      </div>
    </div>
  );
};
