'use client';

import React from 'react';
import { LayoutType, Panel } from '@/lib/store';
import ComicPanel from './ComicPanel';

interface ComicGridProps {
  layout: LayoutType;
  panels: Panel[];
  onImageUpload: (panelId: string, file: File) => void;
  onAddTextBubble: (panelId: string, type: 'speech' | 'thought') => void;
  onUpdateTextBubble: (panelId: string, bubbleId: string, updates: Partial<{ text: string; x: number; y: number; type: string }>) => void;
  onDeleteTextBubble: (panelId: string, bubbleId: string) => void;
  onSelectMemeFromLibrary: (panelId: string, url: string) => void;
}

const ComicGrid: React.FC<ComicGridProps> = ({ 
  layout, 
  panels, 
  onImageUpload, 
  onAddTextBubble, 
  onUpdateTextBubble, 
  onDeleteTextBubble,
  onSelectMemeFromLibrary 
}) => {
  const getGridClass = () => {
    switch (layout) {
      case 'horizontal':
        return `grid grid-cols-${Math.min(panels.length, 3)} gap-4`;
      case 'vertical':
        return 'grid grid-cols-1 gap-4';
      case 'grid':
        return panels.length <= 4 
          ? 'grid grid-cols-2 gap-4' 
          : 'grid grid-cols-3 gap-4';
      default:
        return 'grid grid-cols-2 gap-4';
    }
  };

  const getContainerClass = () => {
    const baseClass = 'w-full max-w-5xl mx-auto p-4 bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-600 rounded-lg shadow-lg';
    
    if (layout === 'vertical') {
      return `${baseClass} max-h-[80vh] overflow-y-auto`;
    }
    
    return baseClass;
  };

  return (
    <div className={getContainerClass()}>
      <div className={getGridClass()}>
        {panels.map((panel) => (
          <ComicPanel
            key={panel.id}
            panel={panel}
            onImageUpload={onImageUpload}
            onAddTextBubble={onAddTextBubble}
            onUpdateTextBubble={onUpdateTextBubble}
            onDeleteTextBubble={onDeleteTextBubble}
            onSelectMemeFromLibrary={onSelectMemeFromLibrary}
          />
        ))}
      </div>
    </div>
  );
};

export default ComicGrid; 