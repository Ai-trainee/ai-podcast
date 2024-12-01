const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const { execSync } = require('child_process');

async function findSystemFFmpeg() {
  try {
    const ffmpegPath = execSync('where ffmpeg').toString().trim().split('\n')[0];
    const ffprobePath = path.join(path.dirname(ffmpegPath), 'ffprobe.exe');
    
    if (fs.existsSync(ffmpegPath) && fs.existsSync(ffprobePath)) {
      return { ffmpegPath, ffprobePath };
    }
  } catch (error) {
    console.log('系统中未找到 FFmpeg');
  }
  return null;
}

async function setupFFmpeg() {
  const binDir = path.join(process.cwd(), 'ffmpeg', 'bin');
  const localFfmpegPath = path.join(binDir, 'ffmpeg.exe');
  const localFfprobePath = path.join(binDir, 'ffprobe.exe');
  
  try {
    console.log('检查 FFmpeg 文件...');

    // 确保目录存在
    if (!fs.existsSync(binDir)) {
      fs.mkdirSync(binDir, { recursive: true });
    }

    // 如果本地文件不存在，尝试从系统复制
    if (!fs.existsSync(localFfmpegPath) || !fs.existsSync(localFfprobePath)) {
      console.log('本地 FFmpeg 文件不完整，尝试从系统复制...');
      
      const systemPaths = await findSystemFFmpeg();
      if (systemPaths) {
        console.log('找到系统 FFmpeg，开始复制...');
        fs.copyFileSync(systemPaths.ffmpegPath, localFfmpegPath);
        fs.copyFileSync(systemPaths.ffprobePath, localFfprobePath);
        console.log('复制完成');
      } else {
        throw new Error('无法找到系统 FFmpeg 文件');
      }
    }

    // 再次检查文件
    if (!fs.existsSync(localFfmpegPath)) {
      throw new Error(`ffmpeg.exe 未找到: ${localFfmpegPath}`);
    }
    if (!fs.existsSync(localFfprobePath)) {
      throw new Error(`ffprobe.exe 未找到: ${localFfprobePath}`);
    }

    console.log('FFmpeg 文件检查通过');
    console.log('路径:', {
      ffmpeg: localFfmpegPath,
      ffprobe: localFfprobePath
    });

    // 测试 FFmpeg
    console.log('测试 FFmpeg...');
    ffmpeg.setFfmpegPath(localFfmpegPath);
    ffmpeg.setFfprobePath(localFfprobePath);
    
    await new Promise((resolve, reject) => {
      ffmpeg.getAvailableFormats((err, formats) => {
        if (err) reject(err);
        else resolve(formats);
      });
    });
    
    console.log('FFmpeg 测试成功');
    return true;
  } catch (error) {
    console.error('FFmpeg 设置失败:', error);
    console.error('请确保系统已安装 FFmpeg，或手动复制 ffmpeg.exe 和 ffprobe.exe 到:', binDir);
    return false;
  }
}

if (require.main === module) {
  setupFFmpeg().then(success => {
    if (!success) {
      process.exit(1);
    }
  });
}

module.exports = setupFFmpeg; 