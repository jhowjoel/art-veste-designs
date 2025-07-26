-- Create table for chat messages in custom art requests
CREATE TABLE public.custom_art_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES public.custom_art_requests(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id),
  message TEXT,
  file_urls TEXT[],
  is_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.custom_art_messages ENABLE ROW LEVEL SECURITY;

-- Policy for users to view messages in their own requests
CREATE POLICY "Users can view messages in their own requests" 
ON public.custom_art_messages 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.custom_art_requests 
    WHERE id = request_id AND user_id = auth.uid()
  )
);

-- Policy for users to create messages in their own requests
CREATE POLICY "Users can create messages in their own requests" 
ON public.custom_art_messages 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.custom_art_requests 
    WHERE id = request_id AND user_id = auth.uid()
  ) AND sender_id = auth.uid() AND is_admin = false
);

-- Policy for admin to view all messages
CREATE POLICY "Admin can view all messages" 
ON public.custom_art_messages 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND email = 'jota100clock@gmail.com'
  )
);

-- Policy for admin to create messages
CREATE POLICY "Admin can create messages" 
ON public.custom_art_messages 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND email = 'jota100clock@gmail.com'
  ) AND is_admin = true
);

-- Add status field to custom_art_requests to track conversation state
ALTER TABLE public.custom_art_requests 
ADD COLUMN conversation_status TEXT DEFAULT 'open';

-- Create trigger for updating timestamps
CREATE TRIGGER update_custom_art_messages_updated_at
  BEFORE UPDATE ON public.custom_art_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_subscription_updated_at();

-- Add index for better performance
CREATE INDEX idx_custom_art_messages_request_id ON public.custom_art_messages(request_id);
CREATE INDEX idx_custom_art_messages_created_at ON public.custom_art_messages(created_at);