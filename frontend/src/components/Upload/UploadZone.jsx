import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'

export default function UploadZone({ onAnalyze, loading }) {
  const [preview, setPreview] = useState(null)
  const [file, setFile] = useState(null)

  const onDrop = useCallback((accepted) => {
    const f = accepted[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': [], 'image/png': [], 'image/webp': [] },
    maxFiles: 1,
    disabled: loading,
  })

  function handleAnalyze() {
    if (file) onAnalyze(file)
  }

  function handleClear(e) {
    e.stopPropagation()
    setFile(null)
    setPreview(null)
  }

  return (
    <div>
      <motion.div
        {...getRootProps()}
        animate={{
          borderColor: isDragActive ? 'var(--gs-lime)' : 'var(--gs-border-bright)',
          boxShadow: isDragActive
            ? '0 0 40px rgba(163,230,53,0.18), inset 0 0 60px rgba(163,230,53,0.04)'
            : '0 0 0 rgba(0,0,0,0)',
        }}
        transition={{ duration: 0.2 }}
        style={{
          position: 'relative',
          borderRadius: 16,
          border: '2px dashed var(--gs-border-bright)',
          background: isDragActive
            ? 'rgba(163,230,53,0.04)'
            : 'rgba(9,21,16,0.5)',
          cursor: loading ? 'not-allowed' : 'pointer',
          overflow: 'hidden',
          minHeight: preview ? 280 : 200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background 0.2s',
        }}
      >
        <input {...getInputProps()} />

        <AnimatePresence mode="wait">
          {preview ? (
            <motion.div
              key="preview"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{
                position: 'absolute', inset: 0,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <img
                src={preview}
                alt="Selected crop"
                style={{
                  maxWidth: '100%', maxHeight: 260,
                  objectFit: 'contain',
                  borderRadius: 8,
                  filter: loading ? 'brightness(0.5)' : 'none',
                  transition: 'filter 0.3s',
                }}
              />
              {/* Scan line effect when loading */}
              <AnimatePresence>
                {loading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                      position: 'absolute', inset: 0,
                      display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center',
                      gap: 12,
                    }}
                  >
                    <div style={{
                      position: 'absolute', left: 0, right: 0, height: 2,
                      background: 'linear-gradient(90deg, transparent, var(--gs-lime), transparent)',
                      animation: 'scan-line 1.5s ease-in-out infinite',
                    }} />
                    <div style={{
                      padding: '6px 14px',
                      borderRadius: 20,
                      background: 'rgba(9,21,16,0.9)',
                      border: '1px solid var(--gs-lime)',
                      color: 'var(--gs-lime)',
                      fontSize: 12,
                      fontFamily: 'var(--font-mono)',
                      letterSpacing: '0.08em',
                      zIndex: 2,
                    }}>
                      ANALYZING...
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {!loading && (
                <button
                  onClick={handleClear}
                  style={{
                    position: 'absolute', top: 10, right: 10,
                    width: 28, height: 28, borderRadius: '50%',
                    background: 'rgba(9,21,16,0.9)',
                    border: '1px solid var(--gs-border-bright)',
                    color: 'var(--gs-text-muted)',
                    cursor: 'pointer', fontSize: 16,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    lineHeight: 1,
                  }}
                >
                  ×
                </button>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="placeholder"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: 12, padding: 32, textAlign: 'center',
              }}
            >
              <motion.div
                animate={{ y: isDragActive ? -8 : 0 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <circle cx="24" cy="24" r="23" stroke="var(--gs-border-bright)" strokeWidth="1" strokeDasharray="4 3" />
                  <path d="M24 32V20M24 20L19 25M24 20L29 25" stroke="var(--gs-lime)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <rect x="15" y="33" width="18" height="2" rx="1" fill="var(--gs-border-bright)" />
                </svg>
              </motion.div>

              <div>
                <p style={{ color: 'var(--gs-text)', fontSize: 15, fontWeight: 600, marginBottom: 4 }}>
                  {isDragActive ? 'Drop your crop photo here' : 'Drop a leaf or crop image'}
                </p>
                <p style={{ color: 'var(--gs-text-muted)', fontSize: 13 }}>
                  JPEG, PNG, WebP — up to 10MB
                </p>
              </div>

              <div style={{
                padding: '6px 14px',
                borderRadius: 20,
                border: '1px solid var(--gs-border)',
                color: 'var(--gs-text-dim)',
                fontSize: 12,
                fontFamily: 'var(--font-mono)',
              }}>
                or click to browse
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Analyze button */}
      <AnimatePresence>
        {file && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            style={{ marginTop: 14 }}
          >
            <button
              onClick={handleAnalyze}
              className="btn-primary glow-lime"
              style={{ width: '100%', padding: '15px 20px', fontSize: 16, borderRadius: 12 }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M12 2a10 10 0 1 0 10 10" />
                <path d="M12 6v6l4 2" />
              </svg>
              Analyze Crop
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
