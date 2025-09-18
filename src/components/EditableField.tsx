import React, { useState, useRef, useEffect, ReactNode } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Check, X, Loader2, CalendarIcon, Edit } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface EditableFieldProps {
  value: string | number | Date | null | undefined;
  onSave: (newValue: string | number | Date | null) => Promise<void>;
  type?: 'text' | 'number' | 'select' | 'date' | 'textarea';
  label?: string;
  className?: string;
  displayClassName?: string;
  selectOptions?: { value: string; label: string }[];
  placeholder?: string;
  isLoading?: boolean;
  children?: ReactNode; // For custom display when not editing
  formatDisplayValue?: (value: string | number | Date | null | undefined) => ReactNode;
  disabled?: boolean; // Prop to disable editing
  required?: boolean; // New prop to mark field as required
}

const EditableField: React.FC<EditableFieldProps> = ({
  value,
  onSave,
  type = 'text',
  label,
  className,
  displayClassName,
  selectOptions,
  placeholder = 'Digite aqui...',
  isLoading = false,
  children,
  formatDisplayValue,
  disabled = false,
  required = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [internalValue, setInternalValue] = useState<string | number | Date | null>(value || '');
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const selectRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setInternalValue(value || '');
  }, [value]);

  useEffect(() => {
    if (isEditing) {
      if (type === 'select' && selectRef.current) {
        selectRef.current.focus();
      } else if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  }, [isEditing, type]);

  const handleSave = async () => {
    if (isLoading || disabled) return;
    
    // Don't save empty values for required fields
    if (required && (internalValue === '' || internalValue === null)) {
      return;
    }
    
    await onSave(internalValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setInternalValue(value || '');
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && type !== 'textarea') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const renderDisplayValue = () => {
    if (children) return children;
    if (formatDisplayValue) return formatDisplayValue(value);

    if (value instanceof Date) {
      return format(value, 'dd/MM/yyyy', { locale: ptBR });
    }
    if (type === 'select' && selectOptions) {
      return selectOptions.find(option => option.value === value)?.label || String(value);
    }
    
    // Return placeholder with muted style if value is empty
    if (!value && value !== 0) {
      return <span className="text-muted-foreground italic">{placeholder}</span>;
    }
    
    return String(value);
  };

  if (isEditing && !disabled) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        {type === 'text' && (
          <Input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            value={String(internalValue)}
            onChange={(e) => setInternalValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="h-9 placeholder:text-muted-foreground dark:placeholder:text-muted-foreground placeholder:opacity-80"
            disabled={isLoading}
            required={required}
            aria-required={required}
          />
        )}
        {type === 'textarea' && (
          <Textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={String(internalValue)}
            onChange={(e) => setInternalValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="min-h-[80px] w-full placeholder:text-muted-foreground dark:placeholder:text-muted-foreground placeholder:opacity-80"
            disabled={isLoading}
            required={required}
            aria-required={required}
          />
        )}
        {type === 'number' && (
          <Input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="number"
            value={Number(internalValue)}
            onChange={(e) => setInternalValue(Number(e.target.value))}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="h-9 placeholder:text-muted-foreground dark:placeholder:text-muted-foreground placeholder:opacity-80"
            disabled={isLoading}
            required={required}
            aria-required={required}
          />
        )}
        {type === 'select' && selectOptions && (
          <Select
            value={String(internalValue)}
            onValueChange={(newValue) => {
              setInternalValue(newValue);
              onSave(newValue); // Save immediately on select change
              setIsEditing(false); // Close editing mode
            }}
            disabled={isLoading}
          >
            <SelectTrigger 
              ref={selectRef} 
              className="h-9 w-full placeholder:text-muted-foreground dark:placeholder:text-muted-foreground placeholder:opacity-80"
            >
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {selectOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {type === 'date' && (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal h-9",
                  !internalValue && "text-muted-foreground"
                )}
                disabled={isLoading}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {internalValue instanceof Date ? format(internalValue, "dd/MM/yyyy", { locale: ptBR }) : <span>{placeholder}</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={internalValue instanceof Date ? internalValue : undefined}
                onSelect={(date) => {
                  setInternalValue(date || null);
                  onSave(date || null); // Save immediately on date select
                  setIsEditing(false); // Close editing mode
                }}
                initialFocus
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>
        )}
        {isLoading && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
        {!isLoading && (type !== 'select' && type !== 'date') && ( // Only show check/x for text/number/textarea
          <>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={handleSave} className="h-8 w-8">
                    <Check className="h-4 w-4 text-green-500" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Salvar (Enter)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={handleCancel} className="h-8 w-8">
                    <X className="h-4 w-4 text-red-500" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Cancelar (Esc)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2 group cursor-pointer",
        displayClassName,
        disabled ? "cursor-not-allowed opacity-70" : ""
      )}
      onClick={() => !disabled && setIsEditing(true)}
      tabIndex={disabled ? -1 : 0}
      onKeyDown={(e) => {
        if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          setIsEditing(true);
        }
      }}
      role="button"
      aria-label={disabled ? undefined : `Editar ${label || 'campo'}`}
    >
      {renderDisplayValue()}
      {!disabled && (
        <Edit className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
    </div>
  );
};

export default EditableField;