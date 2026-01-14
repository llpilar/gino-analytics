import { useRef, useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Pencil,
  Eraser,
  Square,
  Circle,
  Triangle,
  Minus,
  ArrowUp,
  Trash2,
  Undo2,
  Redo2,
  Download,
  MousePointer2,
  Type,
  Hand,
  StickyNote as StickyNoteIcon,
  Plus,
  Minus as MinusIcon,
  ZoomIn,
  Maximize2,
  Image as ImageIcon,
  Save
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { StickyNote, StickyNoteData } from './StickyNote';

interface Point {
  x: number;
  y: number;
}

interface DrawingElement {
  id: string;
  type: 'pencil' | 'line' | 'rectangle' | 'circle' | 'triangle' | 'arrow' | 'text';
  points: Point[];
  color: string;
  strokeWidth: number;
  fill?: string;
  text?: string;
  selected?: boolean;
}

interface DrawingData {
  elements: DrawingElement[];
  stickyNotes: StickyNoteData[];
}

interface InfiniteCanvasProps {
  initialData?: string;
  onSave?: (data: string) => void;
  boardTitle?: string;
}

const COLORS = [
  '#1e1e1e', '#ffffff', '#ef4444', '#f97316', '#eab308', 
  '#22c55e', '#14b8a6', '#3b82f6', '#8b5cf6', '#ec4899'
];

const FILL_COLORS = [
  'transparent', '#fef3c7', '#dcfce7', '#dbeafe', '#fce7f3', '#f3e8ff', '#e0e7ff'
];

type Tool = 'select' | 'pencil' | 'eraser' | 'line' | 'rectangle' | 'circle' | 'triangle' | 'arrow' | 'text' | 'pan' | 'sticky';

export const InfiniteCanvas = ({ initialData, onSave, boardTitle = 'Whiteboard' }: InfiniteCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [tool, setTool] = useState<Tool>('select');
  const [color, setColor] = useState('#1e1e1e');
  const [fillColor, setFillColor] = useState('transparent');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [isDrawing, setIsDrawing] = useState(false);
  const [elements, setElements] = useState<DrawingElement[]>([]);
  const [currentElement, setCurrentElement] = useState<DrawingElement | null>(null);
  const [history, setHistory] = useState<DrawingData[]>([{ elements: [], stickyNotes: [] }]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(100);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  
  // Sticky notes state
  const [stickyNotes, setStickyNotes] = useState<StickyNoteData[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);

  // Canvas dimensions
  const [canvasSize, setCanvasSize] = useState({ width: 3000, height: 2000 });

  // Handle resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setCanvasSize({ 
          width: Math.max(rect.width * 3, 3000), 
          height: Math.max(rect.height * 3, 2000) 
        });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Load initial data
  useEffect(() => {
    if (initialData) {
      try {
        const parsed = JSON.parse(initialData) as DrawingData;
        setElements(parsed.elements || []);
        setStickyNotes(parsed.stickyNotes || []);
        setHistory([{ elements: parsed.elements || [], stickyNotes: parsed.stickyNotes || [] }]);
      } catch (e) {
        console.error('Failed to parse drawing data:', e);
      }
    }
  }, [initialData]);

  // Redraw canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const scale = zoom / 100;

    // Clear canvas with white background
    ctx.fillStyle = '#fafafa';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw dot grid
    ctx.fillStyle = '#e5e5e5';
    const gridSize = 20 * scale;
    const offsetX = (offset.x * scale) % gridSize;
    const offsetY = (offset.y * scale) % gridSize;
    
    for (let x = offsetX; x < canvas.width; x += gridSize) {
      for (let y = offsetY; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.arc(x, y, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Draw all elements
    ctx.save();
    ctx.scale(scale, scale);
    ctx.translate(offset.x, offset.y);

    [...elements, currentElement].filter(Boolean).forEach((element) => {
      if (!element) return;
      
      ctx.strokeStyle = element.color;
      ctx.fillStyle = element.fill || 'transparent';
      ctx.lineWidth = element.strokeWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      switch (element.type) {
        case 'pencil':
          if (element.points.length < 2) return;
          ctx.beginPath();
          ctx.moveTo(element.points[0].x, element.points[0].y);
          element.points.slice(1).forEach((point) => {
            ctx.lineTo(point.x, point.y);
          });
          ctx.stroke();
          break;

        case 'line':
          if (element.points.length < 2) return;
          ctx.beginPath();
          ctx.moveTo(element.points[0].x, element.points[0].y);
          ctx.lineTo(element.points[1].x, element.points[1].y);
          ctx.stroke();
          break;

        case 'arrow':
          if (element.points.length < 2) return;
          const start = element.points[0];
          const end = element.points[1];
          const headLength = 15;
          const angle = Math.atan2(end.y - start.y, end.x - start.x);
          
          ctx.beginPath();
          ctx.moveTo(start.x, start.y);
          ctx.lineTo(end.x, end.y);
          ctx.stroke();
          
          // Arrow head
          ctx.beginPath();
          ctx.moveTo(end.x, end.y);
          ctx.lineTo(
            end.x - headLength * Math.cos(angle - Math.PI / 6),
            end.y - headLength * Math.sin(angle - Math.PI / 6)
          );
          ctx.lineTo(
            end.x - headLength * Math.cos(angle + Math.PI / 6),
            end.y - headLength * Math.sin(angle + Math.PI / 6)
          );
          ctx.closePath();
          ctx.fillStyle = element.color;
          ctx.fill();
          break;

        case 'rectangle':
          if (element.points.length < 2) return;
          const rectX = Math.min(element.points[0].x, element.points[1].x);
          const rectY = Math.min(element.points[0].y, element.points[1].y);
          const rectW = Math.abs(element.points[1].x - element.points[0].x);
          const rectH = Math.abs(element.points[1].y - element.points[0].y);
          
          if (element.fill && element.fill !== 'transparent') {
            ctx.fillStyle = element.fill;
            ctx.fillRect(rectX, rectY, rectW, rectH);
          }
          ctx.strokeRect(rectX, rectY, rectW, rectH);
          
          // Selection handles
          if (element.id === selectedElementId) {
            drawSelectionHandles(ctx, rectX, rectY, rectW, rectH);
          }
          break;

        case 'circle':
          if (element.points.length < 2) return;
          const circleX = (element.points[0].x + element.points[1].x) / 2;
          const circleY = (element.points[0].y + element.points[1].y) / 2;
          const radiusX = Math.abs(element.points[1].x - element.points[0].x) / 2;
          const radiusY = Math.abs(element.points[1].y - element.points[0].y) / 2;
          
          ctx.beginPath();
          ctx.ellipse(circleX, circleY, radiusX, radiusY, 0, 0, 2 * Math.PI);
          if (element.fill && element.fill !== 'transparent') {
            ctx.fillStyle = element.fill;
            ctx.fill();
          }
          ctx.stroke();
          break;

        case 'triangle':
          if (element.points.length < 2) return;
          const triX1 = (element.points[0].x + element.points[1].x) / 2;
          const triY1 = element.points[0].y;
          const triX2 = element.points[0].x;
          const triY2 = element.points[1].y;
          const triX3 = element.points[1].x;
          const triY3 = element.points[1].y;
          
          ctx.beginPath();
          ctx.moveTo(triX1, triY1);
          ctx.lineTo(triX2, triY2);
          ctx.lineTo(triX3, triY3);
          ctx.closePath();
          if (element.fill && element.fill !== 'transparent') {
            ctx.fillStyle = element.fill;
            ctx.fill();
          }
          ctx.stroke();
          break;

        case 'text':
          if (element.text && element.points.length > 0) {
            ctx.font = `${element.strokeWidth * 8}px Inter, sans-serif`;
            ctx.fillStyle = element.color;
            ctx.fillText(element.text, element.points[0].x, element.points[0].y);
          }
          break;
      }
    });

    ctx.restore();
  }, [elements, currentElement, offset, zoom, selectedElementId]);

  const drawSelectionHandles = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
    const handleSize = 8;
    ctx.fillStyle = '#3b82f6';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;

    // Draw dashed border
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = '#3b82f6';
    ctx.strokeRect(x - 2, y - 2, w + 4, h + 4);
    ctx.setLineDash([]);

    // Corner handles
    const handles = [
      { x: x - handleSize/2, y: y - handleSize/2 },
      { x: x + w - handleSize/2, y: y - handleSize/2 },
      { x: x - handleSize/2, y: y + h - handleSize/2 },
      { x: x + w - handleSize/2, y: y + h - handleSize/2 },
    ];

    handles.forEach(handle => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(handle.x, handle.y, handleSize, handleSize);
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.strokeRect(handle.x, handle.y, handleSize, handleSize);
    });
  };

  const getCanvasPoint = useCallback((e: React.MouseEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const scale = zoom / 100;
    
    return {
      x: (e.clientX - rect.left) / scale - offset.x,
      y: (e.clientY - rect.top) / scale - offset.y,
    };
  }, [offset, zoom]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setSelectedNoteId(null);
    setSelectedElementId(null);
    
    if (tool === 'pan') {
      setIsPanning(true);
      setPanStart({ x: e.clientX - offset.x * (zoom / 100), y: e.clientY - offset.y * (zoom / 100) });
      return;
    }

    if (tool === 'sticky') {
      const point = getCanvasPoint(e);
      const newNote: StickyNoteData = {
        id: `note-${Date.now()}`,
        x: point.x,
        y: point.y,
        text: '',
        color: '#fef08a',
        width: 180,
        height: 140,
      };
      
      const newNotes = [...stickyNotes, newNote];
      setStickyNotes(newNotes);
      setSelectedNoteId(newNote.id);
      saveToHistory({ elements, stickyNotes: newNotes });
      setTool('select');
      return;
    }

    const point = getCanvasPoint(e);
    setIsDrawing(true);

    if (tool === 'text') {
      const text = prompt('Digite o texto:');
      if (text) {
        const newElement: DrawingElement = {
          id: `el-${Date.now()}`,
          type: 'text',
          points: [point],
          color,
          strokeWidth,
          text,
        };
        const newElements = [...elements, newElement];
        setElements(newElements);
        saveToHistory({ elements: newElements, stickyNotes });
      }
      setIsDrawing(false);
      return;
    }

    if (tool === 'eraser') {
      const threshold = 20;
      const filtered = elements.filter((el) => {
        return !el.points.some((p) => 
          Math.abs(p.x - point.x) < threshold && Math.abs(p.y - point.y) < threshold
        );
      });
      if (filtered.length !== elements.length) {
        setElements(filtered);
        saveToHistory({ elements: filtered, stickyNotes });
      }
      return;
    }

    if (tool === 'select') {
      // Check if clicking on an element
      return;
    }

    const newElement: DrawingElement = {
      id: `el-${Date.now()}`,
      type: tool as DrawingElement['type'],
      points: [point],
      color,
      strokeWidth,
      fill: fillColor,
    };
    setCurrentElement(newElement);
  }, [tool, color, strokeWidth, fillColor, elements, stickyNotes, getCanvasPoint, offset, zoom]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      const scale = zoom / 100;
      setOffset({
        x: (e.clientX - panStart.x) / scale,
        y: (e.clientY - panStart.y) / scale,
      });
      return;
    }

    if (!isDrawing || !currentElement) return;

    const point = getCanvasPoint(e);

    if (currentElement.type === 'pencil') {
      setCurrentElement({
        ...currentElement,
        points: [...currentElement.points, point],
      });
    } else {
      setCurrentElement({
        ...currentElement,
        points: [currentElement.points[0], point],
      });
    }
  }, [isDrawing, currentElement, getCanvasPoint, isPanning, panStart, zoom]);

  const handleMouseUp = useCallback(() => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }

    if (!isDrawing || !currentElement) return;

    const newElements = [...elements, currentElement];
    setElements(newElements);
    setCurrentElement(null);
    setIsDrawing(false);
    saveToHistory({ elements: newElements, stickyNotes });
  }, [isDrawing, currentElement, elements, stickyNotes]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -10 : 10;
      setZoom(prev => Math.min(200, Math.max(25, prev + delta)));
    }
  }, []);

  const saveToHistory = (data: DrawingData) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(data);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setElements(history[newIndex].elements);
      setStickyNotes(history[newIndex].stickyNotes);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setElements(history[newIndex].elements);
      setStickyNotes(history[newIndex].stickyNotes);
    }
  };

  const handleSave = () => {
    const data = JSON.stringify({ elements, stickyNotes });
    onSave?.(data);
  };

  const handleUpdateNote = (updatedNote: StickyNoteData) => {
    const newNotes = stickyNotes.map(n => n.id === updatedNote.id ? updatedNote : n);
    setStickyNotes(newNotes);
  };

  const handleDeleteNote = (id: string) => {
    const newNotes = stickyNotes.filter(n => n.id !== id);
    setStickyNotes(newNotes);
    saveToHistory({ elements, stickyNotes: newNotes });
    setSelectedNoteId(null);
  };

  const zoomIn = () => setZoom(prev => Math.min(200, prev + 25));
  const zoomOut = () => setZoom(prev => Math.max(25, prev - 25));
  const zoomReset = () => { setZoom(100); setOffset({ x: 0, y: 0 }); };

  const tools: { id: Tool; icon: React.ReactNode; label: string; shortcut?: string }[] = [
    { id: 'select', icon: <MousePointer2 className="w-5 h-5" />, label: 'Selecionar', shortcut: 'V' },
    { id: 'pan', icon: <Hand className="w-5 h-5" />, label: 'Mover', shortcut: 'H' },
    { id: 'pencil', icon: <Pencil className="w-5 h-5" />, label: 'Caneta', shortcut: 'D' },
    { id: 'line', icon: <Minus className="w-5 h-5" />, label: 'Linha' },
    { id: 'arrow', icon: <ArrowUp className="w-5 h-5" />, label: 'Seta', shortcut: 'A' },
    { id: 'rectangle', icon: <Square className="w-5 h-5" />, label: 'Retângulo', shortcut: 'R' },
    { id: 'circle', icon: <Circle className="w-5 h-5" />, label: 'Círculo' },
    { id: 'triangle', icon: <Triangle className="w-5 h-5" />, label: 'Triângulo' },
    { id: 'sticky', icon: <StickyNoteIcon className="w-5 h-5" />, label: 'Nota', shortcut: 'N' },
    { id: 'text', icon: <Type className="w-5 h-5" />, label: 'Texto', shortcut: 'T' },
    { id: 'eraser', icon: <Eraser className="w-5 h-5" />, label: 'Borracha' },
  ];

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      switch (e.key.toLowerCase()) {
        case 'v': setTool('select'); break;
        case 'h': setTool('pan'); break;
        case 'd': setTool('pencil'); break;
        case 'a': setTool('arrow'); break;
        case 'r': setTool('rectangle'); break;
        case 'n': setTool('sticky'); break;
        case 't': setTool('text'); break;
        case 'z':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            if (e.shiftKey) redo();
            else undo();
          }
          break;
        case 'delete':
        case 'backspace':
          if (selectedNoteId) {
            handleDeleteNote(selectedNoteId);
          }
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNoteId, historyIndex]);

  return (
    <div ref={containerRef} className="relative w-full h-full bg-[#fafafa] overflow-hidden">
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        className={cn(
          "absolute inset-0",
          tool === 'pan' ? "cursor-grab" : tool === 'sticky' ? "cursor-copy" : "cursor-crosshair",
          isPanning && "cursor-grabbing"
        )}
        style={{
          width: canvasSize.width,
          height: canvasSize.height,
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      />
      
      {/* Sticky Notes Layer */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          transform: `scale(${zoom / 100})`,
          transformOrigin: '0 0',
        }}
      >
        <div 
          style={{ 
            transform: `translate(${offset.x}px, ${offset.y}px)`,
          }}
        >
          {stickyNotes.map((note) => (
            <div key={note.id} className="pointer-events-auto">
              <StickyNote
                note={note}
                onUpdate={handleUpdateNote}
                onDelete={handleDeleteNote}
                isSelected={selectedNoteId === note.id}
                onSelect={setSelectedNoteId}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Zoom Controls - Bottom Left */}
      <div className="absolute bottom-20 left-4 flex items-center gap-1 bg-white rounded-lg shadow-lg border p-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={zoomReset}
          title="Resetar zoom"
        >
          <Maximize2 className="w-4 h-4" />
        </Button>
        <Separator orientation="vertical" className="h-6" />
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={zoomOut}
          disabled={zoom <= 25}
        >
          <MinusIcon className="w-4 h-4" />
        </Button>
        <span className="w-12 text-center text-sm font-medium">{zoom}%</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={zoomIn}
          disabled={zoom >= 200}
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {/* Main Toolbar - Bottom Center */}
      <TooltipProvider delayDuration={100}>
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-white rounded-xl shadow-xl border p-1.5">
          {tools.map((t, index) => (
            <div key={t.id} className="flex items-center">
              {index === 2 && <Separator orientation="vertical" className="h-8 mx-1" />}
              {index === 8 && <Separator orientation="vertical" className="h-8 mx-1" />}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={tool === t.id ? 'default' : 'ghost'}
                    size="icon"
                    className={cn(
                      "h-10 w-10 rounded-lg",
                      tool === t.id && "bg-primary text-primary-foreground shadow-md"
                    )}
                    onClick={() => setTool(t.id)}
                  >
                    {t.icon}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>{t.label} {t.shortcut && <span className="text-muted-foreground ml-1">({t.shortcut})</span>}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          ))}

          <Separator orientation="vertical" className="h-8 mx-1" />

          {/* Colors */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-lg">
                <div 
                  className="w-6 h-6 rounded border-2 border-gray-300"
                  style={{ backgroundColor: color }}
                />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-3" side="top">
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Cor do traço</p>
                  <div className="grid grid-cols-5 gap-1">
                    {COLORS.map((c) => (
                      <button
                        key={c}
                        className={cn(
                          "w-7 h-7 rounded-lg transition-all border-2",
                          color === c ? "border-primary scale-110" : "border-transparent"
                        )}
                        style={{ backgroundColor: c }}
                        onClick={() => setColor(c)}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Preenchimento</p>
                  <div className="grid grid-cols-4 gap-1">
                    {FILL_COLORS.map((c) => (
                      <button
                        key={c}
                        className={cn(
                          "w-7 h-7 rounded-lg transition-all border-2",
                          fillColor === c ? "border-primary scale-110" : "border-gray-200",
                          c === 'transparent' && "bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjUiIGhlaWdodD0iNSIgZmlsbD0iI2RkZCIvPjxyZWN0IHg9IjUiIHk9IjUiIHdpZHRoPSI1IiBoZWlnaHQ9IjUiIGZpbGw9IiNkZGQiLz48L3N2Zz4=')]"
                        )}
                        style={{ backgroundColor: c === 'transparent' ? undefined : c }}
                        onClick={() => setFillColor(c)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Separator orientation="vertical" className="h-8 mx-1" />

          {/* Undo/Redo */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-lg"
                onClick={undo}
                disabled={historyIndex === 0}
              >
                <Undo2 className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Desfazer (Ctrl+Z)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-lg"
                onClick={redo}
                disabled={historyIndex >= history.length - 1}
              >
                <Redo2 className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Refazer (Ctrl+Shift+Z)</TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>

      {/* Top Right Actions */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <Button variant="outline" size="sm" className="bg-white shadow-sm" onClick={() => {
          const canvas = canvasRef.current;
          if (!canvas) return;
          const link = document.createElement('a');
          link.download = 'whiteboard.png';
          link.href = canvas.toDataURL('image/png');
          link.click();
        }}>
          <Download className="w-4 h-4 mr-2" />
          Exportar
        </Button>
        
        {onSave && (
          <Button size="sm" className="shadow-sm" onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Salvar
          </Button>
        )}
      </div>

      {/* Delete hint */}
      {(selectedNoteId || selectedElementId) && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/80 text-white text-sm px-3 py-1.5 rounded-lg">
          Pressione <kbd className="bg-white/20 px-1.5 py-0.5 rounded mx-1">Delete</kbd> para remover
        </div>
      )}
    </div>
  );
};
