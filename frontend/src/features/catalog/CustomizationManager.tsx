import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Plus, X, Save, Trash2, Clock, Package as PackageIcon, FolderTree, Ruler, SprayCan, Lightbulb } from 'lucide-react';
import type { Employee, Category, Unit, Service, Package } from '@mass-laundry/shared-types';
import { catalogApi, apiClient } from '../../services/api';
import {
  Card, PageHeader, Tabs, Button, Input, Select, Badge, EmptyState, Money, SkeletonCard,
} from '../../components/ui';
import { staggerContainer, listItem } from '../../lib/motion';

interface CustomizationManagerProps {
  employee: Employee;
  onDataUpdate?: () => void;
}

interface CategoryForm { name: string; description: string; }
interface UnitForm { name: string; description: string; }
interface ServiceForm {
  name: string;
  category_id: string;
  unit_id: string;
  base_price: string;
  duration_days: number;
  duration_hours: number;
  duration_minutes: number;
}
interface PackageServiceItem { service_id: string; quantity: number; }
interface PackageForm {
  name: string;
  description: string;
  services: PackageServiceItem[];
  discount_percent: number;
}

type CustomTab = 'categories' | 'units' | 'services' | 'packages';

export const CustomizationManager: React.FC<CustomizationManagerProps> = ({
  employee,
  onDataUpdate,
}) => {
  const [activeCustomTab, setActiveCustomTab] = useState<CustomTab>('categories');
  const [loading, setLoading] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [categoryForm, setCategoryForm] = useState<CategoryForm>({ name: '', description: '' });

  const [showUnitForm, setShowUnitForm] = useState(false);
  const [unitForm, setUnitForm] = useState<UnitForm>({ name: '', description: '' });

  const [showServiceForm, setShowServiceForm] = useState(false);
  const [serviceForm, setServiceForm] = useState<ServiceForm>({
    name: '', category_id: '', unit_id: '', base_price: '',
    duration_days: 0, duration_hours: 0, duration_minutes: 0,
  });

  const [showPackageForm, setShowPackageForm] = useState(false);
  const [packageForm, setPackageForm] = useState<PackageForm>({
    name: '', description: '', services: [], discount_percent: 0,
  });

  useEffect(() => { loadAllData(); }, []);

  const loadAllData = async () => {
    setDataLoading(true);
    try {
      const [cats, uns, svcs, pkgs] = await Promise.all([
        catalogApi.getCategories(),
        catalogApi.getUnits(),
        catalogApi.getServices(),
        catalogApi.getPackages(),
      ]);
      setCategories(cats);
      setUnits(uns);
      setServices(svcs);
      setPackages(pkgs);
    } catch (err) {
      console.error('Error loading catalog data:', err);
    } finally {
      setDataLoading(false);
    }
  };

  const refreshData = async () => {
    await loadAllData();
    onDataUpdate?.();
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) return;
    setLoading(true);
    try {
      await apiClient.post('/categories', { ...categoryForm, created_by_employee_id: employee.id });
      setCategoryForm({ name: '', description: '' });
      setShowCategoryForm(false);
      await refreshData();
      toast.success('Kategori berhasil ditambahkan!');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      toast.error('Error: ' + (axiosErr.response?.data?.detail || 'Gagal menambah kategori'));
    }
    setLoading(false);
  };

  const handleCreateUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitForm.name.trim()) return;
    setLoading(true);
    try {
      await apiClient.post('/units', { ...unitForm, created_by_employee_id: employee.id });
      setUnitForm({ name: '', description: '' });
      setShowUnitForm(false);
      await refreshData();
      toast.success('Satuan berhasil ditambahkan!');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      toast.error('Error: ' + (axiosErr.response?.data?.detail || 'Gagal menambah satuan'));
    }
    setLoading(false);
  };

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceForm.name.trim() || !serviceForm.category_id || !serviceForm.unit_id) return;
    setLoading(true);
    try {
      await apiClient.post('/services', {
        ...serviceForm,
        base_price: parseFloat(serviceForm.base_price),
        duration_days: parseInt(String(serviceForm.duration_days)),
        duration_hours: parseInt(String(serviceForm.duration_hours)),
        duration_minutes: parseInt(String(serviceForm.duration_minutes)),
        created_by_employee_id: employee.id,
      });
      setServiceForm({
        name: '', category_id: '', unit_id: '', base_price: '',
        duration_days: 0, duration_hours: 0, duration_minutes: 0,
      });
      setShowServiceForm(false);
      await refreshData();
      toast.success('Layanan berhasil ditambahkan!');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      toast.error('Error: ' + (axiosErr.response?.data?.detail || 'Gagal menambah layanan'));
    }
    setLoading(false);
  };

  const handleCreatePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!packageForm.name.trim() || packageForm.services.length === 0) return;
    setLoading(true);
    try {
      await apiClient.post('/packages', { ...packageForm, created_by_employee_id: employee.id });
      setPackageForm({ name: '', description: '', services: [], discount_percent: 0 });
      setShowPackageForm(false);
      await refreshData();
      toast.success('Paket berhasil ditambahkan!');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      toast.error('Error: ' + (axiosErr.response?.data?.detail || 'Gagal menambah paket'));
    }
    setLoading(false);
  };

  const addServiceToPackage = () => {
    if (services.length === 0) return;
    setPackageForm({
      ...packageForm,
      services: [...packageForm.services, { service_id: services[0].id, quantity: 1 }],
    });
  };

  const removeServiceFromPackage = (index: number) => {
    setPackageForm({
      ...packageForm,
      services: packageForm.services.filter((_, i) => i !== index),
    });
  };

  const updatePackageService = (
    index: number,
    field: keyof PackageServiceItem,
    value: string | number,
  ) => {
    const updatedServices = [...packageForm.services];
    updatedServices[index] = { ...updatedServices[index], [field]: value };
    setPackageForm({ ...packageForm, services: updatedServices });
  };

  const formatDuration = (days: number, hours: number, minutes: number) => {
    if (days === 0 && hours === 0 && minutes === 0) return 'Instan';
    return [days > 0 && `${days}h`, hours > 0 && `${hours}j`, minutes > 0 && `${minutes}m`]
      .filter(Boolean)
      .join(' ');
  };

  if (dataLoading) {
    return (
      <div className="space-y-4">
        <SkeletonCard lines={2} />
        <SkeletonCard lines={4} />
      </div>
    );
  }

  const tabs = [
    { value: 'categories', label: `Kategori (${categories.length})`, icon: <FolderTree size={15} /> },
    { value: 'units', label: `Satuan (${units.length})`, icon: <Ruler size={15} /> },
    { value: 'services', label: `Layanan (${services.length})`, icon: <SprayCan size={15} /> },
    { value: 'packages', label: `Paket (${packages.length})`, icon: <PackageIcon size={15} /> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Katalog"
        title="Kustomisasi Layanan"
        description="Kelola kategori, satuan, layanan, dan paket."
      />

      <div className="overflow-x-auto -mx-1 px-1">
        <Tabs
          id="catalog"
          value={activeCustomTab}
          onChange={(v) => setActiveCustomTab(v as CustomTab)}
          tabs={tabs}
        />
      </div>

      <div id="custom-tab-panel" role="tabpanel" aria-live="polite">
        {/* ── Categories ─────────────────────────────────────────────── */}
        {activeCustomTab === 'categories' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center gap-3">
              <h3 className="text-lg font-bold text-ink">Kategori Barang</h3>
              <Button
                variant={showCategoryForm ? 'secondary' : 'primary'}
                size="sm"
                onClick={() => setShowCategoryForm(!showCategoryForm)}
                icon={showCategoryForm ? <X size={15} /> : <Plus size={15} />}
              >
                {showCategoryForm ? 'Batal' : 'Tambah Kategori'}
              </Button>
            </div>

            {showCategoryForm && (
              <Card tone="default" className="bg-surface-sunken">
                <form onSubmit={handleCreateCategory} className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Nama Kategori"
                      placeholder="mis. Pakaian, Sepatu"
                      value={categoryForm.name}
                      onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                      required
                    />
                    <Input
                      label="Deskripsi (opsional)"
                      placeholder="Deskripsi singkat"
                      value={categoryForm.description}
                      onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                    />
                  </div>
                  <Button type="submit" loading={loading} icon={<Save size={15} />}>Simpan Kategori</Button>
                </form>
              </Card>
            )}

            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              {categories.map((category) => (
                <motion.div key={category.id} variants={listItem}>
                  <Card>
                    <h4 className="font-semibold text-ink">{category.name}</h4>
                    <div className="mt-1 text-xs text-ink-faint font-mono">ID: {category.id}</div>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        )}

        {/* ── Units ──────────────────────────────────────────────────── */}
        {activeCustomTab === 'units' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center gap-3">
              <h3 className="text-lg font-bold text-ink">Satuan Hitung</h3>
              <Button
                variant={showUnitForm ? 'secondary' : 'primary'}
                size="sm"
                onClick={() => setShowUnitForm(!showUnitForm)}
                icon={showUnitForm ? <X size={15} /> : <Plus size={15} />}
              >
                {showUnitForm ? 'Batal' : 'Tambah Satuan'}
              </Button>
            </div>

            {showUnitForm && (
              <Card className="bg-surface-sunken">
                <form onSubmit={handleCreateUnit} className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Nama Satuan"
                      placeholder="mis. pcs, kg, set"
                      value={unitForm.name}
                      onChange={(e) => setUnitForm({ ...unitForm, name: e.target.value })}
                      required
                    />
                    <Input
                      label="Deskripsi (opsional)"
                      placeholder="Deskripsi singkat"
                      value={unitForm.description}
                      onChange={(e) => setUnitForm({ ...unitForm, description: e.target.value })}
                    />
                  </div>
                  <Button type="submit" loading={loading} icon={<Save size={15} />}>Simpan Satuan</Button>
                </form>
              </Card>
            )}

            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              {units.map((unit) => (
                <motion.div key={unit.id} variants={listItem}>
                  <Card>
                    <h4 className="font-semibold text-ink">{unit.name}</h4>
                    <div className="mt-1 text-xs text-ink-faint font-mono">ID: {unit.id}</div>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        )}

        {/* ── Services ───────────────────────────────────────────────── */}
        {activeCustomTab === 'services' && (
          <div className="space-y-4">
            <div className="flex justify-between items-start gap-3">
              <div>
                <h3 className="text-lg font-bold text-ink">Layanan dengan Estimasi Manual</h3>
                <p className="text-sm text-ink-muted mt-0.5">Atur sendiri berapa lama setiap layanan akan selesai.</p>
              </div>
              <Button
                variant={showServiceForm ? 'secondary' : 'primary'}
                size="sm"
                onClick={() => setShowServiceForm(!showServiceForm)}
                icon={showServiceForm ? <X size={15} /> : <Plus size={15} />}
                className="shrink-0"
              >
                {showServiceForm ? 'Batal' : 'Tambah Layanan'}
              </Button>
            </div>

            {showServiceForm && (
              <Card className="bg-surface-sunken">
                <div className="rounded-xl bg-brand-50 p-4 mb-4">
                  <h4 className="flex items-center gap-2 text-sm font-semibold text-brand-800 mb-2">
                    <Lightbulb size={15} /> Tips Estimasi Manual
                  </h4>
                  <ul className="text-xs text-brand-700 space-y-1">
                    <li><strong>Cuci Express:</strong> 0 hari + 3 jam</li>
                    <li><strong>Setrika Saja:</strong> 0 hari + 2 jam</li>
                    <li><strong>Dry Clean:</strong> 3 hari</li>
                    <li><strong>Instan:</strong> 0 hari + 0 jam</li>
                  </ul>
                </div>

                <form onSubmit={handleCreateService} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Input
                      label="Nama Layanan"
                      placeholder="Nama layanan"
                      value={serviceForm.name}
                      onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                      required
                    />
                    <Select
                      label="Kategori"
                      value={serviceForm.category_id}
                      onChange={(e) => setServiceForm({ ...serviceForm, category_id: e.target.value })}
                      required
                      options={[{ value: '', label: 'Pilih Kategori' }, ...categories.map((c) => ({ value: c.id, label: c.name }))]}
                    />
                    <Select
                      label="Satuan"
                      value={serviceForm.unit_id}
                      onChange={(e) => setServiceForm({ ...serviceForm, unit_id: e.target.value })}
                      required
                      options={[{ value: '', label: 'Pilih Satuan' }, ...units.map((u) => ({ value: u.id, label: u.name }))]}
                    />
                    <Input
                      label="Harga per satuan"
                      type="number"
                      placeholder="0"
                      value={serviceForm.base_price}
                      onChange={(e) => setServiceForm({ ...serviceForm, base_price: e.target.value })}
                      required
                    />
                  </div>

                  <div className="rounded-xl bg-surface border border-border p-4 space-y-3">
                    <h4 className="flex items-center gap-2 text-sm font-semibold text-ink">
                      <Clock size={15} className="text-accent-600" /> Estimasi Waktu Selesai
                    </h4>
                    <p className="text-xs text-ink-muted">Pelanggan akan melihat estimasi ini saat membuat bon.</p>
                    <div className="grid grid-cols-3 gap-4">
                      <Select
                        label="Hari"
                        value={serviceForm.duration_days}
                        onChange={(e) => setServiceForm({ ...serviceForm, duration_days: parseInt(e.target.value) })}
                        options={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 14, 21, 30].map((d) => ({ value: d, label: `${d} hari` }))}
                      />
                      <Select
                        label="Jam"
                        value={serviceForm.duration_hours}
                        onChange={(e) => setServiceForm({ ...serviceForm, duration_hours: parseInt(e.target.value) })}
                        options={Array.from({ length: 24 }, (_, i) => ({ value: i, label: `${i} jam` }))}
                      />
                      <Select
                        label="Menit"
                        value={serviceForm.duration_minutes}
                        onChange={(e) => setServiceForm({ ...serviceForm, duration_minutes: parseInt(e.target.value) })}
                        options={[0, 15, 30, 45].map((m) => ({ value: m, label: `${m} menit` }))}
                      />
                    </div>

                    <div className="rounded-lg bg-success-light p-3">
                      <div className="text-sm font-semibold text-success-dark mb-1">Preview Estimasi</div>
                      <div className="text-sm text-success-dark/90">
                        {serviceForm.duration_days === 0 && serviceForm.duration_hours === 0 && serviceForm.duration_minutes === 0 ? (
                          'Selesai dalam hitungan menit (Instan)'
                        ) : (
                          <>
                            Jika masuk sekarang, akan selesai pada:{' '}
                            <strong className="text-success-dark">
                              {(() => {
                                const now = new Date();
                                const totalMinutes =
                                  serviceForm.duration_days * 24 * 60 +
                                  serviceForm.duration_hours * 60 +
                                  serviceForm.duration_minutes;
                                const completionTime = new Date(now.getTime() + totalMinutes * 60 * 1000);
                                return completionTime.toLocaleString('id-ID', {
                                  weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
                                });
                              })()}
                            </strong>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <Button type="submit" loading={loading} icon={<Save size={15} />}>Simpan Layanan</Button>
                </form>
              </Card>
            )}

            {services.length === 0 ? (
              <Card>
                <EmptyState
                  title="Belum Ada Layanan"
                  description="Tambahkan layanan dan atur sendiri estimasi waktu selesai. Contoh: Cuci Express (3 jam), Dry Clean (3 hari)."
                />
              </Card>
            ) : (
              <motion.div
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
              >
                {services.map((service) => (
                  <motion.div key={service.id} variants={listItem}>
                    <Card interactive>
                      <div className="flex justify-between items-start mb-3 gap-3">
                        <div className="min-w-0">
                          <h4 className="font-semibold text-ink truncate">{service.name}</h4>
                          <p className="text-sm text-ink-muted">{service.category?.name}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <Money value={service.basePriceCents / 100} />
                          <span className="text-xs text-ink-faint">/{service.unit?.name}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between rounded-lg bg-surface-sunken px-3 py-2">
                        <span className="flex items-center gap-1.5 text-sm font-medium text-ink-muted">
                          <Clock size={14} className="text-accent-600" /> Estimasi
                        </span>
                        <Badge variant="accent">
                          {formatDuration(service.durationDays, service.durationHours, service.durationMinutes)}
                        </Badge>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        )}

        {/* ── Packages ───────────────────────────────────────────────── */}
        {activeCustomTab === 'packages' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center gap-3">
              <h3 className="text-lg font-bold text-ink">Paket Layanan</h3>
              <Button
                variant={showPackageForm ? 'secondary' : 'primary'}
                size="sm"
                onClick={() => setShowPackageForm(!showPackageForm)}
                icon={showPackageForm ? <X size={15} /> : <Plus size={15} />}
              >
                {showPackageForm ? 'Batal' : 'Tambah Paket'}
              </Button>
            </div>

            {showPackageForm && (
              <Card className="bg-surface-sunken">
                <form onSubmit={handleCreatePackage} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Nama Paket"
                      placeholder="mis. Paket Lengkap, Paket Express"
                      value={packageForm.name}
                      onChange={(e) => setPackageForm({ ...packageForm, name: e.target.value })}
                      required
                    />
                    <Input
                      label="Deskripsi Paket"
                      placeholder="Deskripsi paket"
                      value={packageForm.description}
                      onChange={(e) => setPackageForm({ ...packageForm, description: e.target.value })}
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center gap-3">
                      <label className="text-sm font-semibold text-ink-muted">Layanan dalam Paket</label>
                      <Button
                        type="button"
                        variant="subtle"
                        size="sm"
                        onClick={addServiceToPackage}
                        disabled={services.length === 0}
                        icon={<Plus size={14} />}
                      >
                        Tambah Layanan
                      </Button>
                    </div>

                    {packageForm.services.length === 0 ? (
                      <div className="text-center text-sm text-ink-faint py-4 border border-dashed border-border rounded-lg">
                        Belum ada layanan dalam paket. Klik "Tambah Layanan".
                      </div>
                    ) : (
                      packageForm.services.map((serviceItem, index) => (
                        <div key={index} className="flex items-end gap-3 bg-surface p-3 rounded-lg border border-border">
                          <div className="flex-1 min-w-0">
                            <Select
                              label={`Layanan ${index + 1}`}
                              value={serviceItem.service_id}
                              onChange={(e) => updatePackageService(index, 'service_id', e.target.value)}
                              required
                              options={services.map((s) => ({
                                value: s.id,
                                label: `${s.name} - Rp ${(s.basePriceCents / 100).toLocaleString('id-ID')}`,
                              }))}
                            />
                          </div>
                          <Input
                            label="Qty"
                            type="number"
                            min="1"
                            aria-label={`Jumlah layanan ke-${index + 1}`}
                            value={serviceItem.quantity}
                            onChange={(e) => updatePackageService(index, 'quantity', parseInt(e.target.value) || 1)}
                            className="w-20 text-center"
                          />
                          <Button
                            type="button"
                            variant="danger"
                            size="icon"
                            aria-label={`Hapus layanan ke-${index + 1}`}
                            onClick={() => removeServiceFromPackage(index)}
                            icon={<Trash2 size={15} />}
                            iconOnly
                          />
                        </div>
                      ))
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="text-sm font-semibold text-ink-muted">Diskon Paket</label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        aria-label="Diskon paket persen"
                        value={packageForm.discount_percent}
                        onChange={(e) => setPackageForm({ ...packageForm, discount_percent: parseFloat(e.target.value) || 0 })}
                        className="w-20 text-center"
                        placeholder="0"
                      />
                      <span className="text-sm text-ink-muted">%</span>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    loading={loading}
                    disabled={packageForm.services.length === 0}
                    icon={<Save size={15} />}
                  >
                    Simpan Paket
                  </Button>
                </form>
              </Card>
            )}

            {packages.length === 0 ? (
              <Card>
                <EmptyState title="Belum ada paket" description="Tambah paket layanan pertama Anda." />
              </Card>
            ) : (
              <motion.div
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
              >
                {packages.map((pkg) => (
                  <motion.div key={pkg.id} variants={listItem}>
                    <Card interactive>
                      <h4 className="font-semibold text-ink">{pkg.name}</h4>
                      <p className="text-sm text-ink-muted mt-1">{pkg.description}</p>
                      <div className="mt-3 flex justify-between items-end">
                        <Badge variant="default">{pkg.packageServices.length} layanan</Badge>
                        <div className="text-right">
                          <div className="text-xs text-ink-faint line-through font-mono">
                            Rp {(pkg.totalPriceCents / 100).toLocaleString('id-ID')}
                          </div>
                          <Money value={pkg.discountedPriceCents / 100} className="text-base" />
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
