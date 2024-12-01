'use client';

import { Radio, Search, Users } from 'lucide-react';
import Link from 'next/link';
import { Button } from './ui/button';

export default function Navigation() {
  return (
    <header className="fixed w-full top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <Radio className="h-8 w-8 text-violet-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">VoiceForge</span>
            </Link>
            <nav className="ml-8">
              <div className="flex space-x-4">
                <Link href="/" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg text-sm font-medium">
                  <Search className="h-5 w-5 inline-block mr-1" />
                  探索
                </Link>
                <Link href="/community" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg text-sm font-medium">
                  <Users className="h-5 w-5 inline-block mr-1" />
                  社区
                </Link>
              </div>
            </nav>
          </div>
          <div className="flex items-center">
            <Button variant="ghost" className="mr-2">登录</Button>
            <Button>注册</Button>
          </div>
        </div>
      </div>
    </header>
  );
} 