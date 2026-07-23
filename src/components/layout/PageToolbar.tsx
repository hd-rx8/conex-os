import type { HTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

type PageToolbarProps = HTMLAttributes<HTMLElement>;

export function PageToolbar({
  children,
  className,
  ...props
}: PageToolbarProps) {
  return (
    <section
      className={cn(
        'flex flex-col gap-3 rounded-xl border bg-card p-3 shadow-sm sm:p-4 lg:flex-row lg:items-center',
        className,
      )}
      {...props}
    >
      {children}
    </section>
  );
}
