import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import type { Employee, Category, Unit, Service, Package } from '@mass-laundry/shared-types';
import { catalogApi, apiClient } from '../../services/api';

interface CustomizationManagerProps {
  employee: Employee;
  onDataUpdate?: () => void;
}

interface CategoryForm {
  name: string;
  description: string;
}

interface UnitForm {
  name: string;
  description: string;
}

interface ServiceForm {
  name: string;
  category_id: string;
  unit_id: string;
  base_price: string;
  duration_days: number;
  duration_hours: number;
  duration_minutes: number;
}

interface PackageServiceItem {
  service_id: string;
  quantity: number;
}

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

  // Data state — fetched internally to decouple from App
  const [categories, setCategories] = useState<Category[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  // Category Management
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [categoryForm, setCategoryForm] = useState<CategoryForm>({ name: '', description: '' });

  // Unit Management
  const [showUnitForm, setShowUnitForm] = useState(false);
  const [unitForm, setUnitForm] = useState<UnitForm>({ name: '', description: '' });

  // Service Management
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [serviceForm, setServiceForm] = useState<ServiceForm>({
    name: '',
    category_id: '',
    unit_id: '',
    base_price: '',
    duration_days: 0,
    duration_hours: 0,
    duration_minutes: 0,
  });

  // Package Management
  const [showPackageForm, setShowPackageForm] = useState(false);
  const [packageForm, setPackageForm] = useState<PackageForm>({
    name: '',
    description: '',
    services: [],
    discount_percent: 0,
  });

  useEffect(() => {
    loadAllData();
  }, []);

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

  // Create Category
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) return;

    setLoading(true);
    try {
      await apiClient.post('/categories', {
        ...categoryForm,
        created_by_employee_id: employee.id,
      });
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

  // Create Unit
  const handleCreateUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitForm.name.trim()) return;

    setLoading(true);
    try {
      await apiClient.post('/units', {
        ...unitForm,
        created_by_employee_id: employee.id,
      });
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

  // Create Service
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
        name: '',
        category_id: '',
        unit_id: '',
        base_price: '',
        duration_days: 0,
        duration_hours: 0,
        duration_minutes: 0,
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

  // Create Package
  const handleCreatePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!packageForm.name.trim() || packageForm.services.length === 0) return;

    setLoading(true);
    try {
      await apiClient.post('/packages', {
        ...packageForm,
        created_by_employee_id: employee.id,
      });
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

  // Add service to package
  const addServiceToPackage = () => {
    if (services.length === 0) return;
    setPackageForm({
      ...packageForm,
      services: [...packageForm.services, { service_id: services[0].id, quantity: 1 }],
    });
  };

  // Remove service from package
  const removeServiceFromPackage = (index: number) => {
    setPackageForm({
      ...packageForm,
      services: packageForm.services.filter((_, i) => i !== index),
    });
  };

  // Update package service
  const updatePackageService = (
    index: number,
    field: keyof PackageServiceItem,
    value: string | number
  ) => {
    const updatedServices = [...packageForm.services];
    updatedServices[index] = { ...updatedServices[index], [field]: value };
    setPackageForm({ ...packageForm, services: updatedServices });
  };

  if (dataLoading) {
    return <div className="text-center py-8">Memuat data kustomisasi...</div>;
  }

  const tabs: { id: CustomTab; label: string; count: number }[] = [
    { id: 'categories', label: '📂 Kategori', count: categories.length },
    { id: 'units', label: '📏 Satuan', count: units.length },
    { id: 'services', label: '🧽 Layanan', count: services.length },
    { id: 'packages', label: '📦 Paket', count: packages.length },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">🎨 Kustomisasi Mass Laundry</h2>
          <div className="text-sm text-gray-600">Kelola kategori, satuan, layanan, dan paket</div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveCustomTab(tab.id)}
              className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeCustomTab === tab.id
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {tab.label}
              <span className="ml-1 text-xs bg-gray-200 px-1 rounded">{tab.count}</span>
            </button>
          ))}
        </div>

        {/* Categories Tab */}
        {activeCustomTab === 'categories' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">Kategori Barang</h3>
              <button
                onClick={() => setShowCategoryForm(!showCategoryForm)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm"
              >
                {showCategoryForm ? '✕ Batal' : '➕ Tambah Kategori'}
              </button>
            </div>

            {showCategoryForm && (
              <form
                onSubmit={handleCreateCategory}
                className="bg-gray-50 p-4 rounded-lg space-y-3"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Nama Kategori (e.g., Pakaian, Sepatu)"
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Deskripsi (optional)"
                    value={categoryForm.description}
                    onChange={(e) =>
                      setCategoryForm({ ...categoryForm, description: e.target.value })
                    }
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                >
                  {loading ? 'Menyimpan...' : '💾 Simpan Kategori'}
                </button>
              </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((category) => (
                <div key={category.id} className="bg-gray-50 p-4 rounded-lg border">
                  <h4 className="font-semibold text-gray-800">{category.name}</h4>
                  <div className="mt-2 text-xs text-gray-500">ID: {category.id}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Units Tab */}
        {activeCustomTab === 'units' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">Satuan Hitung</h3>
              <button
                onClick={() => setShowUnitForm(!showUnitForm)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm"
              >
                {showUnitForm ? '✕ Batal' : '➕ Tambah Satuan'}
              </button>
            </div>

            {showUnitForm && (
              <form onSubmit={handleCreateUnit} className="bg-gray-50 p-4 rounded-lg space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Nama Satuan (e.g., pcs, kg, set)"
                    value={unitForm.name}
                    onChange={(e) => setUnitForm({ ...unitForm, name: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Deskripsi (optional)"
                    value={unitForm.description}
                    onChange={(e) => setUnitForm({ ...unitForm, description: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                >
                  {loading ? 'Menyimpan...' : '💾 Simpan Satuan'}
                </button>
              </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {units.map((unit) => (
                <div key={unit.id} className="bg-gray-50 p-4 rounded-lg border">
                  <h4 className="font-semibold text-gray-800">{unit.name}</h4>
                  <div className="mt-2 text-xs text-gray-500">ID: {unit.id}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Services Tab */}
        {activeCustomTab === 'services' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  Layanan dengan Estimasi Manual
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Atur sendiri berapa lama setiap layanan akan selesai
                </p>
              </div>
              <button
                onClick={() => setShowServiceForm(!showServiceForm)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm"
              >
                {showServiceForm ? '✕ Batal' : '➕ Tambah Layanan'}
              </button>
            </div>

            {showServiceForm && (
              <div className="bg-gray-50 p-6 rounded-lg space-y-4 border-2 border-indigo-200">
                <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-lg mb-4">
                  <h4 className="text-sm font-semibold text-indigo-800 mb-2">
                    💡 Tips Estimasi Manual:
                  </h4>
                  <ul className="text-xs text-indigo-700 space-y-1">
                    <li>
                      • <strong>Cuci Express:</strong> 0 hari + 3 jam + 0 menit
                    </li>
                    <li>
                      • <strong>Setrika Saja:</strong> 0 hari + 2 jam + 0 menit
                    </li>
                    <li>
                      • <strong>Dry Clean:</strong> 3 hari + 0 jam + 0 menit
                    </li>
                    <li>
                      • <strong>Cuci Setrika:</strong> 2 hari + 0 jam + 0 menit
                    </li>
                    <li>
                      • <strong>Instan:</strong> 0 hari + 0 jam + 0 menit
                    </li>
                  </ul>
                </div>

                <form onSubmit={handleCreateService} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <input
                      type="text"
                      placeholder="Nama Layanan"
                      value={serviceForm.name}
                      onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      required
                    />
                    <select
                      value={serviceForm.category_id}
                      onChange={(e) =>
                        setServiceForm({ ...serviceForm, category_id: e.target.value })
                      }
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      required
                    >
                      <option value="">Pilih Kategori</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                    <select
                      value={serviceForm.unit_id}
                      onChange={(e) =>
                        setServiceForm({ ...serviceForm, unit_id: e.target.value })
                      }
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      required
                    >
                      <option value="">Pilih Satuan</option>
                      {units.map((unit) => (
                        <option key={unit.id} value={unit.id}>
                          {unit.name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      placeholder="Harga per satuan"
                      value={serviceForm.base_price}
                      onChange={(e) =>
                        setServiceForm({ ...serviceForm, base_price: e.target.value })
                      }
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg space-y-3">
                    <h4 className="text-sm font-semibold text-blue-800 flex items-center">
                      ⏱️ Estimasi Waktu Selesai (Atur Manual)
                    </h4>
                    <p className="text-xs text-blue-700 mb-3">
                      Atur sendiri berapa lama layanan ini akan selesai. Pelanggan akan melihat
                      estimasi ini saat membuat bon.
                    </p>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Hari</label>
                        <select
                          value={serviceForm.duration_days}
                          onChange={(e) =>
                            setServiceForm({
                              ...serviceForm,
                              duration_days: parseInt(e.target.value),
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                        >
                          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 14, 21, 30].map((days) => (
                            <option key={days} value={days}>
                              {days} hari
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Jam</label>
                        <select
                          value={serviceForm.duration_hours}
                          onChange={(e) =>
                            setServiceForm({
                              ...serviceForm,
                              duration_hours: parseInt(e.target.value),
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                        >
                          {Array.from({ length: 24 }, (_, i) => (
                            <option key={i} value={i}>
                              {i} jam
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Menit
                        </label>
                        <select
                          value={serviceForm.duration_minutes}
                          onChange={(e) =>
                            setServiceForm({
                              ...serviceForm,
                              duration_minutes: parseInt(e.target.value),
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                        >
                          {[0, 15, 30, 45].map((minutes) => (
                            <option key={minutes} value={minutes}>
                              {minutes} menit
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Preview Estimasi */}
                    <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
                      <div className="text-sm font-medium text-green-800 mb-1">
                        📅 Preview Estimasi:
                      </div>
                      <div className="text-sm text-green-700">
                        {serviceForm.duration_days === 0 &&
                        serviceForm.duration_hours === 0 &&
                        serviceForm.duration_minutes === 0 ? (
                          '⚡ Selesai dalam hitungan menit (Instan)'
                        ) : (
                          <>
                            Jika masuk sekarang (
                            {new Date().toLocaleString('id-ID', {
                              day: 'numeric',
                              month: 'long',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                            ), akan selesai pada:{' '}
                            <strong className="text-green-900">
                              {(() => {
                                const now = new Date();
                                const totalMinutes =
                                  serviceForm.duration_days * 24 * 60 +
                                  serviceForm.duration_hours * 60 +
                                  serviceForm.duration_minutes;
                                const completionTime = new Date(
                                  now.getTime() + totalMinutes * 60 * 1000
                                );
                                return completionTime.toLocaleString('id-ID', {
                                  weekday: 'long',
                                  day: 'numeric',
                                  month: 'long',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                });
                              })()}
                            </strong>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                  >
                    {loading ? 'Menyimpan...' : '💾 Simpan Layanan'}
                  </button>
                </form>
              </div>
            )}

            {/* Services List */}
            <div className="space-y-4">
              {services.length === 0 && (
                <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                  <div className="mb-4">⏱️</div>
                  <h4 className="text-lg font-medium text-gray-800 mb-2">Belum Ada Layanan</h4>
                  <p className="text-gray-600 mb-4">
                    Tambahkan layanan dan atur sendiri estimasi waktu selesai untuk setiap layanan.
                  </p>
                  <p className="text-sm text-gray-500">
                    Contoh: Cuci Express (3 jam), Dry Clean (3 hari), Setrika Saja (2 jam)
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {services.map((service) => (
                  <div
                    key={service.id}
                    className="bg-gray-50 p-4 rounded-lg border hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-800">{service.name}</h4>
                        <p className="text-sm text-gray-600">{service.category?.name}</p>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-indigo-600">
                          Rp{(service.basePriceCents / 100).toLocaleString('id-ID')}/
                          {service.unit?.name}
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border border-orange-200 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <span className="text-orange-600 mr-2">⏱️</span>
                          <span className="text-sm font-medium text-gray-700">
                            Estimasi Manual:
                          </span>
                        </div>
                        <div className="text-sm font-bold text-orange-600">
                          {service.durationDays === 0 &&
                          service.durationHours === 0 &&
                          service.durationMinutes === 0 ? (
                            'Instan'
                          ) : (
                            <>
                              {service.durationDays > 0 && `${service.durationDays}h `}
                              {service.durationHours > 0 && `${service.durationHours}j `}
                              {service.durationMinutes > 0 && `${service.durationMinutes}m`}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Packages Tab */}
        {activeCustomTab === 'packages' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">Paket Layanan</h3>
              <button
                onClick={() => setShowPackageForm(!showPackageForm)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm"
              >
                {showPackageForm ? '✕ Batal' : '➕ Tambah Paket'}
              </button>
            </div>

            {showPackageForm && (
              <form
                onSubmit={handleCreatePackage}
                className="bg-gray-50 p-4 rounded-lg space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Nama Paket (e.g., Paket Lengkap, Paket Express)"
                    value={packageForm.name}
                    onChange={(e) => setPackageForm({ ...packageForm, name: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Deskripsi paket"
                    value={packageForm.description}
                    onChange={(e) =>
                      setPackageForm({ ...packageForm, description: e.target.value })
                    }
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                {/* Services in Package */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium text-gray-700">
                      Layanan dalam Paket:
                    </label>
                    <button
                      type="button"
                      onClick={addServiceToPackage}
                      disabled={services.length === 0}
                      className="text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 disabled:bg-gray-400"
                    >
                      ➕ Tambah Layanan
                    </button>
                  </div>

                  {packageForm.services.length === 0 ? (
                    <div className="text-center text-gray-500 py-4 border-2 border-dashed border-gray-200 rounded">
                      Belum ada layanan dalam paket. Klik "Tambah Layanan" untuk menambah.
                    </div>
                  ) : (
                    packageForm.services.map((serviceItem, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-3 bg-white p-3 rounded border"
                      >
                        <select
                          value={serviceItem.service_id}
                          onChange={(e) =>
                            updatePackageService(index, 'service_id', e.target.value)
                          }
                          className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
                          required
                        >
                          {services.map((service) => (
                            <option key={service.id} value={service.id}>
                              {service.name} - Rp
                              {(service.basePriceCents / 100).toLocaleString('id-ID')}
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          min="1"
                          value={serviceItem.quantity}
                          onChange={(e) =>
                            updatePackageService(
                              index,
                              'quantity',
                              parseInt(e.target.value) || 1
                            )
                          }
                          className="w-20 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 text-center"
                          placeholder="Qty"
                        />
                        <button
                          type="button"
                          onClick={() => removeServiceFromPackage(index)}
                          className="bg-red-500 text-white px-3 py-2 rounded hover:bg-red-600"
                        >
                          🗑️
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* Discount */}
                <div className="flex items-center space-x-4">
                  <label className="text-sm font-medium text-gray-700">Diskon Paket:</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={packageForm.discount_percent}
                      onChange={(e) =>
                        setPackageForm({
                          ...packageForm,
                          discount_percent: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-20 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 text-center"
                      placeholder="0"
                    />
                    <span className="text-sm text-gray-600">%</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || packageForm.services.length === 0}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                >
                  {loading ? 'Menyimpan...' : '💾 Simpan Paket'}
                </button>
              </form>
            )}

            {/* Packages List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {packages.length === 0 ? (
                <div className="col-span-2 text-center text-gray-500 py-8">
                  📦 Belum ada paket layanan. Tambah paket pertama Anda!
                </div>
              ) : (
                packages.map((pkg) => (
                  <div key={pkg.id} className="bg-gray-50 p-4 rounded-lg border">
                    <h4 className="font-semibold text-gray-800">{pkg.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">{pkg.description}</p>
                    <div className="mt-2 flex justify-between items-end">
                      <div className="text-sm text-gray-500">
                        {pkg.packageServices.length} layanan
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-400 line-through">
                          Rp{(pkg.totalPriceCents / 100).toLocaleString('id-ID')}
                        </div>
                        <div className="font-bold text-green-600">
                          Rp{(pkg.discountedPriceCents / 100).toLocaleString('id-ID')}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
