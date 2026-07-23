import React, { useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import QuoteResult, { QuoteResultRef } from '@/components/QuoteResult'; // Import QuoteResultRef
import { useQuoteWizard } from '@/context/QuoteWizardContext';
import { Loader2, Save, Link as LinkIcon, ClipboardCopy, Printer, Send, Eye, X } from 'lucide-react'; // Import Printer and Send
import { useSession } from '@/hooks/useSession';
import { toast } from 'sonner';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle } from 'lucide-react';

const getSafeReturnTo = (returnTo: unknown) => (
  returnTo === '/' || returnTo === '/opportunities' || returnTo === '/clients'
    ? returnTo
    : '/opportunities'
);

const getSaveErrorMessage = (error: string | null) => {
  switch (error) {
    case 'locked':
      return 'Esta proposta não pode mais ser alterada porque seu status foi atualizado.';
    case 'conflict':
      return 'Esta proposta foi alterada em outro lugar. Atualize os dados antes de tentar salvar novamente.';
    case 'validation':
      return 'Revise os campos obrigatórios antes de salvar as alterações.';
    case 'unknown':
      return 'Não foi possível salvar as alterações. Tente novamente.';
    default:
      return null;
  }
};

const StepReview: React.FC = () => {
  const { user } = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const quoteResultRef = useRef<QuoteResultRef>(null); // Create a ref for QuoteResult

  const {
    selectedServices, clientInfo, cashDiscountPercentage,
    calculateOriginalSubtotal, calculateTotal, calculateCashDiscount, calculateFinalTotal,
    getSelectedPayment, getTotalInstallmentValue, notes, isValidityEnabled, validityDays,
    mode, isSaving, saveError, saveProposalChanges, reloadProposal,
    generateShareableLink, registerProposal,
    proposalTitle, proposalLogoUrl, proposalGradientTheme,
    generatedShareLink, isGeneratingLink, paymentType, installmentValue, manualInstallmentTotal
  } = useQuoteWizard();

  const [isRegistering, setIsRegistering] = React.useState(false);
  const [isShareLinkDialogOpen, setIsShareLinkDialogOpen] = React.useState(false);
  const safeReturnTo = getSafeReturnTo((location.state as { returnTo?: unknown } | null)?.returnTo);

  const handleGenerateShareableLink = async () => {
    if (!user?.id) {
      toast.error('Você precisa estar logado para gerar um link compartilhável.');
      return;
    }
    const link = await generateShareableLink(user.id);
    if (link) {
      setIsShareLinkDialogOpen(true);
    }
  };

  const handleRegisterProposal = async () => {
    if (!user?.id) {
      toast.error('Você precisa estar logado para salvar uma proposta.');
      return;
    }
    setIsRegistering(true);
    const success = await registerProposal(user.id);
    setIsRegistering(false);
    if (success) {
      navigate('/proposals');
    }
  };

  const handleSaveChanges = async () => {
    if (!saveProposalChanges || isSaving) return;

    const success = await saveProposalChanges();
    if (success) {
      toast.success('Alterações salvas com sucesso.');
      navigate(safeReturnTo, { replace: true });
    }
  };

  const handleCopyLink = () => {
    if (generatedShareLink) {
      navigator.clipboard.writeText(generatedShareLink);
      toast.success('Link copiado para a área de transferência!');
    }
  };

  const handlePrint = () => {
    quoteResultRef.current?.handlePrintPDF();
  };

  const handleShare = () => {
    quoteResultRef.current?.handleWhatsApp();
  };

  const handleViewProposal = () => {
    if (!generatedShareLink) {
      toast.error('O link desta proposta não está disponível.');
      return;
    }
    window.open(generatedShareLink, '_blank', 'noopener,noreferrer');
  };

  const canProceed = selectedServices.length > 0 && clientInfo.name && clientInfo.email && proposalTitle;

  // Validação para campos de parcelamento
  const isInstallmentValid = () => {
    if (paymentType !== 'installment') return true;
    return installmentValue > 0 || manualInstallmentTotal > 0;
  };

  const getInstallmentStatusMessage = () => {
    if (paymentType !== 'installment') return null;
    
    if (installmentValue === 0 && (manualInstallmentTotal === null || manualInstallmentTotal === 0)) {
      return {
        type: 'warning' as const,
        message: '⚠️ Configuração de parcelamento incompleta: As informações de pagamento parcelado não aparecerão na proposta. Volte ao passo de configurações para preencher o valor da parcela.'
      };
    }
    
    return {
      type: 'success' as const,
      message: '✅ Configuração de parcelamento completa: As informações de pagamento parcelado serão exibidas na proposta.'
    };
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Revisar Proposta</CardTitle>
          <CardDescription>Verifique todos os detalhes da proposta antes de salvar ou compartilhar.</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Alerta de status da configuração de pagamento */}
          {getInstallmentStatusMessage() && (
            <Alert className={getInstallmentStatusMessage()?.type === 'warning' ? 'border-orange-200 bg-orange-50 mb-6' : 'border-green-200 bg-green-50 mb-6'}>
              {getInstallmentStatusMessage()?.type === 'warning' ? (
                <AlertCircle className="h-4 w-4 text-orange-600" />
              ) : (
                <CheckCircle className="h-4 w-4 text-green-600" />
              )}
              <AlertDescription className={getInstallmentStatusMessage()?.type === 'warning' ? 'text-orange-800' : 'text-green-800'}>
                {getInstallmentStatusMessage()?.message}
              </AlertDescription>
            </Alert>
          )}

          {canProceed ? (
            <QuoteResult
              ref={quoteResultRef}
              selectedServices={selectedServices}
              clientInfo={clientInfo}
              subtotal={calculateOriginalSubtotal()}
              discount={0}
              discountType="percentage"
              discountPercentage={0}
              total={calculateTotal()}
              cashDiscount={cashDiscountPercentage}
              finalTotal={calculateFinalTotal()}
              selectedPayment={getSelectedPayment()}
              installmentTotal={getTotalInstallmentValue()}
              notes={notes}
              isValidityEnabled={isValidityEnabled}
              validityDays={validityDays}
              proposalTitle={proposalTitle}
              proposalLogoUrl={proposalLogoUrl}
              proposalGradientTheme={proposalGradientTheme}
              generatedShareLink={generatedShareLink}
            />
          ) : (
            <div className="text-center py-12">
              <h3 className="text-xl font-semibold mb-4">Proposta Incompleta</h3>
              <p className="text-muted-foreground mb-6">
                Por favor, complete os passos anteriores para revisar a proposta.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      {mode === 'edit' ? (
        <>
          {getSaveErrorMessage(saveError) && (
            <Alert className="border-destructive/30 bg-destructive/5">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <AlertDescription className="flex flex-wrap items-center gap-3 text-destructive">
                <span>{getSaveErrorMessage(saveError)}</span>
                {(saveError === 'locked' || saveError === 'conflict') && (
                  <Button variant="outline" size="sm" onClick={() => void reloadProposal()}>
                    Atualizar proposta
                  </Button>
                )}
              </AlertDescription>
            </Alert>
          )}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mt-8">
            <Button variant="outline" onClick={() => navigate(safeReturnTo)}>
              <X className="w-4 h-4" />
              <span>Cancelar</span>
            </Button>
            <Button variant="outline" onClick={handleViewProposal} disabled={!generatedShareLink}>
              <Eye className="w-4 h-4" />
              <span>Visualizar proposta</span>
            </Button>
            {generatedShareLink && (
              <Button variant="outline" onClick={handleCopyLink}>
                <ClipboardCopy className="w-4 h-4" />
                <span>Copiar link</span>
              </Button>
            )}
            <Button
              onClick={() => void handleSaveChanges()}
              disabled={!canProceed || isSaving}
              className="gradient-button-bg"
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="w-4 h-4" />
              <span>Salvar alterações</span>
            </Button>
          </div>
        </>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8"> {/* Grid for 4 buttons */}
          {/* 1. Gerar Link Compartilhável (sem cor) */}
          <Button
            onClick={handleGenerateShareableLink}
            disabled={!canProceed || isGeneratingLink || isRegistering}
            variant="outline"
            className="flex items-center space-x-2"
          >
            {isGeneratingLink && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <LinkIcon className="w-4 h-4" />
            <span>Gerar Link Compartilhável</span>
          </Button>

          {/* 2. Imprimir Proposta (colorido) */}
          <Button onClick={handlePrint} className="gradient-button-bg flex items-center space-x-2">
            <Printer className="w-4 h-4" />
            <span>Imprimir Proposta</span>
          </Button>

          {/* 3. Enviar por WhatsApp (sem cor) */}
          <Button
            onClick={handleShare}
            disabled={!generatedShareLink}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <Send className="w-4 h-4" />
            <span>Enviar por WhatsApp</span>
          </Button>

          {/* 4. Salvar Proposta (colorido) */}
          <Button
            onClick={handleRegisterProposal}
            disabled={!canProceed || isRegistering || isGeneratingLink}
            className="gradient-button-bg flex items-center space-x-2"
          >
            {isRegistering && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="w-4 h-4" />
            <span>Salvar Proposta</span>
          </Button>
        </div>
      )}

      {/* Share Link Dialog */}
      {mode === 'create' && <AlertDialog open={isShareLinkDialogOpen} onOpenChange={setIsShareLinkDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Link Compartilhável Gerado!</AlertDialogTitle>
            <AlertDialogDescription>
              Copie o link abaixo para compartilhar esta proposta.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex items-center space-x-2">
            <Input value={generatedShareLink || ''} readOnly className="flex-1" />
            <Button onClick={handleCopyLink} size="sm">
              <ClipboardCopy className="w-4 h-4 mr-2" />
              Copiar
            </Button>
          </div>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setIsShareLinkDialogOpen(false)}>Fechar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>}
    </div>
  );
};

export default StepReview;
