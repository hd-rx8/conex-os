import type { ReactNode } from 'react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ContentCardProps {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}

export function ContentCard({
  title,
  description,
  action,
  children,
  className,
  contentClassName,
}: ContentCardProps) {
  const hasHeader = title || description || action;

  return (
    <Card className={cn('overflow-hidden shadow-sm', className)}>
      {hasHeader && (
        <CardHeader className="flex flex-col gap-3 space-y-0 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-1">
            {title && <CardTitle className="text-xl">{title}</CardTitle>}
            {description && (
              <CardDescription className="max-w-3xl">
                {description}
              </CardDescription>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </CardHeader>
      )}
      <CardContent className={cn(!hasHeader && 'pt-6', contentClassName)}>
        {children}
      </CardContent>
    </Card>
  );
}
