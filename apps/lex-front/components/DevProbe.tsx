'use client'
import { useEffect } from 'react'
export default function DevProbe() {
  useEffect(() => { console.log('[DEV] HYDRATED') }, [])
  return null
}
