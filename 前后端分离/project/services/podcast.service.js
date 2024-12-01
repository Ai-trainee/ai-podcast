const podcastConfig = require('../config/podcast.config');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const FormData = require('form-data');
const ffmpegConfig = require('../config/ffmpeg.config');

class PodcastService {
  constructor() {
    this.baseUrl = podcastConfig.api.baseUrl;
    this.endpoints = podcastConfig.api.endpoints;
    this.taskStatuses = new Map();
  }

  // 文本转播客
  async generateFromText(text) {
    try {
      const taskId = uuidv4();
      
      // 更新任务状态
      this.taskStatuses.set(taskId, {
        taskId,
        status: 'processing',
        progress: '正在生成对话内容'
      });

      // 生成对话内容
      const dialogue = await this.generateDialogue(text);
      
      // 更新状态
      this.taskStatuses.set(taskId, {
        taskId,
        status: 'processing',
        progress: '正在生成音频'
      });

      // 生成音频文件
      const audioFiles = await this.generateAudio(dialogue, taskId);
      
      // 更新状态
      this.taskStatuses.set(taskId, {
        taskId,
        status: 'processing',
        progress: '正在合并音频'
      });

      // 合并音频文件
      const outputPath = path.join(process.cwd(), podcastConfig.output.dir, taskId, `${taskId}.mp3`);
      await this.mergeAudioFiles(audioFiles, outputPath);

      // 更新状态为完成
      this.taskStatuses.set(taskId, {
        taskId,
        status: 'completed',
        progress: '处理完成',
        audioUrl: `/output/${taskId}/${taskId}.mp3`
      });

      return taskId;
    } catch (error) {
      console.error('生成播客失败:', error);
      throw error;
    }
  }

  // 文件上传转播客
  async generateFromFile(file) {
    try {
      const content = await this.processUploadedFile(file);
      return this.generateFromText(content);
    } catch (error) {
      console.error('处理上传文件失败:', error);
      throw error;
    }
  }

  // 获取任务状态
  getTaskStatus(taskId) {
    return this.taskStatuses.get(taskId);
  }

  // 处理上传的文件
  async processUploadedFile(file) {
    try {
      const content = await fs.readFile(file.path, 'utf-8');
      await fs.unlink(file.path); // 清理临时文件
      return content.trim();
    } catch (error) {
      console.error('处理文件失败:', error);
      throw error;
    }
  }

  // 生成对话内容
  async generateDialogue(text) {
    try {
      console.log('开始生成对话，API配置:', {
        url: `${this.baseUrl}${this.endpoints.generate}`,
        model: podcastConfig.llm.model,
        maxTurns: podcastConfig.dialogue.maxTurns
      });

      const response = await fetch(`${this.baseUrl}${this.endpoints.generate}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${podcastConfig.llm.apiKey}`
        },
        body: JSON.stringify({
          model: podcastConfig.llm.model,
          messages: [
            {
              role: 'system',
              content: `你是一个播客对话内容生成器。请将输入的内容转换为主持人(host)和嘉宾(guest)的对话形式。
要求：
1. 对话要自然、口语化，避免简单的问答形式
2. 开场需要欢迎语和主题引入
3. ${podcastConfig.dialogue.maxTurns === 2 
    ? '测试模式：生成2轮对话' 
    : `内容要丰富，总字数大于${podcastConfig.dialogue.minWords}字`}
4. 严格按照以下格式输出：
主持人：欢迎大家收听本期播客
嘉宾：谢谢邀请
主持人：今天我们要讨论的话题是...
嘉宾：是的，这个话题很有意思...`
            },
            {
              role: 'user',
              content: `请将以下内容转换成播客对话:\n${text}`
            }
          ],
          temperature: 0.7,
          max_tokens: 2000
        })
      });

      if (!response.ok) {
        console.error('API响应错误:', {
          status: response.status,
          statusText: response.statusText
        });
        const errorText = await response.text();
        console.error('错误详情:', errorText);
        throw new Error(`生成对话失败: ${response.status}`);
      }

      const data = await response.json();
      console.log('API响应成功:', data);
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        console.error('API响应格式错误:', data);
        throw new Error('API响应格式错误');
      }

      // 解析对话并限制轮数
      const dialogues = this.parseDialogues(data.choices[0].message.content);
      if (dialogues.length > podcastConfig.dialogue.maxTurns * 2) { // 每轮包含主持人和嘉宾各一句
        console.log(`对话轮数超过限制，从 ${dialogues.length/2} 轮裁剪到 ${podcastConfig.dialogue.maxTurns} 轮`);
        return dialogues.slice(0, podcastConfig.dialogue.maxTurns * 2);
      }

      return dialogues;
    } catch (error) {
      console.error('生成对话失败:', error);
      throw error;
    }
  }

  // 解析对话内容
  parseDialogues(text) {
    try {
      const lines = text.split('\n').filter(line => line.trim());
      const dialogues = [];
      
      for (const line of lines) {
        const hostMatch = line.match(/^(主持人|host)[:：](.*)/i);
        const guestMatch = line.match(/^(嘉宾|guest)[:：](.*)/i);
        
        if (hostMatch) {
          dialogues.push({
            role: 'host',
            content: hostMatch[2].trim()
          });
        } else if (guestMatch) {
          dialogues.push({
            role: 'guest',
            content: guestMatch[2].trim()
          });
        }
      }
      
      return dialogues;
    } catch (error) {
      console.error('解析对话内容失败:', error);
      throw new Error('解析对话内容失败: ' + error.message);
    }
  }

  // 生成音频
  async generateAudio(dialogue, taskId) {
    try {
      const outputDir = path.join(process.cwd(), podcastConfig.output.dir, taskId);
      await fs.mkdir(outputDir, { recursive: true });
      
      const audioFiles = [];
      
      for (let i = 0; i < dialogue.length; i++) {
        const item = dialogue[i];
        const response = await fetch(`${this.baseUrl}${this.endpoints.upload}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${podcastConfig.tts.apiKey}`
          },
          body: JSON.stringify({
            model: podcastConfig.tts.model,
            input: item.content,
            voice: podcastConfig.tts.voices[item.role]
          })
        });

        if (!response.ok) {
          throw new Error(`生成音频失败: ${response.status}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const audioPath = path.join(outputDir, `${i}.mp3`);
        await fs.writeFile(audioPath, Buffer.from(arrayBuffer));
        audioFiles.push(audioPath);
      }

      return audioFiles;
    } catch (error) {
      console.error('生成音频失败:', error);
      throw error;
    }
  }

  // 合并音频文件
  async mergeAudioFiles(audioFiles, outputPath) {
    try {
      if (audioFiles.length === 0) {
        throw new Error('没有音频文件需要合并');
      }

      // 创建合并文件列表
      const listPath = path.join(path.dirname(outputPath), 'list.txt');
      const fileList = audioFiles.map(file => `file '${path.resolve(file)}'`).join('\n');
      
      console.log('准备合并音频文件:', {
        audioFiles,
        outputPath,
        listPath,
        fileList
      });
      
      await fs.writeFile(listPath, fileList);

      // 使用 ffmpeg 合并音频
      await new Promise((resolve, reject) => {
        const ffmpeg = require('fluent-ffmpeg');
        const command = ffmpeg();

        // 添加输入文件
        command
          .input(listPath)
          .inputOptions(['-f', 'concat', '-safe', '0'])
          .outputOptions([
            `-c:a`, podcastConfig.ffmpeg.audioOptions.codec,
            `-q:a`, podcastConfig.ffmpeg.audioOptions.quality,
            `-ar`, podcastConfig.ffmpeg.audioOptions.sampleRate,
            `-ac`, podcastConfig.ffmpeg.audioOptions.channels
          ])
          .on('start', cmdline => {
            console.log('开始执行 FFmpeg 命令:', cmdline);
          })
          .on('progress', progress => {
            console.log('合并进度:', progress);
          })
          .on('error', (err, stdout, stderr) => {
            console.error('FFmpeg 错误:', err);
            console.error('FFmpeg stderr:', stderr);
            reject(err);
          })
          .on('end', () => {
            console.log('音频合并完成:', outputPath);
            resolve();
          })
          .save(outputPath);
      });

      // 验证输出文件是否存在
      const stats = await fs.stat(outputPath);
      console.log('合并后的文件信息:', {
        size: stats.size,
        path: outputPath
      });

      // 清理临时文件
      await fs.unlink(listPath);
      if (podcastConfig.output.deleteOriginal) {
        console.log('清理临时音频文件...');
        await Promise.all(audioFiles.map(file => fs.unlink(file)));
      }

      return outputPath;
    } catch (error) {
      console.error('合并音频失败:', error);
      throw error;
    }
  }

  // 获取用户的播客列表
  async getUserPodcasts(userId) {
    try {
      // TODO: 从数据库获取用户的播客列表
      // 这里暂时返回内存中的数据
      const userPodcasts = Array.from(this.taskStatuses.values())
        .filter(task => task.userId === userId)
        .map(task => ({
          taskId: task.taskId,
          status: task.status,
          progress: task.progress,
          audioUrl: task.audioUrl,
          createdAt: task.createdAt
        }));
      return userPodcasts;
    } catch (error) {
      console.error('获取用户播客列表失败:', error);
      throw error;
    }
  }

  // 删除播客
  async deletePodcast(taskId, userId) {
    try {
      const task = this.taskStatuses.get(taskId);
      if (!task) {
        throw new Error('播客不存在');
      }
      
      // TODO: 检查权限
      // if (task.userId !== userId) {
      //   throw new Error('无权限删除此播客');
      // }

      // 删除音频文件
      const outputDir = path.join(process.cwd(), podcastConfig.output.dir, taskId);
      await fs.rm(outputDir, { recursive: true, force: true });

      // 从状态映射中删除
      this.taskStatuses.delete(taskId);
    } catch (error) {
      console.error('删除播客失败:', error);
      throw error;
    }
  }
}

module.exports = new PodcastService(); 