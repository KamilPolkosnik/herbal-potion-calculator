
-- Create warning_thresholds table
CREATE TABLE public.warning_thresholds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  herbs_threshold NUMERIC NOT NULL DEFAULT 0,
  oils_threshold NUMERIC NOT NULL DEFAULT 0,
  others_threshold NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add trigger to update updated_at column
CREATE TRIGGER set_warning_thresholds_updated_at
  BEFORE UPDATE ON public.warning_thresholds
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default values
INSERT INTO public.warning_thresholds (herbs_threshold, oils_threshold, others_threshold)
VALUES (0, 0, 0);
