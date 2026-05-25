import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../hooks/useAuth'

// Particle data generated once — random positions, sizes, durations
const PARTICLES = Array.from({ length: 55 }, (_, i) => ({
  id: i,
  left: Math.random() * 100,
  size: Math.random() * 4 + 2,
  duration: Math.random() * 18 + 12,
  delay: Math.random() * 20,
  opacity: Math.random() * 0.6 + 0.2,
}))

function LeafIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <path
        d="M16 3C16 3 5 8 5 18C5 23.5 9.5 28 16 28C22.5 28 27 23.5 27 18C27 8 16 3 16 3Z"
        fill="url(#leafGrad)"
      />
      <path d="M16 28V14" stroke="#050d07" strokeWidth="2" strokeLinecap="round" />
      <path d="M16 20C16 20 10 16 8 12" stroke="#050d07" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M16 17C16 17 20 14 23 11" stroke="#050d07" strokeWidth="1.5" strokeLinecap="round" />
      <defs>
        <linearGradient id="leafGrad" x1="5" y1="3" x2="27" y2="28" gradientUnits="userSpaceOnUse">
          <stop stopColor="#a3e635" />
          <stop offset="1" stopColor="#22c55e" />
        </linearGradient>
      </defs>
    </svg>
  )
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

export default function LoginPage() {
  const { user, signInWithGoogle, signInWithEmail, signUp } = useAuth()
  const navigate = useNavigate()

  const [mode, setMode] = useState('signin') // 'signin' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Redirect already-authenticated users (handles OAuth callback landing on /login edge case)
  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true })
  }, [user, navigate])

  async function handleGoogle() {
    setError('')
    setLoading(true)
    try {
      await signInWithGoogle()
    } catch (e) {
      setError(e.message)
      setLoading(false)
    }
  }

  async function handleEmail(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'signup') {
        await signUp(email, password)
        setError('Check your email to confirm your account.')
      } else {
        await signInWithEmail(email, password)
        navigate('/dashboard')
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100svh',
      background: 'var(--gs-bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Radial ambient glow */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 60% 50% at 50% 60%, rgba(34,197,94,0.07) 0%, transparent 70%)',
      }} />

      {/* Particle field */}
      {PARTICLES.map(p => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            bottom: '-10px',
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            borderRadius: '50%',
            background: Math.random() > 0.4 ? 'var(--gs-lime)' : 'var(--gs-green)',
            opacity: p.opacity,
            animation: `float-up ${p.duration}s ${p.delay}s linear infinite`,
            pointerEvents: 'none',
          }}
        />
      ))}

      {/* Grid overlay */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: `
          linear-gradient(rgba(26,51,34,0.3) 1px, transparent 1px),
          linear-gradient(90deg, rgba(26,51,34,0.3) 1px, transparent 1px)
        `,
        backgroundSize: '60px 60px',
      }} />

      {/* Back to Home */}
      <button
        onClick={() => navigate('/')}
        style={{
          position: 'absolute', top: 16, left: 16, zIndex: 20,
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--gs-text-muted)',
          fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 500,
          padding: '10px 14px', borderRadius: 8, minHeight: 44,
          transition: 'color 0.2s',
        }}
        onMouseEnter={e => { e.currentTarget.style.color = 'var(--gs-text)' }}
        onMouseLeave={e => { e.currentTarget.style.color = 'var(--gs-text-muted)' }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 5l-7 7 7 7" />
        </svg>
        Back to Home
      </button>

      {/* Login card */}
      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: 420,
          margin: '0 16px',
          borderRadius: 20,
          padding: 'clamp(28px, 5vw, 44px) clamp(20px, 6vw, 40px)',
          position: 'relative',
          zIndex: 10,
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
          <LeafIcon />
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
            fontSize: 22,
            letterSpacing: '-0.02em',
            color: 'var(--gs-text)',
          }}>
            Green<span className="gradient-text">Spectra</span>
          </span>
        </div>

        <h1 style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 26,
          fontWeight: 700,
          letterSpacing: '-0.03em',
          color: 'var(--gs-text)',
          marginBottom: 6,
        }}>
          {mode === 'signin' ? 'Welcome back' : 'Create account'}
        </h1>
        <p style={{ color: 'var(--gs-text-muted)', fontSize: 14, marginBottom: 28 }}>
          AI-powered crop disease diagnosis
        </p>

        {/* Google OAuth */}
        <button
          onClick={handleGoogle}
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px 16px',
            borderRadius: 10,
            border: '1px solid var(--gs-border-bright)',
            background: 'rgba(255,255,255,0.04)',
            color: 'var(--gs-text)',
            fontFamily: 'var(--font-sans)',
            fontWeight: 500,
            fontSize: 14,
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            transition: 'background 0.2s, border-color 0.2s',
            marginBottom: 20,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
        >
          <GoogleIcon />
          Continue with Google
        </button>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ flex: 1, height: 1, background: 'var(--gs-border)' }} />
          <span style={{ color: 'var(--gs-text-dim)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>OR</span>
          <div style={{ flex: 1, height: 1, background: 'var(--gs-border)' }} />
        </div>

        {/* Email form */}
        <form onSubmit={handleEmail} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: 10,
              border: '1px solid var(--gs-border)',
              background: 'rgba(9,21,16,0.6)',
              color: 'var(--gs-text)',
              fontFamily: 'var(--font-sans)',
              fontSize: 14,
              outline: 'none',
              transition: 'border-color 0.2s',
            }}
            onFocus={e => { e.target.style.borderColor = 'var(--gs-lime-dim)' }}
            onBlur={e => { e.target.style.borderColor = 'var(--gs-border)' }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: 10,
              border: '1px solid var(--gs-border)',
              background: 'rgba(9,21,16,0.6)',
              color: 'var(--gs-text)',
              fontFamily: 'var(--font-sans)',
              fontSize: 14,
              outline: 'none',
              transition: 'border-color 0.2s',
            }}
            onFocus={e => { e.target.style.borderColor = 'var(--gs-lime-dim)' }}
            onBlur={e => { e.target.style.borderColor = 'var(--gs-border)' }}
          />

          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{
                  color: error.startsWith('Check') ? 'var(--gs-green)' : 'var(--gs-red)',
                  fontSize: 13,
                  padding: '8px 12px',
                  borderRadius: 8,
                  background: error.startsWith('Check')
                    ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                  border: `1px solid ${error.startsWith('Check') ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
                }}
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ width: '100%', padding: '13px 16px', marginTop: 4 }}
          >
            {loading
              ? <span style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid rgba(0,0,0,0.3)', borderTopColor: '#050d07', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
              : mode === 'signin' ? 'Sign in' : 'Create account'
            }
          </button>
        </form>

        {/* Toggle mode */}
        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--gs-text-muted)' }}>
          {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button
            onClick={() => { setMode(m => m === 'signin' ? 'signup' : 'signin'); setError('') }}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--gs-lime)', fontFamily: 'var(--font-sans)',
              fontSize: 13, fontWeight: 600,
            }}
          >
            {mode === 'signin' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </motion.div>
    </div>
  )
}
