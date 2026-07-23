import React, { useState, useRef } from 'react';
import { Download, Upload, Loader2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';
import { useSession } from '@/hooks/useSession';
import { exportUserData, importUserData } from '../api/importExportApi';

export function ImportExportCard() {
  const { user } = useSession();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      setError(null);

      const data = await exportUserData();

      // Cria o arquivo JSON para download
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `conex-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Exportação concluída com sucesso!');
    } catch (err: any) {
      console.error('Erro na exportação:', err);
      setError(err.message || 'Ocorreu um erro ao exportar os dados.');
      toast.error('Falha na exportação.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Resetar input
    event.target.value = '';

    if (!user) {
      toast.error('Usuário não autenticado.');
      return;
    }

    try {
      setIsImporting(true);
      setError(null);

      const fileContent = await file.text();
      const jsonData = JSON.parse(fileContent);

      await importUserData(jsonData, user.id);

      toast.success('Importação concluída com sucesso! Atualize a página para ver os novos dados.');
    } catch (err: any) {
      console.error('Erro na importação:', err);
      if (err.name === 'ZodError') {
        setError('O arquivo JSON possui um formato inválido ou corrompido.');
      } else if (err instanceof SyntaxError) {
        setError('O arquivo não é um JSON válido.');
      } else {
        setError(err.message || 'Ocorreu um erro ao importar os dados.');
      }
      toast.error('Falha na importação.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Backup e Migração</CardTitle>
        <CardDescription>
          Exporte seus dados para um arquivo de segurança ou importe um backup existente.
          A importação irá preservar todos os relacionamentos entre projetos, pastas e tarefas.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleExport}
            disabled={isExporting || isImporting}
          >
            {isExporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            {isExporting ? 'Exportando...' : 'Exportar Dados (.json)'}
          </Button>

          <Button
            variant="default"
            className="flex-1"
            onClick={handleImportClick}
            disabled={isExporting || isImporting}
          >
            {isImporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            {isImporting ? 'Importando...' : 'Importar Dados'}
          </Button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json"
            className="hidden"
          />
        </div>
      </CardContent>
    </Card>
  );
}
