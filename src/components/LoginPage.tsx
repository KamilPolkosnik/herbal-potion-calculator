
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';

interface LoginPageProps {
  onLogin: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const success = await login(username, password);
      if (success) {
        onLogin();
      } else {
        setError('Nieprawidłowy login lub hasło');
      }
    } catch (error) {
      setError('Wystąpił błąd podczas logowania');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-sm mx-auto">
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="text-xl sm:text-2xl text-center text-green-700">
            Logowanie
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="username" className="text-sm sm:text-base">Login</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={isLoading}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="password" className="text-sm sm:text-base">Hasło</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                className="mt-1"
              />
            </div>
            {error && (
              <div className="text-red-600 text-sm text-center">{error}</div>
            )}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Logowanie...' : 'Zaloguj się'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
