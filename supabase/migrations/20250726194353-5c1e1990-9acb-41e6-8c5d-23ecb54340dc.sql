-- Create table for custom art requests
CREATE TABLE public.custom_art_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  country TEXT,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.custom_art_requests ENABLE ROW LEVEL SECURITY;

-- Policy for users to insert their own requests
CREATE POLICY "Users can create custom art requests" 
ON public.custom_art_requests 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

-- Policy for users to view their own requests
CREATE POLICY "Users can view their own requests" 
ON public.custom_art_requests 
FOR SELECT 
USING (user_id = auth.uid());

-- Policy for admin to view all requests
CREATE POLICY "Admin can view all requests" 
ON public.custom_art_requests 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.email = 'jota100clock@gmail.com'
));

-- Create trigger for updating timestamps
CREATE TRIGGER update_custom_art_requests_updated_at
BEFORE UPDATE ON public.custom_art_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_subscription_updated_at();