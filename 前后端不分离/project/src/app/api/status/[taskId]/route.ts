import { NextResponse } from 'next/server'
import { getTaskStatus } from '@/lib/podcast'

export async function GET(
  request: Request,
  { params }: { params: { taskId: string } }
) {
  try {
    const status = await getTaskStatus(params.taskId)
    
    // 确保返回完整的状态数据
    return NextResponse.json({
      status: status?.status || 'failed',
      progress: status?.progress || '获取状态失败',
      audioUrl: status?.audioUrl,
      error: status?.error
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({
      status: 'failed',
      progress: '获取任务状态失败',
      error: error instanceof Error ? error.message : '未知错误'
    })
  }
} 