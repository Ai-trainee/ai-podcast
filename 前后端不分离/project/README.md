# AI 播客生成器

作者: Aitrainee
订阅: AI进修生·订阅频道|第一期
https://mp.weixin.qq.com/s/AytEhLFqmyTAIthng72UBw
## 项目概述

这是一个基于 Next.js 的 AI 播客生成器，可将文本转换为自然的播客音频。

### 核心特性

- 🎯 支持长文本输入和文件上传
- 🎨 简洁现代的用户界面
- 🎵 专业音频控制功能
- 📱 完整响应式设计
- 🔄 实时进度显示
- ⚡ 快速音频生成

## 技术栈

### 前端
- Next.js 14 (App Router)
- React 18 + TypeScript
- TailwindCSS
- Radix UI 组件库

### 后端
- Next.js API Routes
- Azure TTS 服务
- FFmpeg 音频处理

## 配置说明

项目配置文件位于 `src/lib/config.ts`，包含以下主要配置项：

### LLM配置
```typescript
LLM: {
  API_URL: 'https://api.chatanywhere.tech/v1/chat/completions', // LLM API地址
  API_KEY: 'your-api-key',  // API密钥
  MODEL: 'gpt-4o-mini'      // 使用的模型
}
```

### TTS配置
```typescript
TTS: {
  API_URL: 'https://api.chatanywhere.tech/v1/audio/speech', // TTS API地址
  API_KEY: 'your-api-key',  // API密钥
  MODEL: 'tts-1',           // TTS模型
  VOICE_CONFIGS: {
    'leo': {
      voice: 'onyx'         // 主持人声音
    },
    'kunkun': {
      voice: 'nova'         // 嘉宾声音
    }
  }
}
```

### 其他配置项
- `NEED_SECOND_DIALOGUE`: 是否需要第二轮对话
- `OUTPUT_DIR`: 音频输出目录
- `DELETE_ORIGINAL_AUDIO`: 合并后是否删除原始音频文件
- `TEST_MODE`: 测试模式配置
  - `ENABLED`: 是否启用测试模式
  - `MAX_DIALOGUES`: 测试模式下的最大对话轮数

使用步骤：
1. 复制 `src/lib/config.ts` 文件
2. 替换相应的 API 密钥
3. 根据需要调整其他配置项
4. 重启应用使配置生效

## 已实现功能

### 用户界面
- [x] 文本输入/文件上传
- [x] 生成进度显示
- [x] 音频播放控制
- [x] 错误处理与提示
- [x] 响应式布局

### 后端处理
- [x] 文本分段处理
- [x] 音频生成 API
- [x] 状态查询接口
- [ ] 文件管理系统

## 开发中功能

### 用户体验优化
- [ ] 前端优化播客显示（提升排版与可读性）
- [ ] 文本输入防抖
- [ ] 音频波形显示
- [ ] 生成历史记录
- [ ] 黑暗模式支持
- [ ] 快捷键操作
- [ ] 生成预览功能
- [ ] 自动生成字幕

### 音频处理增强
- [ ] 多音色选择
- [ ] 音频格式转换

### API 扩展
- [ ] WebSocket 接口
- [ ] 音频分析 API
- [ ] 转码服务 API

### 系统功能
- [ ] 用户认证系统
- [ ] 生成配额管理
- [ ] 文件自动清理
- [ ] API 访问控制
- [ ] 项目管理功能
- [ ] 数据分析功能
- [ ] 团队协作支持

## 使用指南

### 环境要求
- Node.js >= 18
- FFmpeg
- Azure 账号与 API 密钥

### 安装步骤
1. 克隆仓库
