import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { DISEASE_META, DISEASE_DETAIL } from '../../lib/constants'
import { useMobile } from '../../hooks/useMobile'
import HeatmapViewer from './HeatmapViewer'

const URGENCY_COLORS = {
  immediate:     { bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.3)',  text: '#ef4444' },
  within_3_days: { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', text: '#f59e0b' },
  within_week:   { bg: 'rgba(163,230,53,0.10)', border: 'rgba(163,230,53,0.25)', text: '#a3e635' },
  monitor:       { bg: 'rgba(34,197,94,0.10)',  border: 'rgba(34,197,94,0.25)', text: '#22c55e' },
}

const SEVERITY_LEVELS = ['mild', 'moderate', 'severe']
const SEVERITY_COLORS = { mild: '#22c55e', moderate: '#f59e0b', severe: '#ef4444' }

// ── Small helpers ────────────────────────────────────────────────────────────

function Label({ children, style }) {
  return (
    <p style={{
      fontFamily: 'var(--font-mono)', fontSize: 10,
      color: 'var(--gs-text-dim)', letterSpacing: '0.12em',
      marginBottom: 10, ...style,
    }}>
      {children}
    </p>
  )
}

function Card({ children, style, className = 'glass-card' }) {
  return (
    <div className={className} style={{ borderRadius: 14, padding: '16px 18px', ...style }}>
      {children}
    </div>
  )
}

function ConfidenceRing({ value, color }) {
  const R = 34
  const CIRC = 2 * Math.PI * R
  return (
    <div style={{ position: 'relative', width: 84, height: 84, flexShrink: 0 }}>
      <svg width="84" height="84" viewBox="0 0 76 76"
        style={{ transform: 'rotate(-90deg)', position: 'absolute', inset: 0 }}>
        <circle cx="38" cy="38" r={R} fill="none" stroke="var(--gs-border)" strokeWidth="6" />
        <motion.circle
          cx="38" cy="38" r={R}
          fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"
          strokeDasharray={CIRC}
          initial={{ strokeDashoffset: CIRC }}
          animate={{ strokeDashoffset: CIRC * (1 - value) }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
          style={{ filter: `drop-shadow(0 0 6px ${color}60)` }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{
          fontSize: 17, fontWeight: 700,
          fontFamily: 'var(--font-mono)', color,
        }}>
          {Math.round(value * 100)}%
        </span>
      </div>
    </div>
  )
}

function SidebarButton({ icon, label, onClick, active }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 9,
        padding: '8px 12px', borderRadius: 8, width: '100%',
        border: 'none', cursor: 'pointer', textAlign: 'left',
        background: active ? 'var(--gs-surface-3)' : 'transparent',
        color: active ? 'var(--gs-lime)' : 'var(--gs-text-muted)',
        fontSize: 13, fontWeight: active ? 600 : 400,
        fontFamily: 'var(--font-sans)',
        transition: 'background 0.15s, color 0.15s',
        minHeight: 44,
      }}
      onMouseEnter={e => {
        if (!active) {
          e.currentTarget.style.background = 'var(--gs-surface-2)'
          e.currentTarget.style.color = 'var(--gs-text)'
        }
      }}
      onMouseLeave={e => {
        if (!active) {
          e.currentTarget.style.background = 'transparent'
          e.currentTarget.style.color = 'var(--gs-text-muted)'
        }
      }}
    >
      {icon}
      {label}
    </button>
  )
}

// ── Main component ───────────────────────────────────────────────────────────

export default function DiagnosisCard({ result, imagePreview, onClose }) {
  const navigate = useNavigate()
  const isMobile = useMobile()
  const [checkedSteps, setCheckedSteps] = useState({})

  const { disease, confidence, all_probs, heatmap, heatmapUrl, treatment } = result
  const meta = DISEASE_META[disease] || DISEASE_META.healthy
  const detail = DISEASE_DETAIL[disease] || DISEASE_DETAIL.healthy
  const urgencyStyle = URGENCY_COLORS[treatment?.urgency] || URGENCY_COLORS.monitor
  const severityIdx = SEVERITY_LEVELS.indexOf(treatment?.severity || 'mild')

  const toggleStep = (i) => setCheckedSteps(p => ({ ...p, [i]: !p[i] }))

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        display: 'flex',
        height: isMobile ? 'auto' : 'calc(100svh - 62px)',
      }}
    >

      {/* ══ SIDEBAR — desktop only ═══════════════════════════════════════════ */}
      {!isMobile && (
        <motion.aside
          initial={{ x: -16, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          style={{
            width: 216,
            flexShrink: 0,
            borderRight: '1px solid var(--gs-border)',
            background: 'var(--gs-surface)',
            display: 'flex',
            flexDirection: 'column',
            padding: '18px 0',
            overflowY: 'auto',
          }}
        >
          {/* Nav */}
          <div style={{ padding: '0 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
            <SidebarButton
              icon={<UploadSvg />}
              label="New Analysis"
              onClick={onClose}
              active={false}
            />
            <SidebarButton
              icon={<HistorySvg />}
              label="History"
              onClick={() => navigate('/history')}
              active={false}
            />
          </div>

          <div style={{ margin: '14px 16px', height: 1, background: 'var(--gs-border)' }} />

          {/* Current analysis info */}
          <div style={{ padding: '0 16px' }}>
            <Label style={{ marginBottom: 10 }}>CURRENT ANALYSIS</Label>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: meta.color, flexShrink: 0,
                boxShadow: `0 0 6px ${meta.color}80`,
              }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: meta.color, lineHeight: 1.2 }}>
                {meta.label}
              </span>
            </div>

            <p style={{
              fontSize: 11, color: 'var(--gs-text-dim)',
              fontFamily: 'var(--font-mono)',
            }}>
              {Math.round(confidence * 100)}% confidence
            </p>

            {treatment?.urgency_label && (
              <div style={{
                marginTop: 12, padding: '6px 10px', borderRadius: 8,
                background: urgencyStyle.bg, border: `1px solid ${urgencyStyle.border}`,
              }}>
                <p style={{
                  fontSize: 11, color: urgencyStyle.text,
                  fontFamily: 'var(--font-mono)', fontWeight: 600,
                }}>
                  {treatment.urgency_label}
                </p>
              </div>
            )}
          </div>

          <div style={{ margin: '14px 16px', height: 1, background: 'var(--gs-border)' }} />

          {/* Alt predictions */}
          {all_probs && (
            <div style={{ padding: '0 16px' }}>
              <Label style={{ marginBottom: 8 }}>OTHER READINGS</Label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {Object.entries(all_probs)
                  .filter(([k]) => k !== disease)
                  .sort(([, a], [, b]) => b - a)
                  .map(([key, prob]) => {
                    const m = DISEASE_META[key]
                    return (
                      <div key={key} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '5px 8px', borderRadius: 6,
                        background: 'var(--gs-surface-2)',
                        border: '1px solid var(--gs-border)',
                      }}>
                        <span style={{ fontSize: 11, color: 'var(--gs-text-muted)' }}>
                          {m?.label || key}
                        </span>
                        <span style={{
                          fontSize: 10, fontFamily: 'var(--font-mono)',
                          color: 'var(--gs-text-dim)',
                        }}>
                          {Math.round(prob * 100)}%
                        </span>
                      </div>
                    )
                  })}
              </div>
            </div>
          )}
        </motion.aside>
      )}

      {/* ══ MAIN CONTENT ═════════════════════════════════════════════════════ */}
      <main style={{
        flex: 1,
        overflowY: isMobile ? 'visible' : 'auto',
        padding: isMobile ? '16px 16px 88px' : '22px 24px 40px',
        background: 'var(--gs-bg)',
      }}>

        {/* Page header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 20,
        }}>
          <div>
            <Label style={{ marginBottom: 3 }}>DIAGNOSIS REPORT</Label>
            <h1 style={{
              fontSize: isMobile ? 18 : 22, fontWeight: 700, letterSpacing: '-0.03em',
              color: 'var(--gs-text)', lineHeight: 1.2,
            }}>
              {meta.label}
            </h1>
          </div>
          <button
            onClick={onClose}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 8,
              border: '1px solid var(--gs-border)',
              background: 'var(--gs-surface)',
              color: 'var(--gs-text-muted)',
              fontSize: 13, fontWeight: 500,
              cursor: 'pointer', fontFamily: 'var(--font-sans)',
              transition: 'border-color 0.15s, color 0.15s',
              minHeight: 44,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'var(--gs-border-bright)'
              e.currentTarget.style.color = 'var(--gs-text)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--gs-border)'
              e.currentTarget.style.color = 'var(--gs-text-muted)'
            }}
          >
            ← New Analysis
          </button>
        </div>

        {/* ── ROW 1: 3 stat cards ─────────────────────────────────────────── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr',
          gap: 10, marginBottom: 10,
        }}>

          {/* Disease */}
          <Card>
            <Label>DISEASE DETECTED</Label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 6 }}>
              <div style={{
                width: 10, height: 10, borderRadius: '50%',
                background: meta.color, flexShrink: 0,
                boxShadow: `0 0 10px ${meta.color}80`,
              }} />
              <span style={{
                fontSize: 17, fontWeight: 700, letterSpacing: '-0.02em',
                color: meta.color,
              }}>
                {meta.label}
              </span>
            </div>
            {treatment?.summary && (
              <p style={{ fontSize: 12, color: 'var(--gs-text-muted)', lineHeight: 1.55 }}>
                {treatment.summary}
              </p>
            )}
          </Card>

          {/* Confidence */}
          <Card>
            <Label>AI CONFIDENCE</Label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <ConfidenceRing value={confidence} color={meta.color} />
              <div>
                <p style={{
                  fontSize: 26, fontWeight: 700, lineHeight: 1,
                  fontFamily: 'var(--font-mono)', color: meta.color,
                }}>
                  {Math.round(confidence * 100)}%
                </p>
                <p style={{
                  fontSize: 12, color: 'var(--gs-text-muted)',
                  marginTop: 4, textTransform: 'capitalize',
                }}>
                  {treatment?.severity || 'moderate'} severity
                </p>
              </div>
            </div>
          </Card>

          {/* Urgency */}
          <Card style={{ background: urgencyStyle.bg, border: `1px solid ${urgencyStyle.border}` }}>
            <Label style={{ color: urgencyStyle.text, opacity: 0.7 }}>URGENCY</Label>
            <p style={{
              fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-mono)',
              color: urgencyStyle.text, lineHeight: 1.3, marginBottom: 6,
            }}>
              {treatment?.urgency_label || meta.urgency || 'Monitor crop'}
            </p>
            <p style={{ fontSize: 11, color: urgencyStyle.text, opacity: 0.65, lineHeight: 1.5 }}>
              {treatment?.urgency === 'immediate'       ? 'Act today to prevent further spread'
               : treatment?.urgency === 'within_3_days' ? 'Treatment needed within this week'
               : treatment?.urgency === 'within_week'   ? 'Schedule treatment in the next few days'
               : 'Continue monitoring on a regular schedule'}
            </p>
          </Card>
        </div>

        {/* ── ROW 2: Original photo + Spectral heatmap ─────────────────────── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: 10, marginBottom: 10,
        }}>

          {/* Original photo card */}
          <div className="glass-card" style={{ borderRadius: 14, overflow: 'hidden' }}>
            <div style={{
              padding: '12px 16px',
              borderBottom: '1px solid var(--gs-border)',
            }}>
              <p style={{
                fontFamily: 'var(--font-mono)', fontSize: 10,
                color: 'var(--gs-text-dim)', letterSpacing: '0.12em',
              }}>ORIGINAL PHOTO</p>
            </div>
            {imagePreview ? (
              <img
                src={imagePreview}
                alt="Analyzed crop"
                style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', display: 'block' }}
              />
            ) : (
              <div style={{
                width: '100%', aspectRatio: '4/3',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'var(--gs-surface-2)',
                color: 'var(--gs-text-dim)', fontSize: 13,
              }}>
                No image available
              </div>
            )}
          </div>

          {/* Spectral heatmap card */}
          <div className="glass-card" style={{ borderRadius: 14, overflow: 'hidden' }}>
            <div style={{
              padding: '12px 16px',
              borderBottom: '1px solid var(--gs-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <p style={{
                fontFamily: 'var(--font-mono)', fontSize: 10,
                color: 'var(--gs-text-dim)', letterSpacing: '0.12em',
              }}>SPECTRAL HEATMAP</p>
              <span style={{
                fontSize: 9, color: 'var(--gs-text-muted)',
                fontFamily: 'var(--font-mono)', letterSpacing: '0.06em',
                padding: '2px 7px', borderRadius: 4,
                background: 'var(--gs-surface-2)',
                border: '1px solid var(--gs-border)',
              }}>NDVI SIM</span>
            </div>
            <div style={{ padding: '14px 16px' }}>
              {(heatmap || heatmapUrl) && imagePreview ? (
                <HeatmapViewer originalSrc={imagePreview} heatmapBase64={heatmap} heatmapUrl={heatmapUrl} />
              ) : (
                <div style={{
                  aspectRatio: '1/1',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'var(--gs-surface-2)', borderRadius: 10,
                  color: 'var(--gs-text-dim)', fontSize: 13,
                }}>
                  No heatmap available
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── ROW 3: What Is This + Severity ───────────────────────────────── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '3fr 2fr',
          gap: 10, marginBottom: 10,
        }}>

          {/* What Is This */}
          <Card>
            <Label>WHAT IS THIS?</Label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {detail.whatIsThis.map((bullet, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 5, height: 5, borderRadius: '50%',
                    background: meta.color, flexShrink: 0, marginTop: 7,
                  }} />
                  <p style={{ fontSize: 13, color: 'var(--gs-text)', lineHeight: 1.55 }}>
                    {bullet}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          {/* Severity */}
          <Card>
            <Label>SEVERITY LEVEL</Label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {SEVERITY_LEVELS.map((level, i) => {
                const isCurrent = i === severityIdx
                const isPast = i < severityIdx
                const c = SEVERITY_COLORS[level]
                return (
                  <div key={level} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '7px 10px', borderRadius: 8,
                    background: isCurrent ? `${c}14` : 'transparent',
                    border: isCurrent ? `1px solid ${c}28` : '1px solid transparent',
                  }}>
                    <div style={{
                      width: 9, height: 9, borderRadius: '50%',
                      background: isCurrent || isPast ? c : 'var(--gs-border)',
                      boxShadow: isCurrent ? `0 0 8px ${c}60` : 'none',
                      flexShrink: 0,
                    }} />
                    <span style={{
                      fontSize: 13, flex: 1, textTransform: 'capitalize',
                      fontWeight: isCurrent ? 600 : 400,
                      color: isCurrent ? c : isPast ? 'var(--gs-text-muted)' : 'var(--gs-text-dim)',
                    }}>
                      {level}
                    </span>
                    {isCurrent && (
                      <span style={{
                        fontSize: 9, fontFamily: 'var(--font-mono)',
                        color: c, padding: '2px 6px', borderRadius: 4,
                        background: `${c}18`,
                      }}>CURRENT</span>
                    )}
                  </div>
                )
              })}
            </div>
          </Card>
        </div>

        {/* ── ROW 4: Action Plan (full width) ──────────────────────────────── */}
        {treatment?.treatment?.length > 0 && (
          <Card style={{ marginBottom: 10 }}>
            <Label>ACTION PLAN</Label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile
                ? '1fr'
                : `repeat(${Math.min(treatment.treatment.length, 3)}, 1fr)`,
              gap: 10,
            }}>
              {treatment.treatment.map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08 + i * 0.07 }}
                  onClick={() => toggleStep(i)}
                  style={{
                    padding: '12px 14px', borderRadius: 10,
                    background: checkedSteps[i] ? 'rgba(34,197,94,0.06)' : 'var(--gs-surface-2)',
                    border: checkedSteps[i] ? '1px solid rgba(34,197,94,0.2)' : '1px solid var(--gs-border)',
                    cursor: 'pointer', transition: 'background 0.2s, border-color 0.2s',
                    minHeight: 44,
                  }}
                >
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <div style={{
                      width: 17, height: 17, borderRadius: 4, flexShrink: 0, marginTop: 2,
                      border: checkedSteps[i] ? 'none' : `1.5px solid ${meta.color}70`,
                      background: checkedSteps[i] ? meta.color : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {checkedSteps[i] && (
                        <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                          <path d="M1.5 4.5l2 2 4-4" stroke="#050d07" strokeWidth="1.5"
                            strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>

                    <div style={{ flex: 1 }}>
                      <p style={{
                        fontFamily: 'var(--font-mono)', fontSize: 9,
                        color: 'var(--gs-text-dim)', letterSpacing: '0.08em', marginBottom: 4,
                      }}>
                        STEP {step.step}
                      </p>
                      <p style={{
                        fontSize: 13, fontWeight: 500, lineHeight: 1.45,
                        color: checkedSteps[i] ? 'var(--gs-text-muted)' : 'var(--gs-text)',
                        textDecoration: checkedSteps[i] ? 'line-through' : 'none',
                        marginBottom: step.product ? 8 : 0,
                      }}>
                        {step.action}
                      </p>
                      {step.product && (
                        <span style={{
                          fontSize: 11, fontFamily: 'var(--font-mono)',
                          color: meta.color, padding: '2px 7px', borderRadius: 4,
                          background: `${meta.color}12`,
                          border: `1px solid ${meta.color}22`,
                          display: 'inline-block',
                        }}>
                          {step.product}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        )}

        {/* ── ROW 5: Treatment Timeline + Economic Impact ───────────────────── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: 10, marginBottom: 10,
        }}>

          {/* Timeline */}
          <Card>
            <Label>TREATMENT TIMELINE</Label>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {detail.timeline.phases.map((item, i) => {
                const isLast = i === detail.timeline.phases.length - 1
                return (
                  <div key={i} style={{ display: 'flex', gap: 12 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{
                        width: 9, height: 9, borderRadius: '50%', flexShrink: 0, marginTop: 3,
                        background: i === 0 ? meta.color : 'var(--gs-border-bright)',
                        boxShadow: i === 0 ? `0 0 8px ${meta.color}60` : 'none',
                      }} />
                      {!isLast && (
                        <div style={{
                          width: 1, flex: 1, background: 'var(--gs-border)',
                          minHeight: 20, marginTop: 4,
                        }} />
                      )}
                    </div>
                    <div style={{ paddingBottom: isLast ? 0 : 14 }}>
                      <p style={{
                        fontSize: 10, fontFamily: 'var(--font-mono)',
                        color: i === 0 ? meta.color : 'var(--gs-text-dim)',
                        marginBottom: 2,
                      }}>
                        {item.phase}
                      </p>
                      <p style={{ fontSize: 12, color: 'var(--gs-text)', lineHeight: 1.5 }}>
                        {item.action}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>

          {/* Economic Impact */}
          <Card>
            <Label>ECONOMIC IMPACT</Label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { label: 'Yield Loss Risk', value: detail.economicImpact.loss, color: meta.color },
                { label: 'Risk Level', value: detail.economicImpact.risk, color: urgencyStyle.text },
                { label: 'Treatment Cost', value: detail.economicImpact.cost, color: 'var(--gs-text)' },
                { label: 'Time to Act', value: detail.economicImpact.timeToAct, color: urgencyStyle.text },
              ].map((item, i) => (
                <div key={i} style={{
                  padding: '10px 11px', borderRadius: 8,
                  background: 'var(--gs-surface-2)',
                  border: '1px solid var(--gs-border)',
                }}>
                  <p style={{
                    fontSize: 9, fontFamily: 'var(--font-mono)',
                    color: 'var(--gs-text-dim)', letterSpacing: '0.06em', marginBottom: 4,
                  }}>
                    {item.label}
                  </p>
                  <p style={{
                    fontSize: 14, fontWeight: 700,
                    fontFamily: 'var(--font-mono)', color: item.color,
                  }}>
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* ── ROW 6: Recovery Signals (full width) ─────────────────────────── */}
        <Card style={{ marginBottom: 10 }}>
          <Label>RECOVERY SIGNALS</Label>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
            gap: isMobile ? 20 : 18,
          }}>

            {/* Working */}
            <div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10,
              }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--gs-green)' }} />
                <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--gs-green)' }}>
                  Treatment Working
                </p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {detail.recoverySignals.positive.map((signal, i) => (
                  <div key={i} style={{
                    display: 'flex', gap: 8, alignItems: 'flex-start',
                    padding: '6px 10px', borderRadius: 6,
                    background: 'rgba(34,197,94,0.05)',
                    border: '1px solid rgba(34,197,94,0.1)',
                  }}>
                    <span style={{ fontSize: 11, color: 'var(--gs-green)', marginTop: 1, flexShrink: 0 }}>✓</span>
                    <p style={{ fontSize: 12, color: 'var(--gs-text-muted)', lineHeight: 1.45 }}>
                      {signal}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Getting worse */}
            <div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10,
              }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--gs-red)' }} />
                <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--gs-red)' }}>
                  Getting Worse — Escalate Care
                </p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {detail.recoverySignals.negative.map((signal, i) => (
                  <div key={i} style={{
                    display: 'flex', gap: 8, alignItems: 'flex-start',
                    padding: '6px 10px', borderRadius: 6,
                    background: 'rgba(239,68,68,0.05)',
                    border: '1px solid rgba(239,68,68,0.1)',
                  }}>
                    <span style={{ fontSize: 11, color: 'var(--gs-red)', marginTop: 1, flexShrink: 0 }}>✗</span>
                    <p style={{ fontSize: 12, color: 'var(--gs-text-muted)', lineHeight: 1.45 }}>
                      {signal}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* ── ROW 7: Prevention (full width) ───────────────────────────────── */}
        <Card>
          <Label>PREVENTION TIPS</Label>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr',
            gap: 10,
          }}>
            {detail.preventionTips.map((tip, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.07 }}
                style={{
                  padding: '14px 14px', borderRadius: 10,
                  background: 'var(--gs-surface-2)',
                  border: '1px solid var(--gs-border)',
                }}
              >
                <div style={{ fontSize: 20, marginBottom: 8 }}>{tip.icon}</div>
                <p style={{
                  fontSize: 13, fontWeight: 600,
                  color: 'var(--gs-text)', marginBottom: 4,
                }}>
                  {tip.title}
                </p>
                <p style={{ fontSize: 12, color: 'var(--gs-text-muted)', lineHeight: 1.5 }}>
                  {tip.tip}
                </p>
              </motion.div>
            ))}
          </div>
        </Card>

      </main>

      {/* ══ MOBILE BOTTOM TAB BAR ════════════════════════════════════════════ */}
      {isMobile && (
        <nav style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
          height: 64,
          background: 'var(--gs-surface)',
          borderTop: '1px solid var(--gs-border)',
          display: 'flex',
        }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 4,
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--gs-text-muted)',
              fontSize: 10, fontFamily: 'var(--font-mono)',
              letterSpacing: '0.06em',
            }}
          >
            <UploadSvg />
            New Analysis
          </button>
          <button
            onClick={() => navigate('/history')}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 4,
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--gs-text-muted)',
              fontSize: 10, fontFamily: 'var(--font-mono)',
              letterSpacing: '0.06em',
              borderLeft: '1px solid var(--gs-border)',
            }}
          >
            <HistorySvg />
            History
          </button>
        </nav>
      )}
    </motion.div>
  )
}

// ── Icon helpers ─────────────────────────────────────────────────────────────

function UploadSvg() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  )
}

function HistorySvg() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  )
}
