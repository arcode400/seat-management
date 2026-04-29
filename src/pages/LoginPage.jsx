import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Mail, Lock } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const navigate = useNavigate()
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50)
    return () => clearTimeout(t)
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signIn(email, password)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      const msg = err.message
      if (msg.includes('Invalid login credentials')) {
        setError('Email atau password salah. Periksa kembali dan coba lagi.')
      } else if (msg.includes('Email not confirmed')) {
        setError('Email belum dikonfirmasi. Cek inbox email Anda.')
      } else {
        setError(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">

      {/* ─── LEFT PANEL ─── */}
      <div
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden"
        style={{
          backgroundImage: 'url(/bg-login.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundColor: '#0A2E6E',
        }}
      >
        {/* Overlay */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(160deg, rgba(10,30,80,0.88) 0%, rgba(13,71,161,0.75) 60%, rgba(0,0,0,0.65) 100%)' }}
        />

        {/* Decorative circles */}
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full" style={{ background: 'rgba(255,255,255,0.04)' }} />
        <div className="absolute bottom-10 -right-10 w-64 h-64 rounded-full" style={{ background: 'rgba(255,255,255,0.04)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full" style={{ background: 'rgba(13,71,161,0.15)' }} />

        {/* Content */}
        <div
          className="relative z-10 flex flex-col justify-between w-full px-14 py-16"
          style={{
            transition: 'opacity 0.8s ease, transform 0.8s ease',
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateX(0)' : 'translateX(-24px)',
          }}
        >
          {/* Logo */}
          <div>
            <div className="inline-flex bg-white rounded-xl px-5 py-3">
              <img src="/logo.png" alt="Angkasa Pura Supports" className="h-10 w-auto object-contain" />
            </div>
          </div>

          {/* Middle text */}
          <div>
            <p className="text-blue-300 text-sm font-semibold uppercase tracking-widest mb-4">
              Enterprise Asset Management
            </p>
            <h2 className="text-4xl font-bold text-white leading-tight mb-5">
              Kelola Aset IT<br />Lebih Cerdas
            </h2>
            <p className="text-blue-100/80 text-base leading-relaxed max-w-sm">
              Platform monitoring laptop dan manajemen peminjaman perangkat terpadu untuk operasional Injourney Airports yang efisien.
            </p>

            {/* Stats */}
            <div className="flex gap-8 mt-10">
              {[
                { value: '99.9%', label: 'Uptime' },
                { value: '24/7', label: 'Monitoring' },
                { value: '100+', label: 'Perangkat' },
              ].map((s, i) => (
                <div key={i} className="flex items-center gap-4">
                  {i > 0 && <div className="h-10 w-px bg-white/15" />}
                  <div>
                    <p className="text-2xl font-bold text-white">{s.value}</p>
                    <p className="text-blue-200/70 text-xs mt-0.5">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <p className="text-blue-300/50 text-xs">
            © 2025 Angkasa Pura Supports. All rights reserved.
          </p>
        </div>
      </div>

      {/* ─── RIGHT PANEL ─── */}
      <div
        className="w-full lg:w-1/2 relative flex items-center justify-center min-h-screen overflow-hidden px-6 py-12"
        style={{ background: 'linear-gradient(150deg, #7F0000 0%, #B71C1C 45%, #D32F2F 100%)' }}
      >
        {/* SVG geometric pattern */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="xMidYMid slice">
          <defs>
            <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          <circle cx="85%" cy="12%" r="160" fill="rgba(255,255,255,0.05)" />
          <circle cx="8%"  cy="80%" r="200" fill="rgba(0,0,0,0.08)" />
          <circle cx="60%" cy="90%" r="90"  fill="rgba(255,255,255,0.04)" />
          <polygon points="0,0 180,0 0,180"         fill="rgba(255,255,255,0.04)" />
          <polygon points="100%,100% 100%,55% 55%,100%" fill="rgba(0,0,0,0.07)" />
        </svg>

        <div
          className="relative z-10 w-full max-w-md"
          style={{
            transition: 'opacity 0.8s ease 0.15s, transform 0.8s ease 0.15s',
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(24px)',
          }}
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <div className="inline-flex bg-white rounded-xl px-5 py-3">
              <img src="/logo.png" alt="Logo" className="h-10 w-auto object-contain" />
            </div>
          </div>

          {/* Tagline */}
          <div className="text-center mb-6">
            <p className="text-red-200 text-xs font-semibold uppercase tracking-widest mb-2">
              Seat Management System
            </p>
            <h1 className="text-white text-2xl font-bold">Selamat Datang Kembali</h1>
            <p className="text-red-200/80 text-sm mt-2">
              Masuk untuk mengakses dashboard monitoring
            </p>
          </div>

          {/* ── LOGIN CARD ── */}
          <div
            className="bg-white rounded-2xl p-8"
            style={{ boxShadow: '0 30px 80px rgba(0,0,0,0.35), 0 8px 20px rgba(0,0,0,0.2)' }}
          >
            <h2 className="text-base font-bold text-gray-800 mb-6 text-center tracking-wide">
              Login to System
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    type="email" value={email} required
                    onChange={e => { setEmail(e.target.value); setError('') }}
                    placeholder="email@angkasapura.co.id"
                    className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg text-gray-800 placeholder-gray-300 focus:outline-none transition-colors bg-gray-50 focus:bg-white"
                    onFocus={e => { e.target.style.borderColor = '#0D47A1'; e.target.style.backgroundColor = 'white' }}
                    onBlur={e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.backgroundColor = '#F9FAFB' }}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'} value={password} required
                    onChange={e => { setPassword(e.target.value); setError('') }}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2.5 text-sm border border-gray-200 rounded-lg text-gray-800 placeholder-gray-300 focus:outline-none transition-colors bg-gray-50 focus:bg-white"
                    onFocus={e => { e.target.style.borderColor = '#0D47A1'; e.target.style.backgroundColor = 'white' }}
                    onBlur={e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.backgroundColor = '#F9FAFB' }}
                  />
                  <button type="button" onClick={() => setShowPassword(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 bg-transparent border-0 cursor-pointer p-0 transition-colors">
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-start gap-2 text-sm rounded-lg px-3 py-2.5"
                  style={{ backgroundColor: '#FEF2F2', color: '#DC2626' }}>
                  <span className="mt-0.5 flex-shrink-0">⚠</span>
                  <span>{error}</span>
                </div>
              )}

              {/* Divider */}
              <div className="h-px bg-gray-100 my-1" />

              {/* Submit */}
              <button type="submit" disabled={loading}
                className="w-full py-3 text-sm font-bold text-white rounded-lg disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer border-0 transition-colors"
                style={{ backgroundColor: '#0D47A1' }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.backgroundColor = '#1565C0' }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#0D47A1' }}
              >
                {loading
                  ? <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" strokeOpacity="0.3" />
                        <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round" />
                      </svg>
                      Memuat...
                    </span>
                  : 'Masuk ke Dashboard'
                }
              </button>
            </form>
          </div>

          <p className="text-center text-xs text-red-200/60 mt-6">
            © 2025 Angkasa Pura Supports. All rights reserved.
          </p>
        </div>
      </div>

    </div>
  )
}
