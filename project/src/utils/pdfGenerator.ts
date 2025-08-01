import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface SignatureField {
  id: string;
  type: 'signature' | 'initial' | 'date' | 'text';
  x: number;
  y: number;
  recipientId: string;
  label: string;
}

export interface Recipient {
  id: string;
  emails: string[];
  role: 'signer' | 'reviewer' | 'cc';
}

export interface PDFGenerationResult {
  pdfBlob: Blob;
  pdfUrl: string;
  signatureFields: Array<{
    fieldId: string;
    recipientId: string;
    type: string;
    pageNumber: number;
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
}

export class PDFGenerator {
  private static readonly PDF_WIDTH = 210; // A4 width in mm
  private static readonly PDF_HEIGHT = 297; // A4 height in mm
  private static readonly MM_TO_PX = 3.779527559; // Conversion factor

  static async convertDocumentToPDF(
    documentElement: HTMLElement,
    signatureFields: SignatureField[]
  ): Promise<PDFGenerationResult> {
    try {
      // Create a clone of the document to avoid modifying the original
      const documentClone = documentElement.cloneNode(true) as HTMLElement;
      
      // Remove signature field overlays from the clone for clean PDF
      const fieldOverlays = documentClone.querySelectorAll('[data-signature-field]');
      fieldOverlays.forEach(overlay => overlay.remove());

      // Temporarily add the clone to the DOM for rendering
      documentClone.style.position = 'absolute';
      documentClone.style.left = '-9999px';
      documentClone.style.top = '0';
      document.body.appendChild(documentClone);

      // Convert to canvas
      const canvas = await html2canvas(documentClone, {
        scale: 2, // Higher resolution
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: documentClone.scrollWidth,
        height: documentClone.scrollHeight
      });

      // Remove the clone from DOM
      document.body.removeChild(documentClone);

      // Create PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Calculate scaling to fit A4
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const pdfWidth = this.PDF_WIDTH;
      const pdfHeight = this.PDF_HEIGHT;

      // Calculate scale to fit content while maintaining aspect ratio
      const scaleX = pdfWidth / (canvasWidth / this.MM_TO_PX);
      const scaleY = pdfHeight / (canvasHeight / this.MM_TO_PX);
      const scale = Math.min(scaleX, scaleY);

      const scaledWidth = (canvasWidth / this.MM_TO_PX) * scale;
      const scaledHeight = (canvasHeight / this.MM_TO_PX) * scale;

      // Center the content on the page
      const offsetX = (pdfWidth - scaledWidth) / 2;
      const offsetY = (pdfHeight - scaledHeight) / 2;

      // Add the image to PDF
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', offsetX, offsetY, scaledWidth, scaledHeight);

      // Convert signature field positions to PDF coordinates
      const documentRect = documentElement.getBoundingClientRect();
      const pdfSignatureFields = signatureFields.map(field => {
        // Convert pixel coordinates to PDF coordinates
        const relativeX = field.x / documentRect.width;
        const relativeY = field.y / documentRect.height;
        
        const pdfX = offsetX + (relativeX * scaledWidth);
        const pdfY = offsetY + (relativeY * scaledHeight);

        return {
          fieldId: field.id,
          recipientId: field.recipientId,
          type: field.type,
          pageNumber: 1, // For now, assuming single page
          x: pdfX,
          y: pdfY,
          width: 60, // Default field width in mm
          height: 15  // Default field height in mm
        };
      });

      // Generate PDF blob
      const pdfBlob = pdf.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);

      return {
        pdfBlob,
        pdfUrl,
        signatureFields: pdfSignatureFields
      };
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw new Error('Failed to generate PDF');
    }
  }

  static async addSignatureFieldsToPDF(
    pdfBlob: Blob
  ): Promise<Blob> {
    // This would typically use a more advanced PDF library like PDF-lib
    // For now, we'll return the original PDF with field metadata
    return pdfBlob;
  }
}