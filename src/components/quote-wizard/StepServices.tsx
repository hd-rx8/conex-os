import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import ServiceCard from '@/components/ServiceCard';
import { Trash2, Check, PlusCircle } from 'lucide-react';
import { useQuoteWizard } from '@/context/QuoteWizardContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { CustomService, CreateCustomServiceData, UpdateCustomServiceData } from '@/hooks/useCustomServices';
import { Service as QuoteServiceType } from '@/hooks/useQuoteGenerator'; // Alias to avoid conflict
import { useCurrency } from '@/context/CurrencyContext'; // Import useCurrency
import { Database } from '@/integrations/supabase/types'; // Import Database types

type BillingType = Database['public']['Enums']['billing_type'];

// Zod schema for custom service form validation
const customServiceSchema = z.object({
  name: z.string().min(1, 'Título é obrigatório'),
  description: z.string().min(1, 'Descrição é obrigatória'),
  base_price: z.preprocess(
    (val) => Number(val),
    z.number().min(0, 'Preço base deve ser positivo')
  ),
  features: z.string().min(1, 'Pelo menos uma característica é obrigatória'),
  category: z.string().min(1, 'Categoria é obrigatória'),
  icon: z.string().optional(),
  popular: z.boolean().default(false),
  billing_type: z.enum(['one_time', 'monthly']).default('one_time'), // Added billing_type
});

type CustomServiceFormData = z.infer<typeof customServiceSchema>;

const CustomServiceForm = ({
  initialData,
  onSave,
  onCancel,
  existingCategories,
}: {
  initialData?: CustomService;
  onSave: (data: CreateCustomServiceData | UpdateCustomServiceData) => Promise<void>;
  onCancel: () => void;
  existingCategories: string[];
}) => {
  const { register, handleSubmit, formState: { errors, isSubmitting }, setValue, watch } = useForm<CustomServiceFormData>({
    resolver: zodResolver(customServiceSchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      base_price: initialData?.base_price || 0,
      features: initialData?.features.join('\n') || '',
      category: initialData?.category || '',
      icon: initialData?.icon || '✨',
      popular: initialData?.popular || false,
      billing_type: initialData?.billing_type || 'one_time', // Set default or initial billing_type
    },
  });

  const watchedCategory = watch('category');
  const watchedBillingType = watch('billing_type'); // Watch billing_type

  const onSubmit = async (data: CustomServiceFormData) => {
    const featuresArray = data.features.split('\n').map(f => f.trim()).filter(f => f.length > 0);
    await onSave({
      name: data.name,
      description: data.description,
      base_price: data.base_price,
      features: featuresArray,
      category: data.category,
      icon: data.icon,
      popular: data.popular,
      billing_type: data.billing_type, // Pass billing_type
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="name">Título do Serviço *</Label>
        <Input id="name" {...register('name')} placeholder="Ex: Consultoria de SEO" />
        {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
      </div>
      <div>
        <Label htmlFor="description">Descrição Curta *</Label>
        <Textarea id="description" {...register('description')} placeholder="Uma breve descrição do serviço" rows={2} />
        {errors.description && <p className="text-sm text-destructive mt-1">{errors.description.message}</p>}
      </div>
      <div>
        <Label htmlFor="base_price">Preço Base ({watchedBillingType === 'monthly' ? 'por mês' : 'único'}) *</Label>
        <Input id="base_price" type="number" step="0.01" {...register('base_price')} placeholder="0.00" />
        {errors.base_price && <p className="text-sm text-destructive mt-1">{errors.base_price.message}</p>}
      </div>
      <div>
        <Label htmlFor="features">Características (uma por linha) *</Label>
        <Textarea id="features" {...register('features')} placeholder="Característica 1&#10;Característica 2" rows={4} />
        {errors.features && <p className="text-sm text-destructive mt-1">{errors.features.message}</p>}
      </div>
      <div>
        <Label htmlFor="category">Categoria *</Label>
        <Select value={watchedCategory} onValueChange={(value) => setValue('category', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione ou digite uma categoria" />
          </SelectTrigger>
          <SelectContent>
            {existingCategories.map((cat) => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.category && <p className="text-sm text-destructive mt-1">{errors.category.message}</p>}
      </div>
      <div>
        <Label htmlFor="icon">Ícone (Emoji)</Label>
        <Input id="icon" {...register('icon')} placeholder="✨" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="billing_type">Tipo de Cobrança *</Label>
        <Select value={watchedBillingType} onValueChange={(value: BillingType) => setValue('billing_type', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione o tipo de cobrança" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="one_time">Única</SelectItem>
            <SelectItem value="monthly">Mensal</SelectItem>
          </SelectContent>
        </Select>
        {errors.billing_type && <p className="text-sm text-destructive mt-1">{errors.billing_type.message}</p>}
      </div>
      <div className="flex items-center space-x-2">
        <Switch id="popular" checked={watch('popular')} onCheckedChange={(checked) => setValue('popular', checked)} />
        <Label htmlFor="popular">Marcar como Popular</Label>
      </div>
      <DialogFooter className="pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {initialData ? 'Atualizar Serviço' : 'Criar Serviço'}
        </Button>
      </DialogFooter>
    </form>
  );
};

const StepServices: React.FC = () => {
  const {
    selectedServices, addService, removeService, updateServiceQuantity, updateServicePrice,
    updateServiceDiscount, updateServiceDiscountType, updateServiceFeatures,
    calculateTotal, allAvailableServices,
    createCustomService, updateCustomService, deleteCustomService, fetchCustomServices
  } = useQuoteWizard();

  const { formatCurrency } = useCurrency(); // Use formatCurrency from context

  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingCustomService, setEditingCustomService] = useState<CustomService | null>(null);

  // Get unique categories and sort them in the desired order
  const allCategories = [...new Set(allAvailableServices.map(s => s.category))];
  const desiredOrder = [
    'Web Design',
    'Tráfego Pago',
    'Inteligência Comercial',
    'IA & Automação',
    'Fotografia',
    'Design', // Moved 'Design' here
    'Consultoria',
    'Outros Serviços'
  ];
  const categories = allCategories.sort((a, b) => {
    const indexA = desiredOrder.indexOf(a);
    const indexB = desiredOrder.indexOf(b);
    // Handle categories not in desiredOrder by placing them at the end
    if (indexA === -1 && indexB === -1) return a.localeCompare(b); // Alphabetical for unknown
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });

  const handleCreateOrUpdateService = async (data: CreateCustomServiceData | UpdateCustomServiceData) => {
    if (editingCustomService) {
      await updateCustomService(editingCustomService.id, data);
    } else {
      await createCustomService(data as CreateCustomServiceData);
    }
    setIsServiceModalOpen(false);
    setEditingCustomService(null);
    fetchCustomServices(); // Refetch to ensure UI is updated
  };

  const handleEditCustomService = (service: QuoteServiceType) => {
    // Find the full CustomService object from the customServices list
    const fullCustomService = allAvailableServices.find(s => s.id === service.id && s.isCustom) as CustomService | undefined;
    if (fullCustomService) {
      setEditingCustomService(fullCustomService);
      setIsServiceModalOpen(true);
    } else {
      // This should ideally not happen if 'isCustom' is correctly set
      console.error("Attempted to edit a non-custom service or full custom service data not found.");
      // Optionally, show a toast error
    }
  };

  const handleDeleteCustomService = async (serviceId: string) => {
    if (confirm('Tem certeza que deseja excluir este serviço personalizado?')) {
      await deleteCustomService(serviceId);
      fetchCustomServices(); // Refetch to ensure UI is updated
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:justify-between md:items-center gap-4"> {/* Changed to flexbox layout */}
          <div>
            <CardTitle>Selecione os Serviços</CardTitle>
            <CardDescription>Escolha os serviços que farão parte da sua proposta e ajuste seus detalhes.</CardDescription>
          </div>
          <div> {/* Removed md:text-right as flex justify-between handles alignment */}
            <Dialog open={isServiceModalOpen} onOpenChange={setIsServiceModalOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="flex items-center space-x-2 gradient-button-bg hover:opacity-90 w-full md:w-auto" // Full width on small, auto on medium+
                  onClick={() => {
                    setEditingCustomService(null); // Clear any previous editing state
                    setIsServiceModalOpen(true);
                  }}
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Novo Serviço Personalizado</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>{editingCustomService ? 'Editar Serviço Personalizado' : 'Criar Novo Serviço Personalizado'}</DialogTitle>
                </DialogHeader>
                <CustomServiceForm
                  initialData={editingCustomService || undefined}
                  onSave={handleCreateOrUpdateService}
                  onCancel={() => setIsServiceModalOpen(false)}
                  existingCategories={categories}
                />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" className="w-full">
            {categories.map(category => (
              <AccordionItem key={category} value={category} className="border-b">
                <AccordionTrigger className="flex items-center justify-between py-4 text-lg font-semibold hover:no-underline">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-semibold">
                      {category}
                    </span>
                    <Badge variant="secondary" className="ml-2">
                      {allAvailableServices.filter(s => s.category === category).length} serviços
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4 pb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4">
                    {allAvailableServices
                      .filter(service => service.category === category)
                      .map(service => (
                        <ServiceCard
                          key={service.id}
                          service={service}
                          onAdd={addService}
                          onRemove={removeService}
                          isSelected={selectedServices.some(s => s.id === service.id)}
                          isCustom={service.isCustom}
                          onEdit={handleEditCustomService}
                          onDelete={handleDeleteCustomService}
                        />
                      ))
                    }
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {selectedServices.length > 0 && (
        <Card className="gradient-button-bg text-white">
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between">
              Serviços Selecionados
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  if (confirm('Tem certeza que deseja limpar todos os serviços selecionados?')) {
                    selectedServices.forEach(s => removeService(s.id));
                  }
                }}
                className="bg-red-500 hover:bg-red-600"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Limpar Todos
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {selectedServices.map(service => {
                const basePrice = service.customPrice || service.base_price;
                const totalPrice = basePrice * service.quantity;
                const discountAmount = service.discount || 0;
                const finalPrice = totalPrice - discountAmount;
                const currentDiscountType = service.discountType || 'percentage';

                return (
                  <div key={service.id} className="p-4 border rounded-lg space-y-4 bg-white/10">
                    <div className="flex items-center gap-3">
                      <span>{service.icon}</span>
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg">{service.name}</h4>
                        <div className="text-sm opacity-80">
                          Qtd: {service.quantity} × {formatCurrency(basePrice)}
                          {service.billing_type === 'monthly' && <span className="text-xs">/mês</span>}
                        </div>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeService(service.id)}
                        className="bg-red-500 hover:bg-red-600 h-8 w-8 p-0"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Preço Unitário ({formatCurrency(0).replace(/[\d.,]/g, '')})</Label>
                        <Input
                          type="number"
                          value={service.customPrice || service.base_price}
                          onChange={(e) => updateServicePrice(service.id, Number(e.target.value))}
                          className="mt-1 text-foreground"
                        />
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium">
                          Desconto ({currentDiscountType === 'percentage' ? '%' : formatCurrency(0).replace(/[\d.,]/g, '')})
                        </Label>
                        <div className="flex gap-2 mt-1">
                          <Input
                            type="number"
                            value={currentDiscountType === 'percentage' 
                              ? (service.discountPercentage || 0)
                              : (service.discount || 0)
                            }
                            onChange={(e) => updateServiceDiscount(
                              service.id, 
                              Number(e.target.value), 
                              currentDiscountType
                            )}
                            placeholder="0"
                            className="flex-1 text-foreground"
                          />
                          <Select 
                            value={currentDiscountType} 
                            onValueChange={(value: 'percentage' | 'value') => updateServiceDiscountType(service.id, value)}
                          >
                            <SelectTrigger className="w-20 bg-background border border-input text-foreground">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="z-50 bg-background border border-input shadow-lg">
                              <SelectItem value="percentage">%</SelectItem>
                              <SelectItem value="value">R$</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="flex items-end">
                        <div className="w-full">
                          <Label className="text-sm font-medium text-white">Valor Final</Label> {/* Changed text-muted-foreground to text-white */}
                          <div className="text-lg font-bold text-white mt-1">
                            {formatCurrency(finalPrice)}
                            {service.billing_type === 'monthly' && <span className="text-base font-normal">/mês</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {service.discount && service.discount > 0 && (
                      <div className="bg-white/20 p-3 rounded-lg text-sm border-l-4 border-orange-300">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex justify-between">
                            <span className="opacity-80">Valor original:</span>
                            <span>{formatCurrency(totalPrice)}</span>
                          </div>
                          <div className="flex justify-between text-orange-200">
                            <span>Desconto ({Math.round((service.discountPercentage || 0) * 100) / 100}%):</span>
                            <span>-{formatCurrency(discountAmount)}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Editable Features */}
                    <div className="mt-4">
                      <Label htmlFor={`features-${service.id}`} className="text-sm font-medium">
                        Características do Serviço (uma por linha)
                      </Label>
                      <Textarea
                        id={`features-${service.id}`}
                        value={(service.customFeatures || service.features).join('\n')}
                        onChange={(e) => updateServiceFeatures(service.id, e.target.value.split('\n'))}
                        rows={Math.max(3, (service.customFeatures || service.features).length)}
                        className="mt-1 text-foreground"
                        placeholder="Digite as características do serviço, uma por linha."
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="text-right pt-3 border-t border-white/20 mt-4">
              <p className="text-xl font-bold">
                Total dos Serviços: {formatCurrency(calculateTotal())}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StepServices;