import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { X, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface StickyNoteData {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  width: number;
  height: number;
}

interface StickyNoteProps {
  note: StickyNoteData;
  onUpdate: (note: StickyNoteData) => void;
  onDelete: (id: string) => void;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

const NOTE_COLORS = [
  { value: '#fef08a', label: 'Amarelo' },
  { value: '#bbf7d0', label: 'Verde' },
  { value: '#bfdbfe', label: 'Azul' },
  { value: '#fecaca', label: 'Vermelho' },
  { value: '#e9d5ff', label: 'Roxo' },
  { value: '#fed7aa', label: 'Laranja' },
];

export const StickyNote = ({ note, onUpdate, onDelete, isSelected, onSelect }: StickyNoteProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const noteRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isEditing || isResizing) return;
    e.stopPropagation();
    onSelect(note.id);
    
    const rect = noteRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
    setIsDragging(true);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      const parent = noteRef.current?.parentElement;
      if (!parent) return;
      
      const parentRect = parent.getBoundingClientRect();
      const newX = e.clientX - parentRect.left - dragOffset.x;
      const newY = e.clientY - parentRect.top - dragOffset.y;
      
      onUpdate({
        ...note,
        x: Math.max(0, Math.min(newX, parentRect.width - note.width)),
        y: Math.max(0, Math.min(newY, parentRect.height - note.height)),
      });
    }
    
    if (isResizing) {
      const parent = noteRef.current?.parentElement;
      if (!parent) return;
      
      const parentRect = parent.getBoundingClientRect();
      const newWidth = Math.max(120, e.clientX - parentRect.left - note.x);
      const newHeight = Math.max(80, e.clientY - parentRect.top - note.y);
      
      onUpdate({
        ...note,
        width: Math.min(newWidth, 400),
        height: Math.min(newHeight, 400),
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, dragOffset, note]);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdate({ ...note, text: e.target.value });
  };

  const handleColorChange = (color: string) => {
    onUpdate({ ...note, color });
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
  };

  return (
    <div
      ref={noteRef}
      className={cn(
        "absolute rounded-lg shadow-lg transition-shadow cursor-move select-none",
        isSelected && "ring-2 ring-primary shadow-xl",
        isDragging && "opacity-80 cursor-grabbing"
      )}
      style={{
        left: note.x,
        top: note.y,
        width: note.width,
        height: note.height,
        backgroundColor: note.color,
        zIndex: isSelected ? 100 : 10,
      }}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-2 py-1 border-b border-black/10">
        <GripVertical className="w-4 h-4 text-black/30" />
        
        {isSelected && (
          <div className="flex items-center gap-1">
            {NOTE_COLORS.map((c) => (
              <button
                key={c.value}
                className={cn(
                  "w-4 h-4 rounded-full border border-black/20 transition-transform hover:scale-110",
                  note.color === c.value && "ring-1 ring-black/30"
                )}
                style={{ backgroundColor: c.value }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleColorChange(c.value);
                }}
                title={c.label}
              />
            ))}
            
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 ml-1 text-black/50 hover:text-red-600 hover:bg-red-100"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(note.id);
              }}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-2 h-[calc(100%-28px)]">
        {isEditing ? (
          <Textarea
            ref={textareaRef}
            value={note.text}
            onChange={handleTextChange}
            onBlur={handleBlur}
            className="w-full h-full resize-none border-none bg-transparent text-black text-sm focus-visible:ring-0 p-0"
            placeholder="Digite sua nota..."
          />
        ) : (
          <p className="text-black text-sm whitespace-pre-wrap overflow-hidden h-full">
            {note.text || <span className="text-black/40 italic">Clique duplo para editar</span>}
          </p>
        )}
      </div>

      {/* Resize Handle */}
      {isSelected && (
        <div
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
          onMouseDown={handleResizeStart}
        >
          <svg
            className="w-4 h-4 text-black/30"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M22 22H20V20H22V22ZM22 18H20V16H22V18ZM18 22H16V20H18V22ZM22 14H20V12H22V14ZM18 18H16V16H18V18ZM14 22H12V20H14V22Z" />
          </svg>
        </div>
      )}
    </div>
  );
};
