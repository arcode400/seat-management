import { useState } from 'react'
import { PackageX } from 'lucide-react'
import BeritaAcaraKhususForm from '../components/BeritaAcaraKhususForm'
import BeritaAcaraKhususList from '../components/BeritaAcaraKhususList'
import { useAuth } from '../context/AuthContext'

function SectionCard({ title, children }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
      {title && <h2 className="text-xs font-semibold text-gray-500 mb-4 m-0 uppercase tracking-wide">{title}</h2>}
      {children}
    </div>
  )
}

export default function BeritaAcaraKhususPage() {
  const { isAdmin } = useAuth()
  const [refresh, setRefresh] = useState(0)

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3 px-4 py-3 rounded-lg text-sm"
        style={{ backgroundColor: '#FFF1F2', border: '1px solid #FECDD3', color: '#9F1239' }}>
        <PackageX size={15} className="flex-shrink-0 mt-0.5" />
        <span>
          <strong>BA Pengeluaran Aset</strong> digunakan untuk mengeluarkan perangkat secara resmi
          dari inventaris Seat Management. Setelah dokumen ini dibuat, perangkat yang tercantum
          tidak lagi menjadi aset Seat Management.
        </span>
      </div>

      {isAdmin && (
        <SectionCard title="Buat BA Pengeluaran Aset">
          <BeritaAcaraKhususForm onCreated={() => setRefresh(r => r + 1)} />
        </SectionCard>
      )}

      <SectionCard title="Daftar BA Pengeluaran Aset">
        <BeritaAcaraKhususList refreshTrigger={refresh} />
      </SectionCard>
    </div>
  )
}
