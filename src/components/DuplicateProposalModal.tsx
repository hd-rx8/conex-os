import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useClients } from '@/hooks/useClients';
import { Proposal } from '@/hooks/useProposals';

interface DuplicateProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  proposal: Proposal | null;
  onDuplicate: (proposalId: string, newClientId: string | null, newTitle: string) => Promise<void>;
}

const DuplicateProposalModal: React.FC<DuplicateProposalModalProps> = ({
  isOpen,
  onClose,
  proposal,
  onDuplicate
}) => {
  const { clients: allClients } = useClients();
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opens/closes
  React.useEffect(() => {
    if (isOpen && proposal) {
      setNewTitle(`${proposal.title} (Cópia)`);
      setSelectedClientId(proposal.client_id || null);
    } else {
      setNewTitle('');
      setSelectedClientId(null);
    }
  }, [isOpen, proposal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proposal) return;

    setIsSubmitting(true);
    try {
      await onDuplicate(proposal.id, selectedClientId, newTitle);
      onClose();
    } catch (error) {
      console.error('Error duplicating proposal:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentClientName = proposal?.client_id 
    ? allClients.find(c => c.id === proposal.client_id)?.name || 'Cliente não encontrado'
    : 'Nenhum cliente';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Duplicar Proposta</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações da proposta original */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-sm text-gray-700 mb-2">Proposta Original:</h3>
            <p className="text-sm">
              <span className="font-medium">Título:</span> {proposal?.title}
            </p>
            <p className="text-sm">
              <span className="font-medium">Cliente atual:</span> {currentClientName}
            </p>
          </div>

          {/* Novo título */}
          <div className="space-y-2">
            <Label htmlFor="title">Novo Título da Proposta</Label>
            <Input
              id="title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Digite o título da nova proposta"
              required
            />
          </div>

          {/* Seleção de cliente */}
          <div className="space-y-2">
            <Label htmlFor="client">Cliente para a Nova Proposta</Label>
            <Select value={selectedClientId || 'none'} onValueChange={(value) => setSelectedClientId(value === 'none' ? null : value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um cliente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum cliente</SelectItem>
                {allClients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name} {client.company && `(${client.company})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              A proposta será duplicada com todos os serviços e configurações, mas pode ser atribuída a um cliente diferente.
            </p>
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || !newTitle.trim()}
            >
              {isSubmitting ? 'Duplicando...' : 'Duplicar Proposta'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default DuplicateProposalModal;
