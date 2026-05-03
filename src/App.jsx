import { useEffect, useState } from 'react'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
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

export default function App() {
  const [activeTab, setActiveTab] = useState('Dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
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
    <div style={{ backgroundColor: '#F5F7FA' }} className="min-h-screen">
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="md:ml-60 flex flex-col min-h-screen">
        <Topbar onMenuToggle={() => setSidebarOpen(prev => !prev)} />

        <main className="flex-1 p-6">
          <div className="mb-5">
            <h1 className="text-xl font-bold m-0" style={{ color: '#1F2937' }}>
              {PAGE_TITLES[activeTab] ?? activeTab}
            </h1>
            {isStaff && (
              <p className="text-xs text-amber-500 mt-0.5 m-0">
                Mode Teknisi — bisa buat BAP pengembalian, input issues & komplain, lihat aset
              </p>
            )}
          </div>

          {activeTab === 'Dashboard' && (
            <>
              <LocationAlerts />
              <DashboardCards />
              <DashboardCharts />
              <LaptopTable />
            </>
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
        </main>
      </div>
    </div>
  )
}
