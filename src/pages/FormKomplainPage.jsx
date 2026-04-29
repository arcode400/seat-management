import { useState } from 'react'
import { MessageSquareWarning } from 'lucide-react'
import FormKomplainForm from '../components/FormKomplainForm'
import FormKomplainList from '../components/FormKomplainList'
import { useAuth } from '../context/AuthContext'

function SectionCard({ title, children }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
      {title && <h2 className="text-xs font-semibold text-gray-500 mb-4 m-0 uppercase tracking-wide">{title}</h2>}
      {children}
    </div>
  )
}

export default function FormKomplainPage() {
  const { isAdmin, isStaff } = useAuth()
  const [refresh, setRefresh] = useState(0)

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3 px-4 py-3 rounded-lg text-sm"
        style={{ backgroundColor: '#FFF7ED', border: '1px solid #FED7AA', color: '#9A3412' }}>
        <MessageSquareWarning size={15} className="flex-shrink-0 mt-0.5" />
        <span>
          <strong>Form Komplain</strong> digunakan untuk mencatat laporan kerusakan atau masalah perangkat
          dari user. Lampirkan foto pada halaman kedua dokumen yang tercetak.
        </span>
      </div>

      {(isAdmin || isStaff) && (
        <SectionCard title="Buat Form Komplain">
          <FormKomplainForm onCreated={() => setRefresh(r => r + 1)} />
        </SectionCard>
      )}

      <SectionCard title="Daftar Form Komplain">
        <FormKomplainList refreshTrigger={refresh} />
      </SectionCard>
    </div>
  )
}
