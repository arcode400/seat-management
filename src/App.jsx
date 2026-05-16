import { useEffect, useState } from 'react'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import WelcomeSection from './components/WelcomeSection'
import MonthlyReminder from './components/MonthlyReminder'
import DashboardCards from './components/DashboardCards'
import DashboardCharts from './components/DashboardCharts'
import LocationAlerts from './components/LocationAlerts'
import LaptopTable from './components/LaptopTable'
import LaptopList from './components/LaptopList'
import AddLaptopForm from './components/AddLaptopForm'
import UsersPage from './pages/UsersPage'
import LogsPage from './pages/LogsPage'
import IssuesPage from './pages/IssuesPage'
import PeminjamanPage from './pages/PeminjamanPage'
import BeritaAcaraKhususPage from './pages/BeritaAcaraKhususPage'
import FormKomplainPage from './pages/FormKomplainPage'
import SettingsPage from './pages/SettingsPage'
import { useAuth } from './context/AuthContext'
import { logAction } from './services/auditService'
import { updateActiveSession } from './services/activeSessionService'

const PAGE_TITLES = {
  Dashboard: 'Dashboard',
  Laptops: 'Manajemen Asets',
  Peminjaman: 'Peminjaman Aset',
  Issues: 'Tracking Kerusakan',
  BAKhusus: 'BA Pengeluaran Aset Ex Seat Management',
  FormKomplain: 'Form Komplain',
  Users: 'Manajemen User',
  Logs: 'Audit Log',
  Settings: 'Pengaturan PIC IT',
}

function AccessDenied({ msg }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
      <p className="text-gray-400 text-sm">{msg}</p>
    </div>
  )
}

function SectionCard({ title, children }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
      {title && <h2 className="text-xs font-semibold text-gray-500 mb-4 m-0 uppercase tracking-wide">{title}</h2>}
      {children}
    </div>
  )
}

const TAB_STORAGE_KEY = 'seat-active-tab'
const VALID_TABS = ['Dashboard', 'Laptops', 'Peminjaman', 'Issues', 'BAKhusus', 'FormKomplain', 'Users', 'Logs', 'Settings']

function loadInitialTab() {
  if (typeof window === 'undefined') return 'Dashboard'
  try {
    const saved = localStorage.getItem(TAB_STORAGE_KEY)
    return saved && VALID_TABS.includes(saved) ? saved : 'Dashboard'
  } catch { return 'Dashboard' }
}

export default function App() {
  const [activeTab, setActiveTabState] = useState(loadInitialTab)
  const setActiveTab = (tab) => {
    setActiveTabState(tab)
    try { localStorage.setItem(TAB_STORAGE_KEY, tab) } catch {}
  }
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    typeof window !== 'undefined' && localStorage.getItem('seat-sidebar-collapsed') === '1'
  )
  const [globalSearch, setGlobalSearch] = useState('')
  const [refreshLaptops, setRefreshLaptops] = useState(0)
  const [editingLaptop, setEditingLaptop] = useState(null)
  const { user, isSuperAdmin, isAdmin, isStaff } = useAuth()

  // Log view dashboard + ping active session on tab change
  useEffect(() => {
    if (!user) return
    if (activeTab === 'Dashboard') {
      logAction(user.email, 'VIEW', 'Buka Dashboard')
    }
    updateActiveSession(user.id, user.email)
  }, [activeTab, user])

  // Heartbeat active session setiap 5 menit
  useEffect(() => {
    if (!user) return
    const interval = setInterval(() => {
      updateActiveSession(user.id, user.email)
    }, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [user])

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onCollapseChange={setSidebarCollapsed}
      />

      <div
        className={`flex flex-col min-h-screen transition-[margin] duration-200 ease-out ${
          sidebarCollapsed ? 'md:ml-[72px]' : 'md:ml-60'
        }`}
      >
        <Topbar
          onMenuToggle={() => setSidebarOpen(prev => !prev)}
          pageTitle={PAGE_TITLES[activeTab] ?? activeTab}
          searchValue={globalSearch}
          onSearchChange={(v) => {
            setGlobalSearch(v)
            // Kalau user mulai ngetik & belum di Dashboard, lompat ke Dashboard
            if (v && activeTab !== 'Dashboard') setActiveTab('Dashboard')
          }}
          onSearchSubmit={(v) => {
            setGlobalSearch(v)
            setActiveTab('Dashboard')
          }}
        />

        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-[1600px] w-full mx-auto">
          {activeTab === 'Dashboard' ? (
            <>
              <WelcomeSection />
              {isStaff && (
                <div className="mb-4 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-700">
                  Mode Teknisi — bisa buat BAP pengembalian, input issues & komplain, lihat aset
                </div>
              )}
              <MonthlyReminder />
              <LocationAlerts />
              <DashboardCards />
              <DashboardCharts />
              <LaptopTable externalSearch={globalSearch} />
            </>
          ) : (
            <div className="mb-5">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 m-0">
                {PAGE_TITLES[activeTab] ?? activeTab}
              </h1>
              {isStaff && (
                <p className="text-xs text-amber-600 mt-1 m-0">
                  Mode Teknisi — bisa buat BAP pengembalian, input issues & komplain, lihat aset
                </p>
              )}
            </div>
          )}

          {activeTab === 'Laptops' && (
            <div className="space-y-5">
              {isAdmin && (
                <SectionCard title={editingLaptop ? `Edit Laptop — ${editingLaptop.hostname}` : 'Tambah Laptop'}>
                  <AddLaptopForm
                    editData={editingLaptop}
                    onCancelEdit={() => setEditingLaptop(null)}
                    onLaptopAdded={() => { setRefreshLaptops(r => r + 1); setEditingLaptop(null) }}
                  />
                </SectionCard>
              )}
              <SectionCard title="Daftar Laptop">
                <LaptopList
                  refreshTrigger={refreshLaptops}
                  onEdit={isAdmin ? (laptop) => setEditingLaptop(laptop) : undefined}
                />
              </SectionCard>
            </div>
          )}

          {activeTab === 'Peminjaman' && <PeminjamanPage />}

          {activeTab === 'Issues' && <IssuesPage />}

          {activeTab === 'BAKhusus' && isAdmin && <BeritaAcaraKhususPage />}
          {activeTab === 'BAKhusus' && !isAdmin && <AccessDenied msg="Halaman ini hanya dapat diakses oleh Admin." />}

          {activeTab === 'FormKomplain' && <FormKomplainPage />}

          {activeTab === 'Users' && isAdmin && <UsersPage isSuperAdmin={isSuperAdmin} />}
          {activeTab === 'Users' && !isAdmin && <AccessDenied msg="Halaman ini hanya dapat diakses oleh Admin." />}

          {activeTab === 'Logs' && isAdmin && <LogsPage />}
          {activeTab === 'Logs' && !isAdmin && <AccessDenied msg="Halaman ini hanya dapat diakses oleh Admin." />}

          {activeTab === 'Settings' && isAdmin && <SettingsPage />}
          {activeTab === 'Settings' && !isAdmin && <AccessDenied msg="Halaman ini hanya dapat diakses oleh Admin." />}
        </main>
      </div>
    </div>
  )
}
