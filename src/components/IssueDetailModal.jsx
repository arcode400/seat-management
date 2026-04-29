import { useState } from 'react'
import { X, AlertTriangle, Clock, CheckCircle, User, Monitor, Calendar, ArrowRight, Trash2 } from 'lucide-react'
import { updateIssue, deleteIssue } from '../services/issueService'
import { useAuth } from '../context/AuthContext'
import { logActivity } from '../services/auditService'

const STATUS_FLOW = {
  reported: { next: 'in_progress', label: 'Mulai Proses', icon: Clock, color: '#D97706' },
  in_progress: { next: 'resolved', label: 'Tandai Selesai', icon: CheckCircle, color: '#16A34A' },
  resolved: null,
}

function StatusBadge({ status }) {
  const map = {
    reported: { bg: '#F3F4F6', color: '#6B7280', label: 'Reported' },
    in_progress: { bg: '#FEF3C7', color: '#D97706', label: 'In Progress' },
    resolved: { bg: '#DCFCE7', color: '#16A34A', label: 'Resolved' },
  }
  const s = map[status] ?? map.reported
  return (
    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
      style={{ backgroundColor: s.bg, color: s.color }}>{s.label}</span>
  )
}

function PriorityBadge({ priority }) {
  const map = {
    low: { bg: '#DBEAFE', color: '#1D4ED8', label: 'Low' },
    medium: { bg: '#FEF3C7', color: '#D97706', label: 'Medium' },
    high: { bg: '#FEE2E2', color: '#DC2626', label: 'High' },
  }
  const p = map[priority] ?? map.medium
  return (
    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
      style={{ backgroundColor: p.bg, color: p.color }}>{p.label}</span>
  )
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function IssueDetailModal({ issue, onClose, onUpdated }) {
  const { isAdmin, isSuperAdmin } = useAuth()
  const [updating, setUpdating] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [localIssue, setLocalIssue] = useState(issue)

  const flow = STATUS_FLOW[localIssue.status]

  async function handleStatusUpdate() {
    if (!flow) return
    setUpdating(true)
    try {
      const updated = await updateIssue(localIssue.id, { status: flow.next })
      setLocalIssue(updated)
      onUpdated(updated)
    } catch (err) {
      alert('Gagal update status: ' + err.message)
    } finally {
      setUpdating(false)
    }
  }

  async function handleDelete() {
    if (!confirm(`Hapus issue "${localIssue.issue_title}"?`)) return
    setDeleting(true)
    try {
      await deleteIssue(localIssue.id)
      logActivity({ action: 'DELETE', table_name: 'laptop_issues', record_id: localIssue.id, description: `Hapus issue: ${localIssue.issue_title}` })
      onClose()
      onUpdated(null, localIssue.id)
    } catch (err) {
      alert('Gagal menghapus: ' + err.message)
      setDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">

        {/* Header */}
        <div className="px-6 py-4 flex items-start justify-between" style={{ borderBottom: '1px solid #F3F4F6' }}>
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: '#FEF3C7' }}>
              <AlertTriangle size={18} style={{ color: '#D97706' }} strokeWidth={2} />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 m-0 leading-snug">{localIssue.issue_title}</h2>
              <p className="text-xs text-gray-400 mt-0.5 m-0">{localIssue.hostname ?? '—'}</p>
            </div>
          </div>
          <button onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors bg-transparent border-0 cursor-pointer p-1 rounded-lg"
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F3F4F6'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">

          {/* Status + Priority */}
          <div className="flex items-center gap-3">
            <StatusBadge status={localIssue.status} />
            <PriorityBadge priority={localIssue.priority} />
          </div>

          {/* Description */}
          {localIssue.issue_description && (
            <div className="rounded-lg px-4 py-3 text-sm text-gray-700 leading-relaxed"
              style={{ backgroundColor: '#F9FAFB', border: '1px solid #F3F4F6' }}>
              {localIssue.issue_description}
            </div>
          )}

          {/* Meta grid */}
          <div className="grid grid-cols-2 gap-3">
            <MetaItem icon={User} label="Assigned To" value={localIssue.assigned_to || '—'} />
            <MetaItem icon={User} label="Reported By" value={localIssue.reported_by || '—'} />
            <MetaItem icon={Calendar} label="Dibuat" value={formatDate(localIssue.created_at)} />
            <MetaItem icon={Calendar} label="Diperbarui" value={formatDate(localIssue.updated_at)} />
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 pb-5 flex items-center justify-between gap-3">
          {isSuperAdmin && (
            <button onClick={handleDelete} disabled={deleting}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition-colors cursor-pointer disabled:opacity-50"
              style={{ borderColor: '#FCA5A5', color: '#DC2626', backgroundColor: 'transparent' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#DC2626'; e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = '#DC2626' }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#DC2626'; e.currentTarget.style.borderColor = '#FCA5A5' }}>
              <Trash2 size={12} />
              {deleting ? 'Menghapus...' : 'Hapus Issue'}
            </button>
          )}

          <div className="flex items-center gap-2 ml-auto">
            <button onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-gray-500 rounded-lg border border-gray-200 bg-transparent cursor-pointer hover:bg-gray-50 transition-colors">
              Tutup
            </button>
            {flow && isAdmin && (
              <button onClick={handleStatusUpdate} disabled={updating}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white rounded-lg border-0 cursor-pointer disabled:opacity-60 transition-colors"
                style={{ backgroundColor: flow.color }}
                onMouseEnter={e => { if (!updating) e.currentTarget.style.opacity = '0.85' }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}>
                <flow.icon size={12} />
                {updating ? 'Memproses...' : flow.label}
                {!updating && <ArrowRight size={11} />}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function MetaItem({ icon: Icon, label, value }) {
  return (
    <div className="rounded-lg px-3 py-2.5" style={{ backgroundColor: '#F9FAFB', border: '1px solid #F3F4F6' }}>
      <div className="flex items-center gap-1.5 mb-0.5">
        <Icon size={11} className="text-gray-400" />
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide m-0">{label}</p>
      </div>
      <p className="text-sm font-medium text-gray-700 m-0 truncate">{value}</p>
    </div>
  )
}
