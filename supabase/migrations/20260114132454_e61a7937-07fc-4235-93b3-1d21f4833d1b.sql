-- Create whiteboard boards table
CREATE TABLE public.whiteboard_boards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT 'Novo Board',
  description TEXT,
  is_shared BOOLEAN NOT NULL DEFAULT false,
  background_color TEXT DEFAULT '#1a1a2e',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create whiteboard columns table (for kanban)
CREATE TABLE public.whiteboard_columns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  board_id UUID NOT NULL REFERENCES public.whiteboard_boards(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  color TEXT DEFAULT '#3b82f6',
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create whiteboard cards/notes table
CREATE TABLE public.whiteboard_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  column_id UUID NOT NULL REFERENCES public.whiteboard_columns(id) ON DELETE CASCADE,
  board_id UUID NOT NULL REFERENCES public.whiteboard_boards(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  color TEXT DEFAULT '#fbbf24',
  tags TEXT[] DEFAULT '{}',
  position INTEGER NOT NULL DEFAULT 0,
  created_by UUID NOT NULL,
  assigned_to UUID,
  due_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.whiteboard_boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whiteboard_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whiteboard_cards ENABLE ROW LEVEL SECURITY;

-- RLS Policies for boards
CREATE POLICY "Users can view their own boards and shared boards"
ON public.whiteboard_boards
FOR SELECT
USING (auth.uid() = user_id OR is_shared = true);

CREATE POLICY "Users can create their own boards"
ON public.whiteboard_boards
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own boards"
ON public.whiteboard_boards
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own boards"
ON public.whiteboard_boards
FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for columns
CREATE POLICY "Users can view columns of accessible boards"
ON public.whiteboard_columns
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.whiteboard_boards b 
    WHERE b.id = board_id AND (b.user_id = auth.uid() OR b.is_shared = true)
  )
);

CREATE POLICY "Users can create columns on their boards"
ON public.whiteboard_columns
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.whiteboard_boards b 
    WHERE b.id = board_id AND b.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update columns on their boards"
ON public.whiteboard_columns
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.whiteboard_boards b 
    WHERE b.id = board_id AND b.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete columns on their boards"
ON public.whiteboard_columns
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.whiteboard_boards b 
    WHERE b.id = board_id AND b.user_id = auth.uid()
  )
);

-- RLS Policies for cards
CREATE POLICY "Users can view cards of accessible boards"
ON public.whiteboard_cards
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.whiteboard_boards b 
    WHERE b.id = board_id AND (b.user_id = auth.uid() OR b.is_shared = true)
  )
);

CREATE POLICY "Users can create cards on accessible boards"
ON public.whiteboard_cards
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.whiteboard_boards b 
    WHERE b.id = board_id AND (b.user_id = auth.uid() OR b.is_shared = true)
  )
);

CREATE POLICY "Users can update cards on accessible boards"
ON public.whiteboard_cards
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.whiteboard_boards b 
    WHERE b.id = board_id AND (b.user_id = auth.uid() OR b.is_shared = true)
  )
);

CREATE POLICY "Users can delete cards on accessible boards"
ON public.whiteboard_cards
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.whiteboard_boards b 
    WHERE b.id = board_id AND (b.user_id = auth.uid() OR b.is_shared = true)
  )
);

-- Enable realtime for collaborative editing
ALTER PUBLICATION supabase_realtime ADD TABLE public.whiteboard_boards;
ALTER PUBLICATION supabase_realtime ADD TABLE public.whiteboard_columns;
ALTER PUBLICATION supabase_realtime ADD TABLE public.whiteboard_cards;

-- Create trigger for updated_at
CREATE TRIGGER update_whiteboard_boards_updated_at
BEFORE UPDATE ON public.whiteboard_boards
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_whiteboard_cards_updated_at
BEFORE UPDATE ON public.whiteboard_cards
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();