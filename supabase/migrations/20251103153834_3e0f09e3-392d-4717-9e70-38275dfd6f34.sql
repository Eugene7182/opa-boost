-- Add AI assistant feature flag
INSERT INTO public.feature_flags (flag_name, enabled)
VALUES ('ai_assistant_enabled', false)
ON CONFLICT (flag_name) DO NOTHING;

-- Add user settings for BI suggestions
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS suggestions_enabled boolean DEFAULT true;