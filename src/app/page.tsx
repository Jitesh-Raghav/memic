'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { TextRewind } from '@/components/ui/text-rewind';

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Popular meme template URLs for floating backgrounds
  const floatingTemplates = [
    'https://i.imgflip.com/1bij.jpg', // Drake
    'https://i.imgflip.com/4t0m5.jpg', // Distracted Boyfriend
    'https://i.imgflip.com/1g8my4.jpg', // Expanding Brain
    'https://i.imgflip.com/26am.jpg', // Surprised Pikachu
    'https://i.imgflip.com/1otk96.jpg', // This is Fine
    'https://i.imgflip.com/1ihzfe.jpg', // Mocking SpongeBob
    'https://i.imgflip.com/2zoyn9.jpg', // Change My Mind
    'https://i.imgflip.com/1c1uej.jpg', // Leonardo DiCaprio
    'https://i.imgflip.com/30b1gx.jpg', // Woman Yelling at Cat
    'https://i.imgflip.com/1ur9b0.jpg', // Two Buttons
    'https://i.imgflip.com/61kujv.jpg', // Bernie Sanders
    'https://i.imgflip.com/5c7lwq.jpg', // Among Us
  ];

  return (
    <div className="h-screen bg-black text-white relative overflow-hidden flex items-center justify-center">
      {/* Floating Meme Template Backgrounds */}
      <div className="absolute inset-0 overflow-hidden">
        {floatingTemplates.map((template, index) => (
          <div
            key={index}
            className={`absolute opacity-15 hover:opacity-25 transition-opacity duration-700 ${
              mounted ? 'animate-float' : ''
            }`}
            style={{
              left: `${Math.random() * 85}%`,
              top: `${Math.random() * 85}%`,
              animationDelay: `${index * 1.5}s`,
              animationDuration: `${12 + index * 2}s`,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={template}
              alt=""
              className="w-24 md:w-32 lg:w-40 rounded-lg transform rotate-12 hover:rotate-6 transition-transform duration-500 hover:scale-110"
              style={{
                filter: 'grayscale(0.7) blur(0.3px)',
              }}
            />
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 text-center max-w-4xl mx-auto px-6">
        {/* Logo and Brand Name */}
        <div className={`mb-6 transition-all duration-1000 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="flex items-center justify-center mb-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src="/mm.jpg" 
              alt="Memic Logo" 
              className="w-24 h-24 md:w-24 md:h-24 xl:w-36 xl:h-36 rounded-full"
            />
          </div>
          <TextRewind 
            text="Memic" 
            className="text-7xl md:text-9xl font-black"
          />
        </div>

        {/* Tagline */}
        <p className={`text-2xl md:text-3xl text-gray-400 mb-12 font-light transition-all duration-1000 delay-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          Create Viral Memes in Seconds
        </p>

        {/* Main CTA Button */}
        <div className={`transition-all duration-1000 delay-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <Link
            href="/editor"
            className="group inline-flex items-center px-8 py-4 bg-white text-black hover:bg-gray-100 rounded-full font-bold text-xl transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-white/20 space-x-4"
          >
            <span>Start</span>
          </Link>
        </div>

        {/* Small feature text */}
        <div className={`mt-8 text-gray-500 text-sm transition-all duration-1000 delay-900 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          1000+ Templates • AI Powered • Completely Free
        </div>
      </div>

      {/* Custom CSS for floating animation */}
      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) rotate(12deg);
          }
          33% {
            transform: translateY(-15px) rotate(8deg);
          }
          66% {
            transform: translateY(-8px) rotate(15deg);
          }
        }
        .animate-float {
          animation: float ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
