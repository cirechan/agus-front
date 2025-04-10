"use client"

import React, { useEffect, useState } from 'react'
import { useApi } from '@/lib/api/context'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function ApiStatusChecker() {
  const { apiStatus, checkApiStatus, isLoading } = useApi()
  const [showStatus, setShowStatus] = useState(false)

  useEffect(() => {
    // Mostrar el estado solo si hay un problema
    if (apiStatus.status === 'offline') {
      setShowStatus(true)
    }
  }, [apiStatus])

  if (!showStatus) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      <Alert 
        variant={apiStatus.status === 'online' ? 'default' : 'destructive'}
        className="animate-in fade-in slide-in-from-bottom-5"
      >
        {apiStatus.status === 'online' ? (
          <CheckCircle2 className="h-4 w-4" />
        ) : (
          <AlertCircle className="h-4 w-4" />
        )}
        <AlertTitle>
          {apiStatus.status === 'online' 
            ? 'Conexión establecida' 
            : 'Problema de conexión'}
        </AlertTitle>
        <AlertDescription>
          {apiStatus.message}
          <div className="mt-2 flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => checkApiStatus()}
              disabled={isLoading}
            >
              Reintentar
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowStatus(false)}
            >
              Cerrar
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  )
}
