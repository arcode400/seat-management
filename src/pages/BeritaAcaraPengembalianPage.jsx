import { useState } from 'react'
import { RotateCcw } from 'lucide-react'
import BeritaAcaraPengembalianForm from '../components/BeritaAcaraPengembalianForm'
import BeritaAcaraPengembalianList from '../components/BeritaAcaraPengembalianList'
import { useAuth } from '../context/AuthContext'

function SectionCard({ title, children }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
      {title && <h2 className="text-xs font-semibold text-gray-500 mb-4 m-0 uppercase tracking-wide">{title}</h2>}
      {children}
    </div>
  )
}

export default function BeritaAcaraPengembalianPage() {
  const { isAdmin } = useAuth()
  const [refresh, setRefresh] = useState(0)

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3 px-4 py-3 rounded-lg text-sm"
        style={{ backgroundColor: '#FFF7ED', border: '1px solid #FED7AA', color: '#92400E' }}>
        <RotateCcw size={15} className="flex-shrink-0 mt-0.5" />
        <span>
          <strong>BA Pengembalian</strong> dibuat saat perangkat dikembalikan oleh pengguna ke unit TI.
          Dokumen ini mencatat kondisi dan kelengkapan perangkat saat diterima kembali.
        </span>
      </div>

      {isAdmin && (
        <SectionCard title="Buat BA Pengembalian">
          <BeritaAcaraPengembalianForm onCreated={() => setRefresh(r => r + 1)} />
        </SectionCard>
      )}

      <SectionCard title="Daftar BA Pengembalian">
        <BeritaAcaraPengembalianList refreshTrigger={refresh} />
      </SectionCard>
    </div>
  )
}
