import React from 'react';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';

interface MobileMenuToggleProps {
  onToggle: () => void;
}

const MobileMenuToggle: React.FC<MobileMenuToggleProps> = ({ onToggle }) => {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onToggle}
      className="md:hidden h-9 w-9"
    >
      <Menu className="h-5 w-5" />
      <span className="sr-only">Abrir menu de navegação</span>
    </Button>
  );
};

export default MobileMenuToggle;
