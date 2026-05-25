import { useRef, useEffect, useState, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, useInView, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import { useMobile } from '../hooks/useMobile'

// ─── Design tokens ───────────────────────────────────────────────────────────
const C = {
  bg:       '#050d07',
  surface:  '#0a1a0a',
  surface2: '#0d2b0d',
  border:   '#1a3322',
  lime:     '#a3e635',
  limeDim:  '#84cc16',
  green:    '#22c55e',
  text:     '#e8f2e8',
  muted:    '#6b8f73',
  dim:      '#3d5e44',
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function scrollTo(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

// ─── Grain overlay ────────────────────────────────────────────────────────────
function Grain() {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1,
      pointerEvents: 'none',
      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
      backgroundRepeat: 'repeat',
      backgroundSize: '128px 128px',
      opacity: 0.028,
      mixBlendMode: 'overlay',
    }} />
  )
}

// ─── Animated counter ─────────────────────────────────────────────────────────
function Counter({ end, suffix = '', prefix = '', decimals = 0 }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const [val, setVal] = useState(0)

  useEffect(() => {
    if (!inView) return
    let raf
    const start = performance.now()
    const dur = 2000
    const tick = (now) => {
      const t = Math.min((now - start) / dur, 1)
      const eased = 1 - Math.pow(1 - t, 4)
      setVal(eased * end)
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, end])

  const display = decimals > 0
    ? val.toFixed(decimals)
    : Math.round(val).toLocaleString()

  return <span ref={ref}>{prefix}{display}{suffix}</span>
}

// ─── Leaf wordmark ────────────────────────────────────────────────────────────
function LogoMark({ size = 26, animate = false }) {
  return (
    <motion.svg
      width={size} height={size} viewBox="0 0 32 32" fill="none"
      whileHover={animate ? { rotate: [0, -8, 8, 0] } : {}}
      transition={{ duration: 0.5 }}
    >
      <path
        d="M16 3C16 3 5 8 5 18C5 23.5 9.5 28 16 28C22.5 28 27 23.5 27 18C27 8 16 3 16 3Z"
        fill="url(#lmGrad)"
      />
      <path d="M16 28V14" stroke="#050d07" strokeWidth="2" strokeLinecap="round" />
      <path d="M16 20C16 20 10 16 8 12" stroke="#050d07" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M16 17C16 17 20 14 23 11" stroke="#050d07" strokeWidth="1.5" strokeLinecap="round" />
      <defs>
        <linearGradient id="lmGrad" x1="5" y1="3" x2="27" y2="28" gradientUnits="userSpaceOnUse">
          <stop stopColor="#a3e635" /><stop offset="1" stopColor="#22c55e" />
        </linearGradient>
      </defs>
    </motion.svg>
  )
}

// ─── Mobile Drawer ────────────────────────────────────────────────────────────
function MobileDrawer({ isOpen, onClose, navigate }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0, zIndex: 98,
              background: 'rgba(5,13,7,0.75)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
            }}
          />
          <motion.div
            key="drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 220 }}
            style={{
              position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 99,
              width: 280, background: C.surface,
              borderLeft: `1px solid ${C.border}`,
              padding: '80px 20px 32px',
              display: 'flex', flexDirection: 'column',
            }}
          >
            <button
              onClick={onClose}
              style={{
                position: 'absolute', top: 12, right: 12,
                width: 44, height: 44, borderRadius: 10,
                background: C.surface2, border: `1px solid ${C.border}`,
                color: C.muted, cursor: 'pointer', fontSize: 18,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
              aria-label="Close menu"
            >
              ✕
            </button>

            <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 32 }}>
              {[['Features', 'features'], ['How It Works', 'how-it-works'], ['Demo', 'demo']].map(([label, id]) => (
                <button
                  key={id}
                  onClick={() => { scrollTo(id); onClose() }}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    padding: '14px 16px', borderRadius: 10,
                    color: C.text, fontFamily: 'var(--font-body)',
                    fontSize: 16, fontWeight: 500, textAlign: 'left',
                    minHeight: 44,
                  }}
                >
                  {label}
                </button>
              ))}
            </nav>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 'auto' }}>
              <button
                onClick={() => { navigate('/login'); onClose() }}
                style={{
                  padding: '14px', borderRadius: 12,
                  background: 'transparent', color: C.text,
                  border: `1px solid ${C.border}`,
                  fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 500,
                  cursor: 'pointer', minHeight: 44,
                }}
              >
                Sign in
              </button>
              <button
                onClick={() => { navigate('/login'); onClose() }}
                style={{
                  padding: '14px', borderRadius: 12,
                  background: C.lime, color: '#050d07',
                  border: 'none',
                  fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 700,
                  cursor: 'pointer', minHeight: 44,
                }}
              >
                Get Started
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ─── NAVBAR ───────────────────────────────────────────────────────────────────
function Navbar() {
  const navigate = useNavigate()
  const isMobile = useMobile()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  useEffect(() => {
    if (!isMobile && menuOpen) setMenuOpen(false)
  }, [isMobile, menuOpen])

  return (
    <>
      <motion.header
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
          transition: 'background 0.3s, border-color 0.3s, backdrop-filter 0.3s',
          background: scrolled ? 'rgba(5,13,7,0.92)' : 'transparent',
          borderBottom: scrolled ? `1px solid ${C.border}` : '1px solid transparent',
          backdropFilter: scrolled ? 'blur(20px)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(20px)' : 'none',
        }}
      >
        <div style={{
          maxWidth: 1160, margin: '0 auto', padding: '0 20px',
          height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          {/* Logo — always visible */}
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 9 }}
          >
            <LogoMark size={26} animate />
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 17, color: C.text, letterSpacing: '-0.02em' }}>
              Green<span style={{ color: C.lime }}>Spectra</span>
            </span>
          </button>

          {/* Desktop nav links */}
          {!isMobile && (
            <nav style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {[['Features', 'features'], ['How It Works', 'how-it-works'], ['Demo', 'demo']].map(([label, id]) => (
                <button
                  key={id}
                  onClick={() => scrollTo(id)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    padding: '8px 14px', borderRadius: 8,
                    color: C.muted, fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 500,
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = C.text }}
                  onMouseLeave={e => { e.currentTarget.style.color = C.muted }}
                >
                  {label}
                </button>
              ))}
            </nav>
          )}

          {/* Desktop CTA / Mobile hamburger */}
          {!isMobile ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                onClick={() => navigate('/login')}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: C.muted, fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 500,
                  padding: '8px 14px',
                }}
              >
                Sign in
              </button>
              <motion.button
                whileHover={{ scale: 1.03, boxShadow: '0 0 24px rgba(163,230,53,0.35)' }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/login')}
                style={{
                  background: C.lime, color: '#050d07',
                  border: 'none', borderRadius: 10,
                  padding: '9px 20px',
                  fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 700,
                  cursor: 'pointer', letterSpacing: '0.01em',
                }}
              >
                Get Started
              </motion.button>
            </div>
          ) : (
            <button
              onClick={() => setMenuOpen(true)}
              style={{
                background: 'none', border: `1px solid ${C.border}`,
                borderRadius: 8, cursor: 'pointer',
                width: 44, height: 44,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: C.text, flexShrink: 0,
              }}
              aria-label="Open menu"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M3 6h18M3 12h18M3 18h18" />
              </svg>
            </button>
          )}
        </div>
      </motion.header>

      <MobileDrawer isOpen={menuOpen} onClose={() => setMenuOpen(false)} navigate={navigate} />
    </>
  )
}

// ─── App mockup (floating hero decoration) ────────────────────────────────────
function AppMockup() {
  const [heatmap, setHeatmap] = useState(false)
  useEffect(() => {
    const id = setInterval(() => setHeatmap(h => !h), 2800)
    return () => clearInterval(id)
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, rotateX: 8 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 0.9, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
      style={{ perspective: 1000 }}
    >
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          width: 420,
          borderRadius: 20,
          border: `1px solid rgba(163,230,53,0.2)`,
          background: 'rgba(9,21,16,0.9)',
          backdropFilter: 'blur(20px)',
          overflow: 'hidden',
          boxShadow: '0 40px 100px rgba(0,0,0,0.6), 0 0 80px rgba(163,230,53,0.06)',
        }}
      >
        {/* Mockup top bar */}
        <div style={{
          padding: '14px 18px',
          borderBottom: `1px solid ${C.border}`,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          {['#ef4444','#f59e0b','#22c55e'].map(c => (
            <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c, opacity: 0.7 }} />
          ))}
          <div style={{
            flex: 1, height: 22, borderRadius: 6,
            background: C.border, marginLeft: 8,
            display: 'flex', alignItems: 'center', paddingLeft: 10,
          }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: C.dim }}>
              greenspectra.ai/dashboard
            </span>
          </div>
        </div>

        {/* Mockup content */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
          {/* Left: image with heatmap toggle */}
          <div style={{ padding: 16, borderRight: `1px solid ${C.border}` }}>
            <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
              {['Photo', 'NDVI'].map(t => (
                <div key={t} style={{
                  padding: '3px 10px', borderRadius: 6, fontSize: 10,
                  fontFamily: 'var(--font-mono)', fontWeight: 700,
                  background: (t === 'NDVI') === heatmap ? C.surface2 : 'transparent',
                  color: (t === 'NDVI') === heatmap ? C.lime : C.dim,
                  cursor: 'default',
                }}>
                  {t}
                </div>
              ))}
            </div>
            <div style={{
              aspectRatio: '1/1', borderRadius: 10, overflow: 'hidden',
              position: 'relative', border: `1px solid ${C.border}`,
            }}>
              <div style={{
                position: 'absolute', inset: 0,
                background: 'radial-gradient(ellipse at 40% 40%, #1a3d1a 0%, #0a1a0a 70%)',
              }} />
              <div style={{
                position: 'absolute', top: '15%', left: '20%',
                width: '60%', height: '70%',
                borderRadius: '60% 40% 55% 45% / 50% 60% 40% 55%',
                background: 'linear-gradient(135deg, #2d5a2d, #1a4020)',
                opacity: 0.9,
              }} />
              {[[28,35],[55,50],[40,65],[65,30]].map(([x,y], i) => (
                <div key={i} style={{
                  position: 'absolute', width: 8, height: 8, borderRadius: '50%',
                  background: '#8b4513', opacity: 0.7,
                  top: `${y}%`, left: `${x}%`,
                }} />
              ))}
              <AnimatePresence>
                {heatmap && (
                  <motion.div
                    key="heat"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6 }}
                    style={{
                      position: 'absolute', inset: 0,
                      background: 'radial-gradient(ellipse at 45% 52%, rgba(239,68,68,0.75) 0%, rgba(245,158,11,0.5) 35%, rgba(34,197,94,0.4) 65%, transparent 80%)',
                      mixBlendMode: 'hard-light',
                    }}
                  />
                )}
              </AnimatePresence>
              <motion.div
                animate={{ y: ['0%', '100%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                style={{
                  position: 'absolute', left: 0, right: 0, height: 1.5,
                  background: 'linear-gradient(90deg, transparent, rgba(163,230,53,0.8), transparent)',
                }}
              />
            </div>
          </div>

          {/* Right: results */}
          <div style={{ padding: '16px 14px' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: C.dim, letterSpacing: '0.12em', marginBottom: 6 }}>DIAGNOSIS</p>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: '#ef4444', marginBottom: 4 }}>
              Leaf Blight
            </p>
            <div style={{
              display: 'inline-block', padding: '2px 8px', borderRadius: 20,
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
              fontSize: 8, fontFamily: 'var(--font-mono)', color: '#ef4444', marginBottom: 12,
            }}>
              ⚠ Immediate action required
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <svg width="44" height="44" viewBox="0 0 44 44" style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
                <circle cx="22" cy="22" r="17" fill="none" stroke={C.border} strokeWidth="3" />
                <motion.circle
                  cx="22" cy="22" r="17"
                  fill="none" stroke="#ef4444" strokeWidth="3" strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 17}
                  initial={{ strokeDashoffset: 2 * Math.PI * 17 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 17 * (1 - 0.91) }}
                  transition={{ duration: 1.2, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  style={{ filter: 'drop-shadow(0 0 4px rgba(239,68,68,0.5))' }}
                />
              </svg>
              <div>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 700, color: '#ef4444' }}>91%</p>
                <p style={{ fontSize: 9, color: C.dim }}>confidence</p>
              </div>
            </div>

            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: C.dim, letterSpacing: '0.1em', marginBottom: 6 }}>TREATMENT</p>
            {['Apply copper fungicide', 'Remove infected leaves', 'Improve air circulation'].map((step, i) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1 + i * 0.15 }}
                style={{
                  display: 'flex', gap: 6, marginBottom: 5,
                  padding: '5px 8px', borderRadius: 5,
                  background: C.surface2, border: `1px solid ${C.border}`,
                }}
              >
                <span style={{
                  width: 14, height: 14, borderRadius: '50%',
                  background: '#ef4444', color: '#050d07',
                  fontSize: 7, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {i + 1}
                </span>
                <span style={{ fontSize: 9, color: C.muted, lineHeight: 1.4 }}>{step}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── HERO ─────────────────────────────────────────────────────────────────────
function HeroSection() {
  const navigate = useNavigate()
  const isMobile = useMobile()

  return (
    <section style={{
      minHeight: '100svh',
      display: 'flex', alignItems: 'center',
      position: 'relative', overflow: 'hidden',
      padding: isMobile ? '100px 20px 60px' : '120px 28px 80px',
    }}>
      {/* Grid background */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `
          linear-gradient(rgba(26,51,34,0.25) 1px, transparent 1px),
          linear-gradient(90deg, rgba(26,51,34,0.25) 1px, transparent 1px)
        `,
        backgroundSize: '72px 72px',
        maskImage: 'radial-gradient(ellipse 80% 70% at 50% 50%, black 30%, transparent 100%)',
      }} />

      {/* Radial ambient */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(34,197,94,0.05) 0%, transparent 70%)',
      }} />

      <div style={{ position: 'absolute', top: -100, left: -100, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(163,230,53,0.04) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -80, right: -80, width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,197,94,0.03) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ maxWidth: 1160, margin: '0 auto', width: '100%' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: isMobile ? 40 : 60,
          alignItems: 'center',
        }}>

          {/* Left: copy */}
          <div>
            {/* Eyebrow */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '6px 14px', borderRadius: 24,
                background: 'rgba(163,230,53,0.08)',
                border: '1px solid rgba(163,230,53,0.2)',
                marginBottom: 28,
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.lime, animation: 'pulse-dot 2s ease infinite' }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: C.lime, letterSpacing: '0.12em' }}>
                PRECISION AGRICULTURE · AI
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: isMobile ? 'clamp(36px, 10vw, 52px)' : 'clamp(42px, 5vw, 72px)',
                fontWeight: 700,
                letterSpacing: '-0.04em',
                lineHeight: 1.05,
                color: C.text,
                marginBottom: 24,
              }}
            >
              Diagnose Crop{' '}
              <br />
              Disease in{' '}
              <span style={{
                background: `linear-gradient(135deg, ${C.lime} 0%, ${C.green} 50%, #10b981 80%, ${C.lime} 100%)`,
                backgroundSize: '200% 200%',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                animation: 'gradient-shift 4s ease infinite',
                display: 'inline',
              }}>
                5 Seconds
              </span>
            </motion.h1>

            {/* Sub */}
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: isMobile ? 16 : 20,
                color: C.muted,
                lineHeight: 1.6,
                marginBottom: 40,
                maxWidth: 440,
              }}
            >
              AI-powered hyperspectral analysis.{' '}
              <span style={{ color: C.text, fontWeight: 500 }}>Point. Shoot. Heal.</span>
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              style={{
                display: 'flex',
                gap: 12,
                flexDirection: isMobile ? 'column' : 'row',
                flexWrap: 'wrap',
              }}
            >
              <motion.button
                whileHover={{ scale: 1.03, boxShadow: '0 0 40px rgba(163,230,53,0.4)' }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/login')}
                style={{
                  padding: '14px 28px', borderRadius: 12,
                  background: C.lime, color: '#050d07',
                  border: 'none', cursor: 'pointer',
                  fontFamily: 'var(--font-body)', fontSize: 16, fontWeight: 700,
                  letterSpacing: '0.01em',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  minHeight: 44,
                }}
              >
                Try Demo Free
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </motion.button>

              <motion.button
                whileHover={{ borderColor: C.green, color: C.text }}
                whileTap={{ scale: 0.97 }}
                onClick={() => scrollTo('how-it-works')}
                style={{
                  padding: '14px 28px', borderRadius: 12,
                  background: 'transparent', color: C.muted,
                  border: `1px solid ${C.border}`,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-body)', fontSize: 16, fontWeight: 500,
                  transition: 'border-color 0.2s, color 0.2s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  minHeight: 44,
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10" /><path d="m10 8 4 4-4 4" />
                </svg>
                See How It Works
              </motion.button>
            </motion.div>

            {/* Social proof */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              style={{ marginTop: 40, display: 'flex', alignItems: 'center', gap: 12 }}
            >
              <div style={{ display: 'flex' }}>
                {['#22c55e','#a3e635','#10b981','#84cc16','#4ade80'].map((c, i) => (
                  <div key={c} style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: `radial-gradient(circle at 35% 35%, ${c}cc, ${c}66)`,
                    border: `2px solid ${C.bg}`,
                    marginLeft: i ? -8 : 0,
                  }} />
                ))}
              </div>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: C.muted }}>
                <span style={{ color: C.text, fontWeight: 600 }}>500+ farmers</span> already using GreenSpectra
              </p>
            </motion.div>
          </div>

          {/* Right: floating app mockup — hidden on mobile */}
          {!isMobile && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <AppMockup />
            </div>
          )}
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        style={{
          position: 'absolute', bottom: 32, left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
          cursor: 'pointer',
        }}
        onClick={() => scrollTo('stats')}
      >
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="2" strokeLinecap="round">
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
        </motion.div>
      </motion.div>
    </section>
  )
}

// ─── STATS BAR ────────────────────────────────────────────────────────────────
function StatsBar() {
  const isMobile = useMobile()
  const stats = [
    { label: 'Training Images', end: 54000, suffix: '+', prefix: '' },
    { label: 'Disease Types Detected', end: 3, suffix: '', prefix: '' },
    { label: 'Second Diagnosis', end: 5, suffix: 's', prefix: '<' },
    { label: 'Model Accuracy', end: 95, suffix: '%+', prefix: '' },
  ]

  return (
    <section id="stats" style={{ background: C.surface, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
      <div style={{ maxWidth: 1160, margin: '0 auto', padding: '0 20px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
        }}>
          {stats.map((s, i) => {
            const isLastInRow = isMobile ? (i % 2 === 1) : (i === 3)
            const isBottomRow = isMobile && i >= 2
            return (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                style={{
                  padding: isMobile ? '28px 16px' : '36px 24px',
                  textAlign: 'center',
                  borderRight: isLastInRow ? 'none' : `1px solid ${C.border}`,
                  borderBottom: isMobile && !isBottomRow ? `1px solid ${C.border}` : 'none',
                }}
              >
                <p style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: isMobile ? 'clamp(28px, 7vw, 40px)' : 'clamp(32px, 3vw, 48px)',
                  fontWeight: 700,
                  color: C.lime,
                  letterSpacing: '-0.04em',
                  lineHeight: 1,
                  marginBottom: 6,
                }}>
                  <Counter end={s.end} suffix={s.suffix} prefix={s.prefix} />
                </p>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: C.muted, letterSpacing: '0.02em' }}>
                  {s.label}
                </p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ─── FEATURES ─────────────────────────────────────────────────────────────────
function FeaturesSection() {
  const isMobile = useMobile()
  const features = [
    {
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v4M12 18v4M2 12H6M18 12h4" strokeOpacity="0.5" />
        </svg>
      ),
      label: 'NDVI Simulation',
      title: 'Hyperspectral Analysis',
      desc: 'Grad-CAM activation maps simulate what a hyperspectral NDVI sensor would capture — highlighting diseased tissue down to the pixel.',
      accent: C.lime,
    },
    {
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18" />
        </svg>
      ),
      label: 'Deep Learning',
      title: 'AI Crop Diagnosis',
      desc: 'EfficientNet-B0 trained on 54,000+ PlantVillage images classifies powdery mildew, leaf blight, rust, and healthy crops with > 95% accuracy.',
      accent: C.green,
    },
    {
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
        </svg>
      ),
      label: 'LLM-Powered',
      title: 'Treatment Plans',
      desc: 'Llama 3 via Groq generates personalized, step-by-step treatment protocols with urgency scoring and prevention tips — in under a second.',
      accent: '#10b981',
    },
  ]

  return (
    <section id="features" style={{ padding: isMobile ? '64px 20px' : '100px 28px', position: 'relative' }}>
      <div style={{ maxWidth: 1160, margin: '0 auto' }}>
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          style={{ textAlign: 'center', marginBottom: isMobile ? 40 : 64 }}
        >
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 11, color: C.lime,
            letterSpacing: '0.14em', display: 'block', marginBottom: 16,
          }}>
            BUILT DIFFERENT
          </span>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: isMobile ? 'clamp(28px, 8vw, 40px)' : 'clamp(32px, 4vw, 56px)',
            fontWeight: 700,
            letterSpacing: '-0.04em',
            color: C.text,
            lineHeight: 1.1,
          }}>
            Science-grade tools for
            <br />
            <span style={{ color: C.lime }}>every farmer</span>
          </h2>
        </motion.div>

        {/* Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
          gap: 20,
        }}>
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ delay: isMobile ? 0 : i * 0.12, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -6 }}
              style={{
                padding: '32px',
                borderRadius: 20,
                background: C.surface,
                border: `1px solid ${C.border}`,
                position: 'relative',
                overflow: 'hidden',
                cursor: 'default',
                transition: 'border-color 0.3s, box-shadow 0.3s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = `${f.accent}40`
                e.currentTarget.style.boxShadow = `0 0 40px ${f.accent}12, 0 20px 60px rgba(0,0,0,0.3)`
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = C.border
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <div style={{
                position: 'absolute', top: 0, right: 0,
                width: 120, height: 120,
                background: `radial-gradient(circle at 100% 0%, ${f.accent}10, transparent 70%)`,
                pointerEvents: 'none',
              }} />

              <div style={{
                width: 52, height: 52, borderRadius: 14,
                background: `${f.accent}14`,
                border: `1px solid ${f.accent}25`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: f.accent, marginBottom: 22,
              }}>
                {f.icon}
              </div>

              <p style={{
                fontFamily: 'var(--font-mono)', fontSize: 10,
                color: f.accent, letterSpacing: '0.12em', marginBottom: 8,
              }}>
                {f.label}
              </p>

              <h3 style={{
                fontFamily: 'var(--font-display)',
                fontSize: 22, fontWeight: 700,
                letterSpacing: '-0.03em',
                color: C.text, marginBottom: 12,
              }}>
                {f.title}
              </h3>

              <p style={{
                fontFamily: 'var(--font-body)',
                fontSize: 14, color: C.muted,
                lineHeight: 1.65,
              }}>
                {f.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── HOW IT WORKS ─────────────────────────────────────────────────────────────
function HowItWorksSection() {
  const isMobile = useMobile()
  const steps = [
    {
      num: '01',
      title: 'Upload Crop Photo',
      desc: 'Snap a photo of any affected leaf or crop area. JPEG, PNG, WebP — straight from your phone or drone.',
      icon: '📸',
      color: C.lime,
    },
    {
      num: '02',
      title: 'AI Spectral Analysis',
      desc: 'EfficientNet processes the image through 54k trained examples. Grad-CAM generates a pseudo-hyperspectral NDVI overlay highlighting disease zones.',
      icon: '🧠',
      color: C.green,
    },
    {
      num: '03',
      title: 'Diagnosis + Treatment',
      desc: 'Get disease classification with confidence score, urgency level, step-by-step treatment protocol, and prevention tips — all in under 5 seconds.',
      icon: '💊',
      color: '#10b981',
    },
  ]

  return (
    <section id="how-it-works" style={{ padding: isMobile ? '64px 20px' : '100px 28px', background: C.surface }}>
      <div style={{ maxWidth: 1160, margin: '0 auto' }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          style={{ textAlign: 'center', marginBottom: isMobile ? 40 : 80 }}
        >
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 11, color: C.lime,
            letterSpacing: '0.14em', display: 'block', marginBottom: 16,
          }}>
            THE PROCESS
          </span>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: isMobile ? 'clamp(28px, 8vw, 40px)' : 'clamp(32px, 4vw, 56px)',
            fontWeight: 700,
            letterSpacing: '-0.04em',
            color: C.text,
            lineHeight: 1.1,
          }}>
            From photo to plan
            <br />
            <span style={{ color: C.lime }}>in three steps</span>
          </h2>
        </motion.div>

        {/* Steps */}
        <div style={{ position: 'relative' }}>
          {/* Connecting line — desktop only */}
          {!isMobile && (
            <div style={{
              position: 'absolute', top: 44, left: '16.67%', right: '16.67%',
              height: 1,
              background: `repeating-linear-gradient(90deg, ${C.border} 0, ${C.border} 8px, transparent 8px, transparent 16px)`,
            }} />
          )}

          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
            gap: isMobile ? 32 : 32,
          }}>
            {steps.map((s, i) => (
              <motion.div
                key={s.num}
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ delay: isMobile ? 0 : i * 0.15, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  textAlign: isMobile ? 'left' : 'center',
                  position: 'relative',
                  display: isMobile ? 'flex' : 'block',
                  gap: isMobile ? 20 : 0,
                  alignItems: isMobile ? 'flex-start' : undefined,
                }}
              >
                {/* Step orb */}
                <motion.div
                  whileHover={{ scale: 1.08 }}
                  style={{
                    width: 88, height: 88, borderRadius: '50%',
                    background: `radial-gradient(circle at 35% 35%, ${s.color}22, ${s.color}08)`,
                    border: `1px solid ${s.color}30`,
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    margin: isMobile ? '0' : '0 auto 28px',
                    position: 'relative', zIndex: 1,
                    boxShadow: `0 0 30px ${s.color}15`,
                    flexShrink: 0,
                  }}
                >
                  <span style={{ fontSize: 28, lineHeight: 1 }}>{s.icon}</span>
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: 10,
                    color: s.color, letterSpacing: '0.1em', marginTop: 3,
                  }}>
                    {s.num}
                  </span>
                </motion.div>

                <div style={{ paddingTop: isMobile ? 8 : 0 }}>
                  <h3 style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 22, fontWeight: 700,
                    letterSpacing: '-0.03em',
                    color: C.text, marginBottom: 12,
                  }}>
                    {s.title}
                  </h3>
                  <p style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: 14, color: C.muted, lineHeight: 1.65,
                    maxWidth: isMobile ? undefined : 280, margin: isMobile ? 0 : '0 auto',
                  }}>
                    {s.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── DEMO PREVIEW ─────────────────────────────────────────────────────────────
function DemoPreviewSection() {
  const navigate = useNavigate()
  const isMobile = useMobile()
  const [activeDisease, setActiveDisease] = useState(0)
  const diseases = [
    { name: 'Leaf Blight', conf: 91, color: '#ef4444', urgency: 'Immediate action' },
    { name: 'Powdery Mildew', conf: 87, color: '#f59e0b', urgency: 'Act within 3 days' },
    { name: 'Crop Rust', conf: 94, color: '#b45309', urgency: 'Act within 1 week' },
  ]

  useEffect(() => {
    const id = setInterval(() => setActiveDisease(d => (d + 1) % diseases.length), 3000)
    return () => clearInterval(id)
  }, [])

  const d = diseases[activeDisease]
  const CIRC = 2 * Math.PI * 40

  return (
    <section id="demo" style={{ padding: isMobile ? '64px 20px' : '100px 28px', position: 'relative', overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 70% 50% at 50% 50%, rgba(163,230,53,0.03) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ maxWidth: 1160, margin: '0 auto' }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          style={{ textAlign: 'center', marginBottom: isMobile ? 32 : 64 }}
        >
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 11, color: C.lime,
            letterSpacing: '0.14em', display: 'block', marginBottom: 16,
          }}>
            LIVE DEMO
          </span>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: isMobile ? 'clamp(28px, 8vw, 40px)' : 'clamp(32px, 4vw, 56px)',
            fontWeight: 700, letterSpacing: '-0.04em', color: C.text, lineHeight: 1.1,
            marginBottom: 16,
          }}>
            See GreenSpectra
            <br />
            <span style={{ color: C.lime }}>in Action</span>
          </h2>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 16, color: C.muted, maxWidth: 420, margin: '0 auto' }}>
            A live preview of the diagnosis interface — cycling through real disease scenarios.
          </p>
        </motion.div>

        {/* Mock card */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          style={{ maxWidth: 760, margin: '0 auto' }}
        >
          <div style={{
            borderRadius: 24,
            background: 'rgba(9,21,16,0.9)',
            border: `1px solid ${C.border}`,
            overflow: 'hidden',
            boxShadow: '0 40px 100px rgba(0,0,0,0.5)',
            position: 'relative',
          }}>
            {/* Top accent */}
            <motion.div
              animate={{ background: `linear-gradient(90deg, transparent, ${d.color}60, transparent)` }}
              transition={{ duration: 0.5 }}
              style={{ height: 3 }}
            />

            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
            }}>
              {/* Image panel */}
              <div style={{ padding: isMobile ? 20 : 28, borderRight: isMobile ? 'none' : `1px solid ${C.border}`, borderBottom: isMobile ? `1px solid ${C.border}` : 'none' }}>
                <div style={{
                  borderRadius: 14, overflow: 'hidden',
                  aspectRatio: '1/1', position: 'relative',
                  border: `1px solid ${C.border}`,
                  marginBottom: 16,
                }}>
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'radial-gradient(ellipse at 40% 35%, #1e4020 0%, #0a1a0a 70%)',
                  }} />
                  <div style={{
                    position: 'absolute', top: '12%', left: '18%',
                    width: '64%', height: '75%',
                    borderRadius: '55% 45% 60% 40% / 45% 55% 45% 60%',
                    background: 'linear-gradient(150deg, #2d5a2d, #1a4020)',
                  }} />
                  {[[30,40],[52,55],[42,68],[60,32],[38,28]].map(([x,y],i) => (
                    <motion.div
                      key={i}
                      animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0.9, 0.6] }}
                      transition={{ duration: 2, delay: i * 0.3, repeat: Infinity }}
                      style={{
                        position: 'absolute',
                        width: 9, height: 9, borderRadius: '50%',
                        background: d.color, opacity: 0.7,
                        top: `${y}%`, left: `${x}%`,
                        filter: `drop-shadow(0 0 4px ${d.color})`,
                      }}
                    />
                  ))}
                  <motion.div
                    animate={{
                      background: [
                        'radial-gradient(ellipse at 45% 52%, rgba(239,68,68,0) 0%, transparent 80%)',
                        `radial-gradient(ellipse at 45% 52%, ${d.color}55 0%, rgba(245,158,11,0.35) 35%, rgba(34,197,94,0.25) 65%, transparent 80%)`,
                        'radial-gradient(ellipse at 45% 52%, rgba(239,68,68,0) 0%, transparent 80%)',
                      ],
                    }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    style={{ position: 'absolute', inset: 0, mixBlendMode: 'hard-light' }}
                  />
                  <motion.div
                    animate={{ y: ['0%', '100%'] }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: 'linear' }}
                    style={{
                      position: 'absolute', left: 0, right: 0, height: 2,
                      background: 'linear-gradient(90deg, transparent, rgba(163,230,53,0.7), transparent)',
                    }}
                  />
                  <div style={{
                    position: 'absolute', bottom: 10, left: '50%',
                    transform: 'translateX(-50%)',
                    padding: '3px 10px', borderRadius: 20,
                    background: 'rgba(5,13,7,0.9)',
                    border: `1px solid ${C.border}`,
                    fontFamily: 'var(--font-mono)', fontSize: 9,
                    color: C.lime, letterSpacing: '0.08em',
                    whiteSpace: 'nowrap',
                  }}>
                    NDVI SPECTRAL ANALYSIS
                  </div>
                </div>

                {/* Disease selector tabs */}
                <div style={{ display: 'flex', gap: 4 }}>
                  {diseases.map((dis, i) => (
                    <button
                      key={dis.name}
                      onClick={() => setActiveDisease(i)}
                      style={{
                        flex: 1, padding: '8px 0', borderRadius: 6, border: 'none',
                        background: activeDisease === i ? dis.color + '20' : 'transparent',
                        color: activeDisease === i ? dis.color : C.dim,
                        fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700,
                        cursor: 'pointer', transition: 'all 0.2s',
                        borderBottom: activeDisease === i ? `2px solid ${dis.color}` : '2px solid transparent',
                        minHeight: 44,
                      }}
                    >
                      {dis.name.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Results panel */}
              <div style={{ padding: isMobile ? 20 : 28 }}>
                <p style={{
                  fontFamily: 'var(--font-mono)', fontSize: 9,
                  color: C.dim, letterSpacing: '0.12em', marginBottom: 8,
                }}>
                  DIAGNOSIS RESULT
                </p>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeDisease}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                    transition={{ duration: 0.3 }}
                  >
                    <h3 style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 28, fontWeight: 700,
                      letterSpacing: '-0.03em',
                      color: d.color, marginBottom: 8,
                      textShadow: `0 0 24px ${d.color}30`,
                    }}>
                      {d.name}
                    </h3>

                    <div style={{
                      display: 'inline-block', padding: '3px 10px',
                      borderRadius: 20, marginBottom: 20,
                      background: `${d.color}15`,
                      border: `1px solid ${d.color}30`,
                      color: d.color, fontSize: 10,
                      fontFamily: 'var(--font-mono)', fontWeight: 700,
                    }}>
                      ⚠ {d.urgency}
                    </div>

                    {/* Confidence ring */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                      <div style={{ position: 'relative', flexShrink: 0 }}>
                        <svg width="90" height="90" viewBox="0 0 90 90" style={{ transform: 'rotate(-90deg)' }}>
                          <circle cx="45" cy="45" r="40" fill="none" stroke={C.border} strokeWidth="5" />
                          <motion.circle
                            cx="45" cy="45" r="40" fill="none"
                            stroke={d.color} strokeWidth="5" strokeLinecap="round"
                            strokeDasharray={CIRC}
                            initial={{ strokeDashoffset: CIRC }}
                            animate={{ strokeDashoffset: CIRC * (1 - d.conf / 100) }}
                            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                            style={{ filter: `drop-shadow(0 0 6px ${d.color}50)` }}
                          />
                        </svg>
                        <div style={{
                          position: 'absolute', inset: 0,
                          display: 'flex', flexDirection: 'column',
                          alignItems: 'center', justifyContent: 'center',
                        }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 700, color: d.color }}>{d.conf}%</span>
                          <span style={{ fontSize: 9, color: C.dim }}>conf.</span>
                        </div>
                      </div>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 4 }}>Confidence Score</p>
                        <p style={{ fontSize: 12, color: C.muted, lineHeight: 1.5, fontFamily: 'var(--font-body)' }}>
                          Based on EfficientNet-B0 softmax output across 4 disease classes.
                        </p>
                      </div>
                    </div>

                    {/* Treatment preview */}
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: C.dim, letterSpacing: '0.1em', marginBottom: 8 }}>
                      TREATMENT PROTOCOL
                    </p>
                    {['Apply targeted fungicide', 'Isolate affected plants', 'Monitor adjacent rows'].map((step, i) => (
                      <div key={i} style={{
                        display: 'flex', gap: 8, marginBottom: 6,
                        padding: '7px 10px', borderRadius: 7,
                        background: C.surface2, border: `1px solid ${C.border}`,
                      }}>
                        <span style={{
                          width: 18, height: 18, borderRadius: '50%',
                          background: d.color, color: '#050d07',
                          fontSize: 9, fontWeight: 700,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                        }}>{i + 1}</span>
                        <span style={{ fontSize: 12, color: C.muted, fontFamily: 'var(--font-body)' }}>{step}</span>
                      </div>
                    ))}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* CTA below card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            style={{ textAlign: 'center', marginTop: 36 }}
          >
            <motion.button
              whileHover={{ scale: 1.04, boxShadow: '0 0 50px rgba(163,230,53,0.45)' }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/login')}
              style={{
                padding: '16px 40px', borderRadius: 14,
                background: C.lime, color: '#050d07',
                border: 'none', cursor: 'pointer',
                fontFamily: 'var(--font-body)', fontSize: 17, fontWeight: 700,
                letterSpacing: '0.01em',
                display: 'inline-flex', alignItems: 'center', gap: 10,
                width: isMobile ? '100%' : 'auto',
                justifyContent: 'center',
                minHeight: 44,
              }}
            >
              Try It Free — No Card Required
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </motion.button>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: C.dim, marginTop: 10 }}>
              Free tier · No credit card · Diagnose up to 20 crops/month
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

// ─── FOOTER ───────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer style={{
      background: C.surface,
      borderTop: `1px solid ${C.border}`,
      padding: '48px 20px',
    }}>
      <div style={{ maxWidth: 1160, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24 }}>
          {/* Left: logo + tagline */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <LogoMark size={22} />
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 15, color: C.text }}>
                Green<span style={{ color: C.lime }}>Spectra</span>
              </span>
            </div>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: C.muted }}>
              Precision agriculture for every farmer.
            </p>
          </div>

          {/* Center: links */}
          <div style={{ display: 'flex', gap: 24 }}>
            {[
              { label: 'GitHub', href: 'https://github.com' },
              { label: 'About', href: '#' },
              { label: 'Contact', href: 'mailto:kamalsevdaali@gmail.com' },
            ].map(link => (
              <a
                key={link.label}
                href={link.href}
                target={link.href.startsWith('http') ? '_blank' : undefined}
                rel="noopener noreferrer"
                style={{
                  fontFamily: 'var(--font-body)', fontSize: 13,
                  color: C.muted, textDecoration: 'none',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = C.text }}
                onMouseLeave={e => { e.currentTarget.style.color = C.muted }}
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Right: copyright */}
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: C.dim }}>
            © {new Date().getFullYear()} GreenSpectra. MIT License.
          </p>
        </div>
      </div>
    </footer>
  )
}

// ─── PAGE ASSEMBLY ────────────────────────────────────────────────────────────
export default function LandingPage() {
  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth'
    return () => { document.documentElement.style.scrollBehavior = '' }
  }, [])

  return (
    <div style={{ background: C.bg, minHeight: '100svh', position: 'relative' }}>
      <Grain />
      <div style={{ position: 'relative', zIndex: 2 }}>
        <Navbar />
        <HeroSection />
        <StatsBar />
        <FeaturesSection />
        <HowItWorksSection />
        <DemoPreviewSection />
        <Footer />
      </div>
    </div>
  )
}
