'use client';

import { useState, useEffect } from 'react';
import { Link, Upload, Sparkles, Radio, Type, FileText } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert } from '@/components/ui/alert';
import { AudioPlayer } from '@/components/AudioPlayer';
import { motion } from 'framer-motion';

// 添加对话类型
interface Dialogue {
  role: 'host' | 'guest'
  content: string
}

export default function PodcastGenerator() {
  const [activeTab, setActiveTab] = useState('file');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState('');
  const [taskId, setTaskId] = useState('');
  const [progress, setProgress] = useState(0);
  const [audioUrl, setAudioUrl] = useState('');
  const [error, setError] = useState('');
  const [previewText, setPreviewText] = useState('');
  const [dialogues, setDialogues] = useState<Dialogue[]>([]);

  // 文件处理逻辑
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFile(file);
      const reader = new FileReader();
      reader.onload = async (e) => {
        const text = e.target?.result as string;
        setText(text);
        setPreviewText(text.slice(0, 500) + (text.length > 500 ? '...' : ''));
      };
      reader.readAsText(file);
    }
  };

  // 修改URL处理逻辑
  const handleUrlChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setUrl(newUrl);
    if (newUrl) {
      try {
        setStatus('fetching');
        const response = await fetch('/api/fetch-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: newUrl })
        });
        const data = await response.json();
        setText(data.content);
        setPreviewText(data.content.slice(0, 500) + (data.content.length > 500 ? '...' : ''));
        setStatus('ready');
      } catch (error) {
        setError('获取链接内容失败');
        setStatus('failed');
      }
    }
  };

  // 修改提交处理逻辑
  const handleSubmit = async () => {
    try {
      setError('');
      setStatus('processing');
      setProgress(0);
      setAudioUrl(''); // 重置音频URL
      
      // 验证输入
      if (!text && !url) {
        throw new Error('请输入内容或上传文件');
      }
      
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: activeTab === 'file' ? text : url,
          type: activeTab
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '生成请求失败');
      }
      
      const data = await response.json();
      if (data.taskId) {
        setTaskId(data.taskId);
      } else {
        throw new Error('未获取到任务ID');
      }
    } catch (error) {
      setStatus('failed');
      setError(error instanceof Error ? error.message : '未知错误');
    }
  };

  // 修改状态轮询逻辑
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    if (taskId && status === 'processing') {
      intervalId = setInterval(async () => {
        try {
          const response = await fetch(`/api/status/${taskId}`);
          const data = await response.json();
          
          if (data.dialogues) {
            setDialogues(data.dialogues); // 更新对话内容
          }
          
          if (data.status === 'completed' && data.audioUrl) {
            setStatus('completed');
            setProgress(100);
            setAudioUrl(data.audioUrl);
            clearInterval(intervalId);
          } else if (data.status === 'failed') {
            throw new Error(data.error || '生成失败');
          } else if (data.progress) {
            setProgress(data.progress);
          }
        } catch (error) {
          setStatus('failed');
          setError(error instanceof Error ? error.message : '状态查询失败');
          clearInterval(intervalId);
        }
      }, 2000);
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [taskId, status]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* 导航栏 */}
      <nav className="fixed w-full top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <motion.div 
              className="flex items-center space-x-8"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-violet-100 rounded-xl">
                  <Radio className="h-6 w-6 text-violet-600" />
                </div>
                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-indigo-600">
                  AI播客生成器
                </span>
              </div>
              <div className="hidden md:flex space-x-6">
                <a href="#" className="text-gray-900 border-b-2 border-violet-500 px-1 py-2">首页</a>
                <a href="#" className="text-gray-600 hover:text-gray-900 px-1 py-2">我的播客</a>
                <a href="#" className="text-gray-600 hover:text-gray-900 px-1 py-2">探索</a>
              </div>
            </motion.div>
            
            <motion.div 
              className="flex items-center space-x-4"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
            >
              <Button variant="ghost">登录</Button>
              <Button className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white">
                开始使用
              </Button>
            </motion.div>
          </div>
        </div>
      </nav>

      {/* 主要内容区域 */}
      <main className="pt-24 pb-16 px-4">
        <motion.div 
          className="text-center mb-16"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className="text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-indigo-600">
            AI播客生成平台
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            将任何内容转换为专业的播客内容，让创意发声
          </p>
        </motion.div>

        <motion.div 
          className="max-w-4xl mx-auto"
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className="bg-white rounded-2xl shadow-xl p-8 backdrop-blur-xl border border-gray-100">
            <Tabs defaultValue="text" className="w-full">
              <TabsList className="grid grid-cols-3 gap-4 mb-8">
                <TabsTrigger value="text" className="flex items-center space-x-2">
                  <Type className="h-5 w-5" />
                  <span>文本输入</span>
                </TabsTrigger>
                <TabsTrigger value="file" className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>文件上传</span>
                </TabsTrigger>
                <TabsTrigger value="url" className="flex items-center space-x-2">
                  <Link className="h-5 w-5" />
                  <span>链接转换</span>
                </TabsTrigger>
              </TabsList>

              {error && (
                <Alert variant="destructive" className="mb-6">
                  {error}
                </Alert>
              )}

              <TabsContent value="text">
                <div className="space-y-4">
                  <Textarea
                    id="text-input"
                    name="text-input"
                    placeholder="在此输入文本内容..."
                    value={text}
                    onChange={(e) => {
                      setText(e.target.value);
                      setPreviewText(e.target.value.slice(0, 500) + (e.target.value.length > 500 ? '...' : ''));
                    }}
                    className="min-h-[200px]"
                  />
                  <p className="text-sm text-gray-500">
                    支持中英文输入，建议文本长度在500-5000字之间
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="file">
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-12 text-center">
                  <input 
                    type="file" 
                    id="file-upload"
                    name="file-upload"
                    className="hidden" 
                    onChange={handleFileUpload}
                    accept=".txt,.md,.doc,.docx"
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer inline-flex flex-col items-center"
                  >
                    <motion.div 
                      className="p-4 rounded-full bg-violet-50 mb-4"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Upload className="h-8 w-8 text-violet-600" />
                    </motion.div>
                    <span className="text-gray-600 font-medium">点击或拖拽文件到此处上传</span>
                    <span className="text-sm text-gray-500 mt-2">支持 .txt, .md, .doc, .docx 格式</span>
                    {file && (
                      <span className="text-sm text-violet-600 mt-2">
                        已选择文件: {file.name}
                      </span>
                    )}
                  </label>
                </div>
              </TabsContent>

              <TabsContent value="url">
                <div className="space-y-4">
                  <div className="relative">
                    <input
                      type="url"
                      id="url-input"
                      name="url-input"
                      placeholder="输入文章或视频链接"
                      value={url}
                      onChange={handleUrlChange}
                      className="w-full px-4 py-3 pl-12 border border-gray-200 rounded-xl"
                    />
                    <Link className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500">
                    支持主流媒体平台、博客文章等链接
                  </p>
                </div>
              </TabsContent>
            </Tabs>

            {/* 高级设置 */}
            <motion.div className="mt-6">
              <Button
                variant="ghost"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full justify-between border border-gray-200 hover:bg-violet-50"
              >
                <span className="flex items-center">
                  <Sparkles className="h-5 w-5 mr-2" />
                  高级设置
                </span>
                <motion.span animate={{ rotate: showAdvanced ? 180 : 0 }}>↓</motion.span>
              </Button>

              {showAdvanced && (
                <motion.div 
                  className="mt-6 space-y-4 p-4 bg-gray-50 rounded-xl"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                >
                  {/* 这里添加高级设置选项 */}
                </motion.div>
              )}
            </motion.div>

            {/* 生成按钮 */}
            <motion.div 
              className="mt-6"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white h-12 text-lg"
                onClick={handleSubmit}
                disabled={status === 'processing'}
              >
                {status === 'processing' ? (
                  <div className="flex items-center">
                    <span className="animate-spin mr-2">⚡</span>
                    生成中...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Radio className="mr-2 h-5 w-5" />
                    开始生成
                  </div>
                )}
              </Button>
            </motion.div>

            {/* 进度显示 */}
            {status === 'processing' && (
              <motion.div 
                className="mt-6"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Progress value={progress} className="h-2" />
                <p className="text-sm text-gray-600 text-center mt-2">
                  正在生成中 {progress}
                </p>
              </motion.div>
            )}

            {/* 对话内容展示 */}
            {dialogues.length > 0 && (
              <motion.div 
                className="mt-8 p-6 bg-white rounded-xl shadow-sm border border-gray-100"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-medium text-gray-900">对话内容预览</h3>
                  <span className="text-sm text-gray-500">{dialogues.length} 条对话</span>
                </div>
                <div className="space-y-6">
                  {dialogues.map((dialogue, index) => (
                    <div 
                      key={index}
                      className={`flex items-start space-x-4 ${
                        dialogue.role === 'host' ? 'justify-start' : 'justify-end'
                      }`}
                    >
                      <div 
                        className={`max-w-[80%] p-4 rounded-2xl transition-colors ${
                          dialogue.role === 'host'
                            ? 'bg-violet-50 text-violet-900 hover:bg-violet-100'
                            : 'bg-gray-50 text-gray-900 hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center space-x-2 mb-2">
                          <div className={`text-xs font-medium ${
                            dialogue.role === 'host' ? 'text-violet-600' : 'text-gray-600'
                          }`}>
                            {dialogue.role === 'host' ? '主持人' : '嘉宾'}
                          </div>
                          <div className="text-xs text-gray-400">#{index + 1}</div>
                        </div>
                        <p className="text-sm leading-relaxed">{dialogue.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* 音频播放器 */}
            {status === 'completed' && audioUrl && (
              <motion.div 
                className="mt-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <AudioPlayer url={audioUrl} />
              </motion.div>
            )}

            {/* 预览区域 */}
            {previewText && (
              <motion.div 
                className="mt-6 p-6 bg-gray-50 rounded-xl"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <h3 className="text-sm font-medium text-gray-700 mb-2">内容预览</h3>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{previewText}</p>
              </motion.div>
            )}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
