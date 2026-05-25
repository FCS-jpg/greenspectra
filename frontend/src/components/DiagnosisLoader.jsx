import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const STAGES = [
  { label: 'Preprocessing image',       pct: 0.15 },
  { label: 'Running EfficientNet',       pct: 0.40 },
  { label: 'Generating Grad-CAM heatmap', pct: 0.70 },
  { label: 'Fetching AI treatment plan', pct: 0.90 },
  { label: 'Finalising results',         pct: 1.00 },
]

const TOTAL_MS = 5000
const R = 52
const CIRC = 2 * Math.PI * R

export default function DiagnosisLoader({ visible }) {
  const [elapsed, setElapsed] = useState(0)
  const [stageIdx, setStageIdx] = useState(0)

  useEffect(() => {
    if (!visible) {
      setElapsed(0)
      setStageIdx(0)
      return
    }

    const start = Date.now()
    const tick = setInterval(() => {
      const ms = Date.now() - start
      setElapsed(ms)
      // Advance stage based on elapsed fraction (capped at last stage)
      const frac = Math.min(ms / TOTAL_MS, 1)
      const nextIdx = STAGES.findIndex(s => frac < s.pct)
      setStageIdx(nextIdx === -1 ? STAGES.length - 1 : nextIdx)
    }, 80)

    return () => clearInterval(tick)
  }, [visible])

  // Fraction 0→1, then loops if backend takes longer than 5 s
  const rawFrac = elapsed / TOTAL_MS
  const frac = rawFrac <= 1 ? rawFrac : (rawFrac % 1)
  const countdown = Math.max(0, Math.ceil(TOTAL_MS / 1000 - elapsed / 1000))
  const displaySecs = elapsed <= TOTAL_MS ? countdown : 0
  const dashOffset = CIRC * (1 - (elapsed <= TOTAL_MS ? frac : 1))

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="loader"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(5,13,7,0.88)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          }}
        >
          {/* Radial glow */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(ellipse 50% 40% at 50% 50%, rgba(163,230,53,0.06) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          <div style={{ textAlign: 'center', position: 'relative' }}>
            {/* Countdown ring */}
            <div style={{ position: 'relative', width: 140, height: 140, margin: '0 auto 28px' }}>
              <svg
                width="140" height="140" viewBox="0 0 120 120"
                style={{ transform: 'rotate(-90deg)', position: 'absolute', inset: 0 }}
              >
                {/* Track */}
                <circle
                  cx="60" cy="60" r={R}
                  fill="none"
                  stroke="rgba(163,230,53,0.1)"
                  strokeWidth="5"
                />
                {/* Progress arc */}
                <motion.circle
                  cx="60" cy="60" r={R}
                  fill="none"
                  stroke="var(--gs-lime)"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeDasharray={CIRC}
                  animate={{ strokeDashoffset: dashOffset }}
                  transition={{ duration: 0.08, ease: 'linear' }}
                  style={{ filter: 'drop-shadow(0 0 8px rgba(163,230,53,0.5))' }}
                />
                {/* Outer pulse ring */}
                <circle
                  cx="60" cy="60" r={R + 8}
                  fill="none"
                  stroke="rgba(163,230,53,0.08)"
                  strokeWidth="1"
                />
              </svg>

              {/* Center countdown */}
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <AnimatePresence mode="wait">
                  <motion.span
                    key={displaySecs}
                    initial={{ opacity: 0, scale: 1.4, y: -6 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.7, y: 6 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 42,
                      fontWeight: 700,
                      color: 'var(--gs-lime)',
                      lineHeight: 1,
                    }}
                  >
                    {displaySecs}
                  </motion.span>
                </AnimatePresence>
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  color: 'var(--gs-text-dim)',
                  letterSpacing: '0.1em',
                  marginTop: 4,
                }}>
                  SEC
                </span>
              </div>
            </div>

            {/* Title */}
            <p style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 20,
              fontWeight: 700,
              color: 'var(--gs-text)',
              letterSpacing: '-0.02em',
              marginBottom: 8,
            }}>
              Analyzing your crop
            </p>

            {/* Stage label */}
            <AnimatePresence mode="wait">
              <motion.p
                key={stageIdx}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }}
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12,
                  color: 'var(--gs-text-muted)',
                  letterSpacing: '0.04em',
                  marginBottom: 24,
                }}
              >
                {STAGES[stageIdx].label}...
              </motion.p>
            </AnimatePresence>

            {/* Stage dots */}
            <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
              {STAGES.map((s, i) => (
                <motion.div
                  key={i}
                  animate={{
                    background: i <= stageIdx ? 'var(--gs-lime)' : 'var(--gs-border)',
                    scale: i === stageIdx ? 1.3 : 1,
                    boxShadow: i === stageIdx
                      ? '0 0 8px rgba(163,230,53,0.6)' : 'none',
                  }}
                  transition={{ duration: 0.3 }}
                  style={{
                    width: 7, height: 7,
                    borderRadius: '50%',
                    background: 'var(--gs-border)',
                  }}
                />
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
