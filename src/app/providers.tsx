import { ApiProvider } from '@/lib/api/context'
import { ReactNode } from 'react'

export function Providers({ children }: { children: ReactNode }) {
  return <ApiProvider>{children}</ApiProvider>
}
