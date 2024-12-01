const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegConfig = require('../config/ffmpeg.config');

async function checkFFmpeg() {
  console.log('检查 FFmpeg 配置...');

  // 检查文件是否存在
  const files = [
    { path: ffmpegConfig.ffmpegPath, name: 'ffmpeg.exe' },
    { path: ffmpegConfig.ffprobePath, name: 'ffprobe.exe' }
  ];

  for (const file of files) {
    if (!fs.existsSync(file.path)) {
      console.error(`错误: ${file.name} 未找到`);
      console.error('路径:', file.path);
      console.error('\n请确保以下文件存在:');
      console.error('1. ffmpeg.exe');
      console.error('2. ffprobe.exe');
      console.error('\n在目录:', path.dirname(file.path));
      return false;
    }
  }

  try {
    // 测试 FFmpeg
    ffmpeg.setFfmpegPath(ffmpegConfig.ffmpegPath);
    ffmpeg.setFfprobePath(ffmpegConfig.ffprobePath);

    await new Promise((resolve, reject) => {
      ffmpeg.getAvailableFormats((err, formats) => {
        if (err) reject(err);
        else resolve(formats);
      });
    });

    console.log('FFmpeg 配置正确');
    return true;
  } catch (error) {
    console.error('FFmpeg 测试失败:', error);
    return false;
  }
}

if (require.main === module) {
  checkFFmpeg().then(success => {
    if (!success) {
      process.exit(1);
    }
  });
}

module.exports = checkFFmpeg; 