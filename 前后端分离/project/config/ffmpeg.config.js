const path = require('path');
const which = require('which');

function getFfmpegPath() {
    try {
        // 首先尝试查找系统安装的 ffmpeg
        const systemFfmpeg = which.sync('ffmpeg');
        return systemFfmpeg;
    } catch (e) {
        // 如果系统没有安装，则使用项目内的 ffmpeg
        return path.join(__dirname, '../ffmpeg/bin/ffmpeg');
    }
}

function getFfprobePath() {
    try {
        // 首先尝试查找系统安装的 ffprobe
        const systemFfprobe = which.sync('ffprobe');
        return systemFfprobe;
    } catch (e) {
        // 如果系统没有安装，则使用项目内的 ffprobe
        return path.join(__dirname, '../ffmpeg/bin/ffprobe');
    }
}

module.exports = {
    ffmpegPath: getFfmpegPath(),
    ffprobePath: getFfprobePath()
}; 