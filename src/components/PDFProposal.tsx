import React from 'react';
import { SelectedService, ClientInfo } from '@/hooks/useQuoteGenerator';
import { useGradientTheme } from '@/context/GradientThemeContext'; // Import useGradientTheme
import { useCurrency } from '@/context/CurrencyContext'; // Import useCurrency

interface PDFProposalProps {
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
  oneTimeTotal: number; // New prop
  monthlyTotal: number; // New prop
  showInterestRate: boolean; // Novo: controle para mostrar taxa de juros
}

const PDFProposal: React.FC<PDFProposalProps> = ({
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
  oneTimeTotal, // Use new prop
  monthlyTotal, // Use new prop
  showInterestRate, // Novo: controle para mostrar taxa de juros
}) => {
  const currentDate = new Date().toLocaleDateString('pt-BR');
  const { pdfHeaderGradientMap } = useGradientTheme(); // Get the map from context
  const { formatCurrency } = useCurrency(); // Use formatCurrency from context

  // Get the specific gradient string based on the selected theme
  const headerGradientStyle = {
    background: pdfHeaderGradientMap[proposalGradientTheme] || pdfHeaderGradientMap.conexhub,
  };

  // Group services by billing type
  const oneTimeServices = selectedServices.filter(s => s.billing_type === 'one_time');
  const monthlyServices = selectedServices.filter(s => s.billing_type === 'monthly');

  // Heuristic: Hide descriptions if there are more than 1 service to save space
  const hideDescriptions = selectedServices.length > 1;

  // Determine if both one-time and monthly services are present
  const hasBothServiceTypes = oneTimeServices.length > 0 && monthlyServices.length > 0;

  return (
    <div className="print-content bg-white text-black font-sans w-full min-h-[297mm] max-w-[210mm] mx-auto p-[20mm] text-[12pt] flex flex-col justify-between print:p-[16mm] print:text-[11pt] print:max-w-full print:mx-0">
      {/* Header */}
      <div className="print-header text-white p-4 rounded-lg mb-8 print:mb-6 print:p-3" style={headerGradientStyle}>
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <img
              src={proposalLogoUrl}
              alt="CONEX.HUB Logo"
              className="w-8 h-8 object-contain print:w-6 print:h-6"
            />
            <div>
              <h1 className="text-2xl font-bold text-white mb-1 print:text-lg print:mb-0">CONEX.HUB</h1>
              <p className="text-conexhub-blue-100 text-base print:text-xs">Marketing e Tecnologia</p>
              <p className="text-conexhub-blue-200 text-sm print:text-xs print:hidden">Transformando negócios através da tecnologia e inovação</p>
            </div>
          </div>
          <div className="text-right text-conexhub-blue-100">
            <p className="text-lg font-semibold print:text-sm">{proposalTitle || 'Proposta Comercial'}</p>
            <p className="text-sm print:text-xs">{currentDate}</p>
          </div>
        </div>
      </div>

      {/* Client Info */}
      <div className="print-section mb-8 print:mb-6">
        <div className="grid grid-cols-2 gap-4 bg-conexhub-blue-50 p-4 rounded-lg text-sm print:gap-3 print:p-3 print:text-xs">
          <div className="space-y-3 print:space-y-2">
            <div>
              <p className="text-conexhub-blue-600 font-medium">Nome:</p>
              <p className="font-semibold text-conexhub-blue-900">{clientInfo.name}</p>
            </div>
            <div>
              <p className="text-conexhub-blue-600 font-medium">Empresa:</p>
              <p className="font-semibold text-conexhub-blue-900">{clientInfo.company}</p>
            </div>
          </div>
          <div className="space-y-3 print:space-y-2">
            <div>
              <p className="text-conexhub-blue-600 font-medium">Telefone:</p>
              <p className="font-semibold text-conexhub-blue-900">{clientInfo.phone}</p>
            </div>
            <div>
              <p className="text-conexhub-blue-600 font-medium">E-mail:</p>
              <p className="font-semibold text-conexhub-blue-900">{clientInfo.email}</p>
            </div>
        </div>
      </div>
      </div>

      {/* Services */}
      <div className="print-section mb-8 print:mb-6">
        <h2 className="text-lg font-semibold text-conexhub-blue-800 mb-4 border-l-4 border-conexhub-teal-500 pl-3 print:text-base print:mb-3 print:pl-2">
          Serviços Inclusos
        </h2>
        
        {oneTimeServices.length > 0 && (
          <div className="mb-6 print:mb-4">
            <h3 className="text-base font-semibold text-conexhub-blue-700 mb-3 print:text-sm print:mb-2">Serviços Únicos</h3>
            <div className="space-y-3 print:space-y-2">
              {oneTimeServices.map((service) => (
                <div key={service.id} className="print-service-item border border-conexhub-blue-200 rounded-lg p-2 print:p-1 keep-together">
                  <div className="flex justify-between items-start mb-1 print:mb-0">
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm text-conexhub-blue-800 mb-1 print:text-xs print:mb-0">{service.name}</h3>
                      {!hideDescriptions && (
                        <p className="text-conexhub-blue-600 text-xs leading-relaxed print:text-xs print:leading-tight">{service.description}</p>
                      )}
                      {service.id === 'product-photography' && service.quantity > 1 && (
                        <p className="text-xs text-conexhub-blue-600 print:text-xs mt-1">
                          Qtd: {service.quantity} × {formatCurrency(service.customPrice || service.base_price)}
                        </p>
                      )}
                    </div>
                    <div className="text-right ml-4">
                      {service.discount && service.discount > 0 ? (
                        <div className="space-y-0.5">
                          <p className="text-xs text-conexhub-blue-500 line-through print:text-xs">
                            {formatCurrency(((service.customPrice || service.base_price) * service.quantity))}
                          </p>
                          <p className="text-xs text-red-600 font-medium print:text-xs">
                            -{service.discountPercentage?.toFixed(1)}% desconto
                          </p>
                          <p className="text-sm font-bold text-conexhub-teal-600 print:text-xs">
                            {formatCurrency(((service.customPrice || service.base_price) * service.quantity) - service.discount)}
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm font-bold text-conexhub-teal-600 print:text-xs">
                          {formatCurrency((service.customPrice || service.base_price) * service.quantity)}
                        </p>
                      )}
                      {service.quantity > 1 && service.id !== 'product-photography' && (
                        <p className="text-xs text-conexhub-blue-600 print:text-xs">
                          Qtd: {service.quantity} × {formatCurrency(service.customPrice || service.base_price)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="print-features responsive-bullets mt-2 print:mt-1">
                    {(service.customFeatures || service.features).map((feature, index) => (
                      <div key={index} className="bullet-item flex items-start gap-2 text-xs text-conexhub-blue-700 print:text-xs">
                        <span className="text-conexhub-green-600 font-bold text-xs mt-0.5 flex-shrink-0">•</span>
                        <span className="text-xs leading-relaxed print:leading-tight">{feature}</span>
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
            <h3 className="text-base font-semibold text-conexhub-blue-700 mb-3 print:text-sm print:mb-2">Serviços Mensais</h3>
            <div className="space-y-3 print:space-y-2">
              {monthlyServices.map((service) => (
                <div key={service.id} className="print-service-item border border-conexhub-blue-200 rounded-lg p-2 print:p-1 keep-together">
                  <div className="flex justify-between items-start mb-1 print:mb-0">
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm text-conexhub-blue-800 mb-1 print:text-xs print:mb-0">{service.name}</h3>
                      {!hideDescriptions && (
                        <p className="text-conexhub-blue-600 text-xs leading-relaxed print:text-xs print:leading-tight">{service.description}</p>
                      )}
                    </div>
                    <div className="text-right ml-4">
                      {service.discount && service.discount > 0 ? (
                        <div className="space-y-0.5">
                          <p className="text-xs text-conexhub-blue-500 line-through print:text-xs">
                            {formatCurrency(((service.customPrice || service.base_price) * service.quantity))}/mês
                          </p>
                          <p className="text-xs text-red-600 font-medium print:text-xs">
                            -{service.discountPercentage?.toFixed(1)}% desconto
                          </p>
                          <p className="text-sm font-bold text-conexhub-teal-600 print:text-xs">
                            {formatCurrency(((service.customPrice || service.base_price) * service.quantity) - service.discount)}/mês
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm font-bold text-conexhub-teal-600 print:text-xs">
                          {formatCurrency((service.customPrice || service.base_price) * service.quantity)}/mês
                        </p>
                      )}
                      {service.quantity > 1 && (
                        <p className="text-xs text-conexhub-blue-600 print:text-xs">
                          Qtd: {service.quantity} × {formatCurrency(service.customPrice || service.base_price)}/mês
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="print-features responsive-bullets mt-2 print:mt-1">
                    {(service.customFeatures || service.features).map((feature, index) => (
                      <div key={index} className="bullet-item flex items-start gap-2 text-xs text-conexhub-blue-700 print:text-xs">
                        <span className="text-conexhub-green-600 font-bold text-xs mt-0.5 flex-shrink-0">•</span>
                        <span className="text-xs leading-relaxed print:leading-tight">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Investment Section - This section must stay together */}
      <div className="print-investment-section mb-8 print:mb-6">
        <h2 className="text-lg font-semibold text-conexhub-blue-800 mb-4 border-l-4 border-conexhub-teal-500 pl-3 print:text-base print:mb-3 print:pl-2">
          Investimento
        </h2>
        
        <div className="bg-conexhub-blue-50 p-4 rounded-lg border border-conexhub-blue-200 space-y-4 print:p-3 print:space-y-3">
          {/* Totals by Billing Type - Only show if both types are present */}
          {hasBothServiceTypes && (
            <div className="space-y-2">
              {oneTimeTotal > 0 && (
                <div className="flex justify-between text-sm print:text-xs">
                  <span className="text-conexhub-blue-700 font-medium">Total Serviços Únicos:</span>
                  <span className="font-semibold text-conexhub-blue-900">{formatCurrency(oneTimeTotal)}</span>
                </div>
              )}
              {monthlyTotal > 0 && (
                <div className="flex justify-between text-sm print:text-xs">
                  <span className="text-conexhub-blue-700 font-medium">Total Serviços Mensais:</span>
                  <span className="font-semibold text-conexhub-blue-900">{formatCurrency(monthlyTotal)}/mês</span>
                </div>
              )}
              <div className="border-t border-conexhub-blue-200 pt-2 mt-2 print:pt-1 print:mt-1" />
            </div>
          )}

          {/* 1. Valor Bruto */}
          <div className="flex justify-between text-sm print:text-xs">
            <span className="text-conexhub-blue-700 font-medium">Valor Bruto Total:</span>
            <span className="font-semibold text-conexhub-blue-900">{formatCurrency(subtotal)}</span>
          </div>

          {/* Individual service discounts */}
          {selectedServices.some(s => s.discount && s.discount > 0) && (
            <div className="flex justify-between text-xs text-orange-600 print:text-xs">
              <span>Descontos nos serviços:</span>
              <span className="font-semibold">
                - {formatCurrency(selectedServices.reduce((total, s) => total + (s.discount || 0), 0))}
              </span>
            </div>
          )}
          

          {/* Payment conditions must stay together */}
          <div className="border-t border-conexhub-blue-200 pt-3 mt-3 print:pt-2 print:mt-2">
            <h3 className="font-medium text-conexhub-blue-800 mb-3 text-sm print:mb-2 print:text-xs">Condições de Pagamento:</h3>
            
            {/* À vista com desconto configurável */}
            <div className="bg-conexhub-green-50 p-2 rounded border border-conexhub-green-200 mb-2 keep-together print:p-1 print:mb-1">
              <div className="flex justify-between text-xs mb-0.5 print:mb-0 print:text-xs">
                <span className="text-conexhub-green-700 font-medium">Condição à Vista ({cashDiscount}% de desconto):</span>
                <span className="font-semibold text-conexhub-green-800">
                  {formatCurrency(total - (total * cashDiscount / 100))}
                </span>
              </div>
              <p className="text-xs text-conexhub-green-600 print:text-xs">Desconto de {cashDiscount}% aplicado sobre o valor bruto</p>
            </div>

            {/* Condição parcelada - Simplificada */}
            {selectedPayment?.type === 'installment' && selectedPayment?.totalInstallmentValue && selectedPayment?.totalInstallmentValue > 0 && (
              <div className="bg-conexhub-blue-50 p-2 rounded border border-conexhub-blue-200 mb-2 keep-together print:p-1 print:mb-1">
                <div className="flex justify-between text-xs mb-0.5 print:mb-0 print:text-xs">
                  <span className="text-conexhub-blue-700 font-medium">Condição Parcelada:</span>
                  <span className="font-semibold text-conexhub-blue-800">
                    {selectedPayment.installments}x de {formatCurrency(selectedPayment.installmentValue)}
                  </span>
                </div>
                {/* Taxa de juros condicional */}
                {showInterestRate && (
                  <div className="flex justify-between text-xs print:text-xs">
                    <span className="text-conexhub-blue-600">Taxa de juros:</span>
                    <span className="font-semibold text-orange-600">{Math.abs(selectedPayment.fee).toFixed(1)}%</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Final values must stay together */}
          <div className="border-t border-conexhub-blue-300 pt-3 mt-3 print:pt-2 print:mt-2">
            <h3 className="font-medium text-conexhub-blue-800 mb-3 text-sm print:mb-2 print:text-xs">Valores Finais:</h3>
            
            <div className="space-y-1 print:space-y-0.5">
              <div className="bg-gradient-to-r from-conexhub-green-100 to-conexhub-green-50 p-2 rounded-lg border border-conexhub-green-300 print:p-1">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-conexhub-green-800 print:text-xs">Valor Final à Vista:</span>
                  <span className="text-lg font-bold text-conexhub-green-700 print:text-sm">
                    {formatCurrency(total - (total * cashDiscount / 100))}
                  </span>
                </div>
              </div>

              {selectedPayment?.type === 'installment' && selectedPayment?.totalInstallmentValue && selectedPayment?.totalInstallmentValue > 0 && (
                <div className="bg-gradient-to-r from-conexhub-blue-100 to-conexhub-blue-50 p-2 rounded-lg border border-conexhub-blue-300 print:p-1">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-conexhub-blue-800 print:text-xs">Valor Final Parcelado:</span>
                    <span className="text-lg font-bold text-conexhub-blue-700 print:text-sm">
                      {formatCurrency(selectedPayment.totalInstallmentValue)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Validade da Proposta */}
          {isValidityEnabled && (
            <div className="border-t border-conexhub-blue-200 pt-2 mt-2 print:pt-1 print:mt-1">
              <div className="bg-yellow-50 p-1.5 rounded border border-yellow-200 print:p-1">
                <p className="text-yellow-800 text-xs font-medium text-center print:text-xs">
                  Validade da Proposta: {validityDays} dias
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Notes - moved after final total */}
      {notes && (
        <div className="print-section mb-8 print:mb-6">
          <h2 className="text-lg font-semibold text-conexhub-blue-800 mb-4 border-l-4 border-conexhub-teal-500 pl-3 print:text-base print:mb-3 print:pl-2">
            Observações
          </h2>
          <div className="bg-conexhub-blue-50 p-4 rounded-lg print:p-3">
            <p className="text-conexhub-blue-700 whitespace-pre-wrap text-sm print:text-xs">{notes}</p>
          </div>
        </div>
      )}

      {/* Footer - Contatos da Agência */}
      <div className="text-center text-conexhub-blue-600 border-t border-conexhub-blue-200 pt-6 mt-8 print:pt-4 print:mt-6">
        {/* Logo centralizado */}
        <div className="flex justify-center mb-2">
          <img
            src={proposalLogoUrl}
            alt="CONEX.HUB Logo"
            className="w-6 h-6 object-contain opacity-60 print:w-5 print:h-5"
          />
        </div>

        {/* Título centralizado */}
        <div className="mb-3">
          <p className="font-semibold text-conexhub-blue-800 text-sm print:text-xs">CONEX.HUB - Marketing e Tecnologia</p>
          <p className="text-xs print:text-xs">Transformando negócios através da tecnologia e inovação</p>
        </div>
      </div>
    </div>
  );
};

export default PDFProposal;