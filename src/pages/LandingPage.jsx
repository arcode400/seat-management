import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Monitor, FileText, RotateCcw, AlertTriangle, MapPin, Shield, ArrowRight, ChevronDown, Wifi, Bell, BarChart2, Users } from 'lucide-react'

function useInView(threshold = 0.12) {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true) }, { threshold })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [threshold])
  return [ref, inView]
}

function Reveal({ children, delay = 0, dir = 'up' }) {
  const [ref, inView] = useInView()
  const transforms = {
    up:    inView ? 'translateY(0)' : 'translateY(48px)',
    left:  inView ? 'translateX(0)' : 'translateX(-48px)',
    right: inView ? 'translateX(0)' : 'translateX(48px)',
    scale: inView ? 'scale(1)'      : 'scale(0.88)',
  }
  return (
    <div ref={ref} style={{
      opacity: inView ? 1 : 0,
      transform: transforms[dir],
      transition: `opacity .75s ease ${delay}s, transform .75s ease ${delay}s`,
    }}>
      {children}
    </div>
  )
}

function Counter({ target, suffix = '' }) {
  const [count, setCount] = useState(0)
  const [ref, inView] = useInView(0.3)
  useEffect(() => {
    if (!inView) return
    const isNum = !isNaN(parseInt(target))
    if (!isNum) { setCount(target); return }
    const end = parseInt(target)
    let cur = 0
    const step = Math.ceil(end / (1800 / 16))
    const timer = setInterval(() => {
      cur = Math.min(cur + step, end)
      setCount(cur)
      if (cur >= end) clearInterval(timer)
    }, 16)
    return () => clearInterval(timer)
  }, [inView, target])
  return <span ref={ref}>{typeof count === 'number' ? count.toLocaleString() : count}{suffix}</span>
}

const FEATURES = [
  { icon: Monitor,       color: '#2563EB', bg: 'rgba(37,99,235,0.1)',   title: 'Real-time Monitoring',    desc: 'Pantau status online/offline ratusan laptop sekaligus. Lihat lokasi, IP, WiFi, dan uptime tiap perangkat.' },
  { icon: FileText,      color: '#059669', bg: 'rgba(5,150,105,0.1)',   title: 'Berita Acara Otomatis',   desc: 'Buat BAST dan BAP dalam hitungan detik. Cetak PDF siap tanda tangan langsung dari browser.' },
  { icon: RotateCcw,     color: '#D97706', bg: 'rgba(217,119,6,0.1)',   title: 'Manajemen Peminjaman',    desc: 'Kelola siklus peminjaman lengkap dari tersedia, dipinjam, hingga pengembalian — semua tercatat.' },
  { icon: AlertTriangle, color: '#DC2626', bg: 'rgba(220,38,38,0.1)',   title: 'Tracking Kerusakan',      desc: 'Laporan kerusakan masuk ke sistem. Teknisi update status lapangan, admin pantau dari dashboard.' },
  { icon: MapPin,        color: '#7C3AED', bg: 'rgba(124,58,237,0.1)', title: 'Deteksi Lokasi Laptop',   desc: 'Deteksi apakah laptop di kantor atau di luar. Alert otomatis jika 7+ hari meninggalkan kantor.' },
  { icon: Shield,        color: '#0891B2', bg: 'rgba(8,145,178,0.1)',   title: 'Audit Trail Lengkap',     desc: 'Setiap aksi tercatat — siapa, kapan, apa yang diubah. Tidak ada perubahan yang bisa lolos.' },
  { icon: Wifi,          color: '#16A34A', bg: 'rgba(22,163,74,0.1)',   title: 'Agent Auto-Update',       desc: 'Agent di laptop user otomatis update sendiri. Tidak perlu keliling ke setiap perangkat.' },
  { icon: Users,         color: '#EA580C', bg: 'rgba(234,88,12,0.1)',   title: 'Multi-Role Access',       desc: 'Super Admin, Admin, dan Staff punya akses berbeda. Data aman dan terkontrol.' },
  { icon: BarChart2,     color: '#0D47A1', bg: 'rgba(13,71,161,0.1)',   title: 'Export & Laporan',        desc: 'Export CSV atau cetak PDF. Filter per bulan, tahun, atau status untuk laporan yang akurat.' },
]

const STEPS = [
  { num: '01', title: 'Daftarkan Aset', desc: 'Input semua perangkat IT ke sistem. Data tersimpan terpusat dan bisa diakses kapanpun.' },
  { num: '02', title: 'Install Agent', desc: 'Pasang agent di tiap laptop. Agent kirim data real-time tiap menit — lokasi, status, spesifikasi.' },
  { num: '03', title: 'Monitor & Kelola', desc: 'Pantau semua aset dari dashboard. Buat BA, catat kerusakan, dan terima alert otomatis.' },
]

export default function LandingPage() {
  const navigate = useNavigate()
  const [scrollY, setScrollY] = useState(0)
  const canvasRef = useRef(null)

  useEffect(() => {
    const fn = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let raf
    let dots = []

    function init() {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
      dots = Array.from({ length: 55 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 1.8 + 1.2,
      }))
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      dots.forEach(d => {
        d.x += d.vx; d.y += d.vy
        if (d.x < 0 || d.x > canvas.width)  d.vx *= -1
        if (d.y < 0 || d.y > canvas.height) d.vy *= -1
        ctx.beginPath()
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(147,197,253,0.8)'
        ctx.fill()
      })
      for (let i = 0; i < dots.length; i++) {
        for (let j = i + 1; j < dots.length; j++) {
          const dx = dots[i].x - dots[j].x
          const dy = dots[i].y - dots[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 110) {
            ctx.beginPath()
            ctx.moveTo(dots[i].x, dots[i].y)
            ctx.lineTo(dots[j].x, dots[j].y)
            ctx.strokeStyle = `rgba(147,197,253,${0.22 * (1 - dist / 110)})`
            ctx.lineWidth = 0.7
            ctx.stroke()
          }
        }
      }
      raf = requestAnimationFrame(draw)
    }

    init()
    draw()
    window.addEventListener('resize', init)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', init) }
  }, [])

  const navBg = scrollY > 60 ? 'rgba(10,25,47,0.92)' : 'transparent'
  const logoStyle   = { height: 36, mixBlendMode: 'lighten' }
  const logoStyleLg = { height: 48, mixBlendMode: 'lighten' }
  const logoStyleSm = { height: 26, mixBlendMode: 'lighten', opacity: 0.85 }

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', background: '#fff', overflowX: 'hidden' }}>

      {/* ══ NAVBAR ══ */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
        height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 40px',
        backgroundColor: navBg,
        backdropFilter: scrollY > 60 ? 'blur(16px)' : 'none',
        borderBottom: scrollY > 60 ? '1px solid rgba(255,255,255,0.08)' : 'none',
        transition: 'background-color .4s',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/logo-aps.png" alt="APS" style={logoStyle} />
          <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 16, fontWeight: 300 }}>×</span>
          <img src="/logo-injourney.png" alt="Injourney" style={logoStyle} />
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button onClick={() => navigate('/login')} style={{
            background: 'rgba(255,255,255,0.1)', color: 'white',
            border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8,
            padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}>Login</button>
          <button onClick={() => navigate('/login')} style={{
            background: 'white', color: '#0D47A1', border: 'none', borderRadius: 8,
            padding: '8px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
          }}>Masuk →</button>
        </div>
      </nav>

      {/* ══ HERO ══ */}
      <section style={{
        minHeight: '100vh', position: 'relative', overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(135deg, #020818 0%, #0A1F4E 40%, #0D47A1 80%, #1565C0 100%)',
      }}>
        {/* Blobs */}
        {[
          { w: 700, h: 700, top: '-15%', left: '-10%', c: 'rgba(99,102,241,0.15)', dur: '18s' },
          { w: 500, h: 500, top: '40%',  right: '-8%', c: 'rgba(13,71,161,0.25)',  dur: '14s' },
          { w: 400, h: 400, bottom: '-10%', left: '30%', c: 'rgba(21,101,192,0.2)', dur: '22s' },
        ].map((b, i) => (
          <div key={i} style={{
            position: 'absolute', width: b.w, height: b.h, borderRadius: '50%',
            background: b.c, filter: 'blur(80px)',
            top: b.top, left: b.left, right: b.right, bottom: b.bottom,
            animation: `blob${i} ${b.dur} ease-in-out infinite alternate`,
          }} />
        ))}

        {/* Network dots canvas */}
        <canvas ref={canvasRef} style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          zIndex: 2, pointerEvents: 'none',
        }} />

        {/* Grid */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.05, zIndex: 1 }}>
          <defs>
            <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', padding: '100px 24px 80px', maxWidth: 800 }}>

          {/* Colab logos */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 32 }}>
            <img src="/logo-aps.png" alt="APS" style={logoStyleLg} />
            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 20 }}>×</span>
            <img src="/logo-injourney.png" alt="Injourney" style={logoStyleLg} />
          </div>

          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(99,179,237,0.12)', border: '1px solid rgba(99,179,237,0.25)',
            borderRadius: 999, padding: '6px 18px', marginBottom: 28,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ADE80', display: 'inline-block', animation: 'pulse 2s infinite' }} />
            <span style={{ color: '#93C5FD', fontSize: 12, fontWeight: 600, letterSpacing: 1 }}>SISTEM AKTIF — PT ANGKASA PURA INDONESIA</span>
          </div>

          <h1 style={{ fontSize: 'clamp(40px,7vw,76px)', fontWeight: 900, lineHeight: 1.05, color: 'white', marginBottom: 24, letterSpacing: '-1px' }}>
            Kelola Aset IT<br />
            <span style={{
              background: 'linear-gradient(90deg, #60A5FA, #A78BFA, #60A5FA)',
              backgroundSize: '200%',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              animation: 'shimmer 3s linear infinite',
            }}>Lebih Cerdas</span>
          </h1>

          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.65)', lineHeight: 1.75, maxWidth: 540, margin: '0 auto 48px' }}>
            Platform monitoring real-time dan manajemen peminjaman aset IT terpadu untuk operasional yang lebih efisien dan terukur.
          </p>

          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/login')} style={{
              background: 'linear-gradient(135deg,#2563EB,#0D47A1)', color: 'white',
              border: 'none', borderRadius: 12, padding: '15px 36px', fontSize: 15, fontWeight: 700,
              cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8,
              boxShadow: '0 8px 32px rgba(37,99,235,0.5)', transition: 'transform .2s, box-shadow .2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 14px 40px rgba(37,99,235,0.6)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(37,99,235,0.5)' }}>
              Masuk ke Sistem <ArrowRight size={16} />
            </button>
            <button onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })} style={{
              background: 'rgba(255,255,255,0.08)', color: 'white',
              border: '1px solid rgba(255,255,255,0.18)', borderRadius: 12,
              padding: '15px 32px', fontSize: 15, fontWeight: 600, cursor: 'pointer',
            }}>Lihat Fitur</button>
          </div>

          {/* Stats */}
          <div style={{
            display: 'flex', marginTop: 64, flexWrap: 'wrap',
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 20, padding: '24px 0', backdropFilter: 'blur(10px)',
            maxWidth: 580, margin: '64px auto 0',
          }}>
            {[
              { val: 365, suffix: '+',      label: 'Aset Terdaftar' },
              { val: '24/7', suffix: '',    label: 'Monitoring' },
              { val: 1,   suffix: ' menit', label: 'Interval Ping' },
              { val: 100, suffix: '%',      label: 'Tercatat' },
            ].map((s, i) => (
              <div key={i} style={{
                flex: 1, minWidth: 100, textAlign: 'center',
                borderRight: i < 3 ? '1px solid rgba(255,255,255,0.1)' : 'none',
                padding: '0 16px',
              }}>
                <p style={{ fontSize: 26, fontWeight: 800, color: 'white', margin: 0 }}>
                  <Counter target={s.val} suffix={s.suffix} />
                </p>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: '6px 0 0', textTransform: 'uppercase', letterSpacing: 1 }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div style={{
          position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)',
          color: 'rgba(255,255,255,0.3)', cursor: 'pointer', animation: 'bobY 2s ease-in-out infinite',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
        }} onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}>
          <span style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase' }}>Scroll</span>
          <ChevronDown size={18} />
        </div>
      </section>

      {/* ══ HOW IT WORKS ══ */}
      <section style={{ padding: '100px 24px', background: '#F8FAFF' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: 64 }}>
              <span style={{ display: 'inline-block', background: 'rgba(37,99,235,0.1)', color: '#2563EB', fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', padding: '6px 16px', borderRadius: 999, marginBottom: 16 }}>Cara Kerja</span>
              <h2 style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 800, color: '#0F172A', margin: 0 }}>Sederhana. Cepat. Efisien.</h2>
            </div>
          </Reveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px,1fr))', gap: 32 }}>
            {STEPS.map((s, i) => (
              <Reveal key={i} delay={i * 0.15}>
                <div style={{
                  background: 'white', borderRadius: 20, padding: 32,
                  border: '1px solid #E2E8F0', boxShadow: '0 4px 24px rgba(0,0,0,0.05)',
                  position: 'relative', overflow: 'hidden',
                  transition: 'transform .2s, box-shadow .2s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 16px 40px rgba(37,99,235,0.12)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.05)' }}>
                  <div style={{ position: 'absolute', top: -12, right: -8, fontSize: 80, fontWeight: 900, color: 'rgba(37,99,235,0.05)', lineHeight: 1, userSelect: 'none' }}>{s.num}</div>
                  <div style={{ width: 44, height: 44, borderRadius: 12, marginBottom: 20, background: 'linear-gradient(135deg,#2563EB,#0D47A1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 15 }}>{s.num}</div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', marginBottom: 10 }}>{s.title}</h3>
                  <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.7, margin: 0 }}>{s.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FEATURES ══ */}
      <section id="features" style={{ padding: '100px 24px', background: 'white' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: 64 }}>
              <span style={{ display: 'inline-block', background: 'rgba(124,58,237,0.1)', color: '#7C3AED', fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', padding: '6px 16px', borderRadius: 999, marginBottom: 16 }}>Fitur Lengkap</span>
              <h2 style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 800, color: '#0F172A', margin: 0 }}>Semua yang Kamu Butuhkan</h2>
              <p style={{ color: '#64748B', marginTop: 12, fontSize: 16, maxWidth: 480, margin: '12px auto 0' }}>Dari monitoring real-time sampai berita acara otomatis — satu platform untuk semua kebutuhan.</p>
            </div>
          </Reveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px,1fr))', gap: 20 }}>
            {FEATURES.map((f, i) => (
              <Reveal key={i} delay={(i % 3) * 0.1}>
                <div style={{
                  borderRadius: 16, padding: '24px 26px', border: '1px solid #F1F5F9',
                  background: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  transition: 'all .25s ease', cursor: 'default',
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.09)'; e.currentTarget.style.borderColor = f.color + '40' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'; e.currentTarget.style.borderColor = '#F1F5F9' }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, marginBottom: 16, background: f.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <f.icon size={22} color={f.color} strokeWidth={1.8} />
                  </div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>{f.title}</h3>
                  <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.65, margin: 0 }}>{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CTA ══ */}
      <section style={{ padding: '100px 24px', position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg,#020818 0%,#0A1F4E 50%,#0D47A1 100%)', textAlign: 'center' }}>
        <div style={{ position: 'absolute', width: 600, height: 600, borderRadius: '50%', background: 'rgba(99,102,241,0.12)', filter: 'blur(80px)', top: '-30%', left: '50%', transform: 'translateX(-50%)' }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 600, margin: '0 auto' }}>
          <Reveal dir="scale">
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(99,179,237,0.12)', border: '1px solid rgba(99,179,237,0.25)', borderRadius: 999, padding: '6px 18px', marginBottom: 28 }}>
              <Bell size={13} color="#93C5FD" />
              <span style={{ color: '#93C5FD', fontSize: 12, fontWeight: 600 }}>Siap digunakan sekarang</span>
            </div>
            <h2 style={{ fontSize: 'clamp(32px,5vw,52px)', fontWeight: 900, color: 'white', marginBottom: 16, lineHeight: 1.1 }}>Mulai Kelola Aset<br />IT-mu Sekarang</h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 16, marginBottom: 40, lineHeight: 1.7 }}>Masuk ke sistem dan mulai pantau ratusan perangkat IT secara real-time dari satu dashboard.</p>
            <button onClick={() => navigate('/login')} style={{
              background: 'linear-gradient(135deg,#fff,#E0E7FF)', color: '#0D47A1',
              border: 'none', borderRadius: 14, padding: '16px 40px', fontSize: 16, fontWeight: 800,
              cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 10,
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)', transition: 'transform .2s, box-shadow .2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)'; e.currentTarget.style.boxShadow = '0 16px 48px rgba(0,0,0,0.4)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0) scale(1)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.3)' }}>
              Masuk ke Sistem <ArrowRight size={18} />
            </button>
          </Reveal>
        </div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer style={{ background: '#020818', padding: '28px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/logo-aps.png" alt="APS" style={logoStyleSm} />
          <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 14 }}>×</span>
          <img src="/logo-injourney.png" alt="Injourney" style={logoStyleSm} />
        </div>
        <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12, margin: 0 }}>© 2026 PT Angkasa Pura Supports · Seat Management System</p>
      </footer>

      <style>{`
        @keyframes blob0 { from{transform:translate(0,0) scale(1)} to{transform:translate(40px,30px) scale(1.1)} }
        @keyframes blob1 { from{transform:translate(0,0) scale(1)} to{transform:translate(-30px,40px) scale(0.95)} }
        @keyframes blob2 { from{transform:translate(0,0) scale(1)} to{transform:translate(20px,-30px) scale(1.08)} }
        @keyframes shimmer { 0%{background-position:0%} 100%{background-position:200%} }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.6;transform:scale(1.3)} }
        @keyframes bobY { 0%,100%{transform:translateX(-50%) translateY(0)} 50%{transform:translateX(-50%) translateY(8px)} }
      `}</style>
    </div>
  )
}
