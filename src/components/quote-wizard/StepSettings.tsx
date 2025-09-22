import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useQuoteWizard } from '@/context/QuoteWizardContext';
import { useGradientTheme } from '@/context/GradientThemeContext'; // To get gradient options
import { useCurrency } from '@/context/CurrencyContext'; // Import useCurrency
import { AlertCircle, CheckCircle, Info } from 'lucide-react';

const StepSettings: React.FC = () => {
  const {
    paymentType, setPaymentType, installmentNumber, setInstallmentNumber, installmentValue, setInstallmentValue,
    manualInstallmentTotal, setManualInstallmentTotal, cashDiscountPercentage, setCashDiscountPercentage,
    notes, setNotes, isValidityEnabled, setIsValidityEnabled, validityDays, setValidityDays,
    calculateInstallmentInterestRate, getTotalInstallmentValue, calculateTotal,
    proposalTitle, setProposalTitle, proposalLogoUrl, setProposalLogoUrl, proposalGradientTheme, setProposalGradientTheme,
    showInterestRate, setShowInterestRate // Novo: controle para mostrar taxa de juros
  } = useQuoteWizard();

  const { gradientMap } = useGradientTheme(); // Get the gradient map for display
  const { formatCurrency } = useCurrency(); // Use formatCurrency from context

  // Validação para campos de parcelamento
  const isInstallmentValid = () => {
    if (paymentType !== 'installment') return true;
    return installmentValue > 0 || manualInstallmentTotal > 0;
  };

  const getInstallmentValidationMessage = () => {
    if (paymentType !== 'installment') return null;
    
    if (installmentValue === 0 && (manualInstallmentTotal === null || manualInstallmentTotal === 0)) {
      return {
        type: 'warning' as const,
        message: 'Para pagamento parcelado, preencha o valor da parcela ou o total parcelado manual para que as informações apareçam na proposta.'
      };
    }
    
    return {
      type: 'success' as const,
      message: 'Configuração de parcelamento completa! As informações serão exibidas na proposta.'
    };
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Configurações da Proposta</CardTitle>
          <CardDescription>Ajuste as condições de pagamento, descontos e validade da proposta.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Proposal Title */}
          <div className="space-y-2">
            <Label htmlFor="proposalTitle">Título da Proposta *</Label>
            <Input
              id="proposalTitle"
              value={proposalTitle}
              onChange={(e) => setProposalTitle(e.target.value)}
              placeholder="Proposta Comercial para [Nome do Cliente]"
              required
            />
            <p className="text-sm text-muted-foreground">
              Este título aparecerá no cabeçalho da proposta.
            </p>
          </div>

          {/* Visual Customization */}
          <div className="space-y-4">
            <h3 className="font-medium">Personalização Visual</h3>
            <div className="space-y-2">
              <Label htmlFor="proposalLogoUrl">URL do Logo</Label>
              <Input
                id="proposalLogoUrl"
                value={proposalLogoUrl}
                onChange={(e) => setProposalLogoUrl(e.target.value)}
                placeholder="https://seulogo.com/logo.png"
              />
              <p className="text-sm text-muted-foreground">
                Use uma URL de imagem para o logo da sua proposta.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="proposalGradientTheme">Tema de Gradiente</Label>
              <Select
                value={proposalGradientTheme}
                onValueChange={(value) => setProposalGradientTheme(value as 'conexhub' | 'alt1' | 'alt2')}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Selecionar tema" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="conexhub">CONEX.HUB Padrão</SelectItem>
                  <SelectItem value="alt1">Alternativo 1</SelectItem>
                  <SelectItem value="alt2">Alternativo 2</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Define o esquema de cores para os gradientes da proposta.
              </p>
            </div>
          </div>

          {/* Forma de Pagamento */}
          <div className="space-y-4">
            <h3 className="font-medium">Forma de Pagamento</h3>
            <div className="flex gap-4">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="cash"
                  name="paymentType"
                  checked={paymentType === 'cash'}
                  onChange={() => {
                    setPaymentType('cash');
                    setManualInstallmentTotal(null);
                  }}
                  className="w-4 h-4"
                />
                <Label htmlFor="cash">À Vista</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="installment"
                  name="paymentType"
                  checked={paymentType === 'installment'}
                  onChange={() => setPaymentType('installment')}
                  className="w-4 h-4"
                />
                <Label htmlFor="installment">Parcelado</Label>
              </div>
            </div>

            {paymentType === 'installment' && (
              <div className="space-y-4">
                {/* Alerta de validação */}
                {getInstallmentValidationMessage() && (
                  <Alert className={getInstallmentValidationMessage()?.type === 'warning' ? 'border-orange-200 bg-orange-50' : 'border-green-200 bg-green-50'}>
                    {getInstallmentValidationMessage()?.type === 'warning' ? (
                      <AlertCircle className="h-4 w-4 text-orange-600" />
                    ) : (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    )}
                    <AlertDescription className={getInstallmentValidationMessage()?.type === 'warning' ? 'text-orange-800' : 'text-green-800'}>
                      {getInstallmentValidationMessage()?.message}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                  <div>
                    <Label htmlFor="installmentNumber">Número de Parcelas *</Label>
                    <Select 
                      value={installmentNumber.toString()} 
                      onValueChange={(value) => {
                        setInstallmentNumber(parseInt(value));
                        setManualInstallmentTotal(null);
                      }}
                    >
                      <SelectTrigger className="bg-background border border-input">
                        <SelectValue placeholder="Escolha as parcelas" />
                      </SelectTrigger>
                      <SelectContent className="z-50 bg-background border border-input shadow-lg">
                        {Array.from({length: 11}, (_, i) => i + 2).map((num) => (
                          <SelectItem key={num} value={num.toString()}>{num}x</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="installmentValue">Valor da Parcela ({formatCurrency(0).replace(/[\d.,]/g, '')}) *</Label>
                    <Input
                      id="installmentValue"
                      type="number"
                      value={installmentValue || ''}
                      onChange={(e) => {
                        setInstallmentValue(Number(e.target.value) || 0);
                        setManualInstallmentTotal(null);
                      }}
                      placeholder="0,00"
                      min="0"
                      className={installmentValue === 0 ? 'border-orange-300 focus:border-orange-500' : ''}
                    />
                    {installmentValue === 0 && (
                      <p className="text-xs text-orange-600 mt-1">
                        ⚠️ Preencha o valor da parcela para exibir na proposta
                      </p>
                    )}
                  </div>
                  <div className="col-span-full">
                    <Label htmlFor="manualInstallmentTotal">Total Parcelado Manual ({formatCurrency(0).replace(/[\d.,]/g, '')})</Label>
                    <Input
                      id="manualInstallmentTotal"
                      type="number"
                      value={manualInstallmentTotal !== null ? manualInstallmentTotal : ''}
                      onChange={(e) => setManualInstallmentTotal(Number(e.target.value) || null)}
                      placeholder="Opcional: Sobrescrever total"
                      min="0"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Preencha para definir um valor total parcelado exato, ignorando o cálculo automático.
                    </p>
                  </div>
                  {getTotalInstallmentValue() > 0 && (
                    <div className="col-span-full p-3 bg-background rounded border">
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Total parcelado:</span>
                          <span className="font-semibold">{formatCurrency(getTotalInstallmentValue())}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Taxa de juros:</span>
                          <span className={`font-semibold ${calculateInstallmentInterestRate() >= 0 ? 'text-orange-600' : 'text-green-600'}`}>
                            {calculateInstallmentInterestRate().toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Desconto à Vista */}
          <div className="space-y-4">
            <h3 className="font-medium">Desconto à Vista</h3>
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <Label htmlFor="cashDiscount">Desconto à Vista (%)</Label>
                <Input
                  id="cashDiscount"
                  type="number"
                  value={cashDiscountPercentage}
                  onChange={(e) => setCashDiscountPercentage(Number(e.target.value))}
                  placeholder="5"
                  min="0"
                  max="100"
                />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Desconto aplicado automaticamente no pagamento à vista: {cashDiscountPercentage}%
            </p>
          </div>

          {/* Exibição da Taxa de Juros */}
          {paymentType === 'installment' && (
            <div className="space-y-4">
              <h3 className="font-medium">Exibição da Taxa de Juros</h3>
              <div className="flex items-center gap-2">
                <Label htmlFor="show-interest-rate">Mostrar taxa de juros na proposta final</Label>
                <Switch
                  id="show-interest-rate"
                  checked={showInterestRate}
                  onCheckedChange={setShowInterestRate}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                {showInterestRate 
                  ? 'A taxa de juros será exibida na proposta final e no PDF.'
                  : 'A taxa de juros será ocultada na proposta final e no PDF.'}
              </p>
            </div>
          )}

          {/* Proposal Validity */}
          <div className="space-y-4">
            <h3 className="font-medium">Validade da Proposta</h3>
            <div className="flex items-center gap-2">
              <Label htmlFor="enable-validity">Habilitar Validade</Label>
              <Switch
                id="enable-validity"
                checked={isValidityEnabled}
                onCheckedChange={setIsValidityEnabled}
              />
              {isValidityEnabled && (
                <div className="transition-all duration-300 ease-in-out overflow-hidden w-[100px]">
                  <Label htmlFor="validityDays" className="sr-only">Dias de Validade</Label>
                  <Input
                    id="validityDays"
                    type="number"
                    value={validityDays}
                    onChange={(e) => setValidityDays(Number(e.target.value))}
                    placeholder="30"
                    min="1"
                    className="w-full"
                  />
                </div>
              )}
            </div>
            {isValidityEnabled && (
              <p className="text-sm text-muted-foreground mt-1">
                A proposta será válida por {validityDays} dias a partir da data de emissão.
              </p>
            )}
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Adicione observações especiais sobre a proposta..."
              rows={4}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StepSettings;