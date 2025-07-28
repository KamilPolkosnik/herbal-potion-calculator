
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import bcrypt from 'bcryptjs';

interface User {
  username: string;
  role: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('auth_user');
    console.log('useAuth - savedUser from localStorage:', savedUser);
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      console.log('useAuth - parsed user:', parsedUser);
      setUser(parsedUser);
    }
    setLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    try {
      console.log('Login attempt for username:', username);
      
      // First get the user's password hash from database
      const { data: userWithHash, error: userError } = await supabase
        .from('app_users')
        .select('username, role, password_hash')
        .eq('username', username)
        .single();

      if (userError || !userWithHash) {
        return false;
      }

      // Verify password using bcrypt
      const isPasswordValid = await bcrypt.compare(password, userWithHash.password_hash);
      
      if (!isPasswordValid) {
        return false;
      }

      const userData = { username: userWithHash.username, role: userWithHash.role };

      console.log('Setting user data:', userData);
      setUser(userData);
      localStorage.setItem('auth_user', JSON.stringify(userData));
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('auth_user');
  };

  return {
    user,
    loading,
    login,
    logout
  };
};
