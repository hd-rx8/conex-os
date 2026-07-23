import { AlertCircle, Inbox, LoaderCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export function WorkLoadingState({ label = 'Carregando…' }: { label?: string }) {
  return (
    <Card className="shadow-sm">
      <CardContent className="flex min-h-48 items-center justify-center gap-2 text-muted-foreground">
        <LoaderCircle className="h-5 w-5 animate-spin" />
        {label}
      </CardContent>
    </Card>
  );
}

interface WorkEmptyStateProps {
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function WorkEmptyState({
  title,
  description,
  action,
}: WorkEmptyStateProps) {
  return (
    <Card className="border-dashed shadow-sm">
      <CardContent className="flex min-h-48 flex-col items-center justify-center gap-3 text-center">
        <Inbox className="h-8 w-8 text-muted-foreground" />
        <div>
          <h2 className="font-medium">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        {action}
      </CardContent>
    </Card>
  );
}

export function WorkErrorState({
  onRetry,
}: {
  onRetry: () => void;
}) {
  return (
    <Card className="border-destructive/30 shadow-sm">
      <CardContent className="flex min-h-48 flex-col items-center justify-center gap-3 text-center">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <div>
          <h2 className="font-medium">Não foi possível carregar seus dados</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Tente novamente. Se o problema continuar, revise sua conexão.
          </p>
        </div>
        <Button variant="outline" onClick={onRetry}>
          Tentar novamente
        </Button>
      </CardContent>
    </Card>
  );
}
