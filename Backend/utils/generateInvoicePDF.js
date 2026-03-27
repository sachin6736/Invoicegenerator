// utils/generateInvoicePDF.js
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
const logoPath = path.join(process.cwd(), 'assets', 'logo.png');  // ← adjust this path to where your logo file actually is

export async function generateInvoicePDF(invoice) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      margin: 50,
      size: 'A4',
      bufferPages: true,
    });

    const buffers = [];
    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    const primaryColor = '#1e40af';   // Professional blue
    const gray = '#4b5563';
    const lightGray = '#f3f4f6';

    let y = 40;

    // ==================== HEADER ====================
    doc
      .fontSize(24)
      .font('Helvetica-Bold')
      .fillColor(primaryColor)
      .text('Auto Parts Store', 50, y, { align: 'left' });

    // Company Info on the right
    doc
      .fontSize(10)
      .font('Helvetica')
      .fillColor(gray)
      .text('Auto Parts Store', 350, y, { align: 'right', width: 200 })
      // .text('330 N Brand Blvd, STE 700', 350, doc.y, { align: 'right', width: 200 })
      // .text('Glendale, California 91203', 350, doc.y, { align: 'right', width: 200 })
      // .text('+1 888-282-7476', 350, doc.y, { align: 'right', width: 200 })
      // .text('contact@firstusedautoparts.com', 350, doc.y, { align: 'right', width: 200 });

    y = doc.y + 50;

    // ==================== INVOICE TITLE ====================
    doc
      .fontSize(20)
      .font('Helvetica-Bold')
      .fillColor('black')
      .text('INVOICE', 50, y);

    y = doc.y + 30;

    // ==================== INVOICE META ====================
    doc
      .fontSize(11)
      .font('Helvetica-Bold')
      .fillColor('black')
      .text(`Invoice # ${invoice.invoiceNumber}`, 50, y);

    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor(gray)
      .text(`Issue Date: ${new Date(invoice.issueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 50, doc.y + 8)
      .text(`Due Date:   ${new Date(invoice.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 50, doc.y + 4);

    y = doc.y + 40;

    // ==================== BILL TO ====================
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .fillColor('black')
      .text('Bill To:', 50, y);

    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor(gray)
      .text(invoice.client.name || '—', 50, doc.y + 8)
      .text(invoice.client.email || '—', 50, doc.y)
      .text(invoice.client.phone || '', 50, doc.y);

    y = doc.y + 45;

    // ==================== ITEMS TABLE ====================
    const tableTop = y;
    const rowHeight = 30;
    let currentY = tableTop;

    // Table Header
    doc
      .rect(50, currentY - 8, 495, 28)
      .fill(primaryColor);

    doc
      .font('Helvetica-Bold')
      .fontSize(11)
      .fillColor('white')
      .text('Description', 65, currentY)
      .text('Amount', 460, currentY, { width: 85, align: 'right' });

    currentY += rowHeight;

    // Items Rows
    invoice.items.forEach((item, index) => {
      const isEven = index % 2 === 0;
      if (isEven) {
        doc.rect(50, currentY - 8, 495, rowHeight).fill(lightGray);
      }

      doc
        .font('Helvetica')
        .fontSize(10)
        .fillColor('black')
        .text(item.description || '—', 65, currentY, { width: 380 })
        .text(`$${Number(item.amount).toFixed(2)}`, 460, currentY, { width: 85, align: 'right' });

      currentY += rowHeight;
    });

    // Total
    currentY += 20;
    doc
      .font('Helvetica-Bold')
      .fontSize(13)
      .fillColor(primaryColor)
      .text('TOTAL DUE', 360, currentY)
      .text(`$${invoice.totalAmount.toFixed(2)}`, 460, currentY, { width: 85, align: 'right' });

    y = currentY + 50;

    // ==================== NOTES ====================
    if (invoice.notes && invoice.notes.trim()) {
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .fillColor(gray)
        .text('Notes:', 50, y);

      doc
        .font('Helvetica')
        .fontSize(10)
        .text(invoice.notes, 50, doc.y + 5, { width: 500 });
    }

    // ==================== FOOTER ====================
    doc
      .fontSize(9)
      .fillColor(gray)
      .text('Thank you for your business!', 50, doc.page.height - 80, { align: 'center', width: 500 })
      .text('Please make payment by the due date.', 50, doc.y + 8, { align: 'center', width: 500 });

    doc.end();
  });
} 