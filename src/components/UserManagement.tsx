
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Users, Plus, Edit, Trash2, Key } from 'lucide-react';
import { useUserManagement } from '@/hooks/useUserManagement';
import { useToast } from '@/hooks/use-toast';

const UserManagement: React.FC = () => {
  console.log('UserManagement component - rendering started');
  
  try {
    const { users, loading, createUser, updateUser, deleteUser, changePassword } = useUserManagement();
    const { toast } = useToast();
    const [newUser, setNewUser] = useState({ username: '', password: '', role: 'user' });
    const [editingUser, setEditingUser] = useState<any>(null);
    const [passwordChange, setPasswordChange] = useState({ userId: '', newPassword: '' });
    const [creating, setCreating] = useState(false);

    console.log('UserManagement - users:', users);
    console.log('UserManagement - loading:', loading);

    const handleCreateUser = async () => {
      console.log('UserManagement - handleCreateUser called');
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
      console.log('UserManagement - returning loading state');
      return (
        <div className="flex justify-center items-center p-4 sm:p-8">
          <div className="text-base sm:text-lg">Ładowanie użytkowników...</div>
        </div>
      );
    }

    console.log('UserManagement - rendering main content');
    return (
      <div className="space-y-4 sm:space-y-6">
        {/* Dodawanie użytkownika */}
        <Card>
          <CardHeader className="px-3 sm:px-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              Dodaj Nowego Użytkownika
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div>
                <Label htmlFor="new_username" className="text-sm">Nazwa użytkownika</Label>
                <Input
                  id="new_username"
                  value={newUser.username}
                  onChange={(e) => setNewUser(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="Nazwa użytkownika"
                  className="text-sm"
                />
              </div>
              <div>
                <Label htmlFor="new_password" className="text-sm">Hasło</Label>
                <Input
                  id="new_password"
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Hasło"
                  className="text-sm"
                />
              </div>
              <div>
                <Label htmlFor="new_role" className="text-sm">Rola</Label>
                <Select value={newUser.role} onValueChange={(value) => setNewUser(prev => ({ ...prev, role: value }))}>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Wybierz rolę" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Użytkownik</SelectItem>
                    <SelectItem value="admin">Administrator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button onClick={handleCreateUser} disabled={creating} className="w-full text-sm">
                  <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  {creating ? 'Dodawanie...' : 'Dodaj'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista użytkowników */}
        <Card>
          <CardHeader className="px-3 sm:px-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
              Lista Użytkowników
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6">
            <div className="overflow-x-auto">
              <ScrollArea className="w-full">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs sm:text-sm">Nazwa użytkownika</TableHead>
                      <TableHead className="text-xs sm:text-sm">Rola</TableHead>
                      <TableHead className="text-xs sm:text-sm hidden sm:table-cell">Data utworzenia</TableHead>
                      <TableHead className="text-xs sm:text-sm">Akcje</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="text-xs sm:text-sm font-medium">{user.username}</TableCell>
                        <TableCell>
                          <span className={`px-1 sm:px-2 py-1 rounded text-xs ${
                            user.role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {user.role === 'admin' ? 'Admin' : 'User'}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm hidden sm:table-cell">
                          {new Date(user.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1 sm:gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setEditingUser({ ...user })}
                                  className="h-8 w-8 p-0"
                                >
                                  <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="w-[90vw] max-w-md">
                                <DialogHeader>
                                  <DialogTitle className="text-base sm:text-lg">Edytuj Użytkownika</DialogTitle>
                                </DialogHeader>
                                {editingUser && (
                                  <div className="space-y-3 sm:space-y-4">
                                    <div>
                                      <Label htmlFor="edit_username" className="text-sm">Nazwa użytkownika</Label>
                                      <Input
                                        id="edit_username"
                                        value={editingUser.username}
                                        onChange={(e) => setEditingUser(prev => ({ ...prev, username: e.target.value }))}
                                        className="text-sm"
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor="edit_role" className="text-sm">Rola</Label>
                                      <Select value={editingUser.role} onValueChange={(value) => setEditingUser(prev => ({ ...prev, role: value }))}>
                                        <SelectTrigger className="text-sm">
                                          <SelectValue placeholder="Wybierz rolę" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="user">Użytkownik</SelectItem>
                                          <SelectItem value="admin">Administrator</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <Button onClick={handleUpdateUser} className="w-full text-sm">
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
                                  className="h-8 w-8 p-0"
                                >
                                  <Key className="w-3 h-3 sm:w-4 sm:h-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="w-[90vw] max-w-md">
                                <DialogHeader>
                                  <DialogTitle className="text-base sm:text-lg">Zmień Hasło</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-3 sm:space-y-4">
                                  <div>
                                    <Label htmlFor="new_password_change" className="text-sm">
                                      Nowe hasło dla {user.username}
                                    </Label>
                                    <Input
                                      id="new_password_change"
                                      type="password"
                                      value={passwordChange.newPassword}
                                      onChange={(e) => setPasswordChange(prev => ({ ...prev, newPassword: e.target.value }))}
                                      placeholder="Nowe hasło"
                                      className="text-sm"
                                    />
                                  </div>
                                  <Button onClick={handleChangePassword} className="w-full text-sm">
                                    Zmień hasło
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>

                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteUser(user.id, user.username)}
                              disabled={user.username === 'admin'}
                              className="h-8 w-8 p-0"
                            >
                              <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  } catch (error) {
    console.error('UserManagement component - ERROR:', error);
    return (
      <div className="p-4 text-center text-red-600">
        <h2 className="text-base sm:text-lg">Błąd komponentu zarządzania użytkownikami</h2>
        <p className="text-sm sm:text-base">Sprawdź konsolę aby zobaczyć szczegóły błędu</p>
      </div>
    );
  }
};

export default UserManagement;
