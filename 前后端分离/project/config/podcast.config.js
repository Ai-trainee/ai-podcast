const path = require('path');

// 直接使用项目中的 FFmpeg
const FFMPEG_DIR = path.join(process.cwd(), 'ffmpeg', 'bin');

module.exports = {
  // API 配置
  api: {
    baseUrl: process.env.LLM_API_URL.split('/v1')[0],
    endpoints: {
      generate: '/v1/chat/completions',
      upload: '/v1/audio/speech',
      status: '/v1/status'
    }
  },
  llm: {
    apiKey: process.env.LLM_API_KEY,
    model: process.env.LLM_MODEL || 'gpt-4o-mini'
  },
  tts: {
    apiKey: process.env.TTS_API_KEY,
    model: process.env.TTS_MODEL || 'tts-1',
    voices: {
      host: 'onyx',
      guest: 'nova'
    }
  },
  // FFmpeg 配置
  ffmpeg: {
    path: path.join(FFMPEG_DIR, 'ffmpeg.exe'),
    probe: path.join(FFMPEG_DIR, 'ffprobe.exe'),
    audioOptions: {
      codec: 'libmp3lame',    // 使用 MP3 编码器
      quality: 2,             // 音质设置 (0-9, 2 是较好的质量)
      sampleRate: 44100,      // 采样率
      channels: 2             // 双声道
    }
  },
  // 对话生成配置
  dialogue: {
    maxTurns: process.env.TEST_MODE === 'true' ? 2 : 10, // 测试模式下只生成2轮对话
    minWords: process.env.TEST_MODE === 'true' ? 50 : 1000 // 测试模式下最少50字
  },
  // 输出配置
  output: {
    dir: 'public/output',
    deleteOriginal: true
  }
}; 