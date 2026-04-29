import { useState } from 'react'
import { FileText } from 'lucide-react'
import BeritaAcaraForm from '../components/BeritaAcaraForm'
import BeritaAcaraList from '../components/BeritaAcaraList'
import { useAuth } from '../context/AuthContext'

function SectionCard({ title, children }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
      {title && <h2 className="text-xs font-semibold text-gray-500 mb-4 m-0 uppercase tracking-wide">{title}</h2>}
      {children}
    </div>
  )
}

export default function BeritaAcaraPage() {
  const { isAdmin } = useAuth()
  const [refresh, setRefresh] = useState(0)

  return (
    <div className="space-y-5">

      {/* Info banner */}
      <div className="flex items-start gap-3 px-4 py-3 rounded-xl text-sm"
        style={{ backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE' }}>
        <FileText size={16} style={{ color: '#1D4ED8', flexShrink: 0, marginTop: 1 }} />
        <div>
          <p className="font-semibold m-0" style={{ color: '#1D4ED8' }}>Berita Acara Serah Terima (BAST)</p>
          <p className="text-xs m-0 mt-0.5" style={{ color: '#3B82F6' }}>
            Dokumen resmi pencatatan serah terima perangkat antar pihak. Nomor BA di-generate otomatis dan dokumen siap cetak dalam format formal.
          </p>
        </div>
      </div>

      {/* Form (admin only) */}
      {isAdmin && (
        <SectionCard title="Buat Berita Acara Baru">
          <BeritaAcaraForm onCreated={() => setRefresh(r => r + 1)} />
        </SectionCard>
      )}

      {/* List */}
      <SectionCard title="Riwayat Berita Acara">
        <BeritaAcaraList refreshTrigger={refresh} />
      </SectionCard>
    </div>
  )
}
