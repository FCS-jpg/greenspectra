import { useState } from 'react'
import { diagnoseCrop } from '../lib/api'

export function useDiagnosis() {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function diagnose(imageFile) {
    setLoading(true)
    setError(null)
    try {
      const data = await diagnoseCrop(imageFile)
      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return { result, loading, error, diagnose }
}
