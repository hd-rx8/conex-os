import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
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
import { cn } from '@/lib/utils';
import type { Workspace } from '@/types/hierarchy';

interface EditWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspace: Workspace;
  onUpdate: (data: {
    name: string;
    description: string | null;
    icon: string | null;
    color: string | null;
  }) => Promise<void>;
}

const WORKSPACE_ICONS = ['🏢', '🏭', '🏪', '🏬', '🏛️', '🏗️', '🏘️', '🏚️', '🏠', '🏡'];
const WORKSPACE_COLORS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#14B8A6', // teal
  '#F97316', // orange
];

const EditWorkspaceModal: React.FC<EditWorkspaceModalProps> = ({
  isOpen,
  onClose,
  workspace,
  onUpdate,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedIcon, setSelectedIcon] = useState<string>(WORKSPACE_ICONS[0]);
  const [selectedColor, setSelectedColor] = useState<string>(WORKSPACE_COLORS[0]);
  const [isLoading, setIsLoading] = useState(false);

  // Load workspace data when modal opens
  useEffect(() => {
    if (isOpen && workspace) {
      setName(workspace.name);
      setDescription(workspace.description || '');
      setSelectedIcon(workspace.icon || WORKSPACE_ICONS[0]);
      setSelectedColor(workspace.color || WORKSPACE_COLORS[0]);
    }
  }, [isOpen, workspace]);

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
        icon: selectedIcon,
        color: selectedColor,
      });

      onClose();
    } catch (error) {
      console.error('Error updating workspace:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Workspace</DialogTitle>
          <DialogDescription>
            Atualize as informações do workspace. Isso não afetará os projetos dentro dele.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Preview */}
          <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/50">
            <div
              className="flex items-center justify-center w-12 h-12 rounded-lg text-2xl"
              style={{ backgroundColor: selectedColor }}
            >
              {selectedIcon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">
                {name.trim() || 'Nome do Workspace'}
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
            <Label htmlFor="workspace-name">
              Nome do Workspace <span className="text-destructive">*</span>
            </Label>
            <Input
              id="workspace-name"
              placeholder="Ex: Marketing Digital"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="workspace-description">Descrição (opcional)</Label>
            <Textarea
              id="workspace-description"
              placeholder="Descreva o objetivo deste workspace..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Icon Selector */}
          <div className="space-y-2">
            <Label>Ícone</Label>
            <div className="flex flex-wrap gap-2">
              {WORKSPACE_ICONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setSelectedIcon(icon)}
                  className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-all',
                    'hover:bg-accent hover:scale-110',
                    selectedIcon === icon && 'ring-2 ring-primary bg-accent'
                  )}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Color Selector */}
          <div className="space-y-2">
            <Label>Cor</Label>
            <div className="flex flex-wrap gap-2">
              {WORKSPACE_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={cn(
                    'w-10 h-10 rounded-lg transition-all',
                    'hover:scale-110',
                    selectedColor === color && 'ring-2 ring-offset-2 ring-primary'
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
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

export default EditWorkspaceModal;
