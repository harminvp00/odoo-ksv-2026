import { Request, Response, NextFunction } from 'express';
import prisma from '../config/db';
import { generateInvoicePDF } from '../utils/pdf-generator';
import { emailService } from '../services/email.service';

export const invoiceController = {
  generateInvoice: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { purchaseOrderId, dueDate } = req.body;

      // Check if invoice already exists for this PO
      const existingInvoice = await prisma.invoice.findFirst({
        where: { purchaseOrderId }
      });
      if (existingInvoice) {
        return res.status(400).json({
          message: 'Invoice already exists for this Purchase Order',
          invoice: existingInvoice
        });
      }

      // Fetch Purchase Order with its quotation details
      const po = await prisma.purchaseOrder.findUnique({
        where: { id: purchaseOrderId },
        include: {
          quotation: {
            include: {
              lineItems: true
            }
          }
        }
      });

      if (!po) {
        return res.status(404).json({ message: 'Purchase Order not found' });
      }

      // Calculations
      const subtotal = po.quotation.subtotal;
      const gstPercentage = po.quotation.gstPercentage ? Number(po.quotation.gstPercentage) : 18.0;
      // Tax calculations: cgst = sgst = totalGst / 2
      const cgst = (subtotal.toNumber() * (gstPercentage / 2)) / 100;
      const sgst = (subtotal.toNumber() * (gstPercentage / 2)) / 100;
      const grandTotal = subtotal.toNumber() + cgst + sgst;

      // Generate invoice number INV-YYYY-XXXX
      const currentYear = new Date().getFullYear();
      const count = await prisma.invoice.count();
      const invoiceNumber = `INV-${currentYear}-${String(count + 1).padStart(4, '0')}`;

      // Default due date to 30 days from now if not provided
      const resolvedDueDate = dueDate ? new Date(dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      // Create invoice inside database transaction
      const invoice = await prisma.$transaction(async (tx) => {
        const createdInvoice = await tx.invoice.create({
          data: {
            invoiceNumber,
            purchaseOrderId,
            invoiceDate: new Date(),
            dueDate: resolvedDueDate,
            subtotal,
            cgst,
            sgst,
            grandTotal,
            status: 'PENDING_PAYMENT'
          }
        });

        // Copy quotation line items to invoice line items
        for (const item of po.quotation.lineItems) {
          await tx.invoiceLineItem.create({
            data: {
              invoiceId: createdInvoice.id,
              item: item.item,
              qty: item.qty,
              unit: item.unit,
              unitPrice: item.unitPrice,
              totalVal: item.totalVal
            }
          });
        }

        return tx.invoice.findUnique({
          where: { id: createdInvoice.id },
          include: {
            lineItems: true,
            purchaseOrder: {
              include: {
                vendor: true
              }
            }
          }
        });
      });

      res.status(201).json(invoice);
    } catch (err) {
      next(err);
    }
  },

  getInvoice: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const invoice = await prisma.invoice.findUnique({
        where: { id },
        include: {
          lineItems: true,
          purchaseOrder: {
            include: {
              vendor: true
            }
          }
        }
      });

      if (!invoice) {
        return res.status(404).json({ message: 'Invoice not found' });
      }

      res.json(invoice);
    } catch (err) {
      next(err);
    }
  },

  getInvoiceByPO: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { poId } = req.params;

      const invoice = await prisma.invoice.findFirst({
        where: { purchaseOrderId: poId },
        include: {
          lineItems: true,
          purchaseOrder: {
            include: {
              vendor: true
            }
          }
        }
      });

      if (!invoice) {
        return res.status(404).json({ message: 'No invoice found for this Purchase Order' });
      }

      res.json(invoice);
    } catch (err) {
      next(err);
    }
  },

  updateInvoiceStatus: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { status } = req.body; // PENDING_PAYMENT | PAID | OVERDUE

      const validStatuses = ['PENDING_PAYMENT', 'PAID', 'OVERDUE'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid invoice status' });
      }

      const invoice = await prisma.invoice.findUnique({ where: { id } });
      if (!invoice) {
        return res.status(404).json({ message: 'Invoice not found' });
      }

      const updatedInvoice = await prisma.invoice.update({
        where: { id },
        data: { status },
        include: {
          lineItems: true,
          purchaseOrder: {
            include: {
              vendor: true
            }
          }
        }
      });

      res.json(updatedInvoice);
    } catch (err) {
      next(err);
    }
  },

  downloadPDF: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const invoice = await prisma.invoice.findUnique({
        where: { id },
        include: {
          lineItems: true,
          purchaseOrder: {
            include: {
              vendor: true
            }
          }
        }
      });

      if (!invoice) {
        return res.status(404).json({ message: 'Invoice not found' });
      }

      const pdfBuffer = await generateInvoicePDF(invoice);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`);
      res.send(pdfBuffer);
    } catch (err) {
      next(err);
    }
  },

  emailInvoice: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { email } = req.body; // Optional override email (e.g. for testing)

      const invoice = await prisma.invoice.findUnique({
        where: { id },
        include: {
          lineItems: true,
          purchaseOrder: {
            include: {
              vendor: {
                include: {
                  user: true
                }
              }
            }
          }
        }
      });

      if (!invoice) {
        return res.status(404).json({ message: 'Invoice not found' });
      }

      // Determine recipient email (override or vendor user email or test default)
      const recipientEmail = email || invoice.purchaseOrder.vendor.user?.email || 'vekariyaharmin96@gmail.com';

      // Generate the PDF attachment
      const pdfBuffer = await generateInvoicePDF(invoice);

      // Email body template
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f0f0f0;">
          <h2 style="color: #3F51B5; border-bottom: 2px solid #3F51B5; padding-bottom: 10px;">VendorBridge Invoice Notification</h2>
          <p>Hello,</p>
          <p>Please find attached the official invoice generated against Purchase Order <strong>${invoice.purchaseOrder.poNumber}</strong>.</p>
          
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr style="background-color: #f8f8f8;">
              <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Invoice Number</th>
              <td style="padding: 10px; border: 1px solid #ddd;">${invoice.invoiceNumber}</td>
            </tr>
            <tr>
              <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Invoice Date</th>
              <td style="padding: 10px; border: 1px solid #ddd;">${new Date(invoice.invoiceDate).toLocaleDateString()}</td>
            </tr>
            <tr style="background-color: #f8f8f8;">
              <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Due Date</th>
              <td style="padding: 10px; border: 1px solid #ddd;">${new Date(invoice.dueDate).toLocaleDateString()}</td>
            </tr>
            <tr>
              <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Grand Total</th>
              <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold; color: #3F51B5;">INR ${parseFloat(invoice.grandTotal.toString()).toFixed(2)}</td>
            </tr>
          </table>

          <p>Please review the details in the attached PDF. For any questions or support, contact our billing department.</p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 25px 0;" />
          <p style="font-size: 11px; color: #777;">This is an automated notification from VendorBridge. Please do not reply directly to this email.</p>
        </div>
      `;

      // Dispatch email with PDF attachment
      await emailService.sendMail(
        recipientEmail,
        `Invoice ${invoice.invoiceNumber} - VendorBridge`,
        htmlContent,
        [
          {
            filename: `invoice-${invoice.invoiceNumber}.pdf`,
            content: pdfBuffer
          }
        ]
      );

      res.json({
        message: `Invoice successfully dispatched via email to ${recipientEmail}`,
        recipient: recipientEmail
      });
    } catch (err) {
      next(err);
    }
  }
};
