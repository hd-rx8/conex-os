import React from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Plus, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FloatingActionButtonProps {
  onClick: () => void;
  tooltip: string;
  icon?: LucideIcon;
  className?: string;
  disabled?: boolean;
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onClick,
  tooltip,
  icon: Icon = Plus,
  className,
  disabled = false
}) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button 
            size="lg"
            disabled={disabled}
            onClick={onClick}
            className={cn(
              "fixed bottom-6 right-6 h-14 w-14 rounded-full gradient-button-bg hover:opacity-90 text-white shadow-lg hover:shadow-xl transition-all duration-200 z-50 p-0 sm:bottom-8 sm:right-8",
              disabled && "opacity-50 cursor-not-allowed",
              className
            )}
          >
            <Icon className="w-6 h-6" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left" className="mr-2">
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default FloatingActionButton;
