export const CONFIG = {
  // LLM API配置
  // LLM: {
  //   API_URL: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
  //   API_KEY: '8fc32e1a9271b44289837c592a951432.oKN1RxsUAAj4Rr4w',
  //   MODEL: 'glm-4-flash'
  // },
  LLM: {
    API_URL: 'https://api.chatanywhere.tech/v1/chat/completions',
    API_KEY: 'sk',
    MODEL: 'gpt-4o-mini'
  },
  // OpenAI TTS配置
  TTS: {
    API_URL: 'https://api.chatanywhere.tech/v1/audio/speech',
    API_KEY: 'sk',
    MODEL: 'tts-1',
    VOICE_CONFIGS: {
      'leo': {
        voice: 'onyx'  // 主持人声音
      },
      'kunkun': {
        voice: 'nova'  // 嘉宾声音
      }
    }
  },

  // 其他配置
  NEED_SECOND_DIALOGUE: true,
  OUTPUT_DIR: 'public/output',
  DELETE_ORIGINAL_AUDIO: true,  // 合并后是否删除原始音频文件
  
  // 测试模式配置
  TEST_MODE: {
    ENABLED: false,           // 是否启用测试模式
    MAX_DIALOGUES: 2         // 测试模式下的最大对话轮数
  }
} 