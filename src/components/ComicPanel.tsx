'use client';

import React, { useState } from 'react';
import { Panel, TextBubble } from '@/lib/store';
import EditableTextBubble from './EditableTextBubble';
import MemeLibrary from './MemeLibrary';

interface ComicPanelProps {
  panel: Panel;
  onImageUpload: (panelId: string, file: File) => void;
  onAddTextBubble: (panelId: string, type: 'speech' | 'thought') => void;
  onUpdateTextBubble: (panelId: string, bubbleId: string, updates: Partial<TextBubble>) => void;
  onDeleteTextBubble: (panelId: string, bubbleId: string) => void;
  onSelectMemeFromLibrary: (panelId: string, url: string) => void;
}

const ComicPanel: React.FC<ComicPanelProps> = ({ 
  panel, 
  onImageUpload, 
  onAddTextBubble, 
  onUpdateTextBubble, 
  onDeleteTextBubble,
  onSelectMemeFromLibrary 
}) => {
  const [showMemeLibrary, setShowMemeLibrary] = useState(false);
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImageUpload(panel.id, file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      onImageUpload(panel.id, file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleMemeSelect = (url: string) => {
    onSelectMemeFromLibrary(panel.id, url);
  };

  return (
    <div 
      className="relative w-full h-64 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 overflow-hidden"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      {/* Background Image */}
      {panel.image ? (
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src={panel.image} 
          alt="Panel background" 
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
          <div className="mb-3">Drop image here or</div>
          <div className="flex flex-col gap-2">
            <label className="cursor-pointer bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm text-center">
              Upload Image
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
            <button 
              onClick={() => setShowMemeLibrary(true)}
              className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded text-sm"
            >
              Choose Meme
            </button>
          </div>
        </div>
      )}

      {/* Text Bubbles */}
      {panel.textBubbles.map((bubble) => (
        <EditableTextBubble 
          key={bubble.id} 
          bubble={bubble} 
          panelId={panel.id}
          onUpdate={onUpdateTextBubble}
          onDelete={onDeleteTextBubble}
        />
      ))}

      {/* Add Bubble Controls (only show when panel has image) */}
      {panel.image && (
        <div className="absolute top-2 right-2 flex gap-1">
          <button
            onClick={() => onAddTextBubble(panel.id, 'speech')}
            className="bg-yellow-400 hover:bg-yellow-500 text-black px-2 py-1 rounded text-xs"
            title="Add Speech Bubble"
          >
            💬
          </button>
          <button
            onClick={() => onAddTextBubble(panel.id, 'thought')}
            className="bg-blue-400 hover:bg-blue-500 text-white px-2 py-1 rounded text-xs"
            title="Add Thought Bubble"
          >
            💭
          </button>
        </div>
      )}

      {/* Meme Library Modal */}
      <MemeLibrary 
        isOpen={showMemeLibrary}
        onClose={() => setShowMemeLibrary(false)}
        onSelectMeme={handleMemeSelect}
      />
    </div>
  );
};

// Removed - now using EditableTextBubble

export default ComicPanel; 