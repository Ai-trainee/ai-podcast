import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: '没有找到文件' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 创建临时目录
    const tmpDir = path.join(process.cwd(), 'tmp');
    await fs.mkdir(tmpDir, { recursive: true });
    
    const filePath = path.join(tmpDir, file.name);
    await fs.writeFile(filePath, buffer);

    let content = '';

    // 根据文件类型处理
    if (file.name.endsWith('.txt') || file.name.endsWith('.md')) {
      content = await fs.readFile(filePath, 'utf-8');
    } else if (file.name.endsWith('.doc') || file.name.endsWith('.docx')) {
      // 使用pandoc转换doc/docx为文本
      const { stdout } = await execAsync(`pandoc -f docx -t plain "${filePath}"`);
      content = stdout;
    }

    // 清理临时文件
    await fs.unlink(filePath);

    return NextResponse.json({ content });
  } catch (error) {
    console.error('文件处理错误:', error);
    return NextResponse.json(
      { error: '文件处理失败' },
      { status: 500 }
    );
  }
} 