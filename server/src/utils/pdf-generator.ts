import PDFDocument from 'pdfkit';

export function generateInvoicePDF(invoice: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', (err) => reject(err));

    // Header Color Bar
    doc.rect(0, 0, 612, 15).fill('#3F51B5');
    doc.moveDown(2);

    // Document Title & Invoice Meta (Right aligned)
    doc.fillColor('#212121')
       .fontSize(20)
       .text('INVOICE', { align: 'right' });

    doc.fontSize(10)
       .fillColor('#757575')
       .text(`Invoice Number: ${invoice.invoiceNumber}`, { align: 'right' })
       .text(`Invoice Date: ${new Date(invoice.invoiceDate).toLocaleDateString()}`, { align: 'right' })
       .text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`, { align: 'right' });

    doc.moveDown();

    // Company Info / Logo space (Left side)
    doc.fillColor('#212121')
       .fontSize(14)
       .text('VendorBridge Procurement', 50, 40)
       .fontSize(9)
       .fillColor('#757575')
       .text('100 Corporate Parkway, Suite 500')
       .text('Tech City, TC 90210')
       .text('support@vendorbridge.com');

    // Horizontal Rule
    doc.moveTo(50, 125).lineTo(562, 125).strokeColor('#E0E0E0').stroke();
    doc.moveDown(2);

    // Bill To & Vendor Information Side-by-Side
    const ySection = 145;
    doc.fontSize(11)
       .fillColor('#3F51B5')
       .text('BILL TO:', 50, ySection)
       .fillColor('#212121')
       .text('VendorBridge Finance Department', 50, ySection + 15)
       .fillColor('#757575')
       .fontSize(9)
       .text('billing@vendorbridge.com')
       .text('GST No: GST-VB-CORP-01');

    doc.fontSize(11)
       .fillColor('#3F51B5')
       .text('VENDOR / SENDER:', 300, ySection)
       .fillColor('#212121')
       .text(invoice.purchaseOrder.vendor.name, 300, ySection + 15)
       .fillColor('#757575')
       .fontSize(9)
       .text(`Category: ${invoice.purchaseOrder.vendor.category}`)
       .text(`GST No: ${invoice.purchaseOrder.vendor.gstNo}`)
       .text(`Contact: ${invoice.purchaseOrder.vendor.contactNo}`);

    // Associated PO Number
    doc.moveDown(2);
    const yPO = doc.y;
    doc.fontSize(10)
       .fillColor('#212121')
       .text(`Associated Purchase Order: ${invoice.purchaseOrder.poNumber}`, 50, yPO)
       .text(`PO Date: ${new Date(invoice.purchaseOrder.poDate).toLocaleDateString()}`, 50, yPO + 15);

    // Table Header
    doc.moveDown(2);
    const tableTop = doc.y;
    doc.rect(50, tableTop, 512, 20).fill('#F5F5F5');
    
    doc.fillColor('#212121')
       .fontSize(9)
       .text('Item Description', 60, tableTop + 6)
       .text('Qty', 280, tableTop + 6, { width: 30, align: 'right' })
       .text('Unit', 330, tableTop + 6, { width: 40, align: 'center' })
       .text('Unit Price', 390, tableTop + 6, { width: 70, align: 'right' })
       .text('Total', 480, tableTop + 6, { width: 70, align: 'right' });

    let currentY = tableTop + 20;

    // Table Rows
    invoice.lineItems.forEach((item: any) => {
      // Draw a line
      doc.moveTo(50, currentY).lineTo(562, currentY).strokeColor('#EEEEEE').stroke();

      doc.fillColor('#757575')
         .text(item.item, 60, currentY + 6)
         .text(item.qty.toString(), 280, currentY + 6, { width: 30, align: 'right' })
         .text(item.unit, 330, currentY + 6, { width: 40, align: 'center' })
         .text(`INR ${parseFloat(item.unitPrice).toFixed(2)}`, 390, currentY + 6, { width: 70, align: 'right' })
         .text(`INR ${parseFloat(item.totalVal).toFixed(2)}`, 480, currentY + 6, { width: 70, align: 'right' });
      
      currentY += 20;
    });

    // Draw final table bottom line
    doc.moveTo(50, currentY).lineTo(562, currentY).strokeColor('#E0E0E0').stroke();

    // Summary block (Right aligned)
    doc.moveDown(2);
    const summaryY = doc.y;
    doc.fontSize(9).fillColor('#757575');
    doc.text('Subtotal:', 350, summaryY, { width: 100, align: 'right' })
       .text(`INR ${parseFloat(invoice.subtotal).toFixed(2)}`, 460, summaryY, { width: 90, align: 'right' });

    doc.text('CGST:', 350, summaryY + 15, { width: 100, align: 'right' })
       .text(`INR ${parseFloat(invoice.cgst).toFixed(2)}`, 460, summaryY + 15, { width: 90, align: 'right' });

    doc.text('SGST:', 350, summaryY + 30, { width: 100, align: 'right' })
       .text(`INR ${parseFloat(invoice.sgst).toFixed(2)}`, 460, summaryY + 30, { width: 90, align: 'right' });

    doc.fontSize(11).fillColor('#3F51B5');
    doc.text('Grand Total:', 350, summaryY + 50, { width: 100, align: 'right' })
       .text(`INR ${parseFloat(invoice.grandTotal).toFixed(2)}`, 460, summaryY + 50, { width: 90, align: 'right' });

    // Footer
    doc.fontSize(8)
       .fillColor('#9E9E9E')
       .text('Thank you for your business. Please remit payments in a timely manner.', 50, 700, { align: 'center' });

    doc.end();
  });
}
