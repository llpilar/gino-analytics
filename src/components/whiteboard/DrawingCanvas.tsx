import { useRef, useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import {
  Pencil,
  Eraser,
  Square,
  Circle,
  Minus,
  ArrowRight,
  Trash2,
  Undo2,
  Redo2,
  Download,
  Palette,
  MousePointer,
  Type,
  Move
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Point {
  x: number;
  y: number;
}

interface DrawingElement {
  type: 'pencil' | 'line' | 'rectangle' | 'circle' | 'arrow' | 'text';
  points: Point[];
  color: string;
  strokeWidth: number;
  text?: string;
}

interface DrawingCanvasProps {
  initialData?: string;
  onSave?: (data: string) => void;
  width?: number;
  height?: number;
}

const COLORS = [
  '#000000', '#ffffff', '#ef4444', '#f97316', '#eab308', 
  '#22c55e', '#14b8a6', '#3b82f6', '#8b5cf6', '#ec4899'
];

type Tool = 'select' | 'pencil' | 'eraser' | 'line' | 'rectangle' | 'circle' | 'arrow' | 'text' | 'pan';

export const DrawingCanvas = ({ initialData, onSave, width = 1200, height = 800 }: DrawingCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [tool, setTool] = useState<Tool>('pencil');
  const [color, setColor] = useState('#3b82f6');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [isDrawing, setIsDrawing] = useState(false);
  const [elements, setElements] = useState<DrawingElement[]>([]);
  const [currentElement, setCurrentElement] = useState<DrawingElement | null>(null);
  const [history, setHistory] = useState<DrawingElement[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Load initial data
  useEffect(() => {
    if (initialData) {
      try {
        const parsed = JSON.parse(initialData);
        setElements(parsed.elements || []);
        setHistory([parsed.elements || []]);
      } catch (e) {
        console.error('Failed to parse drawing data:', e);
      }
    }
  }, [initialData]);

  // Redraw canvas when elements change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = '#2a2a3e';
    ctx.lineWidth = 1;
    const gridSize = 20;
    
    for (let x = offset.x % gridSize; x < canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    
    for (let y = offset.y % gridSize; y < canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Draw all elements
    [...elements, currentElement].filter(Boolean).forEach((element) => {
      if (!element) return;
      
      ctx.strokeStyle = element.color;
      ctx.fillStyle = element.color;
      ctx.lineWidth = element.strokeWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      switch (element.type) {
        case 'pencil':
          if (element.points.length < 2) return;
          ctx.beginPath();
          ctx.moveTo(element.points[0].x + offset.x, element.points[0].y + offset.y);
          element.points.slice(1).forEach((point) => {
            ctx.lineTo(point.x + offset.x, point.y + offset.y);
          });
          ctx.stroke();
          break;

        case 'line':
          if (element.points.length < 2) return;
          ctx.beginPath();
          ctx.moveTo(element.points[0].x + offset.x, element.points[0].y + offset.y);
          ctx.lineTo(element.points[1].x + offset.x, element.points[1].y + offset.y);
          ctx.stroke();
          break;

        case 'arrow':
          if (element.points.length < 2) return;
          const start = element.points[0];
          const end = element.points[1];
          const headLength = 15;
          const angle = Math.atan2(end.y - start.y, end.x - start.x);
          
          ctx.beginPath();
          ctx.moveTo(start.x + offset.x, start.y + offset.y);
          ctx.lineTo(end.x + offset.x, end.y + offset.y);
          ctx.stroke();
          
          // Arrow head
          ctx.beginPath();
          ctx.moveTo(end.x + offset.x, end.y + offset.y);
          ctx.lineTo(
            end.x + offset.x - headLength * Math.cos(angle - Math.PI / 6),
            end.y + offset.y - headLength * Math.sin(angle - Math.PI / 6)
          );
          ctx.moveTo(end.x + offset.x, end.y + offset.y);
          ctx.lineTo(
            end.x + offset.x - headLength * Math.cos(angle + Math.PI / 6),
            end.y + offset.y - headLength * Math.sin(angle + Math.PI / 6)
          );
          ctx.stroke();
          break;

        case 'rectangle':
          if (element.points.length < 2) return;
          const rectStart = element.points[0];
          const rectEnd = element.points[1];
          ctx.strokeRect(
            rectStart.x + offset.x,
            rectStart.y + offset.y,
            rectEnd.x - rectStart.x,
            rectEnd.y - rectStart.y
          );
          break;

        case 'circle':
          if (element.points.length < 2) return;
          const circleStart = element.points[0];
          const circleEnd = element.points[1];
          const radius = Math.sqrt(
            Math.pow(circleEnd.x - circleStart.x, 2) + 
            Math.pow(circleEnd.y - circleStart.y, 2)
          );
          ctx.beginPath();
          ctx.arc(circleStart.x + offset.x, circleStart.y + offset.y, radius, 0, 2 * Math.PI);
          ctx.stroke();
          break;

        case 'text':
          if (element.text && element.points.length > 0) {
            ctx.font = `${element.strokeWidth * 6}px Inter, sans-serif`;
            ctx.fillText(element.text, element.points[0].x + offset.x, element.points[0].y + offset.y);
          }
          break;
      }
    });
  }, [elements, currentElement, offset, scale]);

  const getCanvasPoint = useCallback((e: React.MouseEvent | React.TouchEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    return {
      x: (clientX - rect.left) / scale - offset.x,
      y: (clientY - rect.top) / scale - offset.y,
    };
  }, [offset, scale]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (tool === 'pan') {
      setIsPanning(true);
      setPanStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
      return;
    }

    const point = getCanvasPoint(e);
    setIsDrawing(true);

    if (tool === 'text') {
      const text = prompt('Digite o texto:');
      if (text) {
        const newElement: DrawingElement = {
          type: 'text',
          points: [point],
          color,
          strokeWidth,
          text,
        };
        const newElements = [...elements, newElement];
        setElements(newElements);
        saveToHistory(newElements);
      }
      return;
    }

    if (tool === 'eraser') {
      // Find and remove element at point
      const threshold = 10;
      const filtered = elements.filter((el) => {
        return !el.points.some((p) => 
          Math.abs(p.x - point.x) < threshold && Math.abs(p.y - point.y) < threshold
        );
      });
      if (filtered.length !== elements.length) {
        setElements(filtered);
        saveToHistory(filtered);
      }
      return;
    }

    const newElement: DrawingElement = {
      type: tool as DrawingElement['type'],
      points: [point],
      color,
      strokeWidth,
    };
    setCurrentElement(newElement);
  }, [tool, color, strokeWidth, elements, getCanvasPoint, offset]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      setOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
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
  }, [isDrawing, currentElement, getCanvasPoint, isPanning, panStart]);

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
    saveToHistory(newElements);
  }, [isDrawing, currentElement, elements]);

  const saveToHistory = (newElements: DrawingElement[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newElements);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setElements(history[historyIndex - 1]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setElements(history[historyIndex + 1]);
    }
  };

  const clear = () => {
    setElements([]);
    saveToHistory([]);
  };

  const handleSave = () => {
    const data = JSON.stringify({ elements });
    onSave?.(data);
  };

  const downloadAsImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const link = document.createElement('a');
    link.download = 'whiteboard-drawing.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const tools: { id: Tool; icon: React.ReactNode; label: string }[] = [
    { id: 'select', icon: <MousePointer className="w-4 h-4" />, label: 'Selecionar' },
    { id: 'pencil', icon: <Pencil className="w-4 h-4" />, label: 'Caneta' },
    { id: 'eraser', icon: <Eraser className="w-4 h-4" />, label: 'Borracha' },
    { id: 'line', icon: <Minus className="w-4 h-4" />, label: 'Linha' },
    { id: 'arrow', icon: <ArrowRight className="w-4 h-4" />, label: 'Seta' },
    { id: 'rectangle', icon: <Square className="w-4 h-4" />, label: 'Retângulo' },
    { id: 'circle', icon: <Circle className="w-4 h-4" />, label: 'Círculo' },
    { id: 'text', icon: <Type className="w-4 h-4" />, label: 'Texto' },
    { id: 'pan', icon: <Move className="w-4 h-4" />, label: 'Mover' },
  ];

  return (
    <div ref={containerRef} className="flex flex-col h-full bg-background rounded-xl overflow-hidden border">
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-2 bg-card border-b flex-wrap">
        {/* Tools */}
        <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
          {tools.map((t) => (
            <Button
              key={t.id}
              variant={tool === t.id ? 'default' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setTool(t.id)}
              title={t.label}
            >
              {t.icon}
            </Button>
          ))}
        </div>

        <Separator orientation="vertical" className="h-8" />

        {/* Colors */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon" className="h-8 w-8">
              <div 
                className="w-5 h-5 rounded-full border-2 border-background"
                style={{ backgroundColor: color }}
              />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2">
            <div className="grid grid-cols-5 gap-1">
              {COLORS.map((c) => (
                <button
                  key={c}
                  className={cn(
                    "w-8 h-8 rounded-lg transition-all border-2",
                    color === c ? "border-primary scale-110" : "border-transparent"
                  )}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Stroke Width */}
        <div className="flex items-center gap-2 px-2">
          <span className="text-xs text-muted-foreground">Espessura:</span>
          <Slider
            value={[strokeWidth]}
            onValueChange={([v]) => setStrokeWidth(v)}
            min={1}
            max={20}
            step={1}
            className="w-24"
          />
          <span className="text-xs w-4">{strokeWidth}</span>
        </div>

        <Separator orientation="vertical" className="h-8" />

        {/* Actions */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={undo}
            disabled={historyIndex === 0}
            title="Desfazer"
          >
            <Undo2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
            title="Refazer"
          >
            <Redo2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={clear}
            title="Limpar tudo"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex-1" />

        {/* Export */}
        <Button variant="outline" size="sm" onClick={downloadAsImage}>
          <Download className="w-4 h-4 mr-2" />
          Exportar PNG
        </Button>

        {onSave && (
          <Button size="sm" onClick={handleSave}>
            Salvar
          </Button>
        )}
      </div>

      {/* Canvas */}
      <div className="flex-1 overflow-hidden">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className={cn(
            "touch-none",
            tool === 'pan' ? "cursor-grab" : "cursor-crosshair",
            isPanning && "cursor-grabbing"
          )}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
      </div>
    </div>
  );
};
