'use client';

import { Heart, Clock } from 'lucide-react';
import Image from 'next/image';

interface PodcastCardProps {
  title: string;
  author: string;
  duration: string;
  likes: number;
  thumbnail: string;
}

export default function PodcastCard({
  title,
  author,
  duration,
  likes,
  thumbnail
}: PodcastCardProps) {
  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="relative h-48">
        <Image
          src={thumbnail}
          alt={title}
          fill
          className="object-cover"
        />
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-1">{title}</h3>
        <p className="text-gray-600 text-sm mb-3">{author}</p>
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            {duration}
          </div>
          <div className="flex items-center">
            <Heart className="h-4 w-4 mr-1" />
            {likes}
          </div>
        </div>
      </div>
    </div>
  );
} 