import { useEffect, useState } from 'react'
import { AlertTriangle, Clock, CheckCircle, Layers } from 'lucide-react'
import { getIssueStats } from '../services/issueService'
import AddIssueForm from '../components/AddIssueForm'
import IssueList from '../components/IssueList'
import { useAuth } from '../context/AuthContext'

function SectionCard({ title, children }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
      {title && <h2 className="text-xs font-semibold text-gray-500 mb-4 m-0 uppercase tracking-wide">{title}</h2>}
      {children}
    </div>
  )
}

function StatCard({ icon: Icon, label, value, iconBg, iconColor, loading }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-start gap-4">
      <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: iconBg }}>
        <Icon size={22} style={{ color: iconColor }} strokeWidth={1.75} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide m-0">{label}</p>
        {loading
          ? <div className="w-12 h-7 bg-gray-100 rounded animate-pulse my-1" />
          : <p className="text-3xl font-bold text-gray-900 leading-tight my-1 m-0">{value}</p>
        }
      </div>
    </div>
  )
}

export default function IssuesPage() {
  const { isAdmin, isStaff } = useAuth()
  const [stats, setStats] = useState({ reported: 0, inProgress: 0, resolved: 0, total: 0 })
  const [statsLoading, setStatsLoading] = useState(true)
  const [refresh, setRefresh] = useState(0)

  useEffect(() => { fetchStats() }, [refresh])

  async function fetchStats() {
    try {
      setStatsLoading(true)
      const data = await getIssueStats()
      setStats(data)
    } catch (err) {
      console.error(err)
    } finally {
      setStatsLoading(false)
    }
  }

  function handleIssueAdded() {
    setRefresh(r => r + 1)
  }

  return (
    <div className="space-y-5">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Layers} label="Total Issue" value={stats.total}
          iconBg="#EDE9FE" iconColor="#7C3AED" loading={statsLoading} />
        <StatCard icon={AlertTriangle} label="Reported" value={stats.reported}
          iconBg="#F3F4F6" iconColor="#6B7280" loading={statsLoading} />
        <StatCard icon={Clock} label="In Progress" value={stats.inProgress}
          iconBg="#FEF3C7" iconColor="#D97706" loading={statsLoading} />
        <StatCard icon={CheckCircle} label="Resolved" value={stats.resolved}
          iconBg="#DCFCE7" iconColor="#16A34A" loading={statsLoading} />
      </div>

      {/* Add Issue Form (Admin + Teknisi) */}
      {(isAdmin || isStaff) && (
        <SectionCard title="Laporkan Issue Baru">
          <AddIssueForm onIssueAdded={handleIssueAdded} />
        </SectionCard>
      )}

      {/* Issue List */}
      <SectionCard title="Daftar Issue">
        <IssueList refreshTrigger={refresh} />
      </SectionCard>
    </div>
  )
}
