import { NextResponse } from 'next/server'
import { generatePodcast } from '@/lib/podcast'

export async function POST(request: Request) {
  try {
    const { text } = await request.json()
    const taskId = await generatePodcast(text)
    
    return NextResponse.json({ taskId })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: '生成播客时发生错误' },
      { status: 500 }
    )
  }
} 