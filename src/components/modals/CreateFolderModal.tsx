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

interface CreateFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  spaceId: string;
  onCreateFolder: (data: {
    space_id: string;
    name: string;
    description: string | null;
  }) => Promise<void>;
}

const CreateFolderModal: React.FC<CreateFolderModalProps> = ({
  isOpen,
  onClose,
  spaceId,
  onCreateFolder,
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
      await onCreateFolder({
        space_id: spaceId,
        name: name.trim(),
        description: description.trim() || null,
      });

      // Reset form
      setName('');
      setDescription('');
      onClose();
    } catch (error) {
      console.error('Error creating folder:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Criar Nova Pasta</DialogTitle>
          <DialogDescription>
            Crie uma pasta para organizar suas listas dentro do projeto.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Preview */}
          <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/50">
            <span className="text-2xl">📂</span>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">
                {name.trim() || 'Nome da Pasta'}
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
            <Label htmlFor="folder-name">
              Nome da Pasta <span className="text-destructive">*</span>
            </Label>
            <Input
              id="folder-name"
              placeholder="Ex: Desenvolvimento, Design, Marketing..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="folder-description">Descrição (opcional)</Label>
            <Textarea
              id="folder-description"
              placeholder="Descreva o objetivo desta pasta..."
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
              {isLoading ? 'Criando...' : 'Criar Pasta'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateFolderModal;
