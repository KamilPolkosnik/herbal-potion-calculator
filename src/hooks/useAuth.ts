
import { useState, useEffect } from 'react';

interface User {
  username: string;
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

  const login = (username: string, password: string) => {
    // Proste sprawdzenie logowania
    if (username === 'admin' && password === '@Surokamil1234') {
      const userData = { username: 'admin' };
      setUser(userData);
      localStorage.setItem('auth_user', JSON.stringify(userData));
      return true;
    }
    return false;
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
