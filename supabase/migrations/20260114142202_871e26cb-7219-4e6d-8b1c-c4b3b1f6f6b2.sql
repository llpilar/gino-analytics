-- Create whiteboard_versions table for version history
CREATE TABLE public.whiteboard_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  board_id UUID NOT NULL REFERENCES public.whiteboard_boards(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL DEFAULT 1,
  drawing_data TEXT NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  description TEXT,
  UNIQUE(board_id, version_number)
);

-- Enable RLS
ALTER TABLE public.whiteboard_versions ENABLE ROW LEVEL SECURITY;

-- Create index for faster queries
CREATE INDEX idx_whiteboard_versions_board_id ON public.whiteboard_versions(board_id);
CREATE INDEX idx_whiteboard_versions_created_at ON public.whiteboard_versions(created_at DESC);

-- RLS Policies
CREATE POLICY "Users can view versions of their boards"
  ON public.whiteboard_versions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.whiteboard_boards 
      WHERE id = board_id AND (user_id = auth.uid() OR is_shared = true)
    )
  );

CREATE POLICY "Users can create versions for their boards"
  ON public.whiteboard_versions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.whiteboard_boards 
      WHERE id = board_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete versions of their boards"
  ON public.whiteboard_versions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.whiteboard_boards 
      WHERE id = board_id AND user_id = auth.uid()
    )
  );

-- Function to get next version number
CREATE OR REPLACE FUNCTION public.get_next_version_number(p_board_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(MAX(version_number), 0) + 1
  FROM public.whiteboard_versions
  WHERE board_id = p_board_id
$$;

-- Enable realtime for versions
ALTER PUBLICATION supabase_realtime ADD TABLE public.whiteboard_versions;