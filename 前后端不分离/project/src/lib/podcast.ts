/**
 * AI 
 * @author Aitrainee
 * @subscribe AI  
 *            https://mp.weixin.qq.com/s/AytEhLFqmyTAIthng72UBw
 */

import { v4 as uuidv4 } from 'uuid'
import { CONFIG } from './config'
import path from 'path'
import fs from 'fs'
import ffmpeg from 'fluent-ffmpeg'

// 类型定义
interface Dialogue {
  role: 'host' | 'guest'
  content: string
}

interface TaskStatus {
  taskId: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: string
  audioUrl?: string
  error?: string
  dialogues?: Dialogue[]
}

// 任务状态存储
const taskStatuses = new Map<string, TaskStatus>()

// 生成对话内容
async function generateDialogue(text: string): Promise<Dialogue[]> {
  const response = await fetch(CONFIG.LLM.API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${CONFIG.LLM.API_KEY}`
    },
    body: JSON.stringify({
      model: CONFIG.LLM.MODEL,
      messages: [
        {
          role: 'system',
          content: `你是一个播客对话内容生成器。请将输入的内容转换为主持人(host)和嘉宾(guest)的对话形式。
要求：
1. 对话要自然、口语化，避免简单的问答形式
2. 开场需要欢迎语和主题引入
3. ${CONFIG.TEST_MODE.ENABLED 
    ? `测试模式：生成${CONFIG.TEST_MODE.MAX_DIALOGUES}轮对话（每轮包含主持人和嘉宾各一句话）` 
    : '内容要丰富，总字数大于1000字'}
4. 严格按照以下JSON格式输出，不要有任何其他内容：
[
  {"role":"host","content":"欢迎大家收听本期播客"},
  {"role":"guest","content":"谢谢邀请"}
]
注意：
1. content字段的内容必须使用双引号
2. 所有引号必须是英文双引号
3. 不要使用任何中文标点符号
4. 不要在JSON中添加任何注释或格式标记`
        },
        {
          role: 'user',
          content: `请将以下内容转换成播客对话:\n${text}`
        }
      ]
    })
  })

  if (!response.ok) {
    throw new Error(`LLM API 请求失败: ${response.status}`)
  }

  const data = await response.json()
  
  try {
    let content = data.choices[0].message.content.trim()
    
    // 尝试修复常见的JSON格式问题
    content = content
      .replace(/```json\s*/g, '')  // 移除 ```json
      .replace(/```\s*/g, '')      // 移除 ```
      .replace(/\n/g, '')          // 移除换行
      .replace(/，/g, ',')         // 修复中文逗号
      .replace(/：/g, ':')         // 修复中文冒号
      .replace(/"/g, '"')          // 修复中文引号
      .replace(/"/g, '"')          // 修复中文引号
      .replace(/「/g, '"')         // 修复其他引号
      .replace(/」/g, '"')         // 修复其他引号
      .replace(/'/g, '"')          // 修复单引号
      .replace(/'\)/g, '"')        // 修复带括号的引号
      .replace(/"\)/g, '"')        // 修复带括号的引号
      .replace(/"\s*,\s*}/g, '"}') // 修复逗号和大括号之间的空格
      .replace(/"\s*}/g, '"}')     // 修复引号和大括号之间的空格
      .replace(/}\s*,\s*/g, '},')  // 修复对象之间的空格
      .replace(/\s*]/g, ']')       // 修复数组结尾的空格
      .replace(/\s*{/g, '{')       // 修复对象开始的空格
      .trim()
    
    // 如果不是以 [ 开头，尝试找到第一个 [
    if (!content.startsWith('[')) {
      const start = content.indexOf('[')
      if (start !== -1) {
        content = content.slice(start)
      }
    }
    
    // 如果不是以 ] 结尾，尝试找到最后一个 ]
    if (!content.endsWith(']')) {
      const end = content.lastIndexOf(']')
      if (end !== -1) {
        content = content.slice(0, end + 1)
      }
    }

    console.log('处理后的JSON字符串:', content)
    
    // 尝试解析JSON
    let dialogue
    try {
      dialogue = JSON.parse(content)
    } catch (parseError) {
      // 如果解析失败，尝试进一步修复
      content = content
        .replace(/"\),/g, '",')    // 移除多余的右括号和逗号
        .replace(/"\)}/g, '"}')    // 移除多余的右括号和大括号
        .replace(/"\)]/g, '"}]')   // 移除多余的右括号和数组结尾
        .replace(/\\/g, '')        // 移除转义字符
        .replace(/([{,]\s*)(\w+):/g, '$1"$2":')  // 修复没有引号的属性名
      
      console.log('进一步修复后的JSON字符串:', content)
      dialogue = JSON.parse(content)
    }
    
    // 验证对话格式
    if (!Array.isArray(dialogue)) {
      throw new Error('对话内容必须是数组')
    }
    
    // 验证每条对话的格式
    dialogue.forEach((item, index) => {
      if (!item.role || !item.content) {
        throw new Error(`第 ${index + 1} 条对话缺少必要字段`)
      }
      if (item.role !== 'host' && item.role !== 'guest') {
        throw new Error(`第 ${index + 1} 条对话的角色必须是 host 或 guest`)
      }
    })
    
    // 在验证对话格式后，如果是测试模式，限制对话轮数
    if (CONFIG.TEST_MODE.ENABLED && dialogue.length > CONFIG.TEST_MODE.MAX_DIALOGUES * 2) {
      dialogue = dialogue.slice(0, CONFIG.TEST_MODE.MAX_DIALOGUES * 2)
      console.log(`[测试模式] 对话已截断至 ${CONFIG.TEST_MODE.MAX_DIALOGUES} 轮`)
    }
    
    return dialogue
  } catch (error) {
    console.error('解析对话内容失败:', error)
    console.error('原始内容:', data.choices[0].message.content)
    throw new Error('生成的对话内容格式不正确')
  }
}

// 生成音频
async function generateAudio(dialogue: Dialogue, taskId: string, index: number): Promise<string> {
  const speaker = dialogue.role === 'host' ? 'leo' : 'kunkun'
  const voiceConfig = CONFIG.TTS.VOICE_CONFIGS[speaker]

  console.log(`[TTS] 开始为第 ${index + 1} 条对话生成音频，角色: ${speaker}`)
  console.log(`[TTS] 对话内容: ${dialogue.content.slice(0, 50)}...`)

  try {
    // 请求生成音频
    console.log('[TTS] 发送请求到 OpenAI TTS API')
    const response = await fetch(CONFIG.TTS.API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CONFIG.TTS.API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: CONFIG.TTS.MODEL,
        input: dialogue.content,
        voice: voiceConfig.voice,
        response_format: 'mp3'
      })
    })

    if (!response.ok) {
      console.error(`[TTS] API请求失败: ${response.status}`)
      console.error('[TTS] 响应内容:', await response.text())
      throw new Error(`OpenAI TTS API 请求失败: ${response.status}`)
    }

    console.log('[TTS] 成功接收音频数据')
    
    // 获取音频数据
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    // 保存音频文件
    const outputDir = path.join(process.cwd(), CONFIG.OUTPUT_DIR, taskId)
    fs.mkdirSync(outputDir, { recursive: true })
    
    const outputPath = path.join(outputDir, `${index.toString().padStart(4, '0')}_${dialogue.role}.mp3`)
    fs.writeFileSync(outputPath, buffer)
    
    console.log(`[TTS] 音频文件已保存: ${outputPath}`)
    console.log(`[TTS] 文件大小: ${buffer.length} 字节`)
    
    return outputPath
  } catch (error) {
    console.error('[TTS] 生成音频失败:', error)
    throw error
  }
}

// 合并音频文件
async function mergeAudioFiles(audioFiles: string[], taskId: string): Promise<string> {
  console.log('[合并] 开始合并音频文件')
  console.log('[合并] 待合并文件列表:', audioFiles)

  return new Promise((resolve, reject) => {
    const outputFile = `${taskId}.mp3`
    const outputPath = path.join(process.cwd(), CONFIG.OUTPUT_DIR, taskId, outputFile)
    console.log('[合并] 输出文件路径:', outputPath)

    // 创建合并文件列表
    const listPath = path.join(process.cwd(), CONFIG.OUTPUT_DIR, taskId, 'list.txt')
    const fileList = audioFiles.map(file => `file '${file}'`).join('\n')
    fs.writeFileSync(listPath, fileList)
    console.log('[合并] 创建文件列表:', listPath)
    console.log('[合并] 文件列表内容:\n', fileList)

    // 使用 fluent-ffmpeg 合并音频
    console.log('[合并] 开始执行 FFmpeg 命令')
    ffmpeg()
      .input(listPath)
      .inputOptions(['-f', 'concat', '-safe', '0'])
      .outputOptions([
        '-c:a', 'libmp3lame',
        '-q:a', '2'
      ])
      .on('start', (command) => {
        console.log('[合并] FFmpeg 命令:', command)
      })
      .on('progress', (progress) => {
        console.log('[合并] 处理进度:', progress)
      })
      .on('end', () => {
        console.log('[合并] 音频合并完成')
        // 清理临时文件
        fs.unlinkSync(listPath)
        console.log('[合并] 已删除临时文件列表')
        
        if (CONFIG.DELETE_ORIGINAL_AUDIO) {
          audioFiles.forEach(file => {
            fs.unlinkSync(file)
            console.log('[合并] 已删除原始音频文件:', file)
          })
        }
        
        // 验证输出文件
        if (fs.existsSync(outputPath)) {
          const stats = fs.statSync(outputPath)
          console.log('[合并] 最终文件大小:', stats.size, '字节')
          resolve(outputFile)
        } else {
          reject(new Error('合并后的文件不存在'))
        }
      })
      .on('error', (err) => {
        console.error('[合并] 音频合并失败:', err)
        console.error('[合并] 错误详情:', err.message)
        reject(new Error('音频合并失败: ' + err.message))
      })
      .save(outputPath)
  })
}

// 导出的主函数
export async function generatePodcast(text: string): Promise<string> {
  const taskId = uuidv4()
  
  // 初始化任务状态
  taskStatuses.set(taskId, {
    taskId,
    status: 'pending',
    progress: '初始化任务'
  })
  
  // 异步处理任务
  processPodcast(taskId, text)
  
  return taskId
}

// 异步处理播客生成
async function processPodcast(taskId: string, text: string) {
  console.log(`[任务${taskId}] 开始处理`)
  
  try {
    // 更新状态为处理中
    taskStatuses.set(taskId, {
      taskId,
      status: 'processing',
      progress: '正在生成对话内容'
    })
    
    // 生成对话内容
    console.log(`[任务${taskId}] 开始生成对话内容`)
    const dialogues = await generateDialogue(text)
    console.log(`[任务${taskId}] 成功生成对话内容，共 ${dialogues.length} 条对话`)
    
    // 更新状态包含对话内容
    taskStatuses.set(taskId, {
      taskId,
      status: 'processing',
      progress: '正在生成音频',
      dialogues
    })
    
    // 生成音频文件
    const audioFiles = []
    for (let i = 0; i < dialogues.length; i++) {
      taskStatuses.set(taskId, {
        taskId,
        status: 'processing',
        progress: `正在生成第 ${i + 1}/${dialogues.length} 个音频片段`,
        dialogues
      })
      
      console.log(`[任务${taskId}] 开始生成第 ${i + 1} 个音频片段`)
      const audioFile = await generateAudio(dialogues[i], taskId, i)
      audioFiles.push(audioFile)
      console.log(`[任务${taskId}] 第 ${i + 1} 个音频片段生成完成`)
    }
    
    // 合并音频文件
    taskStatuses.set(taskId, {
      taskId,
      status: 'processing',
      progress: '正在合并音频文件'
    })
    
    console.log(`[任务${taskId}] 开始合并音频文件`)
    const finalAudio = await mergeAudioFiles(audioFiles, taskId)
    console.log(`[任务${taskId}] 音频文件合并完成`)
    
    // 更新状态为完成
    taskStatuses.set(taskId, {
      taskId,
      status: 'completed',
      progress: '生成完成',
      audioUrl: `/output/${taskId}/${finalAudio}`,
      dialogues
    })
    
    console.log(`[任务${taskId}] 处理完成，音频URL: /output/${taskId}/${finalAudio}`)
    
  } catch (error: any) {
    console.error(`[任务${taskId}] 处理失败:`, error)
    taskStatuses.set(taskId, {
      taskId,
      status: 'failed',
      progress: '处理失败',
      error: error.message || '未知错误'
    })
  }
}

// 获取任务状态
export function getTaskStatus(taskId: string): TaskStatus | undefined {
  return taskStatuses.get(taskId)
} 