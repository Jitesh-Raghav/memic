'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Download } from 'lucide-react';
import { MemeTemplate } from '@/lib/imgflip-api';

export interface TextElement {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  rotation: number;
  opacity: number;
  textAlign: 'left' | 'center' | 'right';
  fontWeight: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
  fontStyle: 'normal' | 'italic';
  textShadow: string;
  zIndex: number;
  width?: number;
  height?: number;
}

interface AdvancedMemeEditorProps {
  template: MemeTemplate | null;
  onExport: (canvas: HTMLCanvasElement) => void;
}

const FONTS = [
  'Impact', 'Arial Black', 'Arial', 'Helvetica', 'Times New Roman', 'Courier New', 'Verdana',
  'Georgia', 'Comic Sans MS', 'Trebuchet MS', 'Lucida Sans Unicode', 'Tahoma', 'Oswald',
  'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Source Sans Pro', 'Raleway', 'Ubuntu'
];

const PRESET_COLORS = [
  '#FFFFFF', '#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00',
  '#FF00FF', '#00FFFF', '#FFA500', '#800080', '#008000', '#FFC0CB',
  '#A52A2A', '#808080', '#000080', '#008080', '#FFD700', '#C0C0C0',
  '#DC143C', '#4B0082', '#FF1493', '#32CD32', '#FF4500', '#DA70D6'
];

const TEXT_EFFECTS = [
  { name: 'None', shadow: 'none' },
  { name: 'Drop Shadow', shadow: '3px 3px 6px rgba(0,0,0,0.8)' },
  { name: 'Strong Outline', shadow: '-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000' },
  { name: 'Glow', shadow: '0 0 15px rgba(255,255,255,0.9)' },
  { name: 'Emboss', shadow: '1px 1px 0 rgba(255,255,255,0.5), -1px -1px 0 rgba(0,0,0,0.5)' },
  { name: 'Heavy Shadow', shadow: '4px 4px 8px rgba(0,0,0,0.9)' }
];

const AdvancedMemeEditor: React.FC<AdvancedMemeEditorProps> = ({ template, onExport }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [textElements, setTextElements] = useState<TextElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [zoom, setZoom] = useState(1);
  const [showGrid, setShowGrid] = useState(false);
  const [templateImage, setTemplateImage] = useState<HTMLImageElement | null>(null);
  const [templateVideo, setTemplateVideo] = useState<HTMLVideoElement | null>(null);
  const [isVideo, setIsVideo] = useState(false);
  const [videoCurrentTime, setVideoCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Load template image/video when template changes
  useEffect(() => {
    console.log('Template changed:', template);
    if (template) {
      const isVideoTemplate = template.mediaType === 'video' || 
        template.url.includes('v.redd.it') || 
        template.url.includes('.mp4') || 
        template.url.includes('.webm');
      
      console.log('Is video template:', isVideoTemplate, 'URL:', template.url);
      setIsVideo(isVideoTemplate);
      
      if (isVideoTemplate) {
        console.log('Loading video template...');
        const video = document.createElement('video');
        video.crossOrigin = 'anonymous';
        video.muted = true;
        video.onloadedmetadata = () => {
          console.log('Video loaded successfully:', video.videoWidth, 'x', video.videoHeight);
          setCanvasSize({ width: video.videoWidth, height: video.videoHeight });
          setVideoDuration(video.duration);
          setTemplateVideo(video);
          setTemplateImage(null);
        };
        video.onerror = (error) => {
          console.error('Failed to load template video:', error, 'URL:', template.url);
          setCanvasSize({ width: 800, height: 600 });
          setTemplateVideo(null);
        };
        video.src = template.url;
      } else {
        console.log('Loading image template...');
        
        // For Reddit images, try without CORS first as they often block it
        const isRedditImage = template.url.includes('i.redd.it') || template.url.includes('reddit');
        
        const loadImage = (useCORS: boolean = false) => {
          const img = new Image();
          
          img.onload = () => {
            console.log('Image loaded successfully:', img.width, 'x', img.height);
            setCanvasSize({ width: img.width, height: img.height });
            setTemplateImage(img);
            setTemplateVideo(null);
          };
          
          img.onerror = (error) => {
            console.error('Failed to load template image:', error, 'URL:', template.url);
            
            // If CORS failed and this was the first attempt, try without CORS
            if (useCORS && !isRedditImage) {
              console.log('Retrying without CORS...');
              loadImage(false);
            } else {
              // Final fallback - create a placeholder
              console.log('Creating fallback placeholder for failed image');
              const canvas = document.createElement('canvas');
              canvas.width = 800;
              canvas.height = 600;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                // Draw placeholder
                ctx.fillStyle = '#2a2a2a';
                ctx.fillRect(0, 0, 800, 600);
                ctx.fillStyle = '#666';
                ctx.font = 'bold 24px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('Template Not Available', 400, 280);
                ctx.font = '16px Arial';
                ctx.fillText('Try a different template', 400, 320);
                ctx.fillText('or upload your own image', 400, 350);
                
                // Convert to image
                const fallbackImg = new Image();
                fallbackImg.onload = () => {
                  setCanvasSize({ width: 800, height: 600 });
                  setTemplateImage(fallbackImg);
                  setTemplateVideo(null);
                };
                fallbackImg.src = canvas.toDataURL();
              } else {
                setCanvasSize({ width: 800, height: 600 });
                setTemplateImage(null);
              }
            }
          };
          
          // Set CORS only if needed and not a Reddit image
          if (useCORS && !isRedditImage) {
            img.crossOrigin = 'anonymous';
          }
          
          img.src = template.url;
        };
        
        // Start with CORS for non-Reddit images, without CORS for Reddit
        loadImage(!isRedditImage);
      }
    } else {
      console.log('No template provided');
      setTemplateImage(null);
      setTemplateVideo(null);
      setCanvasSize({ width: 800, height: 600 });
    }
  }, [template]);

  // Redraw canvas when elements, template, or video time changes
  const redrawCanvas = useCallback(() => {
    if (!canvasRef.current) {
      console.log('No canvas ref available');
      return;
    }
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.log('No canvas context available');
      return;
    }

    console.log('Redrawing canvas:', canvasSize.width, 'x', canvasSize.height);

    // Set canvas size
    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background color for debugging
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw template (image or video frame)
    if (templateImage) {
      console.log('Drawing template image:', templateImage.width, 'x', templateImage.height);
      try {
        ctx.drawImage(templateImage, 0, 0, canvas.width, canvas.height);
      } catch (error) {
        console.error('Error drawing template image:', error);
      }
    } else if (templateVideo && isVideo) {
      console.log('Drawing video frame');
      // Update video time if playing
      if (isPlaying) {
        templateVideo.currentTime = videoCurrentTime;
      }
      try {
        ctx.drawImage(templateVideo, 0, 0, canvas.width, canvas.height);
      } catch (error) {
        console.error('Error drawing video frame:', error);
      }
    } else {
      console.log('No template image or video to draw');
      // Draw placeholder
      ctx.fillStyle = '#666666';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ffffff';
      ctx.font = '24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('No Template Selected', canvas.width / 2, canvas.height / 2);
    }

    // Draw text elements (sorted by zIndex)
    const sortedElements = [...textElements].sort((a, b) => a.zIndex - b.zIndex);
    sortedElements.forEach(element => {
      drawTextElement(ctx, element);
    });

    // Draw grid if enabled
    if (showGrid) {
      drawGrid(ctx, canvas.width, canvas.height);
    }
  }, [templateImage, templateVideo, textElements, canvasSize, showGrid, isVideo, videoCurrentTime, isPlaying]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const gridSize = 20; // Grid cell size in pixels
    
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);
    
    // Draw vertical lines
    for (let x = 0; x <= width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    
    // Draw horizontal lines
    for (let y = 0; y <= height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    
    ctx.restore();
  };

  const drawTextElement = (ctx: CanvasRenderingContext2D, element: TextElement) => {
    ctx.save();
    
    // Apply transformations
    ctx.globalAlpha = element.opacity;
    
    // Set font properties
    const fontStyle = element.fontStyle === 'italic' ? 'italic ' : '';
    const fontWeight = element.fontWeight === 'bold' ? 'bold ' : element.fontWeight !== 'normal' ? `${element.fontWeight} ` : '';
    ctx.font = `${fontStyle}${fontWeight}${element.fontSize}px ${element.fontFamily}`;
    ctx.textAlign = element.textAlign;
    ctx.textBaseline = 'middle';
    
    // Calculate position
    const x = element.x;
    const y = element.y;
    
    // Apply rotation
    if (element.rotation !== 0) {
      ctx.translate(x, y);
      ctx.rotate((element.rotation * Math.PI) / 180);
      ctx.translate(-x, -y);
    }
    
    // Draw background if specified
    if (element.backgroundColor && element.backgroundColor !== 'transparent') {
      const textMetrics = ctx.measureText(element.text);
      const bgWidth = textMetrics.width + 20;
      const bgHeight = element.fontSize + 10;
      
      ctx.fillStyle = element.backgroundColor;
      ctx.fillRect(
        x - bgWidth / 2,
        y - bgHeight / 2,
        bgWidth,
        bgHeight
      );
    }
    
    // Apply text shadow/effects
    const shadowEffect = TEXT_EFFECTS.find(effect => effect.shadow === element.textShadow);
    if (shadowEffect && shadowEffect.shadow !== 'none') {
      if (shadowEffect.name === 'Drop Shadow' || shadowEffect.name === 'Heavy Shadow') {
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = shadowEffect.name === 'Heavy Shadow' ? 8 : 6;
        ctx.shadowOffsetX = shadowEffect.name === 'Heavy Shadow' ? 4 : 3;
        ctx.shadowOffsetY = shadowEffect.name === 'Heavy Shadow' ? 4 : 3;
      } else if (shadowEffect.name === 'Strong Outline') {
        // Draw outline
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.lineJoin = 'round';
        ctx.miterLimit = 2;
        ctx.strokeText(element.text, x, y);
      } else if (shadowEffect.name === 'Glow') {
        ctx.shadowColor = element.color;
        ctx.shadowBlur = 15;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
      }
    }
    
    // Draw border if specified
    if (element.borderWidth > 0 && element.borderColor) {
      ctx.strokeStyle = element.borderColor;
      ctx.lineWidth = element.borderWidth;
      ctx.lineJoin = 'round';
      ctx.strokeText(element.text, x, y);
    }
    
    // Draw text
    ctx.fillStyle = element.color;
    ctx.fillText(element.text, x, y);
    
    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    ctx.restore();
  };

  const addTextElement = () => {
    const newElement: TextElement = {
      id: `text-${Date.now()}`,
      text: 'Your Text Here',
      x: canvasSize.width / 2,
      y: canvasSize.height / 4,
      fontSize: 48,
      fontFamily: 'Impact',
      color: '#FFFFFF',
      backgroundColor: 'transparent',
      borderColor: '#000000',
      borderWidth: 0,
      rotation: 0,
      opacity: 1,
      textAlign: 'center',
      fontWeight: 'bold',
      fontStyle: 'normal',
      textShadow: TEXT_EFFECTS[2].shadow, // Strong Outline
      zIndex: textElements.length + 1,
      width: 200
    };
    
    setTextElements([...textElements, newElement]);
    setSelectedElement(newElement.id);
  };

  const addTextElementAtPosition = (position: 'top' | 'middle' | 'bottom') => {
    const positions = {
      top: { x: canvasSize.width / 2, y: canvasSize.height * 0.15 },
      middle: { x: canvasSize.width / 2, y: canvasSize.height / 2 },
      bottom: { x: canvasSize.width / 2, y: canvasSize.height * 0.85 }
    };

    const newElement: TextElement = {
      id: `text-${Date.now()}`,
      text: position === 'top' ? 'TOP TEXT' : position === 'middle' ? 'MIDDLE TEXT' : 'BOTTOM TEXT',
      x: positions[position].x,
      y: positions[position].y,
      fontSize: 48,
      fontFamily: 'Impact',
      color: '#FFFFFF',
      backgroundColor: 'transparent',
      borderColor: '#000000',
      borderWidth: 0,
      rotation: 0,
      opacity: 1,
      textAlign: 'center',
      fontWeight: 'bold',
      fontStyle: 'normal',
      textShadow: TEXT_EFFECTS[2].shadow, // Strong Outline
      zIndex: textElements.length + 1,
      width: 200
    };
    
    setTextElements([...textElements, newElement]);
    setSelectedElement(newElement.id);
  };

  const duplicateTextElement = (id: string) => {
    const elementToDuplicate = textElements.find(el => el.id === id);
    if (!elementToDuplicate) return;

    const newElement: TextElement = {
      ...elementToDuplicate,
      id: `text-${Date.now()}`,
      x: elementToDuplicate.x + 20,
      y: elementToDuplicate.y + 20,
      zIndex: textElements.length + 1
    };
    
    setTextElements([...textElements, newElement]);
    setSelectedElement(newElement.id);
  };

  const moveElementLayer = (id: string, direction: 'up' | 'down') => {
    setTextElements(prev => {
      const element = prev.find(el => el.id === id);
      if (!element) return prev;

      const newZIndex = direction === 'up' 
        ? Math.min(element.zIndex + 1, prev.length)
        : Math.max(element.zIndex - 1, 1);

      return prev.map(el => {
        if (el.id === id) {
          return { ...el, zIndex: newZIndex };
        }
        if (direction === 'up' && el.zIndex === newZIndex && el.id !== id) {
          return { ...el, zIndex: el.zIndex - 1 };
        }
        if (direction === 'down' && el.zIndex === newZIndex && el.id !== id) {
          return { ...el, zIndex: el.zIndex + 1 };
        }
        return el;
      });
    });
  };

  const updateTextElement = (id: string, updates: Partial<TextElement>) => {
    setTextElements(prev => prev.map(el => 
      el.id === id ? { ...el, ...updates } : el
    ));
  };

  const deleteElement = (id: string) => {
    setTextElements(prev => prev.filter(el => el.id !== id));
    setSelectedElement(null);
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;

    // Check if clicking on existing text element
    const clickedElement = textElements.find(element => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return false;

      const fontStyle = element.fontStyle === 'italic' ? 'italic ' : '';
      const fontWeight = element.fontWeight === 'bold' ? 'bold ' : element.fontWeight !== 'normal' ? `${element.fontWeight} ` : '';
      ctx.font = `${fontStyle}${fontWeight}${element.fontSize}px ${element.fontFamily}`;
      
      const textMetrics = ctx.measureText(element.text);
      const textWidth = textMetrics.width;
      const textHeight = element.fontSize;

      return (
        x >= element.x - textWidth / 2 &&
        x <= element.x + textWidth / 2 &&
        y >= element.y - textHeight / 2 &&
        y <= element.y + textHeight / 2
      );
    });

    if (clickedElement) {
      setSelectedElement(clickedElement.id);
      setIsDragging(true);
      setDragOffset({
        x: x - clickedElement.x,
        y: y - clickedElement.y
      });
    } else {
      setSelectedElement(null);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !selectedElement) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;

    updateTextElement(selectedElement, {
      x: x - dragOffset.x,
      y: y - dragOffset.y
    });
  };

  const handleCanvasMouseUp = () => {
    setIsDragging(false);
  };

  const handleExport = () => {
    if (canvasRef.current) {
      onExport(canvasRef.current);
    }
  };

  // Video control functions
  const togglePlayPause = () => {
    if (!templateVideo) return;
    
    if (isPlaying) {
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      // Start animation loop for video playback
      const animate = () => {
        if (templateVideo && !templateVideo.paused) {
          setVideoCurrentTime(templateVideo.currentTime);
          redrawCanvas();
          if (templateVideo.currentTime < templateVideo.duration) {
            requestAnimationFrame(animate);
          } else {
            setIsPlaying(false);
          }
        }
      };
      templateVideo.play();
      animate();
    }
  };

  const seekVideo = (time: number) => {
    if (!templateVideo) return;
    setVideoCurrentTime(time);
    if (templateVideo) {
      templateVideo.currentTime = time;
    }
    redrawCanvas();
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const selectedTextElement = textElements.find(el => el.id === selectedElement);

  return (
    <div className="flex h-screen bg-black text-white">
      {/* Left Toolbar */}
      <div className="w-20 bg-black border-r border-gray-800 flex flex-col items-center py-6 space-y-6">
        <button
          onClick={addTextElement}
          className="p-4 rounded-xl bg-white text-black hover:bg-gray-100 transition-all duration-300 hover:scale-110 shadow-lg"
          title="Add Text"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M9.93 13.5h4.14L12.94 9.5 9.93 13.5zM20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 1.9 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM10 16l1.5-4h1l1.5 4h-1l-.25-.75h-1.5L10.25 16H10z"/>
          </svg>
        </button>
        
        <div className="w-full h-px bg-gray-700"></div>
        
        {/* Quick Text Position Buttons */}
        <div className="flex flex-col space-y-2 w-full px-2">
          <button
            onClick={() => addTextElementAtPosition('top')}
            className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white transition-all duration-300 text-xs font-medium"
            title="Add Top Text"
          >
            TOP
          </button>
          <button
            onClick={() => addTextElementAtPosition('middle')}
            className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white transition-all duration-300 text-xs font-medium"
            title="Add Middle Text"
          >
            MID
          </button>
          <button
            onClick={() => addTextElementAtPosition('bottom')}
            className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white transition-all duration-300 text-xs font-medium"
            title="Add Bottom Text"
          >
            BOT
          </button>
        </div>
        
        <div className="w-full h-px bg-gray-700"></div>
        
        <button
          onClick={() => setShowGrid(!showGrid)}
          className={`p-3 rounded-lg transition-all duration-300 ${
            showGrid 
              ? 'bg-white text-black shadow-lg' 
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
          }`}
          title="Toggle Grid"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M3 3v18h18V3H3zm8 16H5v-6h6v6zm0-8H5V5h6v6zm8 8h-6v-6h6v6zm0-8h-6V5h6v6z"/>
          </svg>
        </button>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Toolbar */}
        <div className="h-18 bg-black border-b border-gray-800 flex items-center justify-between px-8">
          <div className="flex items-center space-x-6">
            <h2 className="text-2xl font-bold text-white">
              Meme Editor {isVideo ? '🎥' : ''}
            </h2>
            
            {/* Debug Info */}
            {template && (
              <div className="text-xs text-gray-400 bg-gray-900 px-3 py-1 rounded">
                {template.name} | {template.mediaType || 'image'} | {templateImage ? '✅ Image' : templateVideo ? '✅ Video' : '❌ Not Loaded'}
              </div>
            )}
            
            {/* Debug Test Button */}
            <button
              onClick={() => {
                console.log('Testing with known working image...');
                const testImg = new Image();
                testImg.onload = () => {
                  console.log('Test image loaded successfully');
                  setTemplateImage(testImg);
                  setCanvasSize({ width: testImg.width, height: testImg.height });
                };
                testImg.onerror = (e) => console.error('Test image failed:', e);
                testImg.src = 'https://imgflip.com/s/meme/Drake-Pointing.jpg';
              }}
              className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
            >
              Test Load
            </button>
            
            {/* Video Controls */}
            {isVideo && templateVideo && (
              <div className="flex items-center space-x-4 bg-gray-900 rounded-lg px-4 py-2">
                <button
                  onClick={togglePlayPause}
                  className="p-2 text-white hover:bg-gray-800 rounded transition-colors"
                >
                  {isPlaying ? '⏸️' : '▶️'}
                </button>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-400">{formatTime(videoCurrentTime)}</span>
                  <input
                    type="range"
                    min="0"
                    max={videoDuration}
                    step="0.1"
                    value={videoCurrentTime}
                    onChange={(e) => seekVideo(parseFloat(e.target.value))}
                    className="w-32 accent-white"
                  />
                  <span className="text-xs text-gray-400">{formatTime(videoDuration)}</span>
                </div>
              </div>
            )}
            
            <div className="flex items-center space-x-3 bg-gray-900 rounded-lg px-4 py-2">
              <button
                onClick={() => setZoom(zoom * 0.8)}
                className="p-1 text-gray-400 hover:text-white transition-colors rounded"
                disabled={zoom <= 0.2}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 13H5v-2h14v2z"/>
                </svg>
              </button>
              <span className="text-sm font-medium text-gray-300 min-w-[50px] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => setZoom(zoom * 1.25)}
                className="p-1 text-gray-400 hover:text-white transition-colors rounded"
                disabled={zoom >= 3}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                </svg>
              </button>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={handleExport}
              className="flex items-center space-x-2 px-6 py-3 bg-white text-black rounded hover:bg-gray-100 transition-all duration-300 font-medium shadow-lg"
            >
              <Download size={20} />
              <span>Export Meme</span>
            </button>
          </div>
        </div>

        {/* Canvas Container */}
        <div className="flex-1 overflow-auto bg-gray-900 p-8">
          <div className="flex justify-center">
            <div 
              className="relative bg-white shadow-2xl rounded-lg overflow-hidden"
              style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}
            >
              <canvas
                ref={canvasRef}
                width={canvasSize.width}
                height={canvasSize.height}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                className="block cursor-crosshair"
                style={{ maxWidth: '100%', height: 'auto' }}
              />
              {showGrid && (
                <div className="absolute inset-0 pointer-events-none opacity-30">
                  <svg width="100%" height="100%" className="absolute inset-0">
                    <defs>
                      <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#6b7280" strokeWidth="1"/>
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                  </svg>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right Properties Panel */}
      <div className="w-96 bg-black border-l border-gray-800">
        <div className="h-full flex flex-col">
          {/* Panel Header */}
          <div className="p-6 border-b border-gray-800">
            <h3 className="text-lg font-semibold text-white mb-2">Text Properties</h3>
            <p className="text-sm text-gray-400">
              {selectedTextElement ? 'Edit selected text' : 'Select text to edit properties'}
            </p>
          </div>

          {/* Text Layers Section */}
          {textElements.length > 0 && (
            <div className="border-b border-gray-800 p-4">
              <h4 className="text-sm font-medium text-gray-300 mb-3">Text Layers ({textElements.length})</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {textElements
                  .sort((a, b) => b.zIndex - a.zIndex)
                  .map((element) => (
                    <div
                      key={element.id}
                      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedElement === element.id
                          ? 'bg-white text-black border-white'
                          : 'bg-gray-900 border-gray-700 text-gray-300 hover:bg-gray-800 hover:border-gray-600'
                      }`}
                      onClick={() => setSelectedElement(element.id)}
                    >
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <div className="flex flex-col">
                          <span className="text-xs font-medium">
                            Layer {element.zIndex}
                          </span>
                          <span className="text-xs opacity-75 truncate max-w-[120px]">
                            {element.text.length > 15 ? `${element.text.substring(0, 15)}...` : element.text}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            moveElementLayer(element.id, 'up');
                          }}
                          className="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                          title="Move Up"
                          disabled={element.zIndex === textElements.length}
                        >
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M7 14l5-5 5 5z"/>
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            moveElementLayer(element.id, 'down');
                          }}
                          className="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                          title="Move Down"
                          disabled={element.zIndex === 1}
                        >
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M7 10l5 5 5-5z"/>
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            duplicateTextElement(element.id);
                          }}
                          className="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                          title="Duplicate"
                        >
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteElement(element.id);
                          }}
                          className="p-1 rounded hover:bg-red-700 text-gray-400 hover:text-red-400 transition-colors"
                          title="Delete"
                        >
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
              <div className="flex space-x-2 mt-3">
                <button
                  onClick={addTextElement}
                  className="flex-1 py-2 px-3 bg-white text-black rounded hover:bg-gray-100 transition-all font-medium text-sm"
                >
                  + Add Text
                </button>
                <button
                  onClick={() => addTextElementAtPosition('top')}
                  className="px-3 py-2 bg-gray-800 text-gray-300 rounded hover:bg-gray-700 hover:text-white transition-all text-sm"
                  title="Add Top Text"
                >
                  Top
                </button>
                <button
                  onClick={() => addTextElementAtPosition('bottom')}
                  className="px-3 py-2 bg-gray-800 text-gray-300 rounded hover:bg-gray-700 hover:text-white transition-all text-sm"
                  title="Add Bottom Text"
                >
                  Bot
                </button>
              </div>
            </div>
          )}

          {/* Panel Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {selectedTextElement ? (
              <div className="space-y-8">
                {/* Text Content */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">Text Content</label>
                  <textarea
                    value={selectedTextElement.text}
                    onChange={(e) => updateTextElement(selectedTextElement.id, { text: e.target.value })}
                    className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent resize-none"
                    rows={3}
                    placeholder="Enter your meme text..."
                  />
                </div>

                {/* Font Settings */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-gray-300 border-b border-gray-800 pb-2">Font Settings</h4>
                  
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Font Family</label>
                    <select
                      value={selectedTextElement.fontFamily}
                      onChange={(e) => updateTextElement(selectedTextElement.id, { fontFamily: e.target.value })}
                      className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white"
                    >
                      {FONTS.map(font => (
                        <option key={font} value={font}>{font}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Size</label>
                      <div className="space-y-2">
                        <input
                          type="range"
                          min="12"
                          max="120"
                          value={selectedTextElement.fontSize}
                          onChange={(e) => updateTextElement(selectedTextElement.id, { fontSize: parseInt(e.target.value) })}
                          className="w-full accent-white"
                        />
                        <div className="text-center text-xs text-gray-400 bg-gray-900 rounded px-2 py-1">
                          {selectedTextElement.fontSize}px
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Weight</label>
                      <select
                        value={selectedTextElement.fontWeight}
                        onChange={(e) => updateTextElement(selectedTextElement.id, { fontWeight: e.target.value as 'normal' | 'bold' | '100' | '300' | '400' | '500' | '600' | '700' | '800' | '900' })}
                        className="w-full p-2 bg-gray-900 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-white"
                      >
                        <option value="normal">Normal</option>
                        <option value="bold">Bold</option>
                        <option value="100">Thin</option>
                        <option value="300">Light</option>
                        <option value="500">Medium</option>
                        <option value="700">Bold</option>
                        <option value="900">Black</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => updateTextElement(selectedTextElement.id, { textAlign: 'left' })}
                      className={`p-2 rounded ${selectedTextElement.textAlign === 'left' ? 'bg-white text-black' : 'bg-gray-800'} hover:bg-white hover:text-black transition-colors`}
                    >
                      <svg className="w-4 h-4 mx-auto" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M15 15H3v2h12v-2zm0-8H3v2h12V7zM3 13h18v-2H3v2zm0 8h18v-2H3v2zM3 3v2h18V3H3z"/>
                      </svg>
                    </button>
                    <button
                      onClick={() => updateTextElement(selectedTextElement.id, { textAlign: 'center' })}
                      className={`p-2 rounded ${selectedTextElement.textAlign === 'center' ? 'bg-white text-black' : 'bg-gray-800'} hover:bg-white hover:text-black transition-colors`}
                    >
                      <svg className="w-4 h-4 mx-auto" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M7 15v2h10v-2H7zm-4 6h18v-2H3v2zm0-8h18v-2H3v2zm4-6v2h10V7H7zM3 3v2h18V3H3z"/>
                      </svg>
                    </button>
                    <button
                      onClick={() => updateTextElement(selectedTextElement.id, { textAlign: 'right' })}
                      className={`p-2 rounded ${selectedTextElement.textAlign === 'right' ? 'bg-white text-black' : 'bg-gray-800'} hover:bg-white hover:text-black transition-colors`}
                    >
                      <svg className="w-4 h-4 mx-auto" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M3 21h18v-2H3v2zm6-4h12v-2H9v2zm-6-4h18v-2H3v2zm6-4h12V7H9v2zM3 3v2h18V3H3z"/>
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Colors */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-gray-300 border-b border-gray-800 pb-2">Colors</h4>
                  <div className="grid grid-cols-8 gap-2">
                    {PRESET_COLORS.map(color => (
                      <button
                        key={color}
                        onClick={() => updateTextElement(selectedTextElement.id, { color })}
                        className={`w-8 h-8 rounded-lg border-2 transition-all hover:scale-110 ${
                          selectedTextElement.color === color ? 'border-white shadow-lg' : 'border-gray-600'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                {/* Text Effects */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Text Effects</label>
                  <select
                    value={TEXT_EFFECTS.findIndex(effect => effect.shadow === selectedTextElement.textShadow)}
                    onChange={(e) => updateTextElement(selectedTextElement.id, { textShadow: TEXT_EFFECTS[parseInt(e.target.value)].shadow })}
                    className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white"
                  >
                    {TEXT_EFFECTS.map((effect, index) => (
                      <option key={index} value={index}>{effect.name}</option>
                    ))}
                  </select>
                </div>

                {/* Opacity */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Opacity</label>
                  <div className="space-y-2">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={selectedTextElement.opacity}
                      onChange={(e) => updateTextElement(selectedTextElement.id, { opacity: parseFloat(e.target.value) })}
                      className="w-full accent-white"
                    />
                    <div className="text-center text-xs text-gray-400 bg-gray-900 rounded px-2 py-1">
                      {Math.round(selectedTextElement.opacity * 100)}%
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-4 border-t border-gray-800">
                  <button
                    onClick={() => deleteElement(selectedTextElement.id)}
                    className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
                  >
                    Delete Text
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">✏️</div>
                <p className="text-gray-400 mb-6">Select a text element to edit its properties</p>
                <div className="space-y-3">
                  <button
                    onClick={addTextElement}
                    className="w-full px-6 py-3 bg-white text-black rounded-lg hover:bg-gray-100 transition-all font-medium"
                  >
                    Add New Text
                  </button>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => addTextElementAtPosition('top')}
                      className="px-4 py-2 bg-gray-800 text-gray-300 rounded hover:bg-gray-700 hover:text-white transition-all text-sm font-medium"
                    >
                      Top Text
                    </button>
                    <button
                      onClick={() => addTextElementAtPosition('middle')}
                      className="px-4 py-2 bg-gray-800 text-gray-300 rounded hover:bg-gray-700 hover:text-white transition-all text-sm font-medium"
                    >
                      Middle
                    </button>
                    <button
                      onClick={() => addTextElementAtPosition('bottom')}
                      className="px-4 py-2 bg-gray-800 text-gray-300 rounded hover:bg-gray-700 hover:text-white transition-all text-sm font-medium"
                    >
                      Bottom
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedMemeEditor; 