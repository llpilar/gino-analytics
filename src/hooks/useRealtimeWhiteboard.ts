import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface CursorPosition {
  x: number;
  y: number;
}

interface Collaborator {
  id: string;
  name: string;
  color: string;
  cursor: CursorPosition;
  lastSeen: number;
}

interface DrawingElement {
  id: string;
  type: 'pencil' | 'line' | 'rectangle' | 'circle' | 'triangle' | 'arrow' | 'text';
  points: { x: number; y: number }[];
  color: string;
  strokeWidth: number;
  fill?: string;
  text?: string;
  selected?: boolean;
}

interface StickyNoteData {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  width: number;
  height: number;
}

interface DrawingData {
  elements: DrawingElement[];
  stickyNotes: StickyNoteData[];
}

const COLLABORATOR_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
];

const getRandomColor = () => COLLABORATOR_COLORS[Math.floor(Math.random() * COLLABORATOR_COLORS.length)];

export const useRealtimeWhiteboard = (boardId: string) => {
  const { user } = useAuth();
  const [collaborators, setCollaborators] = useState<Map<string, Collaborator>>(new Map());
  const [remoteElements, setRemoteElements] = useState<DrawingElement[]>([]);
  const [remoteStickyNotes, setRemoteStickyNotes] = useState<StickyNoteData[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const myColorRef = useRef(getRandomColor());
  const cursorThrottleRef = useRef<number>(0);
  const drawingThrottleRef = useRef<number>(0);

  // Broadcast cursor position
  const broadcastCursor = useCallback((position: CursorPosition) => {
    if (!channelRef.current || !user) return;
    
    const now = Date.now();
    // Throttle cursor updates to ~30fps
    if (now - cursorThrottleRef.current < 33) return;
    cursorThrottleRef.current = now;

    channelRef.current.send({
      type: 'broadcast',
      event: 'cursor',
      payload: {
        userId: user.id,
        cursor: position,
      },
    });
  }, [user]);

  // Broadcast drawing update
  const broadcastDrawing = useCallback((data: DrawingData) => {
    if (!channelRef.current || !user) return;
    
    const now = Date.now();
    // Throttle drawing updates to ~10fps while drawing
    if (now - drawingThrottleRef.current < 100) return;
    drawingThrottleRef.current = now;

    channelRef.current.send({
      type: 'broadcast',
      event: 'drawing',
      payload: {
        userId: user.id,
        elements: data.elements,
        stickyNotes: data.stickyNotes,
      },
    });
  }, [user]);

  // Broadcast element added
  const broadcastElementAdded = useCallback((element: DrawingElement) => {
    if (!channelRef.current || !user) return;

    channelRef.current.send({
      type: 'broadcast',
      event: 'element_added',
      payload: {
        userId: user.id,
        element,
      },
    });
  }, [user]);

  // Broadcast sticky note added/updated
  const broadcastStickyNote = useCallback((note: StickyNoteData, action: 'add' | 'update' | 'delete') => {
    if (!channelRef.current || !user) return;

    channelRef.current.send({
      type: 'broadcast',
      event: 'sticky_note',
      payload: {
        userId: user.id,
        note,
        action,
      },
    });
  }, [user]);

  // Setup realtime channel
  useEffect(() => {
    if (!user || !boardId) return;

    const channel = supabase.channel(`whiteboard:${boardId}`, {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    channelRef.current = channel;

    // Handle presence updates
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const newCollaborators = new Map<string, Collaborator>();
      
      Object.entries(state).forEach(([userId, presences]) => {
        if (userId !== user.id && presences.length > 0) {
          const presence = presences[0] as { name?: string; color?: string };
          newCollaborators.set(userId, {
            id: userId,
            name: presence.name || 'Colaborador',
            color: presence.color || getRandomColor(),
            cursor: { x: 0, y: 0 },
            lastSeen: Date.now(),
          });
        }
      });
      
      setCollaborators(newCollaborators);
    });

    // Handle cursor broadcasts
    channel.on('broadcast', { event: 'cursor' }, ({ payload }) => {
      if (payload.userId === user.id) return;
      
      setCollaborators(prev => {
        const updated = new Map(prev);
        const existing = updated.get(payload.userId);
        
        if (existing) {
          updated.set(payload.userId, {
            ...existing,
            cursor: payload.cursor,
            lastSeen: Date.now(),
          });
        }
        
        return updated;
      });
    });

    // Handle drawing broadcasts
    channel.on('broadcast', { event: 'drawing' }, ({ payload }) => {
      if (payload.userId === user.id) return;
      setRemoteElements(payload.elements || []);
      setRemoteStickyNotes(payload.stickyNotes || []);
    });

    // Handle individual element additions
    channel.on('broadcast', { event: 'element_added' }, ({ payload }) => {
      if (payload.userId === user.id) return;
      setRemoteElements(prev => [...prev.filter(e => e.id !== payload.element.id), payload.element]);
    });

    // Handle sticky note changes
    channel.on('broadcast', { event: 'sticky_note' }, ({ payload }) => {
      if (payload.userId === user.id) return;
      
      setRemoteStickyNotes(prev => {
        if (payload.action === 'delete') {
          return prev.filter(n => n.id !== payload.note.id);
        } else if (payload.action === 'add') {
          return [...prev, payload.note];
        } else {
          return prev.map(n => n.id === payload.note.id ? payload.note : n);
        }
      });
    });

    // Subscribe to channel
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        setIsConnected(true);
        
        // Track presence
        await channel.track({
          name: user.email?.split('@')[0] || 'Usuário',
          color: myColorRef.current,
          online_at: new Date().toISOString(),
        });
      }
    });

    // Listen for database changes (for persistence sync)
    const drawingChannel = supabase
      .channel(`whiteboard_drawings:${boardId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'whiteboard_drawings',
          filter: `board_id=eq.${boardId}`,
        },
        (payload) => {
          // Only sync if the change came from another user
          try {
            const data = JSON.parse(payload.new.drawing_data) as DrawingData;
            setRemoteElements(data.elements || []);
            setRemoteStickyNotes(data.stickyNotes || []);
          } catch (e) {
            console.error('Failed to parse drawing data:', e);
          }
        }
      )
      .subscribe();

    // Cleanup
    return () => {
      channel.unsubscribe();
      drawingChannel.unsubscribe();
      channelRef.current = null;
      setIsConnected(false);
    };
  }, [user, boardId]);

  // Remove stale collaborators (not seen in 10 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setCollaborators(prev => {
        const updated = new Map(prev);
        updated.forEach((collab, id) => {
          if (now - collab.lastSeen > 10000) {
            updated.delete(id);
          }
        });
        return updated;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return {
    collaborators: Array.from(collaborators.values()),
    isConnected,
    myColor: myColorRef.current,
    broadcastCursor,
    broadcastDrawing,
    broadcastElementAdded,
    broadcastStickyNote,
    remoteElements,
    remoteStickyNotes,
  };
};
