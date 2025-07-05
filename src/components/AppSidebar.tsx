
import React from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Package, Calculator, Settings, ShoppingCart, TrendingUp, LogOut, DollarSign, Users } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface AppSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const AppSidebar: React.FC<AppSidebarProps> = ({ activeTab, onTabChange }) => {
  const { user, logout, loading } = useAuth();

  // Debug logging
  console.log('AppSidebar - current user:', user);
  console.log('AppSidebar - user role:', user?.role);
  console.log('AppSidebar - is admin?', user?.role === 'admin');
  console.log('AppSidebar - loading:', loading);

  const handleLogout = () => {
    logout();
    // Force page reload to reset all application state
    window.location.reload();
  };

  // Poczekaj aż dane użytkownika zostaną załadowane
  if (loading || !user) {
    return (
      <Sidebar>
        <SidebarHeader className="border-b p-4">
          <div className="flex items-center gap-3">
            <Package className="w-8 h-8 text-green-600" />
            <div>
              <h2 className="font-bold text-lg text-gray-800">
                Zarządzanie Kompozycjami
              </h2>
              <p className="text-sm text-gray-600">
                Ładowanie...
              </p>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <div className="p-4 text-center text-gray-500">
            Ładowanie menu...
          </div>
        </SidebarContent>
      </Sidebar>
    );
  }

  const menuItems = [
    {
      id: 'ingredients',
      title: 'Składniki',
      icon: Package,
    },
    {
      id: 'calculator',
      title: 'Zestawy',
      icon: Calculator,
    },
    {
      id: 'management',
      title: 'Zarządzanie',
      icon: Settings,
    },
    {
      id: 'sales',
      title: 'Sprzedaż',
      icon: DollarSign,
    },
    {
      id: 'shopping',
      title: 'Lista Zakupów',
      icon: ShoppingCart,
    },
    {
      id: 'summary',
      title: 'Podsumowanie',
      icon: TrendingUp,
    },
    // Zakładka użytkowników tylko dla administratorów
    ...(user?.role === 'admin' ? [{
      id: 'users',
      title: 'Użytkownicy',
      icon: Users,
    }] : []),
    // Zakładka ustawień tylko dla administratorów
    ...(user?.role === 'admin' ? [{
      id: 'settings',
      title: 'Ustawienia',
      icon: Settings,
    }] : []),
  ];

  console.log('AppSidebar - menuItems length:', menuItems.length);
  console.log('AppSidebar - menuItems:', menuItems.map(item => item.id));

  return (
    <Sidebar>
      <SidebarHeader className="border-b p-4">
        <div className="flex items-center gap-3">
          <Package className="w-8 h-8 text-green-600" />
          <div>
            <h2 className="font-bold text-lg text-gray-800">
              Zarządzanie Kompozycjami
            </h2>
            <p className="text-sm text-gray-600">
              System kontroli składników
            </p>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Nawigacja</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      isActive={activeTab === item.id}
                      onClick={() => onTabChange(item.id)}
                      className="w-full justify-start"
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <div className="space-y-2">
          <div className="text-sm text-gray-600">
            Zalogowany jako: <span className="font-medium">{user?.username}</span>
          </div>
          <Button
            variant="outline"
            onClick={handleLogout}
            className="w-full justify-start"
            size="sm"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Wyloguj
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
