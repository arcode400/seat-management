import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Cropper from 'react-easy-crop'
import { X, Camera, Upload, Save, Trash2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

const AVATAR_BUCKET = 'avatars'
const OUTPUT_SIZE = 512 // px square

// === Helper: render cropped image jadi blob ===
async function getCroppedBlob(imageSrc, croppedAreaPixels) {
  const img = new Image()
  img.crossOrigin = 'anonymous'
  await new Promise((res, rej) => {
    img.onload = res
    img.onerror = rej
    img.src = imageSrc
  })

  const canvas = document.createElement('canvas')
  canvas.width  = OUTPUT_SIZE
  canvas.height = OUTPUT_SIZE
  const ctx = canvas.getContext('2d')
  ctx.drawImage(
    img,
    croppedAreaPixels.x, croppedAreaPixels.y,
    croppedAreaPixels.width, croppedAreaPixels.height,
    0, 0,
    OUTPUT_SIZE, OUTPUT_SIZE
  )

  return new Promise((res, rej) => {
    canvas.toBlob(b => b ? res(b) : rej(new Error('Canvas toBlob gagal')), 'image/jpeg', 0.9)
  })
}

export default function ProfileModal({ open, onClose, onUpdated }) {
  const { user, profile, displayName } = useAuth()
  const fileInputRef = useRef(null)

  const [imageSrc, setImageSrc] = useState(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  // Reset saat modal ditutup
  useEffect(() => {
    if (!open) {
      setImageSrc(null)
      setCrop({ x: 0, y: 0 })
      setZoom(1)
      setError(null)
    }
  }, [open])

  function onFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('File harus berupa gambar (JPG/PNG).')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Ukuran maks 5MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => setImageSrc(reader.result)
    reader.readAsDataURL(file)
    setError(null)
  }

  async function handleSave() {
    if (!imageSrc || !croppedAreaPixels) return
    setSaving(true)
    setError(null)
    try {
      const blob = await getCroppedBlob(imageSrc, croppedAreaPixels)
      const path = `${user.id}/avatar-${Date.now()}.jpg`

      const { error: upErr } = await supabase.storage
        .from(AVATAR_BUCKET)
        .upload(path, blob, { contentType: 'image/jpeg', upsert: true })
      if (upErr) throw upErr

      const { data: urlData } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path)
      const avatarUrl = urlData.publicUrl + '?t=' + Date.now() // cache-buster

      const { error: updErr } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl })
        .eq('id', user.id)
      if (updErr) throw updErr

      onUpdated?.(avatarUrl)
      onClose()
    } catch (err) {
      setError(err.message || String(err))
    } finally {
      setSaving(false)
    }
  }

  async function handleRemove() {
    if (!confirm('Hapus foto profile?')) return
    setSaving(true)
    setError(null)
    try {
      const { error: updErr } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', user.id)
      if (updErr) throw updErr
      onUpdated?.(null)
      onClose()
    } catch (err) {
      setError(err.message || String(err))
    } finally {
      setSaving(false)
    }
  }

  const initials = (displayName || 'U').slice(0, 2).toUpperCase()
  const currentAvatar = profile?.avatar_url

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0,  scale: 1   }}
              exit={{    opacity: 0, y: 20, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md pointer-events-auto overflow-hidden"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-semibold text-slate-800 m-0">Foto Profile</h2>
                  <p className="text-xs text-slate-400 m-0 mt-0.5">{displayName}</p>
                </div>
                <button onClick={onClose}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors border-0 bg-transparent cursor-pointer">
                  <X size={18} />
                </button>
              </div>

              <div className="p-5">
                {!imageSrc ? (
                  <div className="flex flex-col items-center gap-4">
                    {/* Current avatar */}
                    <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-2xl font-bold ring-4 ring-white shadow-lg overflow-hidden">
                      {currentAvatar
                        ? <img src={currentAvatar} alt="Avatar" className="w-full h-full object-cover" />
                        : initials}
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-slate-600 m-0 mb-1">Foto saat ini</p>
                      <p className="text-xs text-slate-400 m-0">JPG / PNG, maksimal 5MB</p>
                    </div>

                    <input type="file" accept="image/*" ref={fileInputRef} onChange={onFileChange} className="hidden" />

                    <div className="flex flex-col w-full gap-2">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center justify-center gap-2 w-full px-4 py-2.5 text-sm font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer border-0"
                      >
                        <Upload size={15} strokeWidth={2.5} />
                        {currentAvatar ? 'Ganti Foto' : 'Upload Foto'}
                      </button>
                      {currentAvatar && (
                        <button
                          onClick={handleRemove}
                          disabled={saving}
                          className="flex items-center justify-center gap-2 w-full px-4 py-2.5 text-sm font-semibold rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors cursor-pointer border-0 disabled:opacity-60"
                        >
                          <Trash2 size={15} strokeWidth={2.5} />
                          Hapus Foto
                        </button>
                      )}
                    </div>

                    {error && (
                      <div className="w-full text-xs text-rose-600 bg-rose-50 px-3 py-2 rounded-lg">
                        {error}
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    {/* Crop area */}
                    <div className="relative w-full h-64 bg-slate-100 rounded-lg overflow-hidden">
                      <Cropper
                        image={imageSrc}
                        crop={crop}
                        zoom={zoom}
                        aspect={1}
                        cropShape="round"
                        showGrid={false}
                        onCropChange={setCrop}
                        onZoomChange={setZoom}
                        onCropComplete={(_a, p) => setCroppedAreaPixels(p)}
                      />
                    </div>
                    <div className="mt-3">
                      <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                        Zoom
                      </label>
                      <input
                        type="range" min={1} max={3} step={0.05}
                        value={zoom} onChange={e => setZoom(Number(e.target.value))}
                        className="w-full mt-1 accent-blue-600 cursor-pointer"
                      />
                    </div>
                    <p className="text-xs text-slate-400 mt-2 m-0 text-center">
                      Geser & zoom untuk pilih bagian foto
                    </p>

                    {error && (
                      <div className="mt-3 text-xs text-rose-600 bg-rose-50 px-3 py-2 rounded-lg">
                        {error}
                      </div>
                    )}

                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => setImageSrc(null)}
                        disabled={saving}
                        className="flex-1 px-4 py-2.5 text-sm font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer border-0 disabled:opacity-60"
                      >
                        Batal
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={saving || !croppedAreaPixels}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer border-0 disabled:opacity-60"
                      >
                        <Save size={15} strokeWidth={2.5} />
                        {saving ? 'Menyimpan...' : 'Simpan'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
