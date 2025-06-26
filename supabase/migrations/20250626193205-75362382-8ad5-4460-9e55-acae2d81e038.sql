
-- Update the admin user with correct base64 encoded password
UPDATE public.app_users 
SET password_hash = 'QFN1cm9rYW1pbDEyMzQ=' 
WHERE username = 'admin';

-- If the admin user doesn't exist, insert it
INSERT INTO public.app_users (username, password_hash, role) 
SELECT 'admin', 'QFN1cm9rYW1pbDEyMzQ=', 'admin'
WHERE NOT EXISTS (SELECT 1 FROM public.app_users WHERE username = 'admin');
