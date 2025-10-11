import React, { useState } from 'react';
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

interface CreateListModalProps {
  isOpen: boolean;
  onClose: () => void;
  spaceId: string;
  folderId?: string | null;
  onCreateList: (data: {
    space_id: string;
    folder_id: string | null;
    name: string;
    description: string | null;
  }) => Promise<void>;
}

const CreateListModal: React.FC<CreateListModalProps> = ({
  isOpen,
  onClose,
  spaceId,
  folderId = null,
  onCreateList,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      return;
    }

    setIsLoading(true);

    try {
      await onCreateList({
        space_id: spaceId,
        folder_id: folderId,
        name: name.trim(),
        description: description.trim() || null,
      });

      // Reset form
      setName('');
      setDescription('');
      onClose();
    } catch (error) {
      console.error('Error creating list:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Criar Nova Lista</DialogTitle>
          <DialogDescription>
            Crie uma lista para organizar tarefas {folderId ? 'dentro da pasta' : 'no projeto'}.
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
              {isLoading ? 'Criando...' : 'Criar Lista'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateListModal;
