import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Plus, X, Save, Trash2 } from 'lucide-react';
import type { Employee, Category, Unit, Service, Package } from '@mass-laundry/shared-types';
import { catalogApi, apiClient } from '../../services/api';
import {
  Card, PageHeader, Tabs, Button, Input, Select, EmptyState, Money, SkeletonCard,
  Table, THead, TBody, Tr, Th, Td,
} from '../../components/ui';

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

  const tabs = [
    { value: 'categories', label: `Kategori (${categories.length})` },
    { value: 'units', label: `Satuan (${units.length})` },
    { value: 'services', label: `Layanan (${services.length})` },
    { value: 'packages', label: `Paket (${packages.length})` },
  ];

  const sectionHead = (
    title: string,
    open: boolean,
    toggle: () => void,
    addLabel: string,
  ) => (
    <div className="flex items-center justify-between gap-3 px-4 py-3 md:px-5 border-b border-border-strong">
      <h2 className="text-lg font-bold tracking-tight text-ink">{title}</h2>
      <Button
        variant={open ? 'secondary' : 'primary'}
        size="sm"
        className="min-h-11"
        onClick={toggle}
        icon={open ? <X size={15} /> : <Plus size={15} />}
      >
        {open ? 'Batal' : addLabel}
      </Button>
    </div>
  );

  const formClass = 'border-b border-border bg-surface-sunken px-4 py-4 md:px-5 space-y-4';
  const nameCell = 'font-semibold';
  const hideSm = 'hidden sm:table-cell';

  return (
    <div className="space-y-6">
      <PageHeader title="Kustomisasi layanan" description="Kategori, satuan, layanan, dan paket." />

      <Tabs
        id="catalog"
        value={activeCustomTab}
        onChange={(v) => setActiveCustomTab(v as CustomTab)}
        tabs={tabs}
      />

      <div id="custom-tab-panel" role="tabpanel" aria-live="polite">
        {/* ── Categories ─────────────────────────────────────────────── */}
        {activeCustomTab === 'categories' && (
          <Card noPadding>
            {sectionHead('Kategori', showCategoryForm, () => setShowCategoryForm(!showCategoryForm), 'Tambah kategori')}

            {showCategoryForm && (
              <form onSubmit={handleCreateCategory} className={formClass}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Nama kategori"
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
                <div className="flex justify-end">
                  <Button type="submit" loading={loading} icon={<Save size={15} />}>Simpan kategori</Button>
                </div>
              </form>
            )}

            {categories.length === 0 ? (
              <EmptyState
                title="Belum ada kategori"
                description="Tambah kategori untuk mengelompokkan layanan."
                action={!showCategoryForm && <Button size="sm" className="min-h-11" onClick={() => setShowCategoryForm(true)} icon={<Plus size={15} />}>Tambah kategori</Button>}
              />
            ) : (
              <Table>
                <THead>
                  <Tr noHover>
                    <Th>Nama</Th>
                    <Th numeric>Dipakai</Th>
                  </Tr>
                </THead>
                <TBody>
                  {categories.map((category) => (
                    <Tr key={category.id}>
                      <Td className={nameCell}>{category.name}</Td>
                      <Td numeric className="font-sans font-normal text-ink-muted">
                        {services.filter((service) => service.categoryId === category.id).length} layanan
                      </Td>
                    </Tr>
                  ))}
                </TBody>
              </Table>
            )}
          </Card>
        )}

        {/* ── Units ──────────────────────────────────────────────────── */}
        {activeCustomTab === 'units' && (
          <Card noPadding>
            {sectionHead('Satuan', showUnitForm, () => setShowUnitForm(!showUnitForm), 'Tambah satuan')}

            {showUnitForm && (
              <form onSubmit={handleCreateUnit} className={formClass}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Nama satuan"
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
                <div className="flex justify-end">
                  <Button type="submit" loading={loading} icon={<Save size={15} />}>Simpan satuan</Button>
                </div>
              </form>
            )}

            {units.length === 0 ? (
              <EmptyState
                title="Belum ada satuan"
                description="Tambah satuan untuk menghitung jumlah layanan."
                action={!showUnitForm && <Button size="sm" className="min-h-11" onClick={() => setShowUnitForm(true)} icon={<Plus size={15} />}>Tambah satuan</Button>}
              />
            ) : (
              <Table>
                <THead>
                  <Tr noHover>
                    <Th>Nama</Th>
                    <Th numeric>Dipakai</Th>
                  </Tr>
                </THead>
                <TBody>
                  {units.map((unit) => (
                    <Tr key={unit.id}>
                      <Td className={nameCell}>{unit.name}</Td>
                      <Td numeric className="font-sans font-normal text-ink-muted">
                        {services.filter((service) => service.unitId === unit.id).length} layanan
                      </Td>
                    </Tr>
                  ))}
                </TBody>
              </Table>
            )}
          </Card>
        )}

        {/* ── Services ───────────────────────────────────────────────── */}
        {activeCustomTab === 'services' && (
          <Card noPadding>
            {sectionHead('Layanan', showServiceForm, () => setShowServiceForm(!showServiceForm), 'Tambah layanan')}

            {showServiceForm && (
              <form onSubmit={handleCreateService} className={formClass}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Input
                    label="Nama layanan"
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
                    options={[{ value: '', label: 'Pilih kategori' }, ...categories.map((c) => ({ value: c.id, label: c.name }))]}
                  />
                  <Select
                    label="Satuan"
                    value={serviceForm.unit_id}
                    onChange={(e) => setServiceForm({ ...serviceForm, unit_id: e.target.value })}
                    required
                    options={[{ value: '', label: 'Pilih satuan' }, ...units.map((u) => ({ value: u.id, label: u.name }))]}
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

                <div className="border-t border-border pt-4 space-y-3">
                  <h3 className="text-base font-semibold text-ink">Estimasi selesai</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                  <p className="text-sm text-ink-muted">
                    {serviceForm.duration_days === 0 && serviceForm.duration_hours === 0 && serviceForm.duration_minutes === 0 ? (
                      'Selesai dalam hitungan menit (Instan)'
                    ) : (
                      <>
                        Jika masuk sekarang, selesai pada{' '}
                        <strong className="text-ink">
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
                  </p>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" loading={loading} icon={<Save size={15} />}>Simpan layanan</Button>
                </div>
              </form>
            )}

            {services.length === 0 ? (
              <EmptyState
                title="Belum ada layanan"
                description="Tambah layanan beserta harga dan estimasi selesainya."
                action={!showServiceForm && <Button size="sm" className="min-h-11" onClick={() => setShowServiceForm(true)} icon={<Plus size={15} />}>Tambah layanan</Button>}
              />
            ) : (
              <Table>
                <THead>
                  <Tr noHover>
                    <Th>Nama</Th>
                    <Th className={hideSm}>Kategori</Th>
                    <Th className={hideSm}>Estimasi</Th>
                    <Th numeric>Harga</Th>
                  </Tr>
                </THead>
                <TBody>
                  {services.map((service) => (
                    <Tr key={service.id}>
                      <Td className={nameCell}>
                        {service.name}
                        <span className="block text-sm font-normal text-ink-muted sm:hidden">{service.category?.name}</span>
                      </Td>
                      <Td className={`${hideSm} text-ink-muted`}>{service.category?.name}</Td>
                      <Td className={`${hideSm} text-ink-muted`}>
                        {formatDuration(service.durationDays, service.durationHours, service.durationMinutes)}
                      </Td>
                      <Td numeric>
                        <Money value={service.basePriceCents / 100} />
                        <span className="font-sans font-normal text-sm text-ink-muted"> /{service.unit?.name}</span>
                      </Td>
                    </Tr>
                  ))}
                </TBody>
              </Table>
            )}
          </Card>
        )}

        {/* ── Packages ───────────────────────────────────────────────── */}
        {activeCustomTab === 'packages' && (
          <Card noPadding>
            {sectionHead('Paket', showPackageForm, () => setShowPackageForm(!showPackageForm), 'Tambah paket')}

            {showPackageForm && (
              <form onSubmit={handleCreatePackage} className={formClass}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Nama paket"
                    placeholder="mis. Paket Lengkap, Paket Express"
                    value={packageForm.name}
                    onChange={(e) => setPackageForm({ ...packageForm, name: e.target.value })}
                    required
                  />
                  <Input
                    label="Deskripsi paket"
                    placeholder="Deskripsi paket"
                    value={packageForm.description}
                    onChange={(e) => setPackageForm({ ...packageForm, description: e.target.value })}
                  />
                </div>

                <div className="border-t border-border pt-4 space-y-3">
                  <div className="flex justify-between items-center gap-3">
                    <h3 className="text-base font-semibold text-ink">Layanan dalam paket</h3>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="min-h-11"
                      onClick={addServiceToPackage}
                      disabled={services.length === 0}
                      icon={<Plus size={14} />}
                    >
                      Tambah layanan
                    </Button>
                  </div>

                  {packageForm.services.length === 0 ? (
                    <p className="text-sm text-ink-muted py-2">
                      Belum ada layanan dalam paket. Tekan &quot;Tambah layanan&quot;.
                    </p>
                  ) : (
                    <div className="ledger">
                      {packageForm.services.map((serviceItem, index) => (
                        <div key={index} className="flex items-end gap-3 py-3">
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
                            variant="ghost"
                            className="hover:text-danger"
                            size="icon"
                            aria-label={`Hapus layanan ke-${index + 1}`}
                            onClick={() => removeServiceFromPackage(index)}
                            icon={<Trash2 size={16} />}
                            iconOnly
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <label htmlFor="package-discount" className="text-sm font-medium text-ink-muted">Diskon paket</label>
                  <Input
                    id="package-discount"
                    type="number"
                    min="0"
                    max="100"
                    value={packageForm.discount_percent}
                    onChange={(e) => setPackageForm({ ...packageForm, discount_percent: parseFloat(e.target.value) || 0 })}
                    className="w-24 text-center"
                    placeholder="0"
                  />
                  <span className="text-sm text-ink-muted">%</span>
                </div>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    loading={loading}
                    disabled={packageForm.services.length === 0}
                    icon={<Save size={15} />}
                  >
                    Simpan paket
                  </Button>
                </div>
              </form>
            )}

            {packages.length === 0 ? (
              <EmptyState
                title="Belum ada paket"
                description="Gabungkan beberapa layanan jadi satu paket."
                action={!showPackageForm && <Button size="sm" className="min-h-11" onClick={() => setShowPackageForm(true)} icon={<Plus size={15} />}>Tambah paket</Button>}
              />
            ) : (
              <Table>
                <THead>
                  <Tr noHover>
                    <Th>Nama</Th>
                    <Th numeric>Item</Th>
                    <Th numeric>Harga</Th>
                  </Tr>
                </THead>
                <TBody>
                  {packages.map((pkg) => (
                    <Tr key={pkg.id}>
                      <Td className={nameCell}>
                        {pkg.name}
                        {pkg.description && <span className="block text-sm font-normal text-ink-muted">{pkg.description}</span>}
                      </Td>
                      <Td numeric className="font-sans font-normal text-ink-muted">{pkg.packageServices.length} layanan</Td>
                      <Td numeric>
                        {pkg.discountedPriceCents !== pkg.totalPriceCents && (
                          <span className="block text-sm line-through text-ink-muted">
                            <Money value={pkg.totalPriceCents / 100} />
                          </span>
                        )}
                        <Money value={pkg.discountedPriceCents / 100} />
                      </Td>
                    </Tr>
                  ))}
                </TBody>
              </Table>
            )}
          </Card>
        )}
      </div>
    </div>
  );
};
