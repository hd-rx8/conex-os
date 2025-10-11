import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { List } from '@/hooks/useLists';

interface EditListModalProps {
  isOpen: boolean;
  onClose: () => void;
  list: List;
  onUpdate: (data: {
    name: string;
    description: string | null;
  }) => Promise<void>;
}

const EditListModal: React.FC<EditListModalProps> = ({
  isOpen,
  onClose,
  list,
  onUpdate,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Load list data when modal opens
  useEffect(() => {
    if (isOpen && list) {
      setName(list.name);
      setDescription(list.description || '');
    }
  }, [isOpen, list]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      return;
    }

    setIsLoading(true);

    try {
      await onUpdate({
        name: name.trim(),
        description: description.trim() || null,
      });

      onClose();
    } catch (error) {
      console.error('Error updating list:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Lista</DialogTitle>
          <DialogDescription>
            Altere as informações da lista.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Preview */}
          <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/50">
            <span className="text-2xl">📋</span>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">
                {name.trim() || 'Nome da Lista'}
              </p>
              {description.trim() && (
                <p className="text-xs text-muted-foreground truncate">
                  {description}
                </p>
              )}
            </div>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="list-name">
              Nome da Lista <span className="text-destructive">*</span>
            </Label>
            <Input
              id="list-name"
              placeholder="Ex: Tarefas da Semana, Backlog, Em Progresso..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="list-description">Descrição (opcional)</Label>
            <Textarea
              id="list-description"
              placeholder="Descreva o objetivo desta lista..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={!name.trim() || isLoading}>
              {isLoading ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditListModal;
