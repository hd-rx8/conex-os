import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Service } from '@/hooks/useQuoteGenerator';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { CustomService } from '@/hooks/useCustomServices'; // Import CustomService

interface ServiceCardProps {
  service: Service;
  onAdd: (service: Service, initialQuantity?: number, initialCustomPrice?: number) => void;
  onRemove: (serviceId: string) => void;
  isSelected?: boolean;
  isCustom?: boolean; // New prop to indicate if it's a custom service
  onEdit?: (service: CustomService) => void; // Changed type to CustomService
  onDelete?: (serviceId: string) => void; // New prop for delete action
}

const ServiceCard: React.FC<ServiceCardProps> = ({ 
  service, 
  onAdd, 
  onRemove, 
  isSelected = false,
  isCustom = false, // Default to false
  onEdit,
  onDelete
}) => {
  const [productPhotosQty, setProductPhotosQty] = useState<number>(20);

  const isProductPhotography = service.id === 'product-photography';
  const computedDisplayPrice = useMemo(() => {
    if (isProductPhotography) {
      return service.base_price * productPhotosQty;
    }
    return service.base_price;
  }, [isProductPhotography, service.base_price, productPhotosQty]);

  const handleClick = () => {
    if (isSelected) {
      onRemove(service.id);
    } else {
      if (isProductPhotography) {
        onAdd(service, productPhotosQty, service.base_price);
      } else {
        onAdd(service);
      }
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick();
    }
  };

  return (
    <Card 
      className={`relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-105 ${
        isSelected ? 'ring-2 ring-primary' : ''
      } ${service.popular ? 'border-primary' : ''}
      cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={isSelected ? `Remover ${service.name}` : `Adicionar ${service.name}`}
    >
      {service.popular && (
        <Badge className="absolute top-2 right-2 bg-gradient-secondary text-white">
          Popular
        </Badge>
      )}
      {isCustom && (
        <Badge className="absolute top-2 left-2 bg-blue-500 text-white">
          Personalizado
        </Badge>
      )}
      {/* New: Billing Type Badge */}
      <Badge 
        className={`absolute top-2 ${service.popular ? 'right-20' : 'right-2'} ${isCustom ? 'top-10' : ''} 
          ${service.billing_type === 'monthly' ? 'bg-conexhub-teal-500' : 'bg-conexhub-blue-500'} text-white`}
      >
        {service.billing_type === 'monthly' ? 'Mensal' : 'Única'}
      </Badge>
      <CardHeader>
        <div className="flex items-center gap-3">
          <span className="text-2xl">{service.icon}</span>
          <div>
            <CardTitle className="text-lg">{service.name}</CardTitle>
            <CardDescription className="text-sm">{service.description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="text-2xl font-bold text-primary">
            R$ {computedDisplayPrice.toLocaleString('pt-BR')}
            {service.billing_type === 'monthly' && <span className="text-base font-normal">/mês</span>}
          </div>
          <div className="space-y-1">
            {service.features.map((feature, index) => (
              <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="text-green-500">✓</span>
                {feature}
              </div>
            ))}
          </div>
          {isProductPhotography && (
            <div className="pt-2">
              <label className="block text-sm text-muted-foreground mb-1">Pacote de fotos</label>
              <select
                className="w-full border rounded-md px-3 py-2 text-sm"
                value={productPhotosQty}
                onChange={(e) => setProductPhotosQty(Number(e.target.value))}
                onClick={(e) => e.stopPropagation()}
              >
                <option value={20}>20 fotos — R$ {(20 * service.base_price).toLocaleString('pt-BR')}</option>
                <option value={60}>60 fotos — R$ {(60 * service.base_price).toLocaleString('pt-BR')}</option>
                <option value={100}>100 fotos — R$ {(100 * service.base_price).toLocaleString('pt-BR')}</option>
              </select>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        {/* The button is kept for visual clarity, but the card itself is also clickable */}
        <Button 
          onClick={(e) => { e.stopPropagation(); handleClick(); }} // Stop propagation to prevent double click from card
          className={`w-full transition-opacity ${
            isSelected 
              ? 'bg-red-500 hover:bg-red-600 text-white' 
              : 'gradient-button-bg hover:opacity-90'
          }`}
          aria-label={isSelected ? `Remover ${service.name}` : `Adicionar ${service.name}`}
        >
          <Plus className={`w-4 h-4 mr-2 ${isSelected ? 'rotate-45' : ''}`} />
          {isSelected ? 'Remover' : 'Adicionar'}
        </Button>
        {isCustom && (
          <div className="flex w-full gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={(e) => { e.stopPropagation(); onEdit?.(service as CustomService); }} // Cast to CustomService
              aria-label={`Editar serviço personalizado ${service.name}`}
            >
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </Button>
            <Button 
              variant="destructive" 
              size="sm" 
              className="flex-1"
              onClick={(e) => { e.stopPropagation(); onDelete?.(service.id); }}
              aria-label={`Excluir serviço personalizado ${service.name}`}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default ServiceCard;