import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Plus, X, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FABAction {
  id: string;
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  color?: string;
}

interface ContextualFABProps {
  actions: FABAction[];
  className?: string;
  disabled?: boolean;
}

const ContextualFAB: React.FC<ContextualFABProps> = ({
  actions,
  className,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const fabRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (fabRef.current && !fabRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleMainClick = () => {
    if (actions.length === 1) {
      // If only one action, execute it directly
      actions[0].onClick();
    } else {
      // Otherwise, toggle menu
      setIsOpen(!isOpen);
    }
  };

  const handleActionClick = (action: FABAction) => {
    action.onClick();
    setIsOpen(false);
  };

  return (
    <div ref={fabRef} className={cn("fixed bottom-6 right-6 z-50 sm:bottom-8 sm:right-8", className)}>
      {/* Action Menu */}
      {isOpen && actions.length > 1 && (
        <div className="absolute bottom-20 right-0 flex flex-col-reverse gap-3 mb-2">
          {actions.map((action, index) => {
            const Icon = action.icon;
            return (
              <TooltipProvider key={action.id}>
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <Button
                      size="lg"
                      onClick={() => handleActionClick(action)}
                      className={cn(
                        "h-12 w-12 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 animate-in fade-in slide-in-from-bottom-4",
                        action.color || "gradient-button-bg hover:opacity-90 text-white"
                      )}
                      style={{
                        animationDelay: `${index * 50}ms`,
                        animationFillMode: 'backwards'
                      }}
                    >
                      <Icon className="w-5 h-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="mr-2">
                    <p>{action.label}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </div>
      )}

      {/* Main FAB Button */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="lg"
              disabled={disabled || actions.length === 0}
              onClick={handleMainClick}
              className={cn(
                "h-14 w-14 rounded-full gradient-button-bg hover:opacity-90 text-white shadow-lg hover:shadow-xl transition-all duration-200 p-0",
                disabled && "opacity-50 cursor-not-allowed",
                isOpen && "rotate-45"
              )}
            >
              {isOpen && actions.length > 1 ? (
                <X className="w-6 h-6" />
              ) : (
                <Plus className="w-6 h-6" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left" className="mr-2">
            <p>
              {actions.length === 0
                ? 'Nenhuma ação disponível'
                : actions.length === 1
                  ? actions[0].label
                  : isOpen
                    ? 'Fechar menu'
                    : 'Ações rápidas'}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export default ContextualFAB;
