import { useRef, useState, useEffect, useCallback } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  MousePointer2,
  Hand,
  CheckSquare,
  Triangle,
  Square,
  ArrowUp,
  Type,
  Frame,
  Spline,
  Sparkles,
  Undo2,
  Redo2,
  Minus,
  Plus,
  Home,
  Pencil,
  StickyNote as StickyNoteIcon,
  Circle,
  Eraser
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { StickyNote, StickyNoteData } from './StickyNote';

interface Point {
  x: number;
  y: number;
}

// Ramer-Douglas-Peucker algorithm for point simplification
const perpendicularDistance = (point: Point, lineStart: Point, lineEnd: Point): number => {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const mag = Math.sqrt(dx * dx + dy * dy);
  
  if (mag === 0) {
    return Math.sqrt(Math.pow(point.x - lineStart.x, 2) + Math.pow(point.y - lineStart.y, 2));
  }
  
  const u = ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / (mag * mag);
  
  let closestX: number, closestY: number;
  if (u < 0) {
    closestX = lineStart.x;
    closestY = lineStart.y;
  } else if (u > 1) {
    closestX = lineEnd.x;
    closestY = lineEnd.y;
  } else {
    closestX = lineStart.x + u * dx;
    closestY = lineStart.y + u * dy;
  }
  
  return Math.sqrt(Math.pow(point.x - closestX, 2) + Math.pow(point.y - closestY, 2));
};

const simplifyPoints = (points: Point[], epsilon: number): Point[] => {
  if (points.length <= 2) return points;
  
  let maxDistance = 0;
  let maxIndex = 0;
  
  for (let i = 1; i < points.length - 1; i++) {
    const distance = perpendicularDistance(points[i], points[0], points[points.length - 1]);
    if (distance > maxDistance) {
      maxDistance = distance;
      maxIndex = i;
    }
  }
  
  if (maxDistance > epsilon) {
    const left = simplifyPoints(points.slice(0, maxIndex + 1), epsilon);
    const right = simplifyPoints(points.slice(maxIndex), epsilon);
    return [...left.slice(0, -1), ...right];
  }
  
  return [points[0], points[points.length - 1]];
};

// Catmull-Rom spline for smooth curves
const getCatmullRomPoint = (p0: Point, p1: Point, p2: Point, p3: Point, t: number): Point => {
  const t2 = t * t;
  const t3 = t2 * t;
  
  return {
    x: 0.5 * ((2 * p1.x) + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
    y: 0.5 * ((2 * p1.y) + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
  };
};

const smoothPoints = (points: Point[], segments: number = 6): Point[] => {
  if (points.length < 4) return points;
  
  const smoothed: Point[] = [points[0]];
  
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[Math.min(points.length - 1, i + 1)];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    
    for (let j = 1; j <= segments; j++) {
      const t = j / segments;
      smoothed.push(getCatmullRomPoint(p0, p1, p2, p3, t));
    }
  }
  
  return smoothed;
};

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

type Tool = 'select' | 'pan' | 'task' | 'triangle' | 'rectangle' | 'sticky' | 'arrow' | 'text' | 'frame' | 'connector' | 'templates' | 'pencil' | 'circle' | 'eraser';

interface ToolItem {
  id: Tool;
  icon: React.ReactNode;
  label: string;
  shortcut: string;
  hasFill?: boolean;
  fillColor?: string;
  hasSubline?: boolean;
  sublineColor?: string;
}

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
  
  const [stickyNotes, setStickyNotes] = useState<StickyNoteData[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);

  const [canvasSize, setCanvasSize] = useState({ width: 3000, height: 2000 });

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

    // Clear canvas with light cream/beige background like ClickUp
    ctx.fillStyle = '#f8f7f4';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw subtle dot grid
    ctx.fillStyle = '#d4d3d0';
    const gridSize = 24 * scale;
    const offsetX = (offset.x * scale) % gridSize;
    const offsetY = (offset.y * scale) % gridSize;
    
    for (let x = offsetX; x < canvas.width; x += gridSize) {
      for (let y = offsetY; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.arc(x, y, 1, 0, Math.PI * 2);
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
  }, [elements, currentElement, offset, zoom]);

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

    if (tool === 'select' || tool === 'task' || tool === 'frame' || tool === 'connector' || tool === 'templates') {
      return;
    }

    const typeMap: Record<Tool, DrawingElement['type']> = {
      pencil: 'pencil',
      triangle: 'triangle',
      rectangle: 'rectangle',
      arrow: 'arrow',
      circle: 'circle',
      select: 'pencil',
      pan: 'pencil',
      task: 'pencil',
      sticky: 'pencil',
      text: 'text',
      frame: 'pencil',
      connector: 'pencil',
      templates: 'pencil',
      eraser: 'pencil',
    };

    const newElement: DrawingElement = {
      id: `el-${Date.now()}`,
      type: typeMap[tool] || 'pencil',
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

    // Apply stroke smoothing for pencil tool
    let finalElement = currentElement;
    if (currentElement.type === 'pencil' && currentElement.points.length > 4) {
      // First simplify to reduce noise, then smooth with Catmull-Rom spline
      const simplified = simplifyPoints(currentElement.points, 2);
      const smoothed = smoothPoints(simplified, 4);
      finalElement = { ...currentElement, points: smoothed };
    }

    const newElements = [...elements, finalElement];
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
  };

  const resetView = () => {
    setOffset({ x: 0, y: 0 });
    setZoom(100);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      if (e.key === 'v' || e.key === 'V') setTool('select');
      if (e.key === 'h' || e.key === 'H') setTool('pan');
      if (e.key === 'd' || e.key === 'D') setTool('triangle');
      if (e.key === 'r' || e.key === 'R') setTool('rectangle');
      if (e.key === 'n' || e.key === 'N') setTool('sticky');
      if (e.key === 'a' || e.key === 'A') setTool('arrow');
      if (e.key === 't' || e.key === 'T') setTool('text');
      if (e.key === 'f' || e.key === 'F') setTool('frame');
      if (e.key === 'p' || e.key === 'P') setTool('pencil');
      if (e.key === 'c' || e.key === 'C') setTool('circle');
      
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [historyIndex, history]);

  const tools: ToolItem[] = [
    { id: 'select', icon: <MousePointer2 className="w-5 h-5" />, label: 'Selecionar', shortcut: 'V' },
    { id: 'pan', icon: <Hand className="w-5 h-5" />, label: 'Mover', shortcut: 'H' },
    { id: 'task', icon: <CheckSquare className="w-5 h-5" />, label: 'Task', shortcut: 'T', hasSubline: true, sublineColor: '#3b82f6' },
    { id: 'triangle', icon: <Triangle className="w-5 h-5" />, label: 'Triângulo', shortcut: 'D' },
    { id: 'rectangle', icon: <Square className="w-5 h-5 fill-current" />, label: 'Retângulo', shortcut: 'R', hasFill: true, fillColor: '#374151' },
    { id: 'sticky', icon: <StickyNoteIcon className="w-5 h-5" />, label: 'Nota', shortcut: 'N', hasFill: true, fillColor: '#fbbf24' },
    { id: 'arrow', icon: <ArrowUp className="w-5 h-5" />, label: 'Seta', shortcut: 'A' },
    { id: 'text', icon: <Type className="w-5 h-5" />, label: 'Texto', shortcut: 'T' },
    { id: 'frame', icon: <Frame className="w-5 h-5" />, label: 'Frame', shortcut: 'F' },
    { id: 'connector', icon: <Spline className="w-5 h-5" />, label: 'Conector', shortcut: 'C' },
    { id: 'templates', icon: <Sparkles className="w-5 h-5 text-purple-500" />, label: 'Templates', shortcut: '' },
  ];

  return (
    <TooltipProvider delayDuration={200}>
      <div 
        ref={containerRef}
        className="relative w-full h-full overflow-hidden"
        style={{ backgroundColor: '#f8f7f4' }}
      >
        {/* Canvas */}
        <canvas
          ref={canvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          className={cn(
            'absolute top-0 left-0',
            tool === 'pan' && 'cursor-grab',
            isPanning && 'cursor-grabbing',
            tool === 'pencil' && 'cursor-crosshair',
            tool === 'text' && 'cursor-text',
            tool === 'eraser' && 'cursor-cell'
          )}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        />

        {/* Sticky Notes Layer */}
        <div 
          className="absolute top-0 left-0 pointer-events-none"
          style={{
            transform: `scale(${zoom / 100}) translate(${offset.x}px, ${offset.y}px)`,
            transformOrigin: 'top left',
          }}
        >
          {stickyNotes.map((note) => (
            <div key={note.id} className="pointer-events-auto">
              <StickyNote
                note={note}
                isSelected={selectedNoteId === note.id}
                onSelect={() => setSelectedNoteId(note.id)}
                onUpdate={handleUpdateNote}
                onDelete={handleDeleteNote}
              />
            </div>
          ))}
        </div>

        {/* Bottom Left Zoom Controls - ClickUp style */}
        <div className="absolute bottom-6 left-6 flex items-center gap-1 bg-white rounded-lg shadow-lg border border-gray-200 px-2 py-1.5">
          <button 
            onClick={resetView}
            className="p-1.5 hover:bg-gray-100 rounded transition-colors"
            title="Voltar ao início"
          >
            <Home className="w-4 h-4 text-gray-600" />
          </button>
          <button 
            onClick={() => setZoom(prev => Math.max(25, prev - 10))}
            className="p-1.5 hover:bg-gray-100 rounded transition-colors"
          >
            <Minus className="w-4 h-4 text-gray-600" />
          </button>
          <span className="px-2 text-sm font-medium text-gray-700 min-w-[48px] text-center">
            {zoom}%
          </span>
          <button 
            onClick={() => setZoom(prev => Math.min(200, prev + 10))}
            className="p-1.5 hover:bg-gray-100 rounded transition-colors"
          >
            <Plus className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* Bottom Center Floating Toolbar - ClickUp style */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center">
          <div className="flex items-center bg-white rounded-2xl shadow-xl border border-gray-200 px-2 py-2 gap-0.5">
            {tools.map((t, index) => (
              <div key={t.id} className="relative">
                {/* Shortcut label above */}
                <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] text-gray-400 font-medium">
                  {t.shortcut}
                </span>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setTool(t.id)}
                      className={cn(
                        'relative flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all',
                        tool === t.id 
                          ? 'bg-gray-800 text-white shadow-md' 
                          : 'text-gray-600 hover:bg-gray-100'
                      )}
                    >
                      {/* Tool icon with optional fill background */}
                      <div 
                        className={cn(
                          'flex items-center justify-center',
                          t.hasFill && t.id !== 'sticky' && 'p-1 rounded'
                        )}
                        style={t.hasFill && tool !== t.id ? { backgroundColor: t.fillColor } : undefined}
                      >
                        {t.id === 'sticky' ? (
                          <div className="w-6 h-6 rounded bg-yellow-400 flex items-center justify-center">
                            <svg className="w-4 h-4 text-yellow-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M4 8 Q 8 4, 12 8 T 20 8" />
                            </svg>
                          </div>
                        ) : t.id === 'rectangle' ? (
                          <div 
                            className="w-6 h-6 rounded-sm"
                            style={{ backgroundColor: tool === t.id ? 'white' : '#374151' }}
                          />
                        ) : t.id === 'task' ? (
                          <div className="flex flex-col items-center">
                            <div className="flex items-center gap-1">
                              <CheckSquare className="w-4 h-4" />
                              <span className="text-[10px] font-medium">Task</span>
                            </div>
                            <div className="w-8 h-0.5 bg-blue-500 mt-1 rounded-full" />
                          </div>
                        ) : t.id === 'templates' ? (
                          <div className="relative">
                            <Sparkles className="w-5 h-5 text-purple-500" />
                            <div className="absolute -top-1 -right-1 w-2 h-2 bg-pink-500 rounded-full" />
                          </div>
                        ) : (
                          t.icon
                        )}
                      </div>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="bg-gray-900 text-white text-xs px-2 py-1">
                    {t.label} {t.shortcut && `(${t.shortcut})`}
                  </TooltipContent>
                </Tooltip>

                {/* Separator after specific tools */}
                {(index === 1 || index === 5 || index === 8) && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-8 bg-gray-200" />
                )}
              </div>
            ))}

            {/* Undo/Redo */}
            <div className="flex items-center gap-0.5 ml-2 pl-2 border-l border-gray-200">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={undo}
                    disabled={historyIndex <= 0}
                    className={cn(
                      'p-2 rounded-lg transition-colors',
                      historyIndex > 0 
                        ? 'text-gray-600 hover:bg-gray-100' 
                        : 'text-gray-300 cursor-not-allowed'
                    )}
                  >
                    <Undo2 className="w-5 h-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="bg-gray-900 text-white text-xs px-2 py-1">
                  Desfazer (Ctrl+Z)
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={redo}
                    disabled={historyIndex >= history.length - 1}
                    className={cn(
                      'p-2 rounded-lg transition-colors',
                      historyIndex < history.length - 1 
                        ? 'text-gray-600 hover:bg-gray-100' 
                        : 'text-gray-300 cursor-not-allowed'
                    )}
                  >
                    <Redo2 className="w-5 h-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="bg-gray-900 text-white text-xs px-2 py-1">
                  Refazer (Ctrl+Shift+Z)
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>

        {/* Auto-save indicator */}
        <button
          onClick={handleSave}
          className="absolute top-4 right-4 px-3 py-1.5 bg-white rounded-lg shadow border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Salvar
        </button>
      </div>
    </TooltipProvider>
  );
};
