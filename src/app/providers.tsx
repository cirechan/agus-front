"use client"

import { ApiProvider } from '@/lib/api/context'
import { LocalDataProvider } from '@/lib/local-data-provider'
import ApiStatusChecker from '@/components/api-status-checker'
import { ReactNode } from 'react'

export function Providers({ children }: { children: ReactNode }) {
  const dataSource = process.env.NEXT_PUBLIC_DATA_SOURCE
  if (dataSource === 'local') {
    return <LocalDataProvider>{children}</LocalDataProvider>
  }
  return (
    <ApiProvider>
      {children}
      <ApiStatusChecker />
    </ApiProvider>
  )
}
