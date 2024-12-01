import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AI 播客生成器',
  description: '将任何内容转换为专业的播客内容',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh">
      <body className="min-h-screen bg-[#fafafa]">{children}</body>
    </html>
  )
}
