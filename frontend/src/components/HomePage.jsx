import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'
import { useDiagnosis } from '../hooks/useDiagnosis'
import { useMobile } from '../hooks/useMobile'
import { getDemoDiagnosis } from '../lib/api'
import UploadZone from './Upload/UploadZone'
import DemoGallery from './Upload/DemoGallery'
import DiagnosisCard from './Diagnosis/DiagnosisCard'
import DiagnosisLoader from './DiagnosisLoader'

// ─── Leaf SVG (shared) ──────────────────────────────────────────────────────
function LeafIcon({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path
        d="M16 3C16 3 5 8 5 18C5 23.5 9.5 28 16 28C22.5 28 27 23.5 27 18C27 8 16 3 16 3Z"
        fill="url(#homeLeafGrad)"
      />
      <path d="M16 28V14" stroke="#050d07" strokeWidth="2" strokeLinecap="round" />
      <path d="M16 20C16 20 10 16 8 12" stroke="#050d07" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M16 17C16 17 20 14 23 11" stroke="#050d07" strokeWidth="1.5" strokeLinecap="round" />
      <defs>
        <linearGradient id="homeLeafGrad" x1="5" y1="3" x2="27" y2="28" gradientUnits="userSpaceOnUse">
          <stop stopColor="#a3e635" />
          <stop offset="1" stopColor="#22c55e" />
        </linearGradient>
      </defs>
    </svg>
  )
}

// ─── Mobile nav drawer ───────────────────────────────────────────────────────
function MobileNavDrawer({ isOpen, onClose, user, onSignOut, navigate }) {
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
              position: 'fixed', inset: 0, zIndex: 49,
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
              position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 50,
              width: 280, background: 'var(--gs-surface)',
              borderLeft: '1px solid var(--gs-border)',
              padding: '80px 20px 32px',
              display: 'flex', flexDirection: 'column',
            }}
          >
            <button
              onClick={onClose}
              style={{
                position: 'absolute', top: 12, right: 12,
                width: 44, height: 44, borderRadius: 10,
                background: 'var(--gs-surface-2)', border: '1px solid var(--gs-border)',
                color: 'var(--gs-text-muted)', cursor: 'pointer', fontSize: 18,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
              aria-label="Close menu"
            >
              ✕
            </button>

            <div style={{
              padding: '12px 14px', borderRadius: 10,
              background: 'var(--gs-surface-2)', border: '1px solid var(--gs-border)',
              marginBottom: 20,
            }}>
              <p style={{ fontSize: 12, color: 'var(--gs-text-muted)', marginBottom: 2 }}>Signed in as</p>
              <p style={{ fontSize: 13, color: 'var(--gs-text)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.email}
              </p>
            </div>

            <button
              onClick={() => { navigate('/history'); onClose() }}
              style={{
                padding: '14px 16px', borderRadius: 10, minHeight: 44,
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--gs-text)', fontFamily: 'var(--font-sans)',
                fontSize: 15, fontWeight: 500, textAlign: 'left',
                display: 'flex', alignItems: 'center', gap: 10,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              History
            </button>

            <div style={{ marginTop: 'auto' }}>
              <button
                onClick={() => { onSignOut(); onClose() }}
                style={{
                  width: '100%', padding: '14px', borderRadius: 10, minHeight: 44,
                  background: 'transparent', color: 'var(--gs-text-muted)',
                  border: '1px solid var(--gs-border)',
                  fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Sign out
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ─── Navbar ─────────────────────────────────────────────────────────────────
function Navbar({ user, onSignOut }) {
  const navigate = useNavigate()
  const isMobile = useMobile()
  const [menuOpen, setMenuOpen] = useState(false)
  const initials = user?.email?.slice(0, 2).toUpperCase() ?? '??'

  useEffect(() => {
    if (!isMobile && menuOpen) setMenuOpen(false)
  }, [isMobile, menuOpen])

  return (
    <>
      <motion.nav
        initial={{ y: -16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: 'sticky', top: 0, zIndex: 40,
          borderBottom: '1px solid var(--gs-border)',
          background: 'rgba(5,13,7,0.88)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          padding: '0 20px',
        }}
      >
        <div style={{
          maxWidth: 1100, margin: '0 auto', height: 62,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <LeafIcon size={26} />
            <span style={{
              fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 17,
              letterSpacing: '-0.02em', color: 'var(--gs-text)',
            }}>
              Green<span style={{ color: 'var(--gs-lime)' }}>Spectra</span>
            </span>
            {!isMobile && (
              <span style={{
                padding: '2px 7px', borderRadius: 4,
                background: 'rgba(163,230,53,0.1)', border: '1px solid rgba(163,230,53,0.2)',
                color: 'var(--gs-lime)', fontSize: 10, fontWeight: 700,
                fontFamily: 'var(--font-mono)', letterSpacing: '0.08em',
              }}>BETA</span>
            )}
          </div>

          {/* Desktop right side */}
          {!isMobile ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                onClick={() => navigate('/history')}
                className="btn-ghost"
                style={{ padding: '7px 14px', fontSize: 13 }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
                History
              </button>

              <div style={{
                width: 34, height: 34, borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--gs-lime-dim), var(--gs-emerald))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700, color: '#050d07',
                fontFamily: 'var(--font-mono)', flexShrink: 0,
              }}>
                {initials}
              </div>

              <button
                onClick={onSignOut}
                className="btn-ghost"
                style={{ padding: '7px 12px', fontSize: 13 }}
              >
                Sign out
              </button>
            </div>
          ) : (
            /* Mobile: avatar + hamburger */
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 34, height: 34, borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--gs-lime-dim), var(--gs-emerald))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700, color: '#050d07',
                fontFamily: 'var(--font-mono)', flexShrink: 0,
              }}>
                {initials}
              </div>
              <button
                onClick={() => setMenuOpen(true)}
                style={{
                  background: 'none', border: '1px solid var(--gs-border)',
                  borderRadius: 8, cursor: 'pointer',
                  width: 44, height: 44,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--gs-text)',
                }}
                aria-label="Open menu"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M3 6h18M3 12h18M3 18h18" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </motion.nav>

      <MobileNavDrawer
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        user={user}
        onSignOut={onSignOut}
        navigate={navigate}
      />
    </>
  )
}

// ─── Diagnosis error panel ───────────────────────────────────────────────────
function DiagnosisError({ message, onRetry }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      style={{
        marginTop: 14, padding: '16px 18px', borderRadius: 12,
        background: 'rgba(239,68,68,0.08)',
        border: '1px solid rgba(239,68,68,0.22)',
        display: 'flex', alignItems: 'flex-start',
        justifyContent: 'space-between', gap: 12,
      }}
    >
      <div>
        <p style={{ color: 'var(--gs-red)', fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
          Diagnosis failed
        </p>
        <p style={{ color: 'var(--gs-text-muted)', fontSize: 13, lineHeight: 1.5 }}>
          {message}
        </p>
      </div>
      <button
        onClick={onRetry}
        style={{
          flexShrink: 0,
          padding: '7px 16px', borderRadius: 8,
          border: '1px solid rgba(239,68,68,0.3)',
          background: 'rgba(239,68,68,0.1)',
          color: 'var(--gs-red)',
          fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600,
          cursor: 'pointer',
          transition: 'background 0.2s',
          minHeight: 44,
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.18)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)' }}
      >
        Retry
      </button>
    </motion.div>
  )
}

// ─── Main page ───────────────────────────────────────────────────────────────
export default function HomePage() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const isMobile = useMobile()
  const { result, loading, error: diagError, diagnose } = useDiagnosis()

  const [demoError, setDemoError] = useState(null)
  const [demoLoading, setDemoLoading] = useState(false)
  const [imagePreview, setImagePreview] = useState(null)
  const [pendingFile, setPendingFile] = useState(null)
  const [activeResult, setActiveResult] = useState(null)

  useEffect(() => {
    if (!loading && result) setActiveResult(result)
  }, [result, loading])

  function handleFileSelected(file) {
    setImagePreview(URL.createObjectURL(file))
    setPendingFile(file)
    setActiveResult(null)
    setDemoError(null)
    diagnose(file)
  }

  function handleRetry() {
    if (pendingFile) {
      setActiveResult(null)
      diagnose(pendingFile)
    }
  }

  async function handleDemo(imageName) {
    setDemoLoading(true)
    setDemoError(null)
    setActiveResult(null)
    setImagePreview(`${import.meta.env.VITE_API_URL}/demo-images/${imageName}.jpg`)
    setPendingFile(null)
    try {
      const data = await getDemoDiagnosis(imageName)
      setActiveResult(data)
    } catch (e) {
      setDemoError(e.message)
      setImagePreview(null)
    } finally {
      setDemoLoading(false)
    }
  }

  function handleDismissResult() {
    setActiveResult(null)
    setImagePreview(null)
    setPendingFile(null)
  }

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  const anyLoading = loading || demoLoading

  return (
    <div style={{ minHeight: '100svh', background: 'var(--gs-bg)' }}>
      <DiagnosisLoader visible={anyLoading} />
      <Navbar user={user} onSignOut={handleSignOut} />

      <AnimatePresence mode="wait">
        {activeResult ? (
          <DiagnosisCard
            key="dashboard"
            result={activeResult}
            imagePreview={imagePreview}
            onClose={handleDismissResult}
          />
        ) : (
          <motion.main
            key="upload"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{ maxWidth: 1100, margin: '0 auto', padding: isMobile ? '0 16px 80px' : '0 24px 80px' }}
          >

            {/* ── Hero ── */}
            <section style={{ textAlign: 'center', padding: isMobile ? '40px 0 36px' : '64px 0 52px', position: 'relative' }}>
              <div style={{
                position: 'absolute', left: '50%', top: 0,
                transform: 'translateX(-50%)',
                width: 700, height: 320, borderRadius: '50%',
                background: 'radial-gradient(ellipse, rgba(34,197,94,0.06) 0%, transparent 70%)',
                pointerEvents: 'none',
              }} />

              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              >
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 7,
                  padding: '5px 14px', borderRadius: 20,
                  background: 'rgba(163,230,53,0.08)', border: '1px solid rgba(163,230,53,0.2)',
                  marginBottom: 28,
                }}>
                  <span style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: 'var(--gs-lime)', animation: 'pulse-dot 2s ease infinite',
                  }} />
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: 11,
                    color: 'var(--gs-lime)', letterSpacing: '0.1em',
                  }}>
                    AI-POWERED CROP DIAGNOSTICS
                  </span>
                </div>

                <h1 style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: isMobile ? 'clamp(32px, 9vw, 52px)' : 'clamp(36px, 5.5vw, 68px)',
                  fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1.1,
                  color: 'var(--gs-text)', marginBottom: 18,
                }}>
                  Diagnose Your Crop
                  <br />
                  <span className="gradient-text">in 5 Seconds</span>
                </h1>

                <p style={{
                  fontSize: isMobile ? 15 : 'clamp(15px, 2vw, 18px)',
                  color: 'var(--gs-text-muted)',
                  maxWidth: 500, margin: '0 auto 40px', lineHeight: 1.6,
                }}>
                  Upload a leaf photo. Our EfficientNet model identifies diseases with
                  Grad-CAM spectral overlays and AI treatment recommendations.
                </p>

                <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                  {[
                    { label: '4 Disease Classes', icon: '🧬' },
                    { label: 'Grad-CAM Heatmaps', icon: '🗺️' },
                    { label: 'AI Treatment Plans', icon: '🤖' },
                  ].map(stat => (
                    <div key={stat.label} style={{
                      padding: '7px 14px', borderRadius: 24,
                      background: 'var(--gs-surface-2)', border: '1px solid var(--gs-border)',
                      color: 'var(--gs-text-muted)', fontSize: 13,
                      display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                      <span>{stat.icon}</span>
                      {stat.label}
                    </div>
                  ))}
                </div>
              </motion.div>
            </section>

            {/* ── Upload + Demo columns ── */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
              gap: isMobile ? 16 : 24,
              marginBottom: 32,
            }}>

              <motion.div
                initial={{ opacity: 0, x: isMobile ? 0 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="glass-card"
                style={{ borderRadius: 18, padding: isMobile ? 16 : 24 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: 'var(--gs-lime)', boxShadow: '0 0 8px rgba(163,230,53,0.6)',
                  }} />
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: 11,
                    color: 'var(--gs-lime)', letterSpacing: '0.1em',
                  }}>UPLOAD YOUR IMAGE</span>
                </div>

                <UploadZone onAnalyze={handleFileSelected} loading={loading} />

                <AnimatePresence>
                  {diagError && (
                    <DiagnosisError message={diagError} onRetry={handleRetry} />
                  )}
                </AnimatePresence>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: isMobile ? 0 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="glass-card"
                style={{ borderRadius: 18, padding: isMobile ? 16 : 24 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: 'var(--gs-emerald)', boxShadow: '0 0 8px rgba(16,185,129,0.6)',
                  }} />
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: 11,
                    color: 'var(--gs-emerald)', letterSpacing: '0.1em',
                  }}>TRY A DEMO SAMPLE</span>
                </div>

                <DemoGallery onSelect={handleDemo} />

                <AnimatePresence>
                  {demoError && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      style={{
                        marginTop: 14, padding: '10px 14px', borderRadius: 8,
                        background: 'rgba(239,68,68,0.08)',
                        border: '1px solid rgba(239,68,68,0.2)',
                        color: 'var(--gs-red)', fontSize: 13,
                      }}
                    >
                      {demoError}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>

            {/* ── How it works ── */}
            {!anyLoading && (
              <motion.section
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                style={{ marginTop: 56, textAlign: 'center' }}
              >
                <p style={{
                  fontFamily: 'var(--font-mono)', fontSize: 10,
                  color: 'var(--gs-text-dim)', letterSpacing: '0.14em', marginBottom: 24,
                }}>HOW IT WORKS</p>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
                  gap: isMobile ? 16 : 1,
                  maxWidth: 700, margin: '0 auto',
                }}>
                  {[
                    { title: 'Upload', desc: 'Drop any leaf or crop photo', icon: '📸' },
                    { title: 'Analyze', desc: 'EfficientNet runs inference', icon: '🧠' },
                    { title: 'Diagnose', desc: 'Disease + heatmap overlay', icon: '🗺️' },
                    { title: 'Treat', desc: 'AI-generated protocol', icon: '💊' },
                  ].map((s, i) => (
                    <div key={s.title} style={{ flex: 1, textAlign: 'center', padding: isMobile ? '0 8px' : '0 12px', position: 'relative' }}>
                      {i < 3 && !isMobile && (
                        <div style={{
                          position: 'absolute', right: 0, top: 17,
                          width: '100%', height: 1,
                          background: 'linear-gradient(90deg, transparent 40%, var(--gs-border) 40%, var(--gs-border) 60%, transparent 60%)',
                          pointerEvents: 'none',
                        }} />
                      )}
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%',
                        background: 'var(--gs-surface-2)', border: '1px solid var(--gs-border)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 18, margin: '0 auto 10px', position: 'relative', zIndex: 1,
                      }}>
                        {s.icon}
                      </div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--gs-text)', marginBottom: 4 }}>{s.title}</p>
                      <p style={{ fontSize: 11, color: 'var(--gs-text-dim)' }}>{s.desc}</p>
                    </div>
                  ))}
                </div>
              </motion.section>
            )}

          </motion.main>
        )}
      </AnimatePresence>
    </div>
  )
}
