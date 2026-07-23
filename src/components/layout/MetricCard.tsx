import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

type MetricTone = 'default' | 'primary' | 'success' | 'warning' | 'danger';

interface MetricCardProps {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  icon?: LucideIcon;
  tone?: MetricTone;
  loading?: boolean;
  className?: string;
}

const toneClasses: Record<MetricTone, { card: string; icon: string }> = {
  default: {
    card: '',
    icon: 'bg-muted text-muted-foreground',
  },
  primary: {
    card: 'border-primary/20',
    icon: 'bg-primary/10 text-primary',
  },
  success: {
    card: 'border-emerald-500/20',
    icon: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  },
  warning: {
    card: 'border-amber-500/20',
    icon: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  },
  danger: {
    card: 'border-red-500/20',
    icon: 'bg-red-500/10 text-red-600 dark:text-red-400',
  },
};

export function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = 'default',
  loading = false,
  className,
}: MetricCardProps) {
  const styles = toneClasses[tone];

  return (
    <Card
      className={cn(
        'overflow-hidden shadow-sm transition-shadow hover:shadow-md',
        styles.card,
        className,
      )}
    >
      <CardContent className="flex min-h-28 items-start justify-between gap-4 p-5">
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          {loading ? (
            <Skeleton
              data-testid="metric-card-skeleton"
              className="h-8 w-24"
            />
          ) : (
            <div className="truncate text-2xl font-semibold tracking-tight">
              {value}
            </div>
          )}
          {detail && (
            <p className="truncate text-xs text-muted-foreground">{detail}</p>
          )}
        </div>
        {Icon && (
          <div className={cn('shrink-0 rounded-xl p-2.5', styles.icon)}>
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
