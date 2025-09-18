import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon: LucideIcon; // Tornando o ícone obrigatório
  className?: string;
  children?: React.ReactNode; // Para elementos adicionais como botões
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  icon: Icon,
  className,
  children
}) => {
  return (
    <div className={cn("flex flex-col md:flex-row md:items-center md:justify-between mb-8 pt-8", className)}> {/* Added pt-8 */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          {Icon && <Icon className="w-7 h-7 text-conexhub-blue-700" />}
          <h1 className="text-3xl font-bold gradient-text">
            {title}
          </h1>
        </div>
        {subtitle && (
          <p className="text-lg text-foreground"> {/* Alterado para text-foreground para melhor contraste */}
            {subtitle}
          </p>
        )}
      </div>
      {children && (
        <div className="mt-4 md:mt-0">
          {children}
        </div>
      )}
    </div>
  );
};

export default PageHeader;