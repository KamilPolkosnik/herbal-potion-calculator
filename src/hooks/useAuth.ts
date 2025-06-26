
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface User {
  username: string;
  role: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('auth_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    try {
      // Simple password verification - in production, use proper bcrypt
      const passwordHash = btoa(password); // Basic encoding to match what's stored
      
      const { data, error } = await supabase
        .from('app_users')
        .select('username, role')
        .eq('username', username)
        .eq('password_hash', passwordHash)
        .single();

      if (error || !data) {
        return false;
      }

      const userData = { username: data.username, role: data.role };
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
