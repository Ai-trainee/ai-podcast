const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();
const path = require('path');
const fs = require('fs');
const fsPromises = require('fs').promises;
const { testConnection } = require('./config/db');
const errorHandler = require('./middleware/error.handler');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegConfig = require('./config/ffmpeg.config');

const app = express();
const auth = require('./middleware/auth');
const authRoutes = require('./routes/auth');
const podcastRoutes = require('./routes/podcast.routes');

// 添加详细的日志
morgan.token('body', (req) => JSON.stringify(req.body));
app.use(morgan(':method :url :status :response-time ms - :body'));

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/podcast', podcastRoutes);

// Protected route example
app.get('/api/protected', auth, (req, res) => {
  res.json({ message: 'This is a protected route', user: req.user });
});

// Public route example
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Authentication API' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('错误详情:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body
  });
  res.status(500).json({ message: err.message || 'Something went wrong!' });
});

// 设置静态文件目录
app.use('/output', express.static(path.join(__dirname, 'public/output')));

// 在启动服务器之前添加初始化检查
async function initializeApp() {
  try {
    // 检查数据库连接
    await testConnection();
    console.log('- 数据库已就绪');

    // 确保必要的目录存在
    await fsPromises.mkdir(path.join(__dirname, 'public/output'), { recursive: true });
    await fsPromises.mkdir(path.join(__dirname, 'tmp'), { recursive: true });
    
    console.log('初始化检查完成:');
    console.log('- public/output 目录已就绪');
    console.log('- tmp 目录已就绪');
    
    // 设置 FFmpeg 路径
    console.log('配置 FFmpeg...');
    ffmpeg.setFfmpegPath(ffmpegConfig.ffmpegPath);
    ffmpeg.setFfprobePath(ffmpegConfig.ffprobePath);

    // 测试 FFmpeg
    await new Promise((resolve, reject) => {
      ffmpeg.getAvailableFormats((err, formats) => {
        if (err) {
          console.error('FFmpeg 测试失败:', err);
          reject(err);
        } else {
          console.log('- FFmpeg 已就绪');
          resolve();
        }
      });
    });

  } catch (error) {
    console.error('初始化失败:', error);
    process.exit(1);
  }
}

// 在启动服务器之前调用
if (process.env.NODE_ENV !== 'test') {
  initializeApp().then(() => {
    // 尝试多个端口
    const tryPorts = [8080];
    
    function tryNextPort(ports) {
      if (ports.length === 0) {
        console.error('所有端口都无法使用，服务器启动失败');
        process.exit(1);
        return;
      }

      const PORT = ports[0];
      const server = app.listen(PORT)
        .on('error', (err) => {
          if (err.code === 'EACCES' || err.code === 'EADDRINUSE') {
            console.log(`端口 ${PORT} 被占用或无权限访问，尝试下一个端口...`);
            server.close();
            tryNextPort(ports.slice(1));
          } else {
            console.error('服务器启动错误:', err);
            process.exit(1);
          }
        })
        .on('listening', () => {
          console.log(`服务器已启动，监听端口 ${PORT}`);
          console.log('可用的API端点:');
          console.log('- POST /api/auth/register    注册新用户');
          console.log('- POST /api/auth/login       用户登录');
          console.log('- POST /api/podcast/generate 生成播客');
          console.log('- POST /api/podcast/upload   上传文件');
          console.log('- GET  /api/podcast/status   查询任务状态');
        });
    }

    tryNextPort(tryPorts);
  });
}

// 在所有路由之后添加错误处理中间件
app.use(errorHandler);

module.exports = app;
