import React from 'react';
import { Badge } from '@/components/ui/badge';
import type { TaskStatus } from '@/types/hierarchy';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: TaskStatus | string;
  className?: string;
}

const statusColorMap: Record<string, string> = {
  'Pendente': 'bg-slate-500 hover:bg-slate-600 text-white border-transparent',
  'Em Progresso': 'bg-blue-500 hover:bg-blue-600 text-white border-transparent',
  'Em progresso': 'bg-blue-500 hover:bg-blue-600 text-white border-transparent',
  'Concluída': 'bg-emerald-500 hover:bg-emerald-600 text-white border-transparent',
  'Atrasada': 'bg-red-500 hover:bg-red-600 text-white border-transparent',
  'Bloqueada': 'bg-purple-500 hover:bg-purple-600 text-white border-transparent',
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  if (!status) return null;
  
  const colorClass = statusColorMap[status] || 'bg-slate-500 hover:bg-slate-600 text-white border-transparent';
  
  return (
    <Badge className={cn("font-medium uppercase text-[10px] tracking-wider", colorClass, className)}>
      {status}
    </Badge>
  );
}
