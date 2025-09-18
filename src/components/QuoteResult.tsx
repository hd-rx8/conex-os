import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { SelectedService, ClientInfo } from '@/hooks/useQuoteGenerator';
import { Calendar, User, Building, Phone, Mail, Printer, Send } from 'lucide-react';
import PDFProposal from './PDFProposal';
import { useGradientTheme } from '@/context/GradientThemeContext';
import { toast } from 'sonner';
import { useCurrency } from '@/context/CurrencyContext';
import { useQuoteWizard } from '@/context/QuoteWizardContext';

interface QuoteResultProps {
  selectedServices: SelectedService[];
  clientInfo: ClientInfo;
  subtotal: number;
  discount: number;
  discountType: 'percentage' | 'value';
  discountPercentage: number;
  total: number;
  cashDiscount: number;
  finalTotal: number;
  selectedPayment?: { 
    name: string; 
    fee: number; 
    installments: number; 
    type: 'cash' | 'installment'; 
    installmentValue?: number; 
    totalInstallmentValue?: number; 
  };
  installmentTotal: number;
  notes: string;
  isValidityEnabled: boolean;
  validityDays: number;
  proposalTitle: string;
  proposalLogoUrl: string;
  proposalGradientTheme: 'conexhub' | 'alt1' | 'alt2';
  generatedShareLink?: string | null;
  oneTimeTotal?: number;
  monthlyTotal?: number;
}

export interface QuoteResultRef {
  handlePrintPDF: () => void;
  handleShareWhatsApp: () => void;
}

const QuoteResult = forwardRef<QuoteResultRef, QuoteResultProps>(({
  selectedServices,
  clientInfo,
  subtotal,
  discount,
  discountType,
  discountPercentage,
  total,
  cashDiscount,
  finalTotal,
  selectedPayment,
  installmentTotal,
  notes,
  isValidityEnabled,
  validityDays,
  proposalTitle,
  proposalLogoUrl,
  proposalGradientTheme,
  generatedShareLink,
  oneTimeTotal: propOneTimeTotal,
  monthlyTotal: propMonthlyTotal,
}, ref) => {
  const currentDate = new Date().toLocaleDateString('pt-BR');
  const printRef = useRef<HTMLDivElement>(null);
  const { pdfHeaderGradientMap } = useGradientTheme();
  const { formatCurrency } = useCurrency();
  const { showInterestRate } = useQuoteWizard();

  const oneTimeServices = selectedServices.filter(s => s.billing_type === 'one_time');
  const monthlyServices = selectedServices.filter(s => s.billing_type === 'monthly');

  const calculatedOneTimeTotal = propOneTimeTotal !== undefined ? propOneTimeTotal : oneTimeServices.reduce((sum, s) => sum + ((s.customPrice || s.base_price) * s.quantity - (s.discount || 0)), 0);
  const calculatedMonthlyTotal = propMonthlyTotal !== undefined ? propMonthlyTotal : monthlyServices.reduce((sum, s) => sum + ((s.customPrice || s.base_price) * s.quantity - (s.discount || 0)), 0);

  const hasBothServiceTypes = oneTimeServices.length > 0 && monthlyServices.length > 0;

  const handlePrintPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const pdfContent = printRef.current?.innerHTML || '';
    const headContent = document.head.innerHTML;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Proposta CONEX.HUB - ${clientInfo.name}</title>
          ${headContent}
          <style>
            @media print {
              body { margin: 0; padding: 0; }
              @page { margin: 10mm; size: A4; }
              .print-content { display: block !important; }
              .no-print { display: none !important; }
            }
          </style>
        </head>
        <body>
          ${pdfContent}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 2000);
  };

  const handleShareWhatsApp = () => {
    if (generatedShareLink) {
      const message = encodeURIComponent(`Confira esta proposta da CONEX.HUB: ${generatedShareLink}`);
      window.open(`https://wa.me/?text=${message}`, '_blank');
      toast.success('Link da proposta aberto no WhatsApp!');
    } else {
      toast.error('Link da proposta não disponível para compartilhamento. Gere o link primeiro.');
    }
  };

  useImperativeHandle(ref, () => ({
    handlePrintPDF,
    handleShareWhatsApp,
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hidden PDF Content for Printing */}
      <div ref={printRef} className="hidden">
        <PDFProposal
          selectedServices={selectedServices}
          clientInfo={clientInfo}
          subtotal={subtotal}
          discount={discount}
          discountType={discountType}
          discountPercentage={discountPercentage}
          total={total}
          cashDiscount={cashDiscount}
          finalTotal={finalTotal}
          selectedPayment={selectedPayment}
          installmentTotal={installmentTotal}
          notes={notes}
          isValidityEnabled={isValidityEnabled}
          validityDays={validityDays}
          proposalTitle={proposalTitle}
          proposalLogoUrl={proposalLogoUrl}
          proposalGradientTheme={proposalGradientTheme}
          oneTimeTotal={calculatedOneTimeTotal}
          monthlyTotal={calculatedMonthlyTotal}
          showInterestRate={showInterestRate}
        />
      </div>

      {/* Regular Preview Content */}
      <div className="no-print">
        {/* Header */}
        <Card className="gradient-button-bg text-white">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <img
                  src={proposalLogoUrl}
                  alt="CONEX.HUB Logo"
                  className="w-8 h-8 object-contain"
                />
                <div>
                  <CardTitle className="text-2xl font-bold text-white">CONEX.HUB</CardTitle>
                  <p className="text-conexhub-blue-100">Marketing e Tecnologia</p>
                </div>
              </div>
              <div className="text-right text-conexhub-blue-100">
                <p className="text-lg font-semibold">{proposalTitle || 'Proposta Comercial'}</p>
                <p className="text-sm">{currentDate}</p>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Client Info */}
        <Card className="bg-card text-foreground border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <User className="w-5 h-5" />
              Informações do Cliente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-primary" />
                <span>{clientInfo.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary" />
                <span>{clientInfo.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-primary" />
                <span>{clientInfo.company}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-primary" />
                <span>{clientInfo.phone}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Services */}
        <Card className="bg-card text-foreground border-border">
          <CardHeader>
            <CardTitle className="text-primary">Serviços Inclusos</CardTitle>
          </CardHeader>
          <CardContent>
            {oneTimeServices.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-conexhub-blue-800 mb-3 border-l-4 border-conexhub-teal-500 pl-3">Serviços Únicos</h3>
                <div className="space-y-4">
                  {oneTimeServices.map((service) => (
                    <div key={service.id} className="border border-border rounded-lg p-4 bg-muted/20">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="font-medium text-foreground mb-1">{service.name}</h3>
                          <p className="text-sm text-muted-foreground leading-relaxed">{service.description}</p>
                          {service.id === 'product-photography' && service.quantity > 1 && (
                            <p className="text-sm text-muted-foreground mt-1">
                              Qtd: {service.quantity} × {formatCurrency(service.customPrice || service.base_price)}
                            </p>
                          )}
                        </div>
                        <div className="text-right ml-4">
                          {service.discount && service.discount > 0 ? (
                            <div className="space-y-0.5">
                              <p className="text-sm text-muted-foreground line-through">
                                {formatCurrency((service.customPrice || service.base_price) * service.quantity)}
                              </p>
                              <p className="text-xs text-destructive font-medium">
                                -{service.discountPercentage?.toFixed(1)}% desconto
                              </p>
                              <p className="font-medium text-primary">
                                {formatCurrency(((service.customPrice || service.base_price) * service.quantity) - service.discount)}
                              </p>
                            </div>
                          ) : (
                            <p className="font-medium text-primary">
                              {formatCurrency((service.customPrice || service.base_price) * service.quantity)}
                            </p>
                          )}
                          {service.quantity > 1 && service.id !== 'product-photography' && (
                            <p className="text-sm text-muted-foreground">
                              Qtd: {service.quantity} × {formatCurrency(service.customPrice || service.base_price)}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="space-y-1 mt-3">
                        {(service.customFeatures || service.features).map((feature, index) => (
                          <div key={index} className="flex items-start gap-2 text-sm">
                            <span className="text-green-500 mt-0.5">•</span>
                            <span className="text-foreground leading-relaxed">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {monthlyServices.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-conexhub-blue-800 mb-3 border-l-4 border-conexhub-teal-500 pl-3">Serviços Mensais</h3>
                <div className="space-y-4">
                  {monthlyServices.map((service) => (
                    <div key={service.id} className="border border-border rounded-lg p-4 bg-muted/20">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="font-medium text-foreground mb-1">{service.name}</h3>
                          <p className="text-sm text-muted-foreground leading-relaxed">{service.description}</p>
                        </div>
                        <div className="text-right ml-4">
                          {service.discount && service.discount > 0 ? (
                            <div className="space-y-0.5">
                              <p className="text-sm text-muted-foreground line-through">
                                {formatCurrency((service.customPrice || service.base_price) * service.quantity)}/mês
                              </p>
                              <p className="text-xs text-destructive font-medium">
                                -{service.discountPercentage?.toFixed(1)}% desconto
                              </p>
                              <p className="font-medium text-primary">
                                {formatCurrency(((service.customPrice || service.base_price) * service.quantity) - service.discount)}/mês
                              </p>
                            </div>
                          ) : (
                            <p className="font-medium text-primary">
                              {formatCurrency((service.customPrice || service.base_price) * service.quantity)}/mês
                            </p>
                          )}
                          {service.quantity > 1 && (
                            <p className="text-sm text-muted-foreground">
                              Qtd: {service.quantity} × {formatCurrency(service.customPrice || service.base_price)}/mês
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="space-y-1 mt-3">
                        {(service.customFeatures || service.features).map((feature, index) => (
                          <div key={index} className="flex items-start gap-2 text-sm">
                            <span className="text-green-500 mt-0.5">•</span>
                            <span className="text-foreground leading-relaxed">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Investment Section */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-primary text-xl">Investimento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Totals by Billing Type - Only show if both types are present */}
            {hasBothServiceTypes && (
              <div className="space-y-2">
                {calculatedOneTimeTotal > 0 && (
                  <div className="flex justify-between text-lg">
                    <span className="text-foreground font-medium">Total Serviços Únicos:</span>
                    <span className="text-primary font-semibold">{formatCurrency(calculatedOneTimeTotal)}</span>
                  </div>
                )}
                {calculatedMonthlyTotal > 0 && (
                  <div className="flex justify-between text-lg">
                    <span className="text-foreground font-medium">Total Serviços Mensais:</span>
                    <span className="text-primary font-semibold">{formatCurrency(calculatedMonthlyTotal)}/mês</span>
                  </div>
                )}
                <Separator className="bg-border" />
              </div>
            )}

            {/* 1. Valor Bruto */}
            <div className="flex justify-between text-lg">
              <span className="text-foreground font-medium">Valor Bruto Total:</span>
              <span className="text-primary font-semibold">{formatCurrency(subtotal)}</span>
            </div>

            {/* Individual service discounts */}
            {selectedServices.some(s => s.discount && s.discount > 0) && (
              <div className="flex justify-between text-orange-600">
                <span>Descontos nos serviços:</span>
                <span className="font-semibold">
                  - {formatCurrency(selectedServices.reduce((total, s) => total + (s.discount || 0), 0))}
                </span>
              </div>
            )}
            
            <Separator className="bg-border" />

            {/* 2. Condições de Pagamento */}
            <div className="space-y-3">
              <h4 className="font-semibold text-foreground">Condições de Pagamento:</h4>
              
              {/* À vista com desconto configurável */}
              <div className="bg-green-100/20 p-3 rounded-lg border border-green-200/50">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-green-700 font-medium">Condição à Vista ({cashDiscount}% de desconto)</span>
                  <span className="text-green-800 font-semibold">
                    {formatCurrency(total - (total * cashDiscount / 100))}
                  </span>
                </div>
                <p className="text-sm text-green-600">
                  Desconto de {cashDiscount}% aplicado sobre o valor bruto
                </p>
              </div>

              {/* Condição parcelada - Simplificada */}
              {selectedPayment?.type === 'installment' && selectedPayment?.totalInstallmentValue && selectedPayment?.totalInstallmentValue > 0 && (
                <div className="bg-blue-100/20 p-3 rounded-lg border border-blue-200/50">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-blue-700 font-medium">Condição Parcelada:</span>
                      <span className="font-semibold text-blue-900">
                        {selectedPayment.installments}x de {formatCurrency(selectedPayment.installmentValue)}
                      </span>
                    </div>
                    {/* Taxa de juros condicional */}
                    {showInterestRate && (
                      <div className="flex justify-between text-sm">
                        <span className="text-blue-600">Taxa de juros:</span>
                        <span className={`font-semibold ${selectedPayment.fee >= 0 ? 'text-orange-600' : 'text-green-600'}`}>
                            {Math.abs(selectedPayment.fee).toFixed(1)}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <Separator className="bg-border" />

            {/* 3. Valores Finais Separados */}
            <div className="space-y-3">
              <h4 className="font-semibold text-foreground">Valores Finais:</h4>
              
              <div className="space-y-2">
                  <div className="bg-gradient-to-r from-green-100/20 to-green-50/20 p-3 rounded-lg border border-green-300/50">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-green-800">Valor Final à Vista:</span>
                      <span className="text-2xl font-bold text-green-700">
                        {formatCurrency(total - (total * cashDiscount / 100))}
                      </span>
                    </div>
                  </div>

                {selectedPayment?.type === 'installment' && selectedPayment?.totalInstallmentValue && selectedPayment?.totalInstallmentValue > 0 && (
                  <div className="bg-gradient-to-r from-blue-100/20 to-blue-50/20 p-3 rounded-lg border border-blue-300/50">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-blue-800">Valor Final Parcelado:</span>
                      <span className="text-2xl font-bold text-blue-700">
                        {formatCurrency(selectedPayment.totalInstallmentValue)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 4. Validade da Proposta */}
            {isValidityEnabled && (
              <>
                <Separator className="bg-border" />
                <div className="bg-yellow-100/20 p-3 rounded-lg border border-yellow-200/50">
                  <p className="text-yellow-800 font-medium text-center">
                    Validade da Proposta: {validityDays} dias
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Notes - moved after final total */}
        {notes && (
          <Card className="bg-card text-foreground border-border">
            <CardHeader>
              <CardTitle className="text-primary">Observações</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground whitespace-pre-wrap">{notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Footer - Contatos da Agência */}
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="text-center text-sm text-muted-foreground">
              <p className="font-medium text-foreground">CONEX.HUB - Marketing e Tecnologia</p>
              <p>Transformando negócios através da tecnologia e inovação</p>
              <div className="mt-3 space-y-1">
                <p className="font-medium">Contatos da Agência:</p>
                <p><strong>Site:</strong> conexhub.tech</p>
                <p><strong>E-mail:</strong> contato@conexhub.com.br</p>
                <p><strong>WhatsApp:</strong> (48) 99843-7326</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
});

export default QuoteResult;