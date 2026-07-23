import type { ReactNode } from 'react';

import { PageHeader } from '@/components/layout/PageHeader';

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
    <PageHeader
      eyebrow={eyebrow}
      title={title}
      description={description}
      actions={actions}
    />
  );
}
