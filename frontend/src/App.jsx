import React, { useState, useEffect } from 'react';
import './App.css';
import axios from 'axios';
import { PrinterProvider } from './contexts/PrinterContext';
import { EmployeeLogin } from './features/auth/EmployeeLogin';
import { EmployeeRegistration } from './features/auth/EmployeeRegistration';
import { AdminRegistration } from './features/auth/AdminRegistration';
import { ExcelReportExport } from './features/reports/ExcelReportExport';
import { AnalyticsDashboard } from './features/reports/AnalyticsDashboard';
import { AuditDashboard } from './features/audit/AuditDashboard';
import { ClientManagement } from './features/clients/ClientManagement';
// ServiceItemsManagement extracted to features/catalog/ServiceItemsManagement.tsx (not currently in use in routing — tab was removed)
import { CustomizationManager } from './features/catalog/CustomizationManager';
import { ClientSelector } from './features/clients/ClientSelector';
import { ReceiptForm } from './features/receipts/ReceiptForm';
import { RecentReceipts } from './features/receipts/RecentReceipts';
import { LaundrySettingsPanel } from './features/settings/LaundrySettingsPanel';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Components extracted to features/ — see imports above

// Main App Component
function App() {
  const [currentEmployee, setCurrentEmployee] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [activeTab, setActiveTab] = useState('create');
  const [showAdminRegistration, setShowAdminRegistration] = useState(false);
  const [showEmployeeRegistration, setShowEmployeeRegistration] = useState(false);
  const [isRestoringSession, setIsRestoringSession] = useState(true); // Add loading state for session

  // New state for customization features
  const [categories, setCategories] = useState([]);
  const [units, setUnits] = useState([]);
  const [services, setServices] = useState([]);
  const [packages, setPackages] = useState([]);
  
  // Modal states
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showPackageModal, setShowPackageModal] = useState(false);

  // Fresh start - clear all existing data and cache
  useEffect(() => {
    console.log('🆕 Fresh App Start - Clearing all caches...');
    
    // Unregister all existing service workers for fresh start
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => {
          console.log('🗑️ Unregistering old service worker...');
          registration.unregister();
        });
        
        // Register fresh service worker
        navigator.serviceWorker.register('/sw.js')
          .then(() => console.log('✅ Fresh Service Worker registered'))
          .catch(err => console.error('❌ SW registration failed:', err));
      });
    }

    // Clear all existing caches
    if ('caches' in window) {
      caches.keys().then(cacheNames => {
        cacheNames.forEach(cacheName => {
          console.log('🗑️ Clearing cache:', cacheName);
          caches.delete(cacheName);
        });
      });
    }

    // Clear localStorage for fresh start (except keep current session)
    const currentSession = localStorage.getItem('laundry_user_session');
    localStorage.clear();
    if (currentSession) {
      localStorage.setItem('laundry_user_session', currentSession);
    }

    // Load all initial data (will be empty on fresh start)
    loadEmployees();
    loadCategories();
    loadUnits();
    loadServices();
    loadPackages();
    
    // Hide loading screen once React has rendered
    setTimeout(() => {
      const loading = document.getElementById('app-loading');
      if (loading) loading.style.display = 'none';
    }, 100);
    
    // Simple session restoration
    const restoreSession = () => {
      console.log('🔄 [Session] Checking for stored session...');
      
      try {
        const storedSession = localStorage.getItem('laundry_user_session');
        
        if (storedSession) {
          console.log('📦 [Session] Found stored session data');
          
          const userData = JSON.parse(storedSession);
          const loginTime = new Date(userData.loginTime);
          const now = new Date();
          const hoursSinceLogin = (now - loginTime) / (1000 * 60 * 60);
          
          console.log(`⏰ [Session] Hours since login: ${hoursSinceLogin.toFixed(2)}`);
          
          if (hoursSinceLogin < 24) {
            console.log('✅ [Session] Restoring valid session for:', userData.name);
            setCurrentEmployee({
              id: userData.id,
              name: userData.name,
              role: userData.role,
              pin: userData.pin,
              created_at: userData.created_at || new Date().toISOString(),
              is_active: true
            });
            setIsRestoringSession(false);
            return;
          } else {
            console.log('⏰ [Session] Session expired, removing');
            localStorage.removeItem('laundry_user_session');
          }
        } else {
          console.log('ℹ️ [Session] No stored session found');
        }
      } catch (error) {
        console.error('❌ [Session] Error during restoration:', error);
        localStorage.removeItem('laundry_user_session');
      }
      
      setIsRestoringSession(false);
    };
    
    // Start restoration after a brief delay
    setTimeout(restoreSession, 500);
  }, []);

  // Initialize default data
  useEffect(() => {
    if (currentEmployee && categories.length === 0) {
      console.log('🔄 Initializing default data...');
      initializeDefaultData();
    }
  }, [currentEmployee, categories.length]);

  const loadEmployees = async () => {
    try {
      const response = await axios.get(`${API}/employees`);
      setEmployees(response.data);
    } catch (err) {
      console.error('Error loading employees:', err);
    }
  };

  // Load customization data
  const loadCategories = async () => {
    try {
      const response = await axios.get(`${API}/categories`);
      setCategories(response.data);
      
      // If no categories exist, initialize default data
      if (response.data.length === 0) {
        await initializeDefaultData();
      }
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  };

  const loadUnits = async () => {
    try {
      const response = await axios.get(`${API}/units`);
      setUnits(response.data);
    } catch (err) {
      console.error('Error loading units:', err);
    }
  };

  const loadServices = async () => {
    try {
      const response = await axios.get(`${API}/services`);
      setServices(response.data);
    } catch (err) {
      console.error('Error loading services:', err);
    }
  };

  const loadPackages = async () => {
    try {
      const response = await axios.get(`${API}/packages`);
      setPackages(response.data);
    } catch (err) {
      console.error('Error loading packages:', err);
    }
  };

  // Initialize default data
  const initializeDefaultData = async () => {
    try {
      const response = await axios.post(`${API}/initialize`);
      console.log('✅ Default data initialized:', response.data);
      
      // Reload all data after initialization
      setTimeout(() => {
        loadCategories();
        loadUnits();
        loadServices();
        loadPackages();
      }, 1000);
    } catch (err) {
      console.error('Error initializing default data:', err);
    }
  };

  const handleLogin = (employee) => {
    console.log('🔐 [Login] Starting login process for:', employee.name);
    setCurrentEmployee(employee);
    
    // Store user session using simple direct approach
    const userSession = {
      id: employee.id,
      name: employee.name,
      role: employee.role,
      pin: employee.pin,
      created_at: employee.created_at,
      is_active: employee.is_active,
      loginTime: new Date().toISOString()
    };
    
    // Direct localStorage save with immediate verification
    try {
      localStorage.setItem('laundry_user_session', JSON.stringify(userSession));
      
      // Immediately verify
      const verification = localStorage.getItem('laundry_user_session');
      if (verification) {
        console.log('✅ [Login] Session verified saved to localStorage');
      } else {
        console.error('❌ [Login] Session save verification failed');
      }
    } catch (error) {
      console.error('❌ [Login] Failed to save session:', error);
    }
    
    console.log('✅ [Login] Login process completed for:', employee.name);
  };

  const handleLogout = () => {
    console.log('🚪 [Logout] Starting logout process');
    setCurrentEmployee(null);
    setSelectedClient(null);
    setActiveTab('create');
    
    // Clear stored session directly
    try {
      localStorage.removeItem('laundry_user_session');
      console.log('✅ [Logout] Session cleared from localStorage');
    } catch (error) {
      console.error('❌ [Logout] Failed to clear session:', error);
    }
    
    // Show logout confirmation
    setTimeout(() => {
      alert('Anda telah berhasil logout. Terima kasih telah menggunakan Mass Laundry!');
    }, 100);
  };

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
  };

  const handleClientSelect = (client) => {
    setSelectedClient(client);
  };

  const handleReceiptCreated = (receiptData) => {
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

  if (isRestoringSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full mx-4">
          <div className="text-center">
            <div className="text-4xl mb-4">🧺</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Mass Laundry</h1>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Memulihkan sesi...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!currentEmployee) {
    return (
      <PrinterProvider>
        <>
          <EmployeeLogin
            onLogin={handleLogin}
            employees={employees}
            onShowAdminRegistration={handleShowAdminRegistration}
            onShowEmployeeRegistration={setShowEmployeeRegistration}
          />
          {/* Employee Registration Modal */}
          {showEmployeeRegistration && (
            <EmployeeRegistration
              onBack={() => setShowEmployeeRegistration(false)}
              onEmployeeCreated={(employee) => {
                setShowEmployeeRegistration(false);
                // Auto-login the new employee
                handleLogin(null, employee);
              }}
            />
          )}

          {/* Admin Registration Modal */}
          {showAdminRegistration && (
            <AdminRegistration
              onCancel={() => setShowAdminRegistration(false)}
              onSuccess={handleAdminRegistrationSuccess}
            />
          )}
        </>
      </PrinterProvider>
    );
  }

  const isAdmin = currentEmployee.role === 'admin';

  return (
    <PrinterProvider>
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-12 sm:h-16">
            {/* Logo and Title - Mobile optimized */}
            <div className="flex items-center space-x-2">
              <h1 className="text-base sm:text-2xl font-bold text-indigo-600 flex items-center">
                <span className="text-lg sm:text-2xl mr-1">🧺</span>
                <span className="hidden xs:inline">Mass Laundry</span>
                <span className="xs:hidden">LP</span>
              </h1>
              {/* User info - Hidden on small mobile */}
              <div className="hidden sm:flex items-center space-x-2">
                <span className="text-gray-500">|</span>
                <div className="text-gray-700 text-sm">
                  <span>{currentEmployee.name}</span>
                  {isAdmin && <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">👑 Admin</span>}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Mobile User Badge */}
              <div className="sm:hidden flex items-center">
                {isAdmin && (
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full mr-2">👑</span>
                )}
                <button
                  onClick={handleLogout}
                  className="px-2 py-1 text-xs font-medium text-red-600 hover:text-red-800 transition-colors"
                >
                  Keluar
                </button>
              </div>
              
              {/* Desktop Navigation - Hidden on mobile */}
              <nav aria-label="Menu utama" className="hidden sm:flex space-x-1 bg-gray-100 rounded-lg p-1" role="tablist">
                <button
                  role="tab"
                  aria-selected={activeTab === 'create'}
                  aria-controls="tab-panel"
                  onClick={() => handleTabChange('create')}
                  className={`px-2 lg:px-4 py-2 rounded-lg text-xs lg:text-sm font-medium transition-colors ${
                    activeTab === 'create'
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Bon Baru
                </button>
                <button
                  role="tab"
                  aria-selected={activeTab === 'receipts'}
                  aria-controls="tab-panel"
                  onClick={() => handleTabChange('receipts')}
                  className={`px-2 lg:px-4 py-2 rounded-lg text-xs lg:text-sm font-medium transition-colors ${
                    activeTab === 'receipts'
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Semua Bon
                </button>
                {/* Hide Settings, Audit, Customization from regular employees - Admin only */}
                {isAdmin && (
                  <button
                    role="tab"
                    aria-selected={activeTab === 'audit'}
                    aria-controls="tab-panel"
                    onClick={() => handleTabChange('audit')}
                    className={`px-2 lg:px-4 py-2 rounded-lg text-xs lg:text-sm font-medium transition-colors ${
                      activeTab === 'audit'
                        ? 'bg-white text-indigo-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    🔍 Audit
                  </button>
                )}
                {isAdmin && (
                  <button
                    role="tab"
                    aria-selected={activeTab === 'clients'}
                    aria-controls="tab-panel"
                    onClick={() => handleTabChange('clients')}
                    className={`px-2 lg:px-4 py-2 rounded-lg text-xs lg:text-sm font-medium transition-colors ${
                      activeTab === 'clients'
                        ? 'bg-white text-indigo-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    👥 Pelanggan
                  </button>
                )}
                {isAdmin && (
                  <button
                    role="tab"
                    aria-selected={activeTab === 'settings'}
                    aria-controls="tab-panel"
                    onClick={() => handleTabChange('settings')}
                    className={`px-2 lg:px-4 py-2 rounded-lg text-xs lg:text-sm font-medium transition-colors ${
                      activeTab === 'settings'
                        ? 'bg-white text-indigo-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    ⚙️ Settings
                  </button>
                )}

                {/* Show Customization for admin OR user named "user" */}
                {(isAdmin || (currentEmployee && currentEmployee.name === 'user')) && (
                  <button
                    role="tab"
                    aria-selected={activeTab === 'customization'}
                    aria-controls="tab-panel"
                    onClick={() => handleTabChange('customization')}
                    className={`px-2 lg:px-4 py-2 rounded-lg text-xs lg:text-sm font-medium transition-colors ${
                      activeTab === 'customization'
                        ? 'bg-white text-indigo-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    🎨 Kustomisasi
                  </button>
                )}
                <button
                  role="tab"
                  aria-selected={activeTab === 'reports'}
                  aria-controls="tab-panel"
                  onClick={() => handleTabChange('reports')}
                  className={`px-2 lg:px-4 py-2 rounded-lg text-xs lg:text-sm font-medium transition-colors ${
                    activeTab === 'reports'
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  📊 Laporan
                </button>
              </nav>
              
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

      {/* Mobile Bottom Navigation - Optimized */}
      <nav aria-label="Navigasi mobile" className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-20" role="tablist">
        <div className="px-1 py-2">
          {/* Show different navigation based on admin/employee role */}
          {!isAdmin ? (
            /* Regular Employee Navigation - 1 row only */
            <div className="flex justify-around">
              <button
                role="tab"
                aria-selected={activeTab === 'create'}
                aria-controls="tab-panel"
                onClick={() => handleTabChange('create')}
                className={`flex flex-col items-center py-2 px-2 text-xs transition-colors ${
                  activeTab === 'create'
                    ? 'text-indigo-600'
                    : 'text-gray-600'
                }`}
              >
                <span className="text-lg mb-1">📝</span>
                <span className="text-xs font-medium">Bon Baru</span>
              </button>
              <button
                role="tab"
                aria-selected={activeTab === 'receipts'}
                aria-controls="tab-panel"
                onClick={() => handleTabChange('receipts')}
                className={`flex flex-col items-center py-2 px-2 text-xs transition-colors ${
                  activeTab === 'receipts'
                    ? 'text-indigo-600'
                    : 'text-gray-600'
                }`}
              >
                <span className="text-lg mb-1">📋</span>
                <span className="text-xs font-medium">Semua Bon</span>
              </button>
              {/* Show Kustomisasi for user named "user" */}
              {currentEmployee && currentEmployee.name === 'user' && (
                <button
                  role="tab"
                  aria-selected={activeTab === 'customization'}
                  aria-controls="tab-panel"
                  onClick={() => handleTabChange('customization')}
                  className={`flex flex-col items-center py-2 px-2 text-xs transition-colors ${
                    activeTab === 'customization'
                      ? 'text-indigo-600'
                      : 'text-gray-600'
                  }`}
                >
                  <span className="text-lg mb-1">🎨</span>
                  <span className="text-xs font-medium">Kustomisasi</span>
                </button>
              )}
              <button
                role="tab"
                aria-selected={activeTab === 'reports'}
                aria-controls="tab-panel"
                onClick={() => handleTabChange('reports')}
                className={`flex flex-col items-center py-2 px-2 text-xs transition-colors ${
                  activeTab === 'reports'
                    ? 'text-indigo-600'
                    : 'text-gray-600'
                }`}
              >
                <span className="text-lg mb-1">📊</span>
                <span className="text-xs font-medium">Laporan</span>
              </button>
            </div>
          ) : (
            /* Admin Navigation - 2 rows for more space */
            <div>
              {/* First Row */}
              <div className="flex justify-around mb-1">
                <button
                  role="tab"
                  aria-selected={activeTab === 'create'}
                  aria-controls="tab-panel"
                  onClick={() => handleTabChange('create')}
                  className={`flex flex-col items-center py-1 px-2 text-xs transition-colors ${
                    activeTab === 'create'
                      ? 'text-indigo-600'
                      : 'text-gray-600'
                  }`}
                >
                  <span className="text-lg mb-1">📝</span>
                  <span className="text-xs font-medium">Bon Baru</span>
                </button>
                <button
                  role="tab"
                  aria-selected={activeTab === 'receipts'}
                  aria-controls="tab-panel"
                  onClick={() => handleTabChange('receipts')}
                  className={`flex flex-col items-center py-1 px-2 text-xs transition-colors ${
                    activeTab === 'receipts'
                      ? 'text-indigo-600'
                      : 'text-gray-600'
                  }`}
                >
                  <span className="text-lg mb-1">📋</span>
                  <span className="text-xs font-medium">Semua Bon</span>
                </button>
                <button
                  role="tab"
                  aria-selected={activeTab === 'clients'}
                  aria-controls="tab-panel"
                  onClick={() => handleTabChange('clients')}
                  className={`flex flex-col items-center py-1 px-2 text-xs transition-colors ${
                    activeTab === 'clients'
                      ? 'text-indigo-600'
                      : 'text-gray-600'
                  }`}
                >
                  <span className="text-lg mb-1">👥</span>
                  <span className="text-xs font-medium">Pelanggan</span>
                </button>
              </div>
              {/* Second Row */}
              <div className="flex justify-around">
                <button
                  role="tab"
                  aria-selected={activeTab === 'audit'}
                  aria-controls="tab-panel"
                  onClick={() => handleTabChange('audit')}
                  className={`flex flex-col items-center py-1 px-2 text-xs transition-colors ${
                    activeTab === 'audit'
                      ? 'text-indigo-600'
                      : 'text-gray-600'
                  }`}
                >
                  <span className="text-lg mb-1">🔍</span>
                  <span className="text-xs font-medium">Audit</span>
                </button>
                <button
                  role="tab"
                  aria-selected={activeTab === 'customization'}
                  aria-controls="tab-panel"
                  onClick={() => handleTabChange('customization')}
                  className={`flex flex-col items-center py-1 px-2 text-xs transition-colors ${
                    activeTab === 'customization'
                      ? 'text-indigo-600'
                      : 'text-gray-600'
                  }`}
                >
                  <span className="text-lg mb-1">🎨</span>
                  <span className="text-xs font-medium">Kustomisasi</span>
                </button>
                <button
                  role="tab"
                  aria-selected={activeTab === 'reports'}
                  aria-controls="tab-panel"
                  onClick={() => handleTabChange('reports')}
                  className={`flex flex-col items-center py-1 px-2 text-xs transition-colors ${
                    activeTab === 'reports'
                      ? 'text-indigo-600'
                      : 'text-gray-600'
                  }`}
                >
                  <span className="text-lg mb-1">📊</span>
                  <span className="text-xs font-medium">Laporan</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      <main className="px-2 sm:px-6 lg:px-8 py-3 sm:py-8 pb-24 sm:pb-8">
        <div id="tab-panel" role="tabpanel" aria-live="polite" className="max-w-7xl mx-auto">
          {activeTab === 'create' && (
            <div className="space-y-3 sm:space-y-8">
              {!selectedClient ? (
                <div className="bg-white rounded-lg shadow-lg p-3 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-6">
                    <h2 className="text-lg sm:text-2xl font-bold text-gray-800 mb-2 sm:mb-0">Pilih atau Tambah Pelanggan</h2>
                    {selectedClient && (
                      <button
                        onClick={() => setSelectedClient(null)}
                        className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200 transition-colors"
                      >
                        ← Pilih Ulang
                      </button>
                    )}
                  </div>
                  <ClientSelector onClientSelect={handleClientSelect} selectedClient={selectedClient} />
                </div>
              ) : (
                <>
                  <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 mb-3 sm:mb-4">
                    <button
                      onClick={() => setSelectedClient(null)}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2 self-start"
                    >
                      <span>←</span>
                      <span>Kembali ke Pilih Pelanggan</span>
                    </button>
                    <div className="text-sm sm:text-lg text-gray-800">
                      Membuat bon untuk: <span className="font-bold text-indigo-600">{selectedClient.name}</span>
                    </div>
                  </div>
                  <ReceiptForm 
                    employee={currentEmployee} 
                    client={selectedClient} 
                    onReceiptCreated={handleReceiptCreated}
                  />
                </>
              )}
            </div>
          )}

        {activeTab === 'receipts' && (
          <RecentReceipts employee={currentEmployee} />
        )}

        {activeTab === 'audit' && (
          <AuditDashboard employee={currentEmployee} />
        )}

        {/* Removed Services Tab - moved functionality to Customization */}

        {activeTab === 'clients' && isAdmin && (
          <ClientManagement employee={currentEmployee} />
        )}

        {activeTab === 'settings' && (
          <LaundrySettingsPanel />
        )}

        {/* Show Customization for admin OR user named "user" */}
        {activeTab === 'customization' && (isAdmin || (currentEmployee && currentEmployee.name === 'user')) && (
          <CustomizationManager
            employee={currentEmployee}
          />
        )}

        {activeTab === 'reports' && (
          <AnalyticsDashboard />
        )}
        </div>
      </main>
    </div>
    </PrinterProvider>
  );
}



export default App;