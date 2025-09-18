import React from 'react';
import { ProposalSnapshot } from '@/types/proposalSnapshot';
import { useGradientTheme } from '@/context/GradientThemeContext';
import { useCurrency } from '@/context/CurrencyContext';
import { getServicePrice, calculateServiceTotal } from '@/lib/proposalUtils';

interface ProposalDocumentProps {
  snapshot: ProposalSnapshot;
  className?: string;
}

const ProposalDocument: React.FC<ProposalDocumentProps> = ({ snapshot, className = '' }) => {
  const { pdfHeaderGradientMap } = useGradientTheme();
  const { formatCurrency } = useCurrency();

  const currentDate = new Date().toLocaleDateString('pt-BR');
  
  // Get the specific gradient string based on the selected theme
  const headerGradientStyle = {
    background: pdfHeaderGradientMap[snapshot.theme.gradient_theme] || pdfHeaderGradientMap.conexhub,
  };

  // Group services by billing type
  const oneTimeServices = snapshot.services.filter(s => s.billing_type === 'one_time');
  const monthlyServices = snapshot.services.filter(s => s.billing_type === 'monthly');

  // Heuristic: Hide descriptions if there are more than 1 service to save space
  const hideDescriptions = snapshot.services.length > 1;

  // Determine if both one-time and monthly services are present
  const hasBothServiceTypes = oneTimeServices.length > 0 && monthlyServices.length > 0;

  // Helper function to safely render service price
  const renderServicePrice = (service: any, showDiscount = false) => {
    const price = getServicePrice(service.custom_price, service.base_price);
    const quantity = service.quantity || 1;
    const discount = service.discount || 0;
    
    if (showDiscount && discount > 0) {
      const originalTotal = price * quantity;
      const finalTotal = originalTotal - discount;
      return (
        <div className="space-y-0.5">
          <p className="text-xs text-conexhub-blue-500 line-through print:text-xs">
            {formatCurrency(originalTotal)}
          </p>
          <p className="text-xs text-red-600 font-medium print:text-xs">
            -{(service.discount_percentage || 0).toFixed(1)}% desconto
          </p>
          <p className="text-sm font-bold text-conexhub-teal-600 print:text-xs">
            {formatCurrency(finalTotal)}
          </p>
        </div>
      );
    } else {
      return (
        <p className="text-sm font-bold text-conexhub-teal-600 print:text-xs">
          {formatCurrency(price * quantity)}
        </p>
      );
    }
  };

  return (
    <div className={`print-content bg-white text-black font-sans w-full min-h-[297mm] max-w-[210mm] mx-auto p-[20mm] text-[12pt] flex flex-col justify-between print:p-[16mm] print:text-[11pt] print:max-w-full print:mx-0 ${className}`}>
      {/* Header */}
      <div className="print-header text-white p-4 rounded-lg mb-8 print:mb-6 print:p-3" style={headerGradientStyle}>
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <img
              src={snapshot.theme.resolved_logo_url}
              alt="CONEX.HUB Logo"
              className="w-8 h-8 object-contain print:w-6 print:h-6"
              crossOrigin="anonymous"
            />
            <div>
              <h1 className="text-2xl font-bold text-white mb-1 print:text-lg print:mb-0">CONEX.HUB</h1>
              <p className="text-conexhub-blue-100 text-base print:text-xs">Marketing e Tecnologia</p>
              <p className="text-conexhub-blue-200 text-sm print:text-xs print:hidden">Transformando negócios através da tecnologia e inovação</p>
            </div>
          </div>
          <div className="text-right text-conexhub-blue-100">
            <p className="text-lg font-semibold print:text-sm">{snapshot.title || 'Proposta Comercial'}</p>
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
              <p className="font-semibold text-conexhub-blue-900">{snapshot.client.name}</p>
            </div>
            <div>
              <p className="text-conexhub-blue-600 font-medium">Empresa:</p>
              <p className="font-semibold text-conexhub-blue-900">{snapshot.client.company}</p>
            </div>
          </div>
          <div className="space-y-3 print:space-y-2">
            <div>
              <p className="text-conexhub-blue-600 font-medium">Telefone:</p>
              <p className="font-semibold text-conexhub-blue-900">{snapshot.client.phone}</p>
            </div>
            <div>
              <p className="text-conexhub-blue-600 font-medium">E-mail:</p>
              <p className="font-semibold text-conexhub-blue-900">{snapshot.client.email}</p>
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
                      {service.service_id === 'product-photography' && service.quantity > 1 && (
                        <p className="text-xs text-conexhub-blue-600 print:text-xs mt-1">
                          Qtd: {service.quantity} × {formatCurrency(getServicePrice(service.custom_price, service.base_price))}
                        </p>
                      )}
                    </div>
                    <div className="text-right ml-4">
                      {renderServicePrice(service, service.discount && service.discount > 0)}
                      {service.quantity > 1 && service.service_id !== 'product-photography' && (
                        <p className="text-xs text-conexhub-blue-600 print:text-xs">
                          Qtd: {service.quantity} × {formatCurrency(getServicePrice(service.custom_price, service.base_price))}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="print-features responsive-bullets mt-2 print:mt-1">
                    {service.features.map((feature, index) => (
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
                            {formatCurrency(getServicePrice(service.custom_price, service.base_price) * (service.quantity || 1))}/mês
                          </p>
                          <p className="text-xs text-red-600 font-medium print:text-xs">
                            -{(service.discount_percentage || 0).toFixed(1)}% desconto
                          </p>
                          <p className="text-sm font-bold text-conexhub-teal-600 print:text-xs">
                            {formatCurrency(calculateServiceTotal(service.custom_price, service.base_price, service.quantity, service.discount))}/mês
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm font-bold text-conexhub-teal-600 print:text-xs">
                          {formatCurrency(getServicePrice(service.custom_price, service.base_price) * (service.quantity || 1))}/mês
                        </p>
                      )}
                      {service.quantity > 1 && (
                        <p className="text-xs text-conexhub-blue-600 print:text-xs">
                          Qtd: {service.quantity} × {formatCurrency(getServicePrice(service.custom_price, service.base_price))}/mês
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="print-features responsive-bullets mt-2 print:mt-1">
                    {service.features.map((feature, index) => (
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

      {/* Investment Section */}
      <div className="print-investment-section mb-8 print:mb-6">
        <h2 className="text-lg font-semibold text-conexhub-blue-800 mb-4 border-l-4 border-conexhub-teal-500 pl-3 print:text-base print:mb-3 print:pl-2">
          Investimento
        </h2>
        
        <div className="bg-conexhub-blue-50 p-4 rounded-lg border border-conexhub-blue-200 space-y-4 print:p-3 print:space-y-3">
          {/* Totals by Billing Type - Only show if both types are present */}
          {hasBothServiceTypes && (
            <div className="space-y-2">
              {snapshot.totals.oneTimeTotal > 0 && (
                <div className="flex justify-between text-sm print:text-xs">
                  <span className="text-conexhub-blue-700 font-medium">Total Serviços Únicos:</span>
                  <span className="font-semibold text-conexhub-blue-900">{formatCurrency(snapshot.totals.oneTimeTotal)}</span>
                </div>
              )}
              {snapshot.totals.monthlyTotal > 0 && (
                <div className="flex justify-between text-sm print:text-xs">
                  <span className="text-conexhub-blue-700 font-medium">Total Serviços Mensais:</span>
                  <span className="font-semibold text-conexhub-blue-900">{formatCurrency(snapshot.totals.monthlyTotal)}/mês</span>
                </div>
              )}
              <div className="border-t border-conexhub-blue-200 pt-2 mt-2 print:pt-1 print:mt-1" />
            </div>
          )}

          {/* 1. Valor Bruto */}
          <div className="flex justify-between text-sm print:text-xs">
            <span className="text-conexhub-blue-700 font-medium">Valor Bruto Total:</span>
            <span className="font-semibold text-conexhub-blue-900">{formatCurrency(snapshot.totals.subtotal)}</span>
          </div>

          {/* Individual service discounts */}
          {snapshot.services.some(s => s.discount && s.discount > 0) && (
            <div className="flex justify-between text-xs text-orange-600 print:text-xs">
              <span>Descontos nos serviços:</span>
              <span className="font-semibold">
                - {formatCurrency(snapshot.services.reduce((total, s) => total + (s.discount || 0), 0))}
              </span>
            </div>
          )}
          
          {/* Payment conditions */}
          <div className="border-t border-conexhub-blue-200 pt-3 mt-3 print:pt-2 print:mt-2">
            <h3 className="font-medium text-conexhub-blue-800 mb-3 text-sm print:mb-2 print:text-xs">Condições de Pagamento:</h3>
            
            {/* À vista com desconto configurável */}
            <div className="bg-conexhub-green-50 p-2 rounded border border-conexhub-green-200 mb-2 keep-together print:p-1 print:mb-1">
              <div className="flex justify-between text-xs mb-0.5 print:mb-0 print:text-xs">
                <span className="text-conexhub-green-700 font-medium">Condição à Vista ({snapshot.payment.cash_discount_percentage}% de desconto):</span>
                <span className="font-semibold text-conexhub-green-800">
                  {formatCurrency(snapshot.totals.totalCash)}
                </span>
              </div>
              <p className="text-xs text-conexhub-green-600 print:text-xs">Desconto de {snapshot.payment.cash_discount_percentage}% aplicado sobre o valor bruto</p>
            </div>

            {/* Condição parcelada */}
            {snapshot.payment.installment_number > 1 && (
              <div className="bg-conexhub-blue-50 p-2 rounded border border-conexhub-blue-200 mb-2 keep-together print:p-1 print:mb-1">
                <div className="flex justify-between text-xs mb-0.5 print:mb-0 print:text-xs">
                  <span className="text-conexhub-blue-700 font-medium">Condição Parcelada:</span>
                  <span className="font-semibold text-conexhub-blue-800">
                    {snapshot.payment.installment_number}x de {formatCurrency(snapshot.payment.installment_value)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Final values */}
          <div className="border-t border-conexhub-blue-300 pt-3 mt-3 print:pt-2 print:mt-2">
            <h3 className="font-medium text-conexhub-blue-800 mb-3 text-sm print:mb-2 print:text-xs">Valores Finais:</h3>
            
            <div className="space-y-1 print:space-y-0.5">
              <div className="bg-gradient-to-r from-conexhub-green-100 to-conexhub-green-50 p-2 rounded-lg border border-conexhub-green-300 print:p-1">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-conexhub-green-800 print:text-xs">Valor Final à Vista:</span>
                  <span className="text-lg font-bold text-conexhub-green-700 print:text-sm">
                    {formatCurrency(snapshot.totals.totalCash)}
                  </span>
                </div>
              </div>

              {snapshot.payment.type === 'installment' && snapshot.payment.installment_number > 1 && (
                <div className="bg-gradient-to-r from-conexhub-blue-100 to-conexhub-blue-50 p-2 rounded-lg border border-conexhub-blue-300 print:p-1">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-conexhub-blue-800 print:text-xs">Valor Final Parcelado:</span>
                  <span className="text-lg font-bold text-conexhub-blue-700 print:text-sm">
                    {formatCurrency(snapshot.totals.totalInstallment)}
                  </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Validade da Proposta */}
          {snapshot.validity.days > 0 && (
            <div className="border-t border-conexhub-blue-200 pt-2 mt-2 print:pt-1 print:mt-1">
              <div className="bg-yellow-50 p-1.5 rounded border border-yellow-200 print:p-1">
                <p className="text-yellow-800 text-xs font-medium text-center print:text-xs">
                  Validade da Proposta: {snapshot.validity.days} dias
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Notes */}
      {snapshot.notes && (
        <div className="print-section mb-8 print:mb-6">
          <h2 className="text-lg font-semibold text-conexhub-blue-800 mb-4 border-l-4 border-conexhub-teal-500 pl-3 print:text-base print:mb-3 print:pl-2">
            Observações
          </h2>
          <div className="bg-conexhub-blue-50 p-4 rounded-lg print:p-3">
            <p className="text-conexhub-blue-700 whitespace-pre-wrap text-sm print:text-xs">{snapshot.notes}</p>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-conexhub-blue-600 border-t border-conexhub-blue-200 pt-6 mt-8 print:pt-4 print:mt-6">
        {/* Logo centralizado */}
        <div className="flex justify-center mb-2">
          <img
            src={snapshot.theme.resolved_logo_url}
            alt="CONEX.HUB Logo"
            className="w-6 h-6 object-contain opacity-60 print:w-5 print:h-5"
            crossOrigin="anonymous"
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

export default ProposalDocument;
