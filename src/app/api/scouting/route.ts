import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

const dataFile = path.join(process.cwd(), 'src', 'data', 'scouting.json')

async function readData() {
  try {
    const data = await fs.readFile(dataFile, 'utf-8')
    return JSON.parse(data)
  } catch {
    return []
  }
}

async function writeData(data: any) {
  await fs.writeFile(dataFile, JSON.stringify(data, null, 2))
}

export async function GET() {
  const data = await readData()
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const newItem = await request.json()
  const data = await readData()
  const item = { id: Date.now().toString(), ...newItem }
  data.push(item)
  await writeData(data)
  return NextResponse.json(item, { status: 201 })
}

export async function PUT(request: Request) {
  const updated = await request.json()
  const data = await readData()
  const index = data.findIndex((item: any) => item.id === updated.id)
  if (index === -1) {
    return NextResponse.json({ message: 'Not found' }, { status: 404 })
  }
  data[index] = { ...data[index], ...updated }
  await writeData(data)
  return NextResponse.json(data[index])
}

export async function DELETE(request: Request) {
  const { id } = await request.json()
  let data = await readData()
  const index = data.findIndex((item: any) => item.id === id)
  if (index === -1) {
    return NextResponse.json({ message: 'Not found' }, { status: 404 })
  }
  const removed = data[index]
  data = data.filter((item: any) => item.id !== id)
  await writeData(data)
  return NextResponse.json(removed)
}
