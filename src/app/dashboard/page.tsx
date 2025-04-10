"use client"

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, CheckCircle, Trophy, Target } from "lucide-react"

export default function DashboardPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold tracking-tight mb-6">Dashboard</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jugadores</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45</div>
            <p className="text-xs text-muted-foreground">
              Total de jugadores
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Asistencia</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">85%</div>
            <p className="text-xs text-muted-foreground">
              Promedio de asistencia
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valoración</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3.8</div>
            <p className="text-xs text-muted-foreground">
              Valoración media
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Objetivos</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">65%</div>
            <p className="text-xs text-muted-foreground">
              Objetivos cumplidos
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Equipos</CardTitle>
            <CardDescription>
              Listado de equipos del Club San Agustín
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {[
                { nombre: "Alevín A", categoria: "1ª Alevín", jugadores: 15 },
                { nombre: "Infantil B", categoria: "2ª Infantil", jugadores: 18 },
                { nombre: "Cadete A", categoria: "1ª Cadete", jugadores: 12 },
                { nombre: "Juvenil A", categoria: "División de Honor", jugadores: 20 }
              ].map((equipo, index) => (
                <Card key={index} className="cursor-pointer hover:bg-muted/50">
                  <CardHeader className="p-4">
                    <CardTitle className="text-base">{equipo.nombre}</CardTitle>
                    <CardDescription>{equipo.categoria}</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <p className="text-sm">{equipo.jugadores} jugadores</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Próximos eventos</CardTitle>
            <CardDescription>
              Calendario de eventos próximos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { fecha: "12/04/2025", evento: "Partido Alevín A vs. CD Leganés", hora: "10:00" },
                { fecha: "13/04/2025", evento: "Partido Infantil B vs. Rayo Vallecano", hora: "11:30" },
                { fecha: "15/04/2025", evento: "Entrenamiento especial Cadete A", hora: "17:00" },
                { fecha: "18/04/2025", evento: "Reunión técnica entrenadores", hora: "19:00" }
              ].map((evento, index) => (
                <div key={index} className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{evento.evento}</p>
                    <p className="text-sm text-muted-foreground">{evento.fecha} - {evento.hora}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
