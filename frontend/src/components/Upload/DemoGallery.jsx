import { motion } from 'framer-motion'
import { DISEASE_META } from '../../lib/constants'
import { useMobile } from '../../hooks/useMobile'

const API_URL = import.meta.env.VITE_API_URL

const DEMOS = [
  { name: 'healthy_1',      disease: 'healthy',        label: 'Corn — Healthy' },
  { name: 'rust',           disease: 'rust',            label: 'Wheat — Rust' },
  { name: 'leaf_blight',    disease: 'leaf_blight',    label: 'Pepper — Blight' },
  { name: 'powdery_mildew', disease: 'powdery_mildew', label: 'Leaf — Mildew' },
  { name: 'healthy_2',      disease: 'healthy',        label: 'Tomato — Healthy' },
]

export default function DemoGallery({ onSelect }) {
  const isMobile = useMobile()

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 11,
          color: 'var(--gs-text-dim)', letterSpacing: '0.1em',
        }}>
          DEMO SAMPLES
        </span>
        <div style={{ flex: 1, height: 1, background: 'var(--gs-border)' }} />
      </div>

      <div className={isMobile ? 'demo-gallery-scroll' : undefined} style={isMobile ? {
        display: 'flex',
        gap: 10,
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none',
        paddingBottom: 4,
        marginRight: -16,
        paddingRight: 16,
      } : {
        display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10,
      }}>
        {DEMOS.map((demo, i) => {
          const meta = DISEASE_META[demo.disease]
          return (
            <motion.button
              key={demo.name}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -4, scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onSelect(demo.name)}
              style={{
                position: 'relative',
                border: 'none',
                borderRadius: 12,
                overflow: 'hidden',
                cursor: 'pointer',
                padding: 0,
                background: 'var(--gs-surface-2)',
                aspectRatio: '3/4',
                ...(isMobile ? { minWidth: 280, flexShrink: 0 } : {}),
              }}
            >
              {/* Actual crop photo */}
              <img
                src={`${API_URL}/demo-images/${demo.name}.jpg`}
                alt={demo.label}
                style={{
                  position: 'absolute', inset: 0,
                  width: '100%', height: '100%',
                  objectFit: 'cover',
                }}
              />

              {/* Gradient overlay for text legibility */}
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(to top, rgba(5,13,7,0.88) 0%, rgba(5,13,7,0.08) 55%, transparent 100%)',
              }} />

              {/* DEMO badge */}
              <div style={{
                position: 'absolute', top: 7, right: 7,
                padding: '2px 7px',
                borderRadius: 4,
                background: 'rgba(5,13,7,0.72)',
                backdropFilter: 'blur(6px)',
                WebkitBackdropFilter: 'blur(6px)',
                border: '1px solid rgba(163,230,53,0.4)',
                color: 'var(--gs-lime)',
                fontSize: 9,
                fontWeight: 700,
                fontFamily: 'var(--font-mono)',
                letterSpacing: '0.1em',
              }}>
                DEMO
              </div>

              {/* Bottom label */}
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                padding: '24px 10px 10px',
              }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: meta.color, marginBottom: 2 }}>
                  {meta.emoji} {meta.label}
                </div>
                <div style={{
                  fontSize: 10, color: 'rgba(255,255,255,0.55)',
                  fontFamily: 'var(--font-mono)',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {demo.label}
                </div>
              </div>

              {/* Border ring */}
              <div style={{
                position: 'absolute', inset: 0,
                borderRadius: 12,
                border: `1px solid ${meta.color}35`,
                pointerEvents: 'none',
              }} />
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
