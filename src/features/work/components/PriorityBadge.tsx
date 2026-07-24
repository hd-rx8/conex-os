import React from 'react';
import { Badge } from '@/components/ui/badge';
import type { TaskPriority } from '@/types/hierarchy';
import { cn } from '@/lib/utils';

interface PriorityBadgeProps {
  priority: TaskPriority | string;
  className?: string;
}

const priorityColorMap: Record<string, string> = {
  'Urgente': 'bg-red-500 hover:bg-red-600 text-white border-transparent',
  'Alta': 'bg-orange-500 hover:bg-orange-600 text-white border-transparent',
  'Média': 'bg-yellow-500 hover:bg-yellow-600 text-white border-transparent',
  'Baixa': 'bg-green-500 hover:bg-green-600 text-white border-transparent',
};

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  if (!priority) return null;
  
  const colorClass = priorityColorMap[priority] || 'bg-secondary text-secondary-foreground';
  
  return (
    <Badge className={cn("font-medium", colorClass, className)}>
      {priority}
    </Badge>
  );
}
