-- Create table for ML learning data
CREATE TABLE public.cloaker_ml_patterns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pattern_type TEXT NOT NULL, -- 'user_agent', 'ip_range', 'referer', 'fingerprint', 'behavior'
  pattern_value TEXT NOT NULL,
  block_count INTEGER NOT NULL DEFAULT 0,
  approve_count INTEGER NOT NULL DEFAULT 0,
  false_positive_count INTEGER NOT NULL DEFAULT 0,
  confidence_score NUMERIC NOT NULL DEFAULT 0.5,
  weight_adjustment NUMERIC NOT NULL DEFAULT 1.0,
  last_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb,
  UNIQUE(pattern_type, pattern_value)
);

-- Create table for adaptive thresholds per link
CREATE TABLE public.cloaker_ml_thresholds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  link_id UUID REFERENCES public.cloaked_links(id) ON DELETE CASCADE,
  min_score_adjusted NUMERIC NOT NULL DEFAULT 40,
  fingerprint_weight NUMERIC NOT NULL DEFAULT 1.0,
  behavior_weight NUMERIC NOT NULL DEFAULT 1.0,
  network_weight NUMERIC NOT NULL DEFAULT 1.0,
  automation_weight NUMERIC NOT NULL DEFAULT 1.0,
  learning_rate NUMERIC NOT NULL DEFAULT 0.1,
  total_decisions INTEGER NOT NULL DEFAULT 0,
  block_rate NUMERIC NOT NULL DEFAULT 0,
  false_positive_rate NUMERIC NOT NULL DEFAULT 0,
  last_adjusted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(link_id)
);

-- Create table for feedback (false positives/negatives)
CREATE TABLE public.cloaker_ml_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  visitor_id UUID REFERENCES public.cloaker_visitors(id) ON DELETE CASCADE,
  link_id UUID REFERENCES public.cloaked_links(id) ON DELETE CASCADE,
  original_decision TEXT NOT NULL,
  corrected_decision TEXT NOT NULL,
  feedback_type TEXT NOT NULL, -- 'false_positive', 'false_negative'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cloaker_ml_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cloaker_ml_thresholds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cloaker_ml_feedback ENABLE ROW LEVEL SECURITY;

-- RLS policies for ml_patterns (edge function needs full access)
CREATE POLICY "Edge function can manage patterns" ON public.cloaker_ml_patterns FOR ALL USING (true);

-- RLS policies for ml_thresholds
CREATE POLICY "Edge function can manage thresholds" ON public.cloaker_ml_thresholds FOR ALL USING (true);
CREATE POLICY "Users can view thresholds for their links" ON public.cloaker_ml_thresholds 
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.cloaked_links WHERE id = link_id AND user_id = auth.uid())
  );

-- RLS policies for ml_feedback
CREATE POLICY "Edge function can manage feedback" ON public.cloaker_ml_feedback FOR ALL USING (true);
CREATE POLICY "Users can manage feedback for their links" ON public.cloaker_ml_feedback 
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.cloaked_links WHERE id = link_id AND user_id = auth.uid())
  );

-- Create indexes for performance
CREATE INDEX idx_ml_patterns_type ON public.cloaker_ml_patterns(pattern_type);
CREATE INDEX idx_ml_patterns_confidence ON public.cloaker_ml_patterns(confidence_score);
CREATE INDEX idx_ml_thresholds_link ON public.cloaker_ml_thresholds(link_id);
CREATE INDEX idx_ml_feedback_link ON public.cloaker_ml_feedback(link_id);

-- Function to update timestamps
CREATE TRIGGER update_cloaker_ml_patterns_updated_at
  BEFORE UPDATE ON public.cloaker_ml_patterns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cloaker_ml_thresholds_updated_at
  BEFORE UPDATE ON public.cloaker_ml_thresholds
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();