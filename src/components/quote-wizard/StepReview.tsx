import React, { useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import QuoteResult, { QuoteResultRef } from '@/components/QuoteResult'; // Import QuoteResultRef
import { useQuoteWizard } from '@/context/QuoteWizardContext';
import { Loader2, Save, Link as LinkIcon, ClipboardCopy, Printer, Send } from 'lucide-react'; // Import Printer and Send
import { useSession } from '@/hooks/useSession';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
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

const StepReview: React.FC = () => {
  const { user } = useSession();
  const navigate = useNavigate();
  const quoteResultRef = useRef<QuoteResultRef>(null); // Create a ref for QuoteResult

  const {
    selectedServices, clientInfo,
    calculateOriginalSubtotal, calculateTotal, calculateCashDiscount, calculateFinalTotal,
    getSelectedPayment, getTotalInstallmentValue, notes, isValidityEnabled, validityDays,
    generateShareableLink, registerProposal,
    proposalTitle, proposalLogoUrl, proposalGradientTheme,
    generatedShareLink, isGeneratingLink
  } = useQuoteWizard();

  const [isRegistering, setIsRegistering] = React.useState(false);
  const [isShareLinkDialogOpen, setIsShareLinkDialogOpen] = React.useState(false);

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

  const canProceed = selectedServices.length > 0 && clientInfo.name && clientInfo.email && proposalTitle;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Revisar Proposta</CardTitle>
          <CardDescription>Verifique todos os detalhes da proposta antes de salvar ou compartilhar.</CardDescription>
        </CardHeader>
        <CardContent>
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
              cashDiscount={calculateCashDiscount() > 0 ? (calculateCashDiscount() / calculateTotal()) * 100 : 0}
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

      {/* Share Link Dialog */}
      <AlertDialog open={isShareLinkDialogOpen} onOpenChange={setIsShareLinkDialogOpen}>
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
      </AlertDialog>
    </div>
  );
};

export default StepReview;