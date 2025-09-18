import { useState } from 'react';
import { CustomService } from './useCustomServices'; // Import CustomService type
import { useCurrency } from '@/context/CurrencyContext'; // Import useCurrency
import { Database } from '@/integrations/supabase/types'; // Import Database types

type BillingType = Database['public']['Enums']['billing_type'];

export interface Service {
  id: string;
  name: string;
  description: string;
  base_price: number; // Alterado de basePrice para base_price
  category: string;
  icon: string;
  features: string[];
  popular?: boolean;
  isCustom?: boolean; // Add flag for custom services
  billing_type: BillingType; // Added billing_type
}

export interface SelectedService extends Service {
  quantity: number;
  customPrice?: number;
  discount?: number; // valor absoluto em R$
  discountPercentage?: number; // porcentagem calculada
  discountType?: 'percentage' | 'value'; // tipo de desconto aplicado
  customFeatures?: string[]; // Novas características personalizadas para a proposta
}

export interface ClientInfo {
  id?: string; // Optional: if selecting an existing client
  name: string;
  email: string;
  company: string;
  phone: string;
}

export interface PaymentOption {
  id: string;
  name: string;
  fee: number; // taxa em %
  installments: number;
}

export const staticServices: Service[] = [ // Renamed to staticServices
  {
    id: 'website',
    name: 'Site Institucional',
    description: 'Site profissional responsivo com design estratégico, otimização para mecanismos de busca e formulários inteligentes para conversão de leads',
    base_price: 2500,
    category: 'Web Design',
    icon: '🌐',
    features: ['Design responsivo profissional', 'SEO técnico otimizado', 'Formulários de contato inteligentes', 'Integração Google Analytics e Search Console'],
    billing_type: 'one_time' // Default to one_time
  },
  // Nova categoria: Fotografia (Planos por IA)
  {
    id: 'photo-ai-basic',
    name: 'Fotografia Básica',
    description: 'Ideal para quem busca fotos simples e funcionais',
    base_price: 229,
    category: 'Fotografia',
    icon: '📸',
    features: [
      '5 fotos geradas por IA',
      '1 mini vídeo de até 5s',
      'Ajustes básicos de edição e refinamento',
      'Fotos editadas com dimensões horizontais e verticais',
      'Entrega em até 5 dias úteis'
    ],
    billing_type: 'one_time'
  },
  {
    id: 'photo-ai-pro',
    name: 'Fotografia Profissional',
    description: 'Ideal para destacar sua imagem em sites e redes sociais',
    base_price: 389,
    category: 'Fotografia',
    icon: '📸',
    features: [
      '10 fotos geradas por IA',
      '2 mini vídeos de até 5s',
      'Ajustes básicos de edição e refinamento',
      'Fotos editadas com dimensões horizontais e verticais',
      'Entrega em até 5 dias úteis'
    ],
    billing_type: 'one_time'
  },
  {
    id: 'photo-ai-premium',
    name: 'Fotografia Premium',
    description: 'Ideal para máxima qualidade e personalização total',
    base_price: 539,
    category: 'Fotografia',
    icon: '📸',
    features: [
      '15 fotos geradas por IA',
      '4 mini vídeos de até 5s',
      'Ajustes básicos de edição e refinamento',
      'Fotos editadas com dimensões horizontais e verticais',
      'Entrega em até 5 dias úteis'
    ],
    billing_type: 'one_time'
  },
  // Fotografia de Produto com preço unitário por foto e pacotes
  {
    id: 'product-photography',
    name: 'Fotografia de Produto',
    description: 'Fotografias reais de produtos para uso comercial',
    base_price: 20, // preço unitário por foto
    category: 'Fotografia',
    icon: '📷',
    features: [
      'Fotos reais com tratamento básico de cor e luz',
      'Fundo branco ou cenário personalizado',
      'Entrega em até 7 dias úteis'
    ],
    billing_type: 'one_time'
  },
  {
    id: 'ecommerce',
    name: 'Loja Virtual',
    description: 'E-commerce completo com arquitetura robusta, sistema de pagamento seguro e painel administrativo avançado para gestão total da operação',
    base_price: 4500,
    category: 'Web Design',
    icon: '🛒',
    features: ['Catálogo de produtos com filtros avançados', 'Carrinho de compras otimizado', 'Gateway de pagamento seguro', 'Painel administrativo completo'],
    popular: true,
    billing_type: 'one_time' // Default to one_time
  },
  {
    id: 'catalog',
    name: 'Site Catálogo',
    description: 'Vitrine digital estratégica com foco em apresentação profissional de produtos e serviços, integração WhatsApp Business e otimização mobile-first',
    base_price: 2500,
    category: 'Web Design',
    icon: '📱',
    features: ['Galeria de produtos profissional', 'Sistema de filtros inteligentes', 'WhatsApp Business integrado', 'Design mobile-first responsivo'],
    billing_type: 'one_time' // Default to one_time
  },
  {
    id: 'landing-page',
    name: 'Landing Page',
    description: 'Página de conversão personalizada com design estratégico focado em conversão de leads, formulários otimizados, integração com CRM e possibilidade de A/B Testing',
    base_price: 1800,
    category: 'Web Design',
    icon: '🎯',
    features: ['Design estratégico focado em conversão', 'Formulários otimizados para leads', 'Integração com CRM avançada', 'Sistema de A/B Testing'],
    billing_type: 'one_time' // Default to one_time
  },
  {
    id: 'website-blog',
    name: 'Site com Blog',
    description: 'Site profissional com sistema de blog integrado, painel de administração completo e estratégia de conteúdo para autoridade digital',
    base_price: 2800,
    category: 'Web Design',
    icon: '📝',
    features: ['Sistema de blog profissional', 'Painel de administração avançado', 'SEO técnico otimizado', 'Sistema de comentários moderados'],
    billing_type: 'one_time' // Default to one_time
  },
  // New DESIGN category - Visual Identity Packages
  {
    id: 'design-start',
    name: 'ID Visual Start',
    description: 'Design de logo simples e diretrizes básicas para iniciar sua marca.',
    base_price: 350,
    category: 'Design',
    icon: '✨',
    features: [
      'Design de logo simples (tipográfico ou símbolo básico)',
      'Paleta de cores principal (3 a 5 cores)',
      'Tipografia recomendada (1–2 fontes)',
      'Diretrizes básicas de marca (PDF simples)',
      '1 rodada de revisão',
      'Tempo de entrega: 5 dias úteis'
    ],
    billing_type: 'one_time'
  },
  {
    id: 'design-pro',
    name: 'ID Visual Pro',
    description: 'Design de logo profissional com paleta de cores completa e diretrizes detalhadas.',
    base_price: 750,
    category: 'Design',
    icon: '🎨',
    features: [
      'Design de logo profissional (com alternativas de conceito)',
      'Paleta de cores completa (primárias, secundárias, de apoio)',
      'Sistema de tipografia e hierarquia',
      'Diretrizes detalhadas de marca (PDF)',
      'Mockups (cartão de visita, post para redes sociais, etc.)',
      '2 rodadas de revisão',
      'Tempo de entrega: 10 dias úteis'
    ],
    popular: true,
    billing_type: 'one_time'
  },
  {
    id: 'design-complete-branding',
    name: 'Branding Completo',
    description: 'Pesquisa de marca, plataforma de marca e sistema visual completo para um branding robusto.',
    base_price: 3500,
    category: 'Design',
    icon: '💎',
    features: [
      'Pesquisa e posicionamento de marca',
      'Plataforma de marca (missão, visão, valores, persona, tom de voz)',
      'Design de logo exclusivo (estudos e variações)',
      'Sistema visual completo (cores, tipografia, ícones, elementos gráficos, texturas)',
      'Manual de marca completo e interativo (PDF + editável)',
      'Kit de aplicações (cartões, papelaria, redes sociais, apresentações, etc.)',
      '3 rodadas de revisão estratégica',
      'Tempo de entrega: 20 a 40 dias úteis'
    ],
    billing_type: 'one_time'
  },
  {
    id: 'social-media',
    name: 'Social Media',
    description: 'Gestão de redes sociais com criação de conteúdo e agendamento de posts.',
    base_price: 1000,
    category: 'Design',
    icon: '📱',
    features: [
      '2 posts por semana + 1 stories',
      'Gestão de redes sociais (agendamentos de posts)',
      'Criação de destaques'
    ],
    billing_type: 'monthly'
  },
  {
    id: 'google-ads',
    name: 'Google Ads',
    description: 'Campanhas Google Ads estratégicas com setup profissional, otimização contínua de performance e relatórios detalhados de resultados',
    base_price: 1200,
    category: 'Tráfego Pago',
    icon: '🔍',
    features: ['Setup profissional de campanhas', 'Otimização contínua de performance', 'Relatórios mensais detalhados', 'Pesquisa de palavras-chave estratégicas'],
    billing_type: 'monthly' // Monthly service
  },
  {
    id: 'facebook-ads',
    name: 'Facebook/Instagram Ads',
    description: 'Campanhas Meta Ads com estratégia de segmentação avançada, criação de anúncios profissionais e otimização de budget para máximo ROI',
    base_price: 1500,
    category: 'Tráfego Pago',
    icon: '📱',
    features: ['Criação de anúncios profissionais', 'Segmentação de público avançada', 'Testes A/B de performance', 'Gestão estratégica de orçamento'],
    popular: true,
    billing_type: 'monthly' // Monthly service
  },
  {
    id: 'dual-traffic',
    name: 'Tráfego Pago Duplo',
    description: 'Estratégia integrada Google Ads + Meta Ads com otimização cruzada, relatórios unificados e maximização de resultados em ambas plataformas',
    base_price: 1800,
    category: 'Tráfego Pago',
    icon: '🚀',
    features: ['Campanhas Google Ads + Meta Ads', 'Estratégia integrada multiplataforma', 'Relatórios unificados de performance', 'Otimização cruzada de resultados'],
    billing_type: 'monthly' // Monthly service
  },
  {
    id: 'crm-kommo',
    name: 'Implementação de CRM (Kommo)',
    description: 'Sistema de gestão de relacionamento Kommo',
    base_price: 2000,
    category: 'Inteligência Comercial',
    icon: '⚙️',
    features: ['Configuração completa', 'Treinamento da equipe', 'Automações de vendas', 'Integração WhatsApp'],
    billing_type: 'one_time' // Default to one_time
  },
  {
    id: 'crm-bitrix24',
    name: 'Implementação de CRM (Bitrix24)',
    description: 'Sistema completo Bitrix24 com todas as funcionalidades',
    base_price: 5000,
    category: 'Inteligência Comercial',
    icon: '🔧',
    features: ['Setup completo Bitrix24', 'Treinamento avançado', 'Automações complexas', 'Integração total'],
    billing_type: 'one_time' // Default to one_time
  },
  {
    id: 'ai-assistant',
    name: 'Assistente de IA',
    description: 'Soluções de inteligência artificial para otimizar processos e interações.',
    base_price: 1500,
    category: 'IA & Automação',
    icon: '🤖',
    features: ['Chatbots inteligentes', 'Análise preditiva', 'Automação de conteúdo', 'Personalização de ofertas'],
    billing_type: 'monthly' // Monthly service
  },
  {
    id: 'chatbot-leadster',
    name: 'Chatbot Leadster',
    description: 'Implementação e configuração de chatbot Leadster para captura e qualificação de leads.',
    base_price: 1000,
    category: 'IA & Automação',
    icon: '💬',
    features: ['Configuração inicial do chatbot', 'Fluxos de conversa para qualificação de leads', 'Integração com site', 'Relatórios de performance'],
    billing_type: 'one_time' // One-time service
  },
  {
    id: 'local-seo',
    name: 'SEO Local',
    description: 'Otimização para negócios locais',
    base_price: 650,
    category: 'Outros Serviços',
    icon: '📍',
    features: ['Google Meu Negócio', 'Otimização local', 'Gestão de reviews', 'Presença online local'],
    billing_type: 'monthly' // Monthly service
  },
  {
    id: 'international',
    name: 'Consultoria Internacional',
    description: 'Estratégias para empresas no exterior',
    base_price: 2000,
    category: 'Consultoria',
    icon: '🌍',
    features: ['Análise de mercado', 'Estratégia de entrada', 'Localização de conteúdo', 'Compliance local'],
    billing_type: 'one_time' // Default to one_time
  },
  {
    id: 'ecommerce-consulting',
    name: 'Consultoria de Uso de Loja Virtual',
    description: 'Suporte e orientação especializada para otimizar o uso e a performance da sua loja virtual após a implementação.',
    base_price: 250, // Preço por hora
    category: 'Consultoria', // Movido para Consultoria
    icon: '💡',
    features: ['Análise de performance da loja', 'Otimização de processos de venda', 'Treinamento de equipe', 'Estratégias de retenção de clientes'],
    billing_type: 'one_time' // Default to one_time
  },
  // Nova categoria Outros Serviços (anteriormente ECOMMERCES)
  {
    id: 'payment-gateway-install',
    name: 'Instalação de Gateway de Pagamento',
    description: 'Configuração e integração de gateways de pagamento seguros para sua loja virtual.',
    base_price: 500,
    category: 'Outros Serviços',
    icon: '💳',
    features: ['Integração com plataformas de e-commerce', 'Configuração de métodos de pagamento', 'Testes de transação'],
    billing_type: 'one_time' // Default to one_time
  },
  {
    id: 'shipping-system-install',
    name: 'Instalação de Novo Sistema de Frete',
    description: 'Implementação e configuração de sistemas de cálculo e gestão de frete para otimizar suas entregas.',
    base_price: 500, // Corrigido de basePrice para base_price
    category: 'Outros Serviços',
    icon: '🚚',
    features: ['Integração com transportadoras', 'Configuração de tabelas de frete', 'Otimização de custos de envio'],
    billing_type: 'one_time' // Default to one_time
  }
];


export const paymentOptions: PaymentOption[] = [
  { id: 'pix', name: 'PIX à Vista', fee: 5.00, installments: 1 },
  { id: 'credit-cash', name: 'Crédito à Vista', fee: 4.20, installments: 1 },
  { id: 'credit-2x', name: '2x no Cartão', fee: 6.09, installments: 2 },
  { id: 'credit-3x', name: '3x no Cartão', fee: 7.01, installments: 3 },
  { id: 'credit-4x', name: '4x no Cartão', fee: 7.91, installments: 4 },
  { id: 'credit-5x', name: '5x no Cartão', fee: 8.80, installments: 5 },
  { id: 'credit-6x', name: '6x no Cartão', fee: 9.67, installments: 6 },
  { id: 'credit-7x', name: '7x no Cartão', fee: 12.59, installments: 7 },
  { id: 'credit-8x', name: '8x no Cartão', fee: 13.42, installments: 8 },
  { id: 'credit-9x', name: '9x no Cartão', fee: 14.25, installments: 9 },
  { id: 'credit-10x', name: '10x no Cartão', fee: 15.06, installments: 10 },
  { id: 'credit-11x', name: '11x no Cartão', fee: 15.87, installments: 11 },
  { id: 'credit-12x', name: '12x no Cartão', fee: 16.66, installments: 12 }
];

export const useQuoteGenerator = (userId: string, customServices: CustomService[] = []) => { // Accept customServices
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>([]);
  const [clientInfo, setClientInfo] = useState<ClientInfo>({
    name: '',
    email: '',
    company: '',
    phone: ''
  });
  const [selectedPayment, setSelectedPayment] = useState<string>('cash');
  const [paymentType, setPaymentType] = useState<'cash' | 'installment'>('cash');
  const [installmentNumber, setInstallmentNumber] = useState(2);
  const [installmentValue, setInstallmentValue] = useState(0); // valor manual da parcela
  const [manualInstallmentTotal, setManualInstallmentTotal] = useState<number | null>(null); // Novo estado para total parcelado manual
  const [cashDiscountPercentage, setCashDiscountPercentage] = useState(5); // desconto à vista ajustável
  const [notes, setNotes] = useState('');
  const [isValidityEnabled, setIsValidityEnabled] = useState(true); // Novo estado para o toggle de validade
  const [validityDays, setValidityDays] = useState(30); // Novo estado para os dias de validade
  const [proposalTitle, setProposalTitle] = useState(''); // New: Proposal Title
  const [proposalLogoUrl, setProposalLogoUrl] = useState('/lovable-uploads/7ef1a887-0fe7-4cc3-bfc3-2d24e0251f8e.png'); // New: Proposal Logo URL
  const [proposalGradientTheme, setProposalGradientTheme] = useState<'conexhub' | 'alt1' | 'alt2'>('conexhub'); // New: Proposal Gradient Theme


  // Combine static and custom services
  const allAvailableServices: Service[] = [
    ...staticServices,
    ...customServices.map(cs => ({ ...cs, base_price: cs.base_price, isCustom: true })) // Usar base_price aqui
  ];

  const addService = (service: Service, initialQuantity?: number, initialCustomPrice?: number) => {
    const existingService = selectedServices.find(s => s.id === service.id);
    if (existingService) {
      setSelectedServices(prev =>
        prev.map(s =>
          s.id === service.id
            ? { 
                ...s, 
                quantity: s.quantity + (initialQuantity && initialQuantity > 0 ? initialQuantity : 1)
              }
            : s
        )
      );
    } else {
      setSelectedServices(prev => [
        ...prev, 
        { 
          ...service, 
          quantity: initialQuantity && initialQuantity > 0 ? initialQuantity : 1, 
          customPrice: initialCustomPrice,
          customFeatures: [...service.features] 
        }
      ]);
      // Simulate analytics event
      console.log('Analytics Event: service_added', {
        service_id: service.id,
        category: service.category,
        price_base: service.base_price, // Usar base_price aqui
        initial_quantity: initialQuantity || 1,
      });
    }
  };

  const removeService = (serviceId: string) => {
    setSelectedServices(prev => prev.filter(s => s.id !== serviceId));
  };

  const updateServiceQuantity = (serviceId: string, quantity: number) => {
    if (quantity <= 0) {
      removeService(serviceId);
      return;
    }
    setSelectedServices(prev =>
      prev.map(s =>
        s.id === serviceId
          ? { ...s, quantity }
          : s
      )
    );
  };

  const updateServicePrice = (serviceId: string, customPrice: number) => {
    setSelectedServices(prev =>
      prev.map(s =>
        s.id === serviceId
          ? { ...s, customPrice }
          : s
      )
    );
  };

  const updateServiceDiscount = (serviceId: string, discountValue: number, discountType: 'percentage' | 'value' = 'percentage') => {
    setSelectedServices(prev =>
      prev.map(s => {
        if (s.id === serviceId) {
          const basePrice = s.customPrice || s.base_price; // Usar base_price aqui
          const totalPrice = basePrice * s.quantity;
          
          if (discountType === 'percentage') {
            const discountAmount = (totalPrice * discountValue) / 100;
            return { 
              ...s, 
              discount: discountAmount,
              discountPercentage: discountValue,
              discountType: 'percentage'
            };
          } else {
            // Valor absoluto
            const discountAmount = Math.min(discountValue, totalPrice);
            const discountPercentage = totalPrice > 0 ? (discountAmount / totalPrice) * 100 : 0;
            return { 
              ...s, 
              discount: discountAmount,
              discountPercentage: Math.round(discountPercentage * 100) / 100,
              discountType: 'value'
            };
          }
        }
        return s;
      })
    );
  };

  const updateServiceDiscountType = (serviceId: string, discountType: 'percentage' | 'value') => {
    setSelectedServices(prev =>
      prev.map(s => {
        if (s.id === serviceId) {
          // Reset discount when changing type
          return { 
            ...s, 
            discount: 0,
            discountPercentage: 0,
            discountType
          };
        }
        return s;
      })
    );
  };

  const updateServiceFeatures = (serviceId: string, newFeatures: string[]) => {
    setSelectedServices(prev =>
      prev.map(s =>
        s.id === serviceId
          ? { ...s, customFeatures: newFeatures }
          : s
      )
    );
  };

  const calculateSubtotal = () => {
    return selectedServices.reduce((total, service) => {
      const price = service.customPrice || service.base_price; // Usar base_price aqui
      const serviceTotal = price * service.quantity;
      const serviceDiscount = service.discount || 0;
      return total + (serviceTotal - serviceDiscount);
    }, 0);
  };

  const calculateOriginalSubtotal = () => {
    return selectedServices.reduce((total, service) => {
      const price = service.customPrice || service.base_price; // Usar base_price aqui
      return total + (price * service.quantity);
    }, 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal();
  };

  const calculateOneTimeTotal = () => {
    return selectedServices
      .filter(service => service.billing_type === 'one_time')
      .reduce((total, service) => {
        const price = service.customPrice || service.base_price; // Usar base_price aqui
        const serviceTotal = price * service.quantity;
        const serviceDiscount = service.discount || 0;
        return total + (serviceTotal - serviceDiscount);
      }, 0);
  };

  const calculateMonthlyTotal = () => {
    return selectedServices
      .filter(service => service.billing_type === 'monthly')
      .reduce((total, service) => {
        const price = service.customPrice || service.base_price; // Usar base_price aqui
        const serviceTotal = price * service.quantity;
        const serviceDiscount = service.discount || 0;
        return total + (serviceTotal - serviceDiscount);
      }, 0);
  };

  const calculateCashDiscount = () => {
    const total = calculateTotal();
    return (total * cashDiscountPercentage) / 100;
  };

  const calculateCashTotal = () => {
    const total = calculateTotal();
    const discount = calculateCashDiscount();
    return total - discount;
  };

  const getTotalInstallmentValue = () => {
    if (manualInstallmentTotal !== null && manualInstallmentTotal > 0) {
      return manualInstallmentTotal;
    }
    if (paymentType === 'installment' && installmentValue > 0) {
      return installmentValue * installmentNumber;
    }
    return 0;
  };

  const calculateInstallmentInterestRate = () => {
    const baseValue = calculateTotal(); // Base value without any payment adjustments
    const currentInstallmentTotal = getTotalInstallmentValue();

    if (paymentType === 'installment' && currentInstallmentTotal > 0 && baseValue > 0) {
      const interestRate = ((currentInstallmentTotal - baseValue) / baseValue) * 100;
      return Math.round(interestRate * 100) / 100; // Can be negative (discount)
    }
    return 0;
  };

  const calculateFinalTotal = () => {
    // Final total is always the cash total with discount
    return calculateCashTotal();
  };

  const getSelectedPayment = () => {
    if (paymentType === 'cash') {
      return { 
        name: 'À vista', 
        fee: cashDiscountPercentage, 
        installments: 1,
        type: 'cash' as 'cash' | 'installment' // Explicitly type
      };
    } else {
      return { 
        name: `Parcelado em ${installmentNumber}x`, 
        fee: calculateInstallmentInterestRate(), 
        installments: installmentNumber,
        type: 'installment' as 'cash' | 'installment', // Corrigido: deve ser 'installment'
        installmentValue: installmentValue,
        totalInstallmentValue: getTotalInstallmentValue() // Incluir o total parcelado (manual ou calculado)
      };
    }
  };

  const clearQuote = () => {
    setSelectedServices([]);
    setClientInfo({
      name: '',
      email: '',
      company: '',
      phone: ''
    });
    setSelectedPayment('cash');
    setPaymentType('cash');
    setInstallmentNumber(2);
    setInstallmentValue(0);
    setManualInstallmentTotal(null); // Limpar o total manual
    setCashDiscountPercentage(5);
    setNotes('');
    setIsValidityEnabled(true); // Reset validity to default
    setValidityDays(30); // Reset validity days to default
    setProposalTitle(''); // Clear proposal title
    setProposalLogoUrl('/lovable-uploads/7ef1a887-0fe7-4cc3-bfc3-2d24e0251f8e.png'); // Reset logo
    setProposalGradientTheme('conexhub'); // Reset gradient theme
  };

  return {
    selectedServices,
    clientInfo,
    selectedPayment,
    paymentType,
    installmentNumber,
    installmentValue,
    manualInstallmentTotal, // Adicionado
    cashDiscountPercentage,
    notes,
    isValidityEnabled, // Adicionado
    validityDays, // Adicionado
    proposalTitle, // New
    proposalLogoUrl, // New
    proposalGradientTheme, // New
    addService,
    removeService,
    updateServiceQuantity,
    updateServicePrice,
    updateServiceDiscount,
    updateServiceDiscountType,
    updateServiceFeatures,
    setClientInfo,
    setSelectedPayment,
    setPaymentType,
    setInstallmentNumber,
    setInstallmentValue,
    setManualInstallmentTotal, // Adicionado
    setCashDiscountPercentage,
    setNotes,
    setIsValidityEnabled, // Adicionado
    setValidityDays, // Adicionado
    setProposalTitle, // New
    setProposalLogoUrl, // New
    setProposalGradientTheme, // New
    calculateSubtotal,
    calculateOriginalSubtotal,
    calculateTotal,
    calculateOneTimeTotal, // New
    calculateMonthlyTotal, // New
    calculateCashDiscount,
    calculateCashTotal,
    calculateFinalTotal,
    calculateInstallmentInterestRate,
    getTotalInstallmentValue,
    getSelectedPayment,
    clearQuote,
    services: allAvailableServices, // Export combined services
    paymentOptions
  };
};