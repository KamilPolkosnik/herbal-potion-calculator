
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import bcrypt from 'bcryptjs';

export interface AppUser {
  id: string;
  username: string;
  role: string;
  created_at: string;
  updated_at: string;
}

export const useUserManagement = () => {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('app_users')
        .select('id, username, role, created_at, updated_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const createUser = async (username: string, password: string, role: string = 'user') => {
    try {
      // Secure password hashing with bcrypt
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);
      
      const { data, error } = await supabase
        .from('app_users')
        .insert({
          username,
          password_hash: passwordHash,
          role
        })
        .select()
        .single();

      if (error) throw error;
      await loadUsers();
      return data;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  };

  const updateUser = async (id: string, updates: Partial<Pick<AppUser, 'username' | 'role'>>) => {
    try {
      const { data, error } = await supabase
        .from('app_users')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      await loadUsers();
      return data;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  };

  const deleteUser = async (id: string) => {
    try {
      const { error } = await supabase
        .from('app_users')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  };

  const changePassword = async (id: string, newPassword: string) => {
    try {
      // Secure password hashing with bcrypt
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(newPassword, saltRounds);
      
      const { error } = await supabase
        .from('app_users')
        .update({ password_hash: passwordHash })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error changing password:', error);
      throw error;
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  return {
    users,
    loading,
    createUser,
    updateUser,
    deleteUser,
    changePassword,
    refreshUsers: loadUsers
  };
};
