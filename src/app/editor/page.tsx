'use client';

import React, { useState, useEffect } from "react";
import { fetchImgflipMemes, MemeTemplate, getPopularMemes, searchMemes } from "@/lib/imgflip-api";
import AdvancedMemeEditor from "@/components/AdvancedMemeEditor";
import MemeLibrary from "@/components/MemeLibrary";
import Link from "next/link";

export default function EditorPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<MemeTemplate | null>(null);
  const [showTemplateLibrary, setShowTemplateLibrary] = useState(false);
  const [allMemes, setAllMemes] = useState<MemeTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadMemes = async () => {
      try {
        setError(null);
        const memes = await fetchImgflipMemes();
        setAllMemes(memes);
        
        // Check URL params for template or search
        const urlParams = new URLSearchParams(window.location.search);
        const templateUrl = urlParams.get('template');
        const searchQuery = urlParams.get('search');
        
        if (templateUrl) {
          // Direct template URL provided
          const template = memes.find(m => m.url === templateUrl) || {
            id: 'custom',
            name: 'Custom Template',
            url: templateUrl,
            category: 'custom'
          };
          setSelectedTemplate(template);
        } else if (searchQuery) {
          // Search query provided
          const searchResults = searchMemes(searchQuery, memes);
          if (searchResults.length > 0) {
            setSelectedTemplate(searchResults[0]);
          } else {
            setShowTemplateLibrary(true);
          }
        } else {
          // Check localStorage for saved template
          const savedTemplate = localStorage.getItem('selectedTemplate');
          if (savedTemplate) {
            try {
              const template = JSON.parse(savedTemplate);
              setSelectedTemplate(template);
              localStorage.removeItem('selectedTemplate');
            } catch (e) {
              console.error('Failed to parse saved template');
            }
          } else {
            setShowTemplateLibrary(true);
          }
        }
        
      } catch (error) {
        console.error('Failed to load memes:', error);
        setError('Failed to load meme templates. Please try refreshing the page.');
      } finally {
        setLoading(false);
      }
    };

    loadMemes();
  }, []);

  const handleTemplateSelect = (templateUrl: string) => {
    console.log('=== TEMPLATE SELECTION DEBUG ===');
    console.log('Template URL received:', templateUrl);
    console.log('Total memes in allMemes:', allMemes.length);
    
    const template = allMemes.find(m => m.url === templateUrl);
    if (template) {
      console.log('✅ Found template in allMemes:', template);
      setSelectedTemplate(template);
      console.log('✅ Template set successfully');
      // Update URL without reloading
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('template', templateUrl);
      window.history.replaceState({}, '', newUrl.toString());
    } else {
      console.log('❌ Template not found in allMemes, creating custom template');
      console.log('Searching in allMemes for URL:', templateUrl);
      console.log('Sample URLs from allMemes:', allMemes.slice(0, 5).map(m => m.url));
      
      // Create custom template with better detection of media type
      const isVideo = templateUrl.includes('.mp4') || 
                      templateUrl.includes('.webm') || 
                      templateUrl.includes('.mov') || 
                      templateUrl.includes('.avi') ||
                      templateUrl.includes('v.redd.it') ||
                      templateUrl.includes('gfycat') ||
                      templateUrl.includes('redgifs');
      
      const customTemplate = {
        id: 'custom-' + Date.now(),
        name: 'Custom Template',
        url: templateUrl,
        category: 'custom',
        mediaType: isVideo ? 'video' as const : 'image' as const,
        source: 'custom' as const
      };
      
      console.log('🔧 Created custom template:', customTemplate);
      setSelectedTemplate(customTemplate);
      console.log('✅ Custom template set successfully');
    }
    setShowTemplateLibrary(false);
    console.log('=== END TEMPLATE SELECTION DEBUG ===');
  };

  const handleExport = (canvas: HTMLCanvasElement) => {
    try {
      // Convert canvas to blob and download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `meme-${Date.now()}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          
          // Show success message (you could add a toast notification here)
          console.log('Meme exported successfully!');
        }
      }, 'image/png', 1.0); // High quality
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export meme. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold mb-2">Loading Editor</h2>
          <p className="text-gray-400">Preparing your meme creation studio...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6">😵</div>
          <h2 className="text-2xl font-bold mb-4">Oops! Something went wrong</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full px-6 py-3 bg-white text-black rounded hover:bg-gray-100 transition-all font-medium"
            >
              Try Again
            </button>
            <Link
              href="/"
              className="block w-full px-6 py-3 border border-gray-600 rounded hover:bg-gray-900 transition-colors font-medium"
            >
              Go Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!selectedTemplate) {
    return (
      <div className="min-h-screen bg-black text-white">
        {/* Header */}
        <header className="bg-black border-b border-gray-800">
          <div className="max-w-6xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link href="/" className="flex items-center space-x-3">
                  <img 
                    src="/memix.ico" 
                    alt="Memic Logo" 
                    className="w-8 h-8"
                  />
                  <span className="text-xl font-bold text-white">
                    Memic
                  </span>
                </Link>
                <div className="h-6 w-px bg-gray-600"></div>
                <span className="text-gray-400">Choose Template</span>
              </div>
              
              <button
                onClick={() => setShowTemplateLibrary(true)}
                className="px-6 py-2 bg-white text-black rounded hover:bg-gray-100 transition-all font-medium"
              >
                Browse All Templates
              </button>
            </div>
          </div>
        </header>

        {/* Template Selection */}
        <div className="max-w-6xl mx-auto px-6 py-16 text-center">
          <div className="mb-16">
            <h1 className="text-5xl md:text-6xl font-black mb-6 text-white">
              Choose Your Template
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Select from {allMemes.length}+ meme templates to start creating.
            </p>
          </div>
          
          {/* Quick Start Templates */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-12">
            {getPopularMemes(allMemes, 12).map((meme) => (
              <div
                key={meme.id}
                onClick={() => setSelectedTemplate(meme)}
                className="cursor-pointer bg-gray-900 border border-gray-800 rounded hover:border-gray-600 transition-all duration-300 overflow-hidden hover:scale-105"
              >
                <div className="aspect-square overflow-hidden">
                  <img
                    src={meme.url}
                    alt={meme.name}
                    className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzMzMzMzMyIvPgogIDx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTk5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIwLjNlbSI+SW1hZ2UgTm90IEZvdW5kPC90ZXh0Pgo8L3N2Zz4K';
                    }}
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-medium text-white text-sm truncate mb-1">
                    {meme.name}
                  </h3>
                  <p className="text-xs text-gray-400 capitalize">
                    {meme.category}
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          {/* CTA Button */}
          <div className="space-y-4">
            <button
              onClick={() => setShowTemplateLibrary(true)}
              className="px-10 py-4 bg-white text-black rounded text-lg font-bold hover:bg-gray-100 transition-all duration-300"
            >
              Browse All {allMemes.length}+ Templates
            </button>
            <p className="text-gray-400 text-sm">
              Or upload your own image to create a custom meme
            </p>
          </div>
        </div>

        {/* Template Library Modal */}
        <MemeLibrary
          isOpen={showTemplateLibrary}
          onClose={() => setShowTemplateLibrary(false)}
          onSelectMeme={handleTemplateSelect}
          showCustomUpload={true}
        />
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden">
      {/* Advanced Meme Editor */}
      <AdvancedMemeEditor
        template={selectedTemplate}
        onExport={handleExport}
      />
      
      {/* Template Library Modal */}
      <MemeLibrary
        isOpen={showTemplateLibrary}
        onClose={() => setShowTemplateLibrary(false)}
        onSelectMeme={handleTemplateSelect}
        showCustomUpload={true}
      />
      
      {/* Template Change Button - Floating */}
      <button
        onClick={() => setShowTemplateLibrary(true)}
        className="fixed bottom-6 left-6 bg-white text-black p-4 rounded-full shadow-2xl hover:bg-gray-100 transition-all duration-300 z-50 hover:scale-110"
        title="Change Template"
      >
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9H9V9h10v2zm-4 4H9v-2h6v2zm4-8H9V5h10v2z"/>
        </svg>
      </button>
      
      {/* Back to Template Selection Button */}
      <button
        onClick={() => setSelectedTemplate(null)}
        className="fixed top-6 left-6 bg-black/80 backdrop-blur-sm text-white p-3 rounded-full hover:bg-black transition-all duration-300 z-50"
        title="Back to Template Selection"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
        </svg>
      </button>
    </div>
  );
} 