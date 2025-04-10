"use client"

import { ApiProvider } from '@/lib/api/context'
import ApiStatusChecker from '@/components/api-status-checker'
import { ReactNode } from 'react'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ApiProvider>
      {children}
      <ApiStatusChecker />
    </ApiProvider>
  )
}
