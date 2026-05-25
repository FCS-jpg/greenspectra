import { useState, useEffect } from 'react'

export function useMobile(bp = 768) {
  const [mob, setMob] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < bp : false
  )
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${bp - 1}px)`)
    setMob(mq.matches)
    const h = (e) => setMob(e.matches)
    mq.addEventListener('change', h)
    return () => mq.removeEventListener('change', h)
  }, [bp])
  return mob
}
