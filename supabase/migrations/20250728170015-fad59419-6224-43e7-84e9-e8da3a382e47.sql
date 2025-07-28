-- Hash existing passwords migration
-- IMPORTANT: This migration will convert all existing btoa-encoded passwords to bcrypt hashes
-- Run this once after deploying the bcrypt authentication code

DO $$
DECLARE
    user_record RECORD;
    decoded_password TEXT;
    bcrypt_hash TEXT;
BEGIN
    -- Loop through all users with btoa-encoded passwords
    FOR user_record IN SELECT id, username, password_hash FROM public.app_users LOOP
        BEGIN
            -- Try to decode the base64 password (btoa encoding)
            -- Note: This assumes passwords were encoded with btoa (base64)
            decoded_password := convert_from(decode(user_record.password_hash, 'base64'), 'UTF8');
            
            -- Generate bcrypt hash using pgcrypto extension
            -- Install pgcrypto if not already available
            CREATE EXTENSION IF NOT EXISTS pgcrypto;
            
            -- Generate bcrypt hash with cost factor 12
            bcrypt_hash := crypt(decoded_password, gen_salt('bf', 12));
            
            -- Update the password hash
            UPDATE public.app_users 
            SET password_hash = bcrypt_hash 
            WHERE id = user_record.id;
            
            RAISE NOTICE 'Updated password for user: %', user_record.username;
            
        EXCEPTION WHEN OTHERS THEN
            -- If decoding fails, the password might already be hashed
            RAISE NOTICE 'Skipping user % - password appears to already be hashed', user_record.username;
            CONTINUE;
        END;
    END LOOP;
END $$;