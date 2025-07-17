'use client';

import React, { useState, useRef, useEffect } from 'react';
import { TextBubble } from '@/lib/store';

interface EditableTextBubbleProps {
  bubble: TextBubble;
  panelId: string;
  onUpdate: (panelId: string, bubbleId: string, updates: Partial<TextBubble>) => void;
  onDelete: (panelId: string, bubbleId: string) => void;
}

const EditableTextBubble: React.FC<EditableTextBubbleProps> = ({ 
  bubble, 
  panelId, 
  onUpdate, 
  onDelete 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const bubbleStyle = bubble.type === 'speech' 
    ? 'bg-white border-2 border-black' 
    : 'bg-blue-100 border-2 border-blue-400';

  const tailStyle = bubble.type === 'speech'
    ? 'absolute -bottom-2 left-4 w-0 h-0 border-l-[10px] border-r-[10px] border-t-[10px] border-l-transparent border-r-transparent border-t-black'
    : '';

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  const handleTextClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleTextChange = (text: string) => {
    onUpdate(panelId, bubble.id, { text });
  };

  const handleTextBlur = () => {
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      setIsEditing(false);
    }
    if (e.key === 'Escape') {
      setIsEditing(false);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isEditing) return;
    
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - (bubble.x * 2.56), // Approximate conversion from % to px
      y: e.clientY - (bubble.y * 2.56)
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;

    const parent = e.currentTarget.parentElement;
    if (!parent) return;

    const rect = parent.getBoundingClientRect();
    const newX = Math.max(0, Math.min(85, ((e.clientX - dragStart.x) / rect.width) * 100));
    const newY = Math.max(0, Math.min(85, ((e.clientY - dragStart.y) / rect.height) * 100));

    onUpdate(panelId, bubble.id, { x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(panelId, bubble.id);
  };

  return (
    <div
      className={`absolute ${bubbleStyle} rounded-lg px-2 py-1 text-xs max-w-32 shadow-lg cursor-move select-none group`}
      style={{
        left: `${bubble.x}%`,
        top: `${bubble.y}%`,
        minWidth: '60px',
        minHeight: '24px',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Speech bubble tail */}
      {bubble.type === 'speech' && (
        <div className={tailStyle}></div>
      )}

      {/* Delete button (shows on hover) */}
      <button
        onClick={handleDelete}
        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
        title="Delete bubble"
      >
        ×
      </button>

      {/* Text content */}
      {isEditing ? (
        <textarea
          ref={textareaRef}
          value={bubble.text}
          onChange={(e) => handleTextChange(e.target.value)}
          onBlur={handleTextBlur}
          onKeyDown={handleKeyDown}
          className="w-full h-full bg-transparent border-none outline-none resize-none text-center text-xs"
          style={{ minHeight: '20px' }}
          rows={2}
        />
      ) : (
        <div
          onClick={handleTextClick}
          className="text-center cursor-text min-h-[20px] flex items-center justify-center"
        >
          {bubble.text || 'Click to edit'}
        </div>
      )}
    </div>
  );
};

export default EditableTextBubble; 