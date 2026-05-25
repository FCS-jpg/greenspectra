import { supabase } from './supabase'

const API_URL = import.meta.env.VITE_API_URL

async function getAuthHeader() {
  let { data: { session } } = await supabase.auth.getSession()

  // If token is missing or expired, attempt a silent refresh once
  if (!session?.access_token) {
    const { data: refreshed } = await supabase.auth.refreshSession()
    session = refreshed.session
  }

  if (!session?.access_token) throw new Error('Not authenticated — please sign in again.')
  return { Authorization: `Bearer ${session.access_token}` }
}

async function parseError(response, fallback) {
  try {
    const body = await response.json()
    return body.detail || body.message || fallback
  } catch {
    return fallback
  }
}

export async function diagnoseCrop(imageFile) {
  const headers = await getAuthHeader()
  const formData = new FormData()
  formData.append('file', imageFile)

  const response = await fetch(`${API_URL}/api/diagnose`, {
    method: 'POST',
    headers,
    body: formData,
  })

  if (!response.ok) {
    const msg = await parseError(response, `Diagnosis failed (${response.status})`)
    throw new Error(msg)
  }
  return response.json()
}

export async function getHistory() {
  const headers = await getAuthHeader()
  const response = await fetch(`${API_URL}/api/history`, { headers })

  if (!response.ok) {
    const msg = await parseError(response, `Failed to load history (${response.status})`)
    throw new Error(msg)
  }
  return response.json()
}

export async function getDemoDiagnosis(imageName) {
  let headers = {}
  try {
    headers = await getAuthHeader()
  } catch {
    // Demo endpoint is public — proceed without auth if no session exists
  }

  const response = await fetch(`${API_URL}/api/demo/${encodeURIComponent(imageName)}`, { headers })
  if (!response.ok) {
    const msg = await parseError(response, `Demo not found: ${imageName}`)
    throw new Error(msg)
  }
  return response.json()
}
