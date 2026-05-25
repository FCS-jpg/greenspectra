import { Component } from 'react'
import { motion } from 'framer-motion'

function ErrorFallback({ error, onReset }) {
  return (
    <div style={{
      minHeight: '100svh',
      background: 'var(--gs-bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    }}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="glass-card"
        style={{
          maxWidth: 480, width: '100%',
          borderRadius: 20, padding: '40px 36px',
          textAlign: 'center',
        }}
      >
        {/* Icon */}
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px',
          fontSize: 28,
        }}>
          ⚠
        </div>

        <h2 style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 22, fontWeight: 700,
          letterSpacing: '-0.03em',
          color: 'var(--gs-text)',
          marginBottom: 10,
        }}>
          Something went wrong
        </h2>

        <p style={{
          color: 'var(--gs-text-muted)',
          fontSize: 14, lineHeight: 1.6,
          marginBottom: 24,
        }}>
          An unexpected error occurred in the interface. Your data is safe.
        </p>

        {error?.message && (
          <div style={{
            padding: '10px 14px',
            borderRadius: 8,
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.15)',
            marginBottom: 24,
            textAlign: 'left',
          }}>
            <p style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 12, color: 'var(--gs-red)',
              wordBreak: 'break-word',
            }}>
              {error.message}
            </p>
          </div>
        )}

        <button
          onClick={onReset}
          className="btn-primary"
          style={{ padding: '12px 28px' }}
        >
          Try again
        </button>
      </motion.div>
    </div>
  )
}

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  handleReset() {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          error={this.state.error}
          onReset={() => this.handleReset()}
        />
      )
    }
    return this.props.children
  }
}
