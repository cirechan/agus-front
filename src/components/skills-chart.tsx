"use client"

import * as React from "react"
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

interface SkillsChartProps {
  data: {
    name: string;
    value: number;
    fullMark: number;
  }[];
  title?: string;
  description?: string;
  footer?: React.ReactNode;
}

export function SkillsChart({ 
  data, 
  title = "Aptitudes del Jugador", 
  description = "Valoración en escala de 1 a 5",
  footer
}: SkillsChartProps) {
  return (
    <Card>
      <CardHeader className="items-center">
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-0">
        <div className="mx-auto aspect-square max-h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
              <PolarGrid />
              <PolarAngleAxis dataKey="name" />
              <Radar
                name="Aptitudes"
                dataKey="value"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary))"
                fillOpacity={0.6}
                dot={{
                  r: 4,
                  fillOpacity: 1,
                  fill: "hsl(var(--primary))",
                  stroke: "hsl(var(--primary))"
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
      {footer && (
        <CardFooter className="flex-col gap-2 text-sm">
          {footer}
        </CardFooter>
      )}
    </Card>
  )
}
