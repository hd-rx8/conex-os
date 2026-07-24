import React from 'react';
import { useNavigate } from 'react-router-dom'; // Corrigido: de '=>' para 'from'
import { useTheme } from 'next-themes';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, LogOut, Settings as SettingsIcon, Users as UsersIcon } from 'lucide-react';
import { useSession } from '@/hooks/useSession';

interface UserNavProps {
  userName?: string | null;
  userEmail?: string | null;
  avatarUrl?: string | null;
  collapsed?: boolean;
}

const UserNav: React.FC<UserNavProps> = ({ userName, userEmail, avatarUrl, collapsed = false }) => {
  const navigate = useNavigate();
  const { signOut } = useSession();
  const { theme, setTheme } = useTheme();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          aria-label={collapsed ? 'Abrir menu do usuário' : undefined}
          className={`relative flex min-w-0 ${collapsed ? 'h-9 w-9 justify-center px-0' : 'h-11 w-full justify-start gap-2 px-2'}`}
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={avatarUrl || undefined} alt={userName || "User"} />
            <AvatarFallback>
              {userName ? userName.charAt(0).toUpperCase() : <User className="h-4 w-4" />}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="hidden min-w-0 flex-1 flex-col items-start text-left sm:flex">
              <p className="w-full truncate text-sm font-medium leading-none">
                {userName || 'Usuário'}
              </p>
              <p className="mt-1 w-full truncate text-xs leading-none text-muted-foreground">
                {userEmail}
              </p>
            </div>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{userName || 'Usuário'}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {userEmail}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => navigate('/settings')} className="cursor-pointer">
            <SettingsIcon className="mr-2 h-4 w-4" />
            <span>Configurações</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-red-600 focus:text-red-600">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sair</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserNav;
