import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../hooks/useAuth'
import { useMobile } from '../../hooks/useMobile'
import { getHistory } from '../../lib/api'
import { DISEASE_META } from '../../lib/constants'
import DiagnosisCard from '../Diagnosis/DiagnosisCard'

const CLASS_NAMES = ['healthy', 'leaf_blight', 'powdery_mildew', 'rust']

function buildResult(item) {
  const otherProb = (1 - item.confidence) / 3
  return {
    disease:    item.disease,
    confidence: item.confidence,
    heatmap:    null,
    heatmapUrl: item.heatmap_url,
    treatment:  item.treatment,
    all_probs:  Object.fromEntries(
      CLASS_NAMES.map(c => [c, c === item.disease ? item.confidence : otherProb])
    ),
  }
}

function LeafIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path d="M16 3C16 3 5 8 5 18C5 23.5 9.5 28 16 28C22.5 28 27 23.5 27 18C27 8 16 3 16 3Z" fill="url(#hLeafGrad)" />
      <path d="M16 28V14" stroke="#050d07" strokeWidth="2" strokeLinecap="round" />
      <defs>
        <linearGradient id="hLeafGrad" x1="5" y1="3" x2="27" y2="28" gradientUnits="userSpaceOnUse">
          <stop stopColor="#a3e635" /><stop offset="1" stopColor="#22c55e" />
        </linearGradient>
      </defs>
    </svg>
  )
}

function EmptyState() {
  return (
    <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <td colSpan={5}>
        <div style={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: 14, padding: '72px 20px', textAlign: 'center',
        }}>
          <svg width="64" height="64" viewBox="0 0 80 80" fill="none">
            <circle cx="40" cy="40" r="38" stroke="var(--gs-border)" strokeWidth="1.5" strokeDasharray="6 4" />
            <path d="M40 15C40 15 20 25 20 42C20 51.4 29 58 40 58C51 58 60 51.4 60 42C60 25 40 15 40 15Z" fill="url(#emptyLeaf)" opacity="0.4" />
            <path d="M40 58V36" stroke="var(--gs-border-bright)" strokeWidth="2" strokeLinecap="round" />
            <defs>
              <linearGradient id="emptyLeaf" x1="20" y1="15" x2="60" y2="58" gradientUnits="userSpaceOnUse">
                <stop stopColor="#a3e635" /><stop offset="1" stopColor="#22c55e" />
              </linearGradient>
            </defs>
          </svg>
          <div>
            <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--gs-text)', marginBottom: 4 }}>
              No diagnoses yet
            </p>
            <p style={{ fontSize: 13, color: 'var(--gs-text-muted)' }}>
              Upload your first crop image from the dashboard to get started
            </p>
          </div>
        </div>
      </td>
    </motion.tr>
  )
}

function EmptyStateMobile() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 14, padding: '56px 20px', textAlign: 'center',
      }}
    >
      <svg width="64" height="64" viewBox="0 0 80 80" fill="none">
        <circle cx="40" cy="40" r="38" stroke="var(--gs-border)" strokeWidth="1.5" strokeDasharray="6 4" />
        <path d="M40 15C40 15 20 25 20 42C20 51.4 29 58 40 58C51 58 60 51.4 60 42C60 25 40 15 40 15Z" fill="url(#emptyLeaf2)" opacity="0.4" />
        <path d="M40 58V36" stroke="var(--gs-border-bright)" strokeWidth="2" strokeLinecap="round" />
        <defs>
          <linearGradient id="emptyLeaf2" x1="20" y1="15" x2="60" y2="58" gradientUnits="userSpaceOnUse">
            <stop stopColor="#a3e635" /><stop offset="1" stopColor="#22c55e" />
          </linearGradient>
        </defs>
      </svg>
      <div>
        <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--gs-text)', marginBottom: 4 }}>
          No diagnoses yet
        </p>
        <p style={{ fontSize: 13, color: 'var(--gs-text-muted)' }}>
          Upload your first crop image from the dashboard to get started
        </p>
      </div>
    </motion.div>
  )
}

// ── Desktop table row ────────────────────────────────────────────────────────
function TableRow({ item, index, onView }) {
  const meta = DISEASE_META[item.disease] || DISEASE_META.healthy
  const date = new Date(item.created_at)
  const formatted = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

  return (
    <motion.tr
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      style={{ borderBottom: '1px solid var(--gs-border)' }}
      onMouseEnter={e => { e.currentTarget.style.background = 'var(--gs-surface-2)' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
    >
      {/* Thumbnail */}
      <td style={{ padding: '12px 16px', width: 64 }}>
        <div style={{
          width: 52, height: 52, borderRadius: 8,
          overflow: 'hidden', flexShrink: 0,
          border: `1px solid ${meta.color}30`,
          background: `radial-gradient(ellipse at 40% 40%, ${meta.color}15, var(--gs-surface))`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {item.image_url ? (
            <img
              src={item.image_url}
              alt={meta.label}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <span style={{ fontSize: 22 }}>{meta.emoji}</span>
          )}
        </div>
      </td>

      {/* Disease badge */}
      <td style={{ padding: '12px 16px' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '4px 10px', borderRadius: 20,
          background: `${meta.color}12`,
          border: `1px solid ${meta.color}30`,
        }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: meta.color, flexShrink: 0 }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: meta.color }}>{meta.label}</span>
        </div>
      </td>

      {/* Confidence */}
      <td style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            fontSize: 15, fontWeight: 700,
            fontFamily: 'var(--font-mono)', color: meta.color, minWidth: 38,
          }}>
            {Math.round(item.confidence * 100)}%
          </span>
          <div style={{
            flex: 1, height: 4, borderRadius: 2,
            background: 'var(--gs-border)', overflow: 'hidden', minWidth: 80,
          }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${item.confidence * 100}%` }}
              transition={{ delay: index * 0.05 + 0.25, duration: 0.6, ease: 'easeOut' }}
              style={{ height: '100%', background: meta.color, borderRadius: 2 }}
            />
          </div>
        </div>
      </td>

      {/* Date */}
      <td style={{ padding: '12px 16px' }}>
        <p style={{ fontSize: 13, color: 'var(--gs-text)', marginBottom: 2 }}>{formatted}</p>
        <p style={{ fontSize: 11, color: 'var(--gs-text-dim)', fontFamily: 'var(--font-mono)' }}>{timeStr}</p>
      </td>

      {/* View button */}
      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
        <button
          onClick={() => onView(item)}
          style={{
            padding: '6px 14px', borderRadius: 7,
            border: '1px solid var(--gs-border)',
            background: 'var(--gs-surface-2)',
            color: 'var(--gs-text-muted)',
            fontSize: 12, fontWeight: 500,
            fontFamily: 'var(--font-sans)',
            cursor: 'pointer',
            transition: 'border-color 0.15s, color 0.15s, background 0.15s',
            minHeight: 44,
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'var(--gs-border-bright)'
            e.currentTarget.style.color = 'var(--gs-lime)'
            e.currentTarget.style.background = 'rgba(163,230,53,0.06)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'var(--gs-border)'
            e.currentTarget.style.color = 'var(--gs-text-muted)'
            e.currentTarget.style.background = 'var(--gs-surface-2)'
          }}
        >
          View Full Report
        </button>
      </td>
    </motion.tr>
  )
}

// ── Mobile card ──────────────────────────────────────────────────────────────
function HistoryCardMobile({ item, index, onView }) {
  const meta = DISEASE_META[item.disease] || DISEASE_META.healthy
  const date = new Date(item.created_at)
  const formatted = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="glass-card"
      style={{
        borderRadius: 12,
        padding: '14px 16px',
        marginBottom: 10,
        border: `1px solid ${meta.color}20`,
      }}
    >
      {/* Top row: thumbnail + disease + confidence */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
        <div style={{
          width: 52, height: 52, borderRadius: 8,
          overflow: 'hidden', flexShrink: 0,
          border: `1px solid ${meta.color}30`,
          background: `radial-gradient(ellipse at 40% 40%, ${meta.color}15, var(--gs-surface))`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {item.image_url ? (
            <img
              src={item.image_url}
              alt={meta.label}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <span style={{ fontSize: 22 }}>{meta.emoji}</span>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '3px 10px', borderRadius: 20,
            background: `${meta.color}12`,
            border: `1px solid ${meta.color}30`,
            marginBottom: 6,
          }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: meta.color, flexShrink: 0 }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: meta.color }}>{meta.label}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              fontSize: 14, fontWeight: 700,
              fontFamily: 'var(--font-mono)', color: meta.color, flexShrink: 0,
            }}>
              {Math.round(item.confidence * 100)}%
            </span>
            <div style={{
              flex: 1, height: 4, borderRadius: 2,
              background: 'var(--gs-border)', overflow: 'hidden',
            }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${item.confidence * 100}%` }}
                transition={{ delay: index * 0.05 + 0.2, duration: 0.6, ease: 'easeOut' }}
                style={{ height: '100%', background: meta.color, borderRadius: 2 }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom row: date + view button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: 13, color: 'var(--gs-text)', marginBottom: 1 }}>{formatted}</p>
          <p style={{ fontSize: 11, color: 'var(--gs-text-dim)', fontFamily: 'var(--font-mono)' }}>{timeStr}</p>
        </div>
        <button
          onClick={() => onView(item)}
          style={{
            padding: '8px 16px', borderRadius: 8,
            border: '1px solid var(--gs-border)',
            background: 'var(--gs-surface-2)',
            color: 'var(--gs-text-muted)',
            fontSize: 13, fontWeight: 500,
            fontFamily: 'var(--font-sans)',
            cursor: 'pointer',
            minHeight: 44,
          }}
        >
          View Report
        </button>
      </div>
    </motion.div>
  )
}

// ── Navbars ──────────────────────────────────────────────────────────────────
function Navbar({ user, onSignOut, onDashboard }) {
  const isMobile = useMobile()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <>
      <nav style={{
        position: 'sticky', top: 0, zIndex: 40,
        borderBottom: '1px solid var(--gs-border)',
        background: 'rgba(5,13,7,0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        padding: '0 20px',
      }}>
        <div style={{
          maxWidth: 1100, margin: '0 auto',
          height: 62, display: 'flex',
          alignItems: 'center', justifyContent: 'space-between',
        }}>
          <button
            onClick={onDashboard}
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <LeafIcon size={24} />
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 16, color: 'var(--gs-text)' }}>
              Green<span style={{ color: 'var(--gs-lime)' }}>Spectra</span>
            </span>
          </button>

          {/* Desktop right */}
          {!isMobile ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                padding: '6px 14px', borderRadius: 8,
                background: 'var(--gs-surface-2)', border: '1px solid var(--gs-border)',
                color: 'var(--gs-text-muted)', fontSize: 13,
              }}>
                {user?.email}
              </div>
              <button onClick={onDashboard} className="btn-ghost" style={{ padding: '7px 14px' }}>
                Dashboard
              </button>
              <button onClick={onSignOut} className="btn-ghost" style={{ padding: '7px 14px' }}>
                Sign out
              </button>
            </div>
          ) : (
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
          )}
        </div>
      </nav>

      {/* Mobile drawer */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
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
                onClick={() => setMenuOpen(false)}
                style={{
                  position: 'absolute', top: 12, right: 12,
                  width: 44, height: 44, borderRadius: 10,
                  background: 'var(--gs-surface-2)', border: '1px solid var(--gs-border)',
                  color: 'var(--gs-text-muted)', cursor: 'pointer', fontSize: 18,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >✕</button>

              <div style={{
                padding: '10px 14px', borderRadius: 10,
                background: 'var(--gs-surface-2)', border: '1px solid var(--gs-border)',
                marginBottom: 20,
              }}>
                <p style={{ fontSize: 12, color: 'var(--gs-text-muted)', marginBottom: 2 }}>Signed in as</p>
                <p style={{ fontSize: 13, color: 'var(--gs-text)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.email}
                </p>
              </div>

              <button
                onClick={() => { onDashboard(); setMenuOpen(false) }}
                style={{
                  padding: '14px 16px', borderRadius: 10, minHeight: 44,
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--gs-text)', fontFamily: 'var(--font-sans)',
                  fontSize: 15, fontWeight: 500, textAlign: 'left',
                }}
              >
                Dashboard
              </button>

              <div style={{ marginTop: 'auto' }}>
                <button
                  onClick={() => { onSignOut(); setMenuOpen(false) }}
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
    </>
  )
}

export default function HistoryPage() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const isMobile = useMobile()
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expandedItem, setExpandedItem] = useState(null)

  useEffect(() => {
    getHistory()
      .then(data => setHistory(Array.isArray(data) ? data : []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const handleSignOut = () => { signOut(); navigate('/login') }

  return (
    <div style={{ minHeight: '100svh', background: 'var(--gs-bg)' }}>
      <Navbar user={user} onSignOut={handleSignOut} onDashboard={() => navigate('/dashboard')} />

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: isMobile ? '24px 16px 60px' : '36px 24px 60px' }}>
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 4 }}>
            <h1 style={{
              fontFamily: 'var(--font-sans)',
              fontSize: isMobile ? 22 : 28,
              fontWeight: 700, letterSpacing: '-0.04em', color: 'var(--gs-text)',
            }}>
              Diagnosis History
            </h1>
            {!loading && (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--gs-text-dim)' }}>
                {history.length} {history.length === 1 ? 'record' : 'records'}
              </span>
            )}
          </div>
          <p style={{ color: 'var(--gs-text-muted)', fontSize: 13 }}>
            All previous crop diagnoses for your account
          </p>
        </motion.div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              border: '2px solid var(--gs-border)',
              borderTopColor: 'var(--gs-lime)',
              animation: 'spin 0.9s linear infinite',
            }} />
          </div>
        ) : error ? (
          <div style={{
            padding: '18px 22px', borderRadius: 12,
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
            color: 'var(--gs-red)', fontSize: 14,
          }}>
            Failed to load history: {error}
          </div>
        ) : isMobile ? (
          /* Mobile card list */
          <div>
            {history.length === 0 ? (
              <EmptyStateMobile />
            ) : (
              history.map((item, i) => (
                <HistoryCardMobile key={item.id} item={item} index={i} onView={setExpandedItem} />
              ))
            )}
          </div>
        ) : (
          /* Desktop table */
          <div className="glass-card" style={{ borderRadius: 14, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--gs-border)' }}>
                  {['Image', 'Disease', 'Confidence', 'Date', ''].map((col, i) => (
                    <th key={i} style={{
                      padding: '10px 16px',
                      textAlign: i === 4 ? 'right' : 'left',
                      fontFamily: 'var(--font-mono)', fontSize: 9,
                      color: 'var(--gs-text-dim)', letterSpacing: '0.12em',
                      fontWeight: 600, background: 'var(--gs-surface)',
                    }}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.length === 0 ? (
                  <EmptyState />
                ) : (
                  history.map((item, i) => (
                    <TableRow key={item.id} item={item} index={i} onView={setExpandedItem} />
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Full-report modal */}
      <AnimatePresence>
        {expandedItem && (
          <motion.div
            key="report-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 200,
              background: 'var(--gs-bg)',
              display: 'flex', flexDirection: 'column',
              overflow: isMobile ? 'auto' : 'hidden',
            }}
          >
            <Navbar user={user} onSignOut={handleSignOut} onDashboard={() => navigate('/dashboard')} />
            <div style={{ flex: 1, overflow: isMobile ? 'visible' : 'hidden' }}>
              <DiagnosisCard
                result={buildResult(expandedItem)}
                imagePreview={expandedItem.image_url}
                onClose={() => setExpandedItem(null)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
