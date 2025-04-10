"use client"

import { ApiProvider } from '@/lib/api/context'
import { ApiStatusChecker } from '@/components/api-status-checker'

export function Providers({ children }) {
  return (
    <ApiProvider>
      {children}
      <ApiStatusChecker />
    </ApiProvider>
  )
}
