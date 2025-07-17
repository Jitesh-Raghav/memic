'use client';

import React, { useState, useEffect } from 'react';
import { fetchImgflipMemes, MemeTemplate, getUniqueCategories, getMemesByCategory, searchMemes, getPopularMemes } from '@/lib/imgflip-api';

interface MemeLibraryProps {
  onSelectMeme: (url: string) => void;
  isOpen: boolean;
  onClose: () => void;
  showCustomUpload?: boolean;
}

const MemeLibrary: React.FC<MemeLibraryProps> = ({ onSelectMeme, isOpen, onClose, showCustomUpload = true }) => {
  const [allMemes, setAllMemes] = useState<MemeTemplate[]>([]);
  const [filteredMemes, setFilteredMemes] = useState<MemeTemplate[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('popular');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [loadingStage, setLoadingStage] = useState<string>('');
  const [loadingProgress, setLoadingProgress] = useState<number>(0);

  const [activeTab, setActiveTab] = useState<'templates' | 'custom'>('templates');
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage] = useState<number>(24); // 6 columns x 4 rows

  useEffect(() => {
    const loadMemes = async () => {
      setLoading(true);
      setError(null);
      setLoadingProgress(0);
      
      try {
        setLoadingStage('Connecting to meme sources...');
        setLoadingProgress(20);
        
        const memes = await fetchImgflipMemes();
        
        setLoadingStage('Processing templates...');
        setLoadingProgress(80);
        
        setAllMemes(memes);
        setFilteredMemes(getPopularMemes(memes, 50));
        
        setLoadingStage('Ready!');
        setLoadingProgress(100);
        
        // Small delay to show completion
        setTimeout(() => {
          setLoading(false);
        }, 200);
        
      } catch (error) {
        console.error('Failed to load memes:', error);
        setError('Failed to load meme templates. Please try again.');
        setLoading(false);
      }
    };

    if (isOpen) {
      loadMemes();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!allMemes.length) return;

    let filtered = allMemes;
    
    if (searchQuery.trim()) {
      filtered = searchMemes(searchQuery, filtered);
    }
    
    if (selectedCategory === 'popular') {
      filtered = getPopularMemes(filtered, 100);
    } else if (selectedCategory === 'reddit') {
      filtered = filtered.filter(meme => meme.source === 'reddit');
    } else if (selectedCategory !== 'all') {
      filtered = getMemesByCategory(selectedCategory, filtered);
    }

    setFilteredMemes(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [allMemes, selectedCategory, searchQuery]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredMemes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentMemes = filteredMemes.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const categories = getUniqueCategories(allMemes);
  const hasResults = filteredMemes.length > 0;

  const handleSelectMeme = (url: string) => {
    onSelectMeme(url);
    onClose();
  };

  const handleCustomUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          handleSelectMeme(event.target.result as string);
        }
      };
      reader.onerror = () => {
        setError('Failed to read file. Please try again.');
      };
      reader.readAsDataURL(file);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-start justify-center z-50 p-2 sm:p-4 overflow-y-auto">
      <div className="bg-black border border-gray-800 rounded-xl w-full min-h-full max-w-7xl flex flex-col shadow-2xl my-2 sm:my-4">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-gray-800 flex justify-between items-center flex-shrink-0">
          <div className="flex items-center space-x-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src="/memix.ico" 
              alt="Memic Logo" 
              className="w-8 h-8"
            />
            <div>
              <h3 className="text-2xl font-bold text-white">
                Meme Library
              </h3>
                          <p className="text-gray-400 mt-1">
              {loading ? (
                <div className="space-y-2">
                  <div>{loadingStage}</div>
                  <div className="w-48 bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-white h-2 rounded-full transition-all duration-300"
                      style={{ width: `${loadingProgress}%` }}
                    ></div>
                  </div>
                </div>
              ) : 
               `${allMemes.length}+ meme templates ready`}
            </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors text-2xl hover:bg-gray-800 rounded-full w-10 h-10 flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-4 sm:px-6 pt-4 border-b border-gray-800 flex-shrink-0">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('templates')}
              className={`px-6 py-3 rounded-t-lg font-medium transition-all flex items-center gap-2 ${
                activeTab === 'templates'
                  ? 'bg-white text-black'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <span className="text-lg">🎭</span>
              Meme Templates
            </button>
            {showCustomUpload && (
              <button
                onClick={() => setActiveTab('custom')}
                className={`px-6 py-3 rounded-t-lg font-medium transition-all flex items-center gap-2 ${
                  activeTab === 'custom'
                    ? 'bg-white text-black'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <span className="text-lg">📁</span>
                Custom Upload
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="mx-4 sm:mx-6 mt-4 p-4 bg-red-900/20 border border-red-500/50 rounded-lg flex-shrink-0">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Main Content Area - Scrollable */}
        <div className="flex-1 flex flex-col min-h-0">
          {activeTab === 'templates' ? (
            <>
              {/* Search and Filters */}
              <div className="p-4 sm:p-6 border-b border-gray-800 space-y-4 flex-shrink-0">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search memes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-3 pl-12 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent text-white placeholder-gray-400"
                  />
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg">
                    🔍
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {Array.from(new Set(['popular', 'all', 'reddit', ...categories])).map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-4 py-2 rounded-full text-sm capitalize font-medium transition-all ${
                        selectedCategory === category
                          ? 'bg-white text-black'
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
                      }`}
                    >
                      {category === 'popular' ? '🔥 Popular' : 
                       category === 'all' ? '📚 All' : 
                       category === 'reddit' ? '📱 Reddit' : 
                       category}
                    </button>
                  ))}
                </div>
              </div>

              {/* Templates Grid - Scrollable */}
              <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6" style={{ maxHeight: 'calc(100vh - 100px)' }}>
                {loading ? (
                  <div className="flex flex-col items-center justify-center h-64">
                    <div className="relative mb-8">
                      <div className="w-16 h-16 border-4 border-gray-600 border-t-white rounded-full animate-spin"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-2xl animate-pulse">🎭</div>
                      </div>
                    </div>
                    <div className="text-center space-y-2">
                      <div className="text-white font-medium text-lg">Fetching Meme Templates</div>
                      <div className="text-gray-400">{loadingStage}</div>
                      <div className="flex items-center justify-center space-x-1 mt-4">
                        <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                ) : !hasResults ? (
                  <div className="flex flex-col items-center justify-center h-40">
                    <div className="text-6xl mb-4">😅</div>
                    <div className="text-gray-400 text-center">
                      <p className="text-lg mb-2">No memes found</p>
                      <p className="text-sm">Try a different search term or category</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 pb-6">
                    {currentMemes.map((meme) => (
                      <div
                        key={meme.id}
                        onClick={() => handleSelectMeme(meme.url)}
                        className="group cursor-pointer"
                      >
                        <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden hover:border-gray-600 transition-all duration-300 hover:scale-105">
                          <div className="aspect-square relative overflow-hidden">
                            {meme.mediaType === 'video' ? (
                              <div className="relative w-full h-full">
                                <video
                                  src={meme.url}
                                  className="w-full h-full object-cover"
                                  muted
                                  loop
                                  onMouseEnter={(e) => (e.target as HTMLVideoElement).play()}
                                  onMouseLeave={(e) => (e.target as HTMLVideoElement).pause()}
                                  onError={(e) => {
                                    const video = e.target as HTMLVideoElement;
                                    const parent = video.parentElement;
                                    if (parent) {
                                      parent.innerHTML = `
                                        <div class="w-full h-full flex items-center justify-center bg-gray-800">
                                          <div class="text-center">
                                            <div class="text-2xl mb-2">🎥</div>
                                            <div class="text-xs text-gray-400">Video Preview</div>
                                            <div class="text-xs text-gray-500 mt-1">${meme.name.substring(0, 20)}</div>
                                          </div>
                                        </div>
                                      `;
                                    }
                                  }}
                                />
                                <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                                  🎥 Video
                                </div>
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300"></div>
                              </div>
                            ) : (
                              <>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={meme.url}
                                  alt={meme.name}
                                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                  loading="lazy"
                                  onError={(e) => {
                                    const img = e.target as HTMLImageElement;
                                    const currentSrc = img.src;
                                    
                                    // If it's already the fallback, don't try again
                                    if (currentSrc.includes('data:image/svg+xml')) {
                                      return;
                                    }
                                    
                                    // Create a better fallback image with meme info
                                    const fallbackSvg = `data:image/svg+xml;base64,${btoa(`
                                      <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
                                        <rect width="200" height="200" fill="#1a1a1a"/>
                                        <rect x="10" y="10" width="180" height="180" fill="none" stroke="#333" stroke-width="2" stroke-dasharray="5,5"/>
                                        <text x="100" y="90" font-family="Arial, sans-serif" font-size="12" fill="#666" text-anchor="middle">Template</text>
                                        <text x="100" y="110" font-family="Arial, sans-serif" font-size="12" fill="#666" text-anchor="middle">Not Available</text>
                                        <text x="100" y="140" font-family="Arial, sans-serif" font-size="10" fill="#444" text-anchor="middle">${meme.name.substring(0, 20)}</text>
                                      </svg>
                                    `)}`;
                                    
                                    img.src = fallbackSvg;
                                  }}
                                  onLoad={() => {
                                    // Optional: Log successful loads for debugging
                                    // console.log(`Successfully loaded: ${meme.name}`);
                                  }}
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300"></div>
                              </>
                            )}
                          </div>
                          <div className="p-3">
                            <p className="text-xs font-medium text-center text-white truncate mb-1">{meme.name}</p>
                            <div className="flex items-center justify-between text-xs text-gray-400">
                              <span className="capitalize truncate">{meme.category}</span>
                              <div className="flex items-center space-x-2 flex-shrink-0">
                                {meme.mediaType === 'video' && (
                                  <span className="text-purple-400">🎥</span>
                                )}
                                {meme.source === 'reddit' && (
                                  <div className="flex items-center space-x-1">
                                    <span className="text-orange-400">📱</span>
                                    <span className="text-orange-400">{meme.upvotes}</span>
                                  </div>
                                )}
                                {meme.source === 'imgflip' && (
                                  <span className="text-blue-400">🎭</span>
                                )}
                                {!meme.source && (
                                  <span className="text-gray-400">✨</span>
                                )}
                              </div>
                            </div>
                            {meme.source === 'reddit' && meme.subreddit && (
                              <p className="text-xs text-gray-500 text-center mt-1">r/{meme.subreddit}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

                            {/* Pagination */}
              {totalPages > 1 && (
                <div className="p-4 sm:p-6 border-t border-gray-800 flex items-center justify-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="text-gray-400">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="text-center py-8 sm:py-16">
                <div className="bg-gray-900 border-2 border-dashed border-gray-700 rounded-xl p-12 hover:border-gray-600 transition-colors">
                  <label className="block cursor-pointer">
                    <div className="text-6xl mb-6">📁</div>
                    <div className="text-2xl font-semibold mb-3 text-white">Upload Your Own Image</div>
                    <div className="text-gray-400 mb-6">
                      PNG, JPG, GIF up to 10MB
                    </div>
                    <div className="inline-block bg-white text-black px-8 py-3 rounded-lg font-medium hover:bg-gray-100 transition-all">
                      Choose File
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCustomUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                <p className="text-gray-400 max-w-md mx-auto mt-6">
                  Upload your own images to create custom memes. Perfect for personal photos, 
                  screenshots, or any image you want to turn into a meme!
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t border-gray-800 text-center flex-shrink-0">
          <p className="text-gray-400">
            {activeTab === 'templates' 
              ? 'Click on any meme template to start editing' 
              : 'Upload custom images to create unique memes'
            }
          </p>
        </div>
      </div>
    </div>
  );
};

export default MemeLibrary; 