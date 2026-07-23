import type { ReactNode } from 'react';

interface WorkPageHeaderProps {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: ReactNode;
}

export function WorkPageHeader({
  eyebrow,
  title,
  description,
  actions,
}: WorkPageHeaderProps) {
  return (
    <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="space-y-1">
        {eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            {eyebrow}
          </p>
        )}
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {title}
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}
