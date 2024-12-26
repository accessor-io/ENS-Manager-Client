"use client";

import { useState, useEffect } from 'react';

interface NewsItem {
  id: string;
  text: string;
  source: 'twitter' | 'dao';
  link: string;
  timestamp: string;
}

export default function NewsMarquee() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    // Mock news data
    const mockNews: NewsItem[] = [
      {
        id: '1',
        text: '🎉 ENS DAO Proposal #123: Improving ENS Name Resolution Speed passes with 98% votes',
        source: 'dao',
        link: 'https://discuss.ens.domains/',
        timestamp: new Date().toISOString()
      },
      {
        id: '2',
        text: '📢 ENS Names now support Unicode emojis in subdomains',
        source: 'twitter',
        link: 'https://twitter.com/ensdomains',
        timestamp: new Date().toISOString()
      },
      {
        id: '3',
        text: '🔥 Over 3 million ENS names registered! Major milestone for decentralized naming',
        source: 'twitter',
        link: 'https://twitter.com/ensdomains',
        timestamp: new Date().toISOString()
      },
      {
        id: '4',
        text: '📋 New ENS Improvement Proposal: Enhanced Privacy Features for ENS Names',
        source: 'dao',
        link: 'https://discuss.ens.domains/',
        timestamp: new Date().toISOString()
      },
      {
        id: '5',
        text: '🌟 ENS Integration Guide: Making Your dApp ENS-Compatible',
        source: 'twitter',
        link: 'https://twitter.com/ensdomains',
        timestamp: new Date().toISOString()
      }
    ];

    setNews(mockNews);

    // Rotate news items every 15 seconds (matching animation duration)
    const interval = setInterval(() => {
      setCurrentIndex(prevIndex => (prevIndex + 1) % mockNews.length);
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  if (news.length === 0) return null;

  const currentNews = news[currentIndex];

  return (
    <div className="flex-1 overflow-hidden px-4">
      <div className="animate-slide-up h-6">
        <a
          key={currentNews.id}
          href={currentNews.link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center space-x-2 text-xs hover:text-blue-600"
        >
          <span className="text-gray-400">
            {currentNews.source === 'twitter' ? '𝕏' : '🏛️'}
          </span>
          <span>{currentNews.text}</span>
        </a>
      </div>
    </div>
  );
} 