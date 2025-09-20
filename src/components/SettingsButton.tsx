import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface SettingsButtonProps {
  collapsed?: boolean;
}

const SettingsButton: React.FC<SettingsButtonProps> = ({ collapsed = false }) => {
  const navigate = useNavigate();
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/settings')}
            className="h-9 w-9"
            aria-label="Configurações"
          >
            <Settings className="h-5 w-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side={collapsed ? "right" : "bottom"}>
          Configurações
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default SettingsButton;
