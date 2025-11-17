'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function TestPage() {
  const [rows, setRows] = useState<any[]>([])
  const [err, setErr] = useState('')

  useEffect(() => {
    supabase
      .from('todos')
      .select('*')
      .then(({ data, error }) => {
        if (error) setErr(error.message)
        else setRows(data || [])
      })
  }, [])

  if (err) return <p style={{color:'red'}}>❌ {err}</p>
  return <pre>{JSON.stringify(rows, null, 2)}</pre>
}