-- Add field to track free tool usage
ALTER TABLE public.profiles 
ADD COLUMN free_tool_uses INTEGER DEFAULT 0;