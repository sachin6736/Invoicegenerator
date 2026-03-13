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

    const primaryColor = '#1e40af'; // blue accent
    const gray = '#4b5563';
    const lightGray = '#f3f4f6';

    // ─── Header with smaller & higher logo + Company Info ─────────────────────
    let y = 20;  // ← moved higher (was 40)

    // Logo (smaller size, left side)
    try {
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 50, y, { width: 100 });  // ← smaller: was 140
      } else {
        // Fallback if logo file is missing
        doc
          .fontSize(16)
          .font('Helvetica-Bold')
          .fillColor(primaryColor)
          .text('First Used Auto Parts', 50, y);
      }
    } catch (err) {
      console.warn('Logo loading failed:', err.message);
      doc
        .fontSize(16)
        .font('Helvetica-Bold')
        .fillColor(primaryColor)
        .text('First Used Auto Parts', 50, y);
    }

    // Company details (right side, aligned under logo area)
    doc
      .fontSize(10)
      .font('Helvetica')
      .fillColor(gray)
      .text('First Used Auto Parts', 350, y, { align: 'right', width: 200 })
      .text('330 N Brand Blvd, STE 700', 350, doc.y, { align: 'right', width: 200 })
      .text('Glendale, California 91203', 350, doc.y, { align: 'right', width: 200 })
      .text('+1 888-282-7476', 350, doc.y, { align: 'right', width: 200 })
      .text('contact@firstusedautoparts.com', 350, doc.y, { align: 'right', width: 200 });

    y = doc.y + 50;  // more space after header

    // ─── Invoice meta (number + dates) ───────────────────────────────────────
    doc
      .fontSize(11)
      .font('Helvetica-Bold')
      .fillColor('black')
      .text(`Invoice # ${invoice.invoiceNumber || '—'}`, 50, y);

    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor(gray)
      .text(`Issue Date: ${new Date(invoice.issueDate).toLocaleDateString('en-US')}`, 50, doc.y + 4)
      .text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString('en-US')}`, 50, doc.y);

    y = doc.y + 40;

    // ─── Bill To ──────────────────────────────────────────────────────────────
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .fillColor('black')
      .text('Bill To:', 50, y);

    doc
      .font('Helvetica')
      .fontSize(10)
      .text(invoice.client.name || '—', 50, doc.y + 5)
      .text(invoice.client.email || '—', 50, doc.y)
      .text(invoice.client.phone || '—', 50, doc.y);

    y = doc.y + 40;

    // ─── Items Table ──────────────────────────────────────────────────────────
    const tableTop = y;
    const rowHeight = 28;
    let currentY = tableTop;

    // Table header with background
    doc
      .rect(50, currentY - 5, 500, 25)
      .fill(primaryColor);

    doc
      .font('Helvetica-Bold')
      .fontSize(11)
      .fillColor('white')
      .text('Description', 60, currentY)
      .text('Amount', 460, currentY, { width: 90, align: 'right' });

    currentY += rowHeight;

    // Separator line
    doc.moveTo(50, currentY - 5).lineTo(550, currentY - 5).lineWidth(1).stroke(gray);

    // Rows
    invoice.items.forEach((item, index) => {
      const isEven = index % 2 === 0;
      if (isEven) {
        doc.rect(50, currentY - 5, 500, rowHeight).fill(lightGray); // subtle stripe
      }

      doc
        .font('Helvetica')
        .fontSize(10)
        .fillColor('black')
        .text(item.description || '—', 60, currentY, { width: 380, lineGap: 2 })
        .text(`$${Number(item.amount).toFixed(2)}`, 460, currentY, { width: 90, align: 'right' });

      currentY += rowHeight;

      // Light row separator
      doc.moveTo(50, currentY - 5).lineTo(550, currentY - 5).stroke('#e5e7eb');
    });

    // Total
    currentY += 15;
    doc
      .font('Helvetica-Bold')
      .fontSize(12)
      .text('Total Amount Due:', 360, currentY)
      .text(`$${invoice.totalAmount.toFixed(2)}`, 460, currentY, { width: 90, align: 'right' });

    currentY += 50;

    // ─── Notes & Footer ───────────────────────────────────────────────────────
    if (invoice.notes?.trim()) {
      doc
        .fontSize(10)
        .font('Helvetica')
        .fillColor(gray)
        .text('Notes / Payment Terms:', 50, currentY)
        .text(invoice.notes, 50, doc.y + 5, { width: 500 });
      currentY = doc.y + 30;
    }

    doc
      .fontSize(9)
      .fillColor(gray)
      .text('Thank you for your business!', 50, currentY, { align: 'center', width: 500 })
      .text('Please make payment by the due date. Contact us with any questions.', 50, doc.y + 10, { align: 'center', width: 500 });

    doc.end();
  });
}