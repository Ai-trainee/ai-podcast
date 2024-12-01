const express = require('express');
const router = express.Router();
const podcastService = require('../services/podcast.service');
const auth = require('../middleware/auth');
const multer = require('multer');

// 配置文件上传
const upload = multer({ 
  dest: 'tmp/',
  limits: {
    fileSize: 10 * 1024 * 1024 // 限制10MB
  }
});

// 文本转播客
router.post('/generate', auth, async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: '请提供文本内容' });
    }
    const taskId = await podcastService.generateFromText(text);
    res.json({ taskId });
  } catch (error) {
    next(error);
  }
});

// 文件上传转播客
router.post('/upload', auth, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '请上传文件' });
    }
    const taskId = await podcastService.generateFromFile(req.file);
    res.json({ taskId });
  } catch (error) {
    next(error);
  }
});

// 获取任务状态
router.get('/status/:taskId', auth, async (req, res, next) => {
  try {
    const status = await podcastService.getTaskStatus(req.params.taskId);
    if (!status) {
      return res.status(404).json({ error: '任务不存在' });
    }
    res.json(status);
  } catch (error) {
    next(error);
  }
});

// 获取用户的播客列表
router.get('/my-podcasts', auth, async (req, res, next) => {
  try {
    const podcasts = await podcastService.getUserPodcasts(req.user.id);
    res.json(podcasts);
  } catch (error) {
    next(error);
  }
});

// 删除播客
router.delete('/:taskId', auth, async (req, res, next) => {
  try {
    await podcastService.deletePodcast(req.params.taskId, req.user.id);
    res.json({ message: '删除成功' });
  } catch (error) {
    next(error);
  }
});

module.exports = router; 