-- Add drawing data column to whiteboard_cards for storing canvas drawings
ALTER TABLE public.whiteboard_cards 
ADD COLUMN drawing_data TEXT;

-- Create a dedicated table for full canvas boards
CREATE TABLE public.whiteboard_drawings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  board_id UUID NOT NULL REFERENCES public.whiteboard_boards(id) ON DELETE CASCADE,
  drawing_data TEXT NOT NULL,
  thumbnail TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.whiteboard_drawings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for drawings
CREATE POLICY "Users can view drawings of accessible boards"
ON public.whiteboard_drawings
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.whiteboard_boards b 
    WHERE b.id = board_id AND (b.user_id = auth.uid() OR b.is_shared = true)
  )
);

CREATE POLICY "Users can create drawings on accessible boards"
ON public.whiteboard_drawings
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.whiteboard_boards b 
    WHERE b.id = board_id AND (b.user_id = auth.uid() OR b.is_shared = true)
  )
);

CREATE POLICY "Users can update drawings on accessible boards"
ON public.whiteboard_drawings
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.whiteboard_boards b 
    WHERE b.id = board_id AND (b.user_id = auth.uid() OR b.is_shared = true)
  )
);

CREATE POLICY "Users can delete drawings on accessible boards"
ON public.whiteboard_drawings
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.whiteboard_boards b 
    WHERE b.id = board_id AND (b.user_id = auth.uid() OR b.is_shared = true)
  )
);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.whiteboard_drawings;

-- Create trigger for updated_at
CREATE TRIGGER update_whiteboard_drawings_updated_at
BEFORE UPDATE ON public.whiteboard_drawings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();