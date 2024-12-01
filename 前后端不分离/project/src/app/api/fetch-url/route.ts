import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function POST(request: Request) {
  try {
    const { url } = await request.json();
    
    const response = await fetch(url);
    const html = await response.text();
    
    // 使用cheerio解析HTML
    const $ = cheerio.load(html);
    
    // 移除脚本和样式
    $('script').remove();
    $('style').remove();
    
    // 获取主要内容
    let content = '';
    
    // 常见的内容容器
    const contentSelectors = [
      'article',
      '.article-content',
      '.post-content',
      '.entry-content',
      'main',
      '#content'
    ];

    for (const selector of contentSelectors) {
      const element = $(selector);
      if (element.length) {
        content = element.text();
        break;
      }
    }

    // 如果没有找到特定容器，获取 body 内容
    if (!content) {
      content = $('body').text();
    }

    // 清理文本
    content = content
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, '\n')
      .trim();

    return NextResponse.json({ content });
  } catch (error) {
    console.error('Error fetching URL:', error);
    return NextResponse.json(
      { error: '获取链接内容失败' },
      { status: 500 }
    );
  }
} 