'use client'

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts'

interface Props {
  data: {
    tecnica: number
    tactica: number
    fisica: number
    mental: number
  }
}

export function PlayerRadarChart({ data }: Props) {
  const chartData = [
    { subject: 'Técnica', value: data.tecnica },
    { subject: 'Táctica', value: data.tactica },
    { subject: 'Física', value: data.fisica },
    { subject: 'Mental', value: data.mental },
  ]

  return (
    <ResponsiveContainer width="100%" height={250}>
      <RadarChart data={chartData} cx="50%" cy="50%" outerRadius="80%">
        <PolarGrid />
        <PolarAngleAxis dataKey="subject" />
        <PolarRadiusAxis domain={[0, 5]} />
        <Radar dataKey="value" stroke="#206C4D" fill="#206C4D" fillOpacity={0.6} />
      </RadarChart>
    </ResponsiveContainer>
  )
}
