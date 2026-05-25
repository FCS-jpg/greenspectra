import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

function InfoIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" />
    </svg>
  )
}

export default function HeatmapViewer({ originalSrc, heatmapBase64, heatmapUrl }) {
  const [hovered, setHovered] = useState(false)
  const [tooltipVisible, setTooltipVisible] = useState(false)
  const heatmapSrc = heatmapBase64 ? `data:image/png;base64,${heatmapBase64}` : heatmapUrl

  return (
    <div>
      {/* Label row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 10,
            color: 'var(--gs-text-dim)', letterSpacing: '0.12em',
          }}>
            SPECTRAL ANALYSIS
          </span>
          <div
            style={{ position: 'relative', cursor: 'help', color: 'var(--gs-text-dim)' }}
            onMouseEnter={() => setTooltipVisible(true)}
            onMouseLeave={() => setTooltipVisible(false)}
          >
            <InfoIcon />
            <AnimatePresence>
              {tooltipVisible && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  style={{
                    position: 'absolute', bottom: 'calc(100% + 8px)', left: '50%',
                    transform: 'translateX(-50%)',
                    width: 230,
                    padding: '10px 12px',
                    borderRadius: 8,
                    background: 'var(--gs-surface-3)',
                    border: '1px solid var(--gs-border-bright)',
                    color: 'var(--gs-text-muted)',
                    fontSize: 12,
                    lineHeight: 1.5,
                    zIndex: 50,
                    pointerEvents: 'none',
                  }}
                >
                  Simulated NDVI overlay using Grad-CAM activation maps. Red areas indicate predicted disease zones; green = healthy tissue.
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        <span style={{ fontSize: 11, color: 'var(--gs-text-dim)', fontFamily: 'var(--font-mono)' }}>
          {hovered ? 'NDVI SIMULATION' : 'ORIGINAL'}
        </span>
      </div>

      {/* Image container with crossfade */}
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          position: 'relative',
          borderRadius: 12,
          overflow: 'hidden',
          aspectRatio: '1 / 1',
          cursor: 'crosshair',
          border: '1px solid var(--gs-border)',
        }}
      >
        {/* Original */}
        {originalSrc && (
          <img
            src={originalSrc}
            alt="Original crop"
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%',
              objectFit: 'cover',
            }}
          />
        )}

        {/* Heatmap crossfade */}
        <motion.div
          animate={{ opacity: hovered ? 1 : 0 }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
          style={{ position: 'absolute', inset: 0 }}
        >
          <img
            src={heatmapSrc}
            alt="Spectral heatmap"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </motion.div>

        {/* Hover hint */}
        <AnimatePresence>
          {!hovered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'absolute', bottom: 10, left: '50%',
                transform: 'translateX(-50%)',
                padding: '4px 10px',
                borderRadius: 20,
                background: 'rgba(5,13,7,0.85)',
                border: '1px solid var(--gs-border)',
                color: 'var(--gs-text-muted)',
                fontSize: 11,
                fontFamily: 'var(--font-mono)',
                whiteSpace: 'nowrap',
                pointerEvents: 'none',
              }}
            >
              hover for NDVI view
            </motion.div>
          )}
        </AnimatePresence>

        {/* NDVI colormap legend */}
        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              style={{
                position: 'absolute', right: 10, top: '50%',
                transform: 'translateY(-50%)',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 4,
              }}
            >
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', fontFamily: 'var(--font-mono)' }}>HIGH</span>
              <div style={{
                width: 10, height: 80, borderRadius: 5,
                background: 'linear-gradient(to bottom, #ef4444, #f59e0b, #22c55e)',
                border: '1px solid rgba(255,255,255,0.2)',
              }} />
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', fontFamily: 'var(--font-mono)' }}>LOW</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <p style={{
        marginTop: 8, textAlign: 'center',
        fontFamily: 'var(--font-mono)', fontSize: 10,
        color: 'var(--gs-text-dim)', letterSpacing: '0.06em',
      }}>
        Simulated NDVI Spectral Analysis — Grad-CAM overlay
      </p>
    </div>
  )
}
