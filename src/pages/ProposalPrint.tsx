import React, { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProposalSnapshot } from '@/hooks/useProposalSnapshot';
import ProposalDocument from '@/components/ProposalDocument';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowLeft, Printer, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { toast } from 'sonner';

const ProposalPrint: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);
  
  const { data: snapshot, isLoading, error } = useProposalSnapshot(id || '', !!id);

  // Wait for fonts and images before printing
  const waitForAssets = async () => {
    try {
      // Wait for fonts to be ready
      if (document.fonts) {
        await document.fonts.ready;
      }
      
      // Wait for all images to load
      const images = Array.from(document.images);
      const imagePromises = images.map(img => {
        if (img.decode) {
          return img.decode().catch(() => {});
        }
        return Promise.resolve();
      });
      
      await Promise.all(imagePromises);
    } catch (error) {
      console.warn('Error waiting for assets:', error);
    }
  };

  const handlePrint = async () => {
    if (!printRef.current) return;
    
    try {
      await waitForAssets();
      
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast.error('Não foi possível abrir a janela de impressão');
        return;
      }

      const printContent = printRef.current.innerHTML;
      const headContent = document.head.innerHTML;

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Proposta CONEX.HUB - ${snapshot?.title}</title>
            ${headContent}
            <style>
              @media print {
                body { margin: 0; padding: 0; }
                @page { margin: 10mm; size: A4; }
                .print-content { display: block !important; }
                .no-print { display: none !important; }
                .print-controls { display: none !important; }
              }
            </style>
          </head>
          <body>
            ${printContent}
          </body>
        </html>
      `);
      
      printWindow.document.close();
      
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 1000);
      
      toast.success('Impressão iniciada!');
    } catch (error) {
      console.error('Error printing:', error);
      toast.error('Erro ao imprimir a proposta');
    }
  };

  const handleDownloadPDF = async () => {
    if (!snapshot || !printRef.current) return;
    
    try {
      toast.info('Gerando PDF...');
      
      await waitForAssets();
      
      // Hide print controls before capturing
      const printControls = document.querySelector('.print-controls');
      if (printControls) {
        (printControls as HTMLElement).style.display = 'none';
      }
      
      // Capture the document as canvas
      const canvas = await html2canvas(printRef.current, {
        scale: 2, // Higher quality
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: printRef.current.scrollWidth,
        height: printRef.current.scrollHeight,
      });
      
      // Restore print controls
      if (printControls) {
        (printControls as HTMLElement).style.display = '';
      }
      
      // Create PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Calculate dimensions
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 0;
      
      // Add image to PDF
      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      
      // Generate filename using exact proposal title
      const filename = `${snapshot.title}.pdf`;
      
      // Download PDF
      pdf.save(filename);
      
      toast.success('PDF baixado com sucesso!');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Erro ao gerar PDF');
      
      // Restore print controls in case of error
      const printControls = document.querySelector('.print-controls');
      if (printControls) {
        (printControls as HTMLElement).style.display = '';
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Carregando proposta...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !snapshot) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-red-600">Erro ao Carregar Proposta</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-800 mb-4">
              {error?.message || 'A proposta não pôde ser carregada.'}
            </p>
            <Button onClick={() => navigate('/proposals')} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para Propostas
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Print Controls */}
      <div className="print-controls bg-white border-b border-gray-200 p-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              onClick={() => navigate('/proposals')} 
              variant="outline" 
              size="sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <h1 className="text-lg font-semibold">Preview da Proposta</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              onClick={handlePrint} 
              className="bg-blue-600 hover:bg-blue-700"
              size="sm"
            >
              <Printer className="w-4 h-4 mr-2" />
              Imprimir
            </Button>
            <Button 
              onClick={handleDownloadPDF} 
              variant="outline" 
              size="sm"
            >
              <Download className="w-4 h-4 mr-2" />
              Baixar PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Document Preview */}
      <div className="p-4">
        <div className="max-w-4xl mx-auto">
          <div ref={printRef}>
            <ProposalDocument snapshot={snapshot} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProposalPrint;
