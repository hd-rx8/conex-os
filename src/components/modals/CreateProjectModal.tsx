import React, { useState } from 'react';
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

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  onCreateProject: (data: {
    workspace_id: string;
    name: string;
    description: string | null;
    icon: string | null;
    color: string | null;
  }) => Promise<void>;
}

const PROJECT_ICONS = ['📁', '📂', '📊', '📈', '📉', '🎯', '🚀', '💼', '🔧', '⚙️'];
const PROJECT_COLORS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#14B8A6', // teal
  '#F97316', // orange
];

const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  workspaceId,
  onCreateProject,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedIcon, setSelectedIcon] = useState<string>(PROJECT_ICONS[0]);
  const [selectedColor, setSelectedColor] = useState<string>(PROJECT_COLORS[0]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      return;
    }

    setIsLoading(true);

    try {
      await onCreateProject({
        workspace_id: workspaceId,
        name: name.trim(),
        description: description.trim() || null,
        icon: selectedIcon,
        color: selectedColor,
      });

      // Reset form
      setName('');
      setDescription('');
      setSelectedIcon(PROJECT_ICONS[0]);
      setSelectedColor(PROJECT_COLORS[0]);
      onClose();
    } catch (error) {
      console.error('Error creating project:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Criar Novo Projeto</DialogTitle>
          <DialogDescription>
            Adicione um novo projeto ao workspace. Projetos ajudam a organizar tarefas e listas.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Preview */}
          <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/50">
            <div
              className="flex items-center justify-center w-10 h-10 rounded-lg text-xl"
              style={{ backgroundColor: selectedColor }}
            >
              {selectedIcon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">
                {name.trim() || 'Nome do Projeto'}
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
            <Label htmlFor="project-name">
              Nome do Projeto <span className="text-destructive">*</span>
            </Label>
            <Input
              id="project-name"
              placeholder="Ex: Marketing Digital"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="project-description">Descrição (opcional)</Label>
            <Textarea
              id="project-description"
              placeholder="Descreva o objetivo deste projeto..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Icon Selector */}
          <div className="space-y-2">
            <Label>Ícone</Label>
            <div className="flex flex-wrap gap-2">
              {PROJECT_ICONS.map((icon) => (
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
              {PROJECT_COLORS.map((color) => (
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
              {isLoading ? 'Criando...' : 'Criar Projeto'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateProjectModal;
