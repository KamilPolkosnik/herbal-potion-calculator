
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Users, Plus, Edit, Trash2, Key } from 'lucide-react';
import { useUserManagement } from '@/hooks/useUserManagement';
import { useToast } from '@/hooks/use-toast';

const UserManagement: React.FC = () => {
  const { users, loading, createUser, updateUser, deleteUser, changePassword } = useUserManagement();
  const { toast } = useToast();
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'user' });
  const [editingUser, setEditingUser] = useState<any>(null);
  const [passwordChange, setPasswordChange] = useState({ userId: '', newPassword: '' });
  const [creating, setCreating] = useState(false);

  const handleCreateUser = async () => {
    if (!newUser.username || !newUser.password) {
      toast({
        title: "Błąd",
        description: "Podaj nazwę użytkownika i hasło",
        variant: "destructive",
      });
      return;
    }

    setCreating(true);
    try {
      await createUser(newUser.username, newUser.password, newUser.role);
      setNewUser({ username: '', password: '', role: 'user' });
      toast({
        title: "Sukces",
        description: "Użytkownik został utworzony",
      });
    } catch (error) {
      console.error('Error creating user:', error);
      toast({
        title: "Błąd",
        description: "Nie udało się utworzyć użytkownika",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;

    try {
      await updateUser(editingUser.id, {
        username: editingUser.username,
        role: editingUser.role
      });
      setEditingUser(null);
      toast({
        title: "Sukces",
        description: "Dane użytkownika zostały zaktualizowane",
      });
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: "Błąd",
        description: "Nie udało się zaktualizować użytkownika",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async (id: string, username: string) => {
    if (!confirm(`Czy na pewno chcesz usunąć użytkownika ${username}?`)) return;

    try {
      await deleteUser(id);
      toast({
        title: "Sukces",
        description: "Użytkownik został usunięty",
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Błąd",
        description: "Nie udało się usunąć użytkownika",
        variant: "destructive",
      });
    }
  };

  const handleChangePassword = async () => {
    if (!passwordChange.newPassword) {
      toast({
        title: "Błąd",
        description: "Podaj nowe hasło",
        variant: "destructive",
      });
      return;
    }

    try {
      await changePassword(passwordChange.userId, passwordChange.newPassword);
      setPasswordChange({ userId: '', newPassword: '' });
      toast({
        title: "Sukces",
        description: "Hasło zostało zmienione",
      });
    } catch (error) {
      console.error('Error changing password:', error);
      toast({
        title: "Błąd",
        description: "Nie udało się zmienić hasła",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-lg">Ładowanie użytkowników...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dodawanie użytkownika */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Dodaj Nowego Użytkownika
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="new_username">Nazwa użytkownika</Label>
              <Input
                id="new_username"
                value={newUser.username}
                onChange={(e) => setNewUser(prev => ({ ...prev, username: e.target.value }))}
                placeholder="Nazwa użytkownika"
              />
            </div>
            <div>
              <Label htmlFor="new_password">Hasło</Label>
              <Input
                id="new_password"
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Hasło"
              />
            </div>
            <div>
              <Label htmlFor="new_role">Rola</Label>
              <Select value={newUser.role} onValueChange={(value) => setNewUser(prev => ({ ...prev, role: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Wybierz rolę" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Użytkownik</SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={handleCreateUser} disabled={creating} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                {creating ? 'Dodawanie...' : 'Dodaj'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista użytkowników */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Lista Użytkowników
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nazwa użytkownika</TableHead>
                <TableHead>Rola</TableHead>
                <TableHead>Data utworzenia</TableHead>
                <TableHead>Akcje</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-xs ${
                      user.role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {user.role === 'admin' ? 'Administrator' : 'Użytkownik'}
                    </span>
                  </TableCell>
                  <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingUser({ ...user })}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edytuj Użytkownika</DialogTitle>
                          </DialogHeader>
                          {editingUser && (
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="edit_username">Nazwa użytkownika</Label>
                                <Input
                                  id="edit_username"
                                  value={editingUser.username}
                                  onChange={(e) => setEditingUser(prev => ({ ...prev, username: e.target.value }))}
                                />
                              </div>
                              <div>
                                <Label htmlFor="edit_role">Rola</Label>
                                <Select value={editingUser.role} onValueChange={(value) => setEditingUser(prev => ({ ...prev, role: value }))}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Wybierz rolę" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="user">Użytkownik</SelectItem>
                                    <SelectItem value="admin">Administrator</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <Button onClick={handleUpdateUser} className="w-full">
                                Zapisz zmiany
                              </Button>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPasswordChange({ userId: user.id, newPassword: '' })}
                          >
                            <Key className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Zmień Hasło</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="new_password_change">Nowe hasło dla {user.username}</Label>
                              <Input
                                id="new_password_change"
                                type="password"
                                value={passwordChange.newPassword}
                                onChange={(e) => setPasswordChange(prev => ({ ...prev, newPassword: e.target.value }))}
                                placeholder="Nowe hasło"
                              />
                            </div>
                            <Button onClick={handleChangePassword} className="w-full">
                              Zmień hasło
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteUser(user.id, user.username)}
                        disabled={user.username === 'admin'} // Zabezpieczenie przed usunięciem głównego admina
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagement;
