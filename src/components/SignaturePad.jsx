import { useRef, useState } from 'react'
import SignatureCanvas from 'react-signature-canvas'
import { Eraser } from 'lucide-react'

export default function SignaturePad({ value, onChange, label = 'Tanda Tangan', height = 160 }) {
  const ref = useRef(null)
  const [empty, setEmty] = useState(!value)

  function handleEnd() {
    if (!ref.current) return
    if (ref.current.isEmpty()) {
      setEmty(true)
      onChange?.(null)
      return
    }
    setEmty(false)
    const dataUrl = ref.current.getCanvas().toDataURL('image/png')
    onChange?.(dataUrl)
  }

  function handleClear() {
    ref.current?.clear()
    setEmty(true)
    onChange?.(null)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</label>
        <button
          type="button"
          onClick={handleClear}
          className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md border-0 cursor-pointer transition-colors"
          style={{ backgroundColor: '#FEF2F2', color: '#DC2626' }}
        >
          <Eraser size={11} /> Hapus
        </button>
      </div>
      <div
        className="rounded-lg border-2 border-dashed bg-white"
        style={{ borderColor: empty ? '#E5E7EB' : '#0D47A1', touchAction: 'none' }}
      >
        <SignatureCanvas
          ref={ref}
          penColor="#111827"
          backgroundColor="rgba(255,255,255,0)"
          canvasProps={{
            style: { width: '100%', height: `${height}px`, display: 'block' },
          }}
          onEnd={handleEnd}
        />
      </div>
      <p className="text-xs text-gray-400 mt-1">
        {empty ? 'Tandatangan di kotak menggunakan jari atau mouse.' : '✓ Tertanda tangani'}
      </p>
    </div>
  )
}
