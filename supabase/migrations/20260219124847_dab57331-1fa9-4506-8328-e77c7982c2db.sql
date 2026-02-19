
-- Goals table for revenue/sales targets
CREATE TABLE public.goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  dataset_name TEXT NOT NULL,
  target_type TEXT NOT NULL DEFAULT 'revenue', -- 'revenue' or 'quantity'
  target_scope TEXT NOT NULL DEFAULT 'overall', -- 'overall', 'product', 'category'
  scope_value TEXT, -- product name or category name when scoped
  target_value NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own goals" ON public.goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own goals" ON public.goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own goals" ON public.goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own goals" ON public.goals FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON public.goals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- AI Reports table for scheduled/stored reports
CREATE TABLE public.ai_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  dataset_name TEXT NOT NULL,
  report_type TEXT NOT NULL DEFAULT 'weekly', -- 'weekly', 'monthly', 'manual'
  analysis JSONB NOT NULL DEFAULT '{}'::jsonb,
  anomalies JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reports" ON public.ai_reports FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own reports" ON public.ai_reports FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own reports" ON public.ai_reports FOR DELETE USING (auth.uid() = user_id);

-- Shared dashboards table
CREATE TABLE public.shared_dashboards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  dataset_name TEXT NOT NULL,
  share_token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.shared_dashboards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own shares" ON public.shared_dashboards FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Anyone can view active shares by token" ON public.shared_dashboards FOR SELECT USING (is_active = true);
