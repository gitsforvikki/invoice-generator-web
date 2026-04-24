import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateInvoicePDF = (invoiceData, action = 'download') => {
  const doc = new jsPDF();
  
  const {
    invoiceNumber = 'DRAFT',
    date = new Date().toISOString(),
    customerDetails = {},
    lineItems = [],
    gstPercentage = 0,
    totals = { subTotal: 0, totalDiscount: 0, gstAmount: 0, grandTotal: 0 }
  } = invoiceData;

  const invoiceDate = new Date(date);
  const dueDate = new Date(invoiceDate.getTime() + 15 * 24 * 60 * 60 * 1000); // +15 days

  const formatDate = (d) => d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Colors
  const primaryColor = [34, 197, 94]; // Green 500
  const textColor = [17, 24, 39]; // Gray 900
  const lightGray = [107, 114, 128]; // Gray 500

  // We use 'Rs.' because standard jsPDF Helvetica doesn't support the '₹' unicode character.
  const currency = 'Rs.';

  // Logo (Right Aligned)
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  const cafeTextWidth = doc.getTextWidth('Cafe');
  const logoX = 196 - cafeTextWidth;
  doc.setTextColor(55, 65, 81); // Gray
  doc.text('Cafe', logoX, 25);
  doc.setTextColor(...primaryColor); // Green
  const healthyTextWidth = doc.getTextWidth('Healthy');
  doc.text('Healthy', logoX - healthyTextWidth, 25);

  // Reset Text Color
  doc.setTextColor(...textColor);

  // Title
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('TAX INVOICE', 105, 40, { align: 'center' });

  // Section: Invoice Details
  let currentY = 55;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Invoice Details', 14, currentY);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  currentY += 8;
  doc.text(`Invoice Number: ${invoiceNumber}`, 14, currentY);
  currentY += 7;
  doc.text(`Invoice Date: ${formatDate(invoiceDate)}`, 14, currentY);
  currentY += 7;
  doc.text(`Due Date: ${formatDate(dueDate)}`, 14, currentY);

  // Section: Billed To
  currentY += 12;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Billed To:', 14, currentY);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  currentY += 8;
  doc.text(`Customer Name: ${customerDetails.name || 'N/A'}`, 14, currentY);
  if (customerDetails.phone) {
    currentY += 7;
    doc.text(`Phone Number: ${customerDetails.phone}`, 14, currentY);
  }
  if (customerDetails.email) {
    currentY += 7;
    doc.text(`Email ID: ${customerDetails.email}`, 14, currentY);
  }
  if (customerDetails.address) {
    currentY += 7;
    const addressLines = doc.splitTextToSize(`Billing Address: ${customerDetails.address}`, 180);
    doc.text(addressLines, 14, currentY);
    currentY += (addressLines.length - 1) * 5;
  }

  currentY += 10;
  doc.setDrawColor(209, 213, 219);
  doc.line(14, currentY, 196, currentY);

  // Section: Line Items
  currentY += 10;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Line Items', 14, currentY);

  const tableColumn = ["Item Name", "Variant / Description", "Qty", `Base Price\n(${currency})`, "GST %", "Discount", `Row Total\n(${currency})`];
  const tableRows = [];

  lineItems.forEach(item => {
    const variantAdjustment = item.variant ? item.variant.priceAdjustment : 0;
    const effectivePrice = item.basePrice + variantAdjustment;

    const discountStr = item.discountType === 'PERCENTAGE' 
      ? `${item.discountValue}%` 
      : `${currency} ${item.discountValue.toFixed(2)}`;
      
    let itemTotal = item.total;
    if (itemTotal === undefined) {
      let dAmount = item.discountType === 'PERCENTAGE' ? (effectivePrice * item.quantity * item.discountValue / 100) : item.discountValue;
      let rowTotalBeforeGST = (effectivePrice * item.quantity) - dAmount;
      itemTotal = rowTotalBeforeGST * (1 + gstPercentage / 100);
    }

    const itemData = [
      item.name || 'Unknown Item',
      item.variant ? `${item.variant.type}: ${item.variant.name}` : '-',
      item.quantity,
      effectivePrice?.toFixed(2),
      `${gstPercentage}%`,
      discountStr,
      itemTotal?.toFixed(2)
    ];
    tableRows.push(itemData);
  });

  autoTable(doc, {
    startY: currentY + 5,
    head: [tableColumn],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [17, 24, 39],
      fontSize: 10,
      fontStyle: 'bold',
      lineColor: [209, 213, 219],
      lineWidth: 0.1,
    },
    styles: {
      fontSize: 10,
      textColor: [55, 65, 81],
      lineColor: [229, 231, 235],
      lineWidth: 0.1,
      valign: 'middle'
    },
    columnStyles: {
      0: { cellWidth: 40 },
      1: { cellWidth: 40 },
      2: { halign: 'center' },
      3: { halign: 'center' },
      4: { halign: 'center' },
      5: { halign: 'center' },
      6: { halign: 'center' }
    }
  });

  // Section: Calculation Summary
  currentY = doc.lastAutoTable.finalY + 10;
  
  doc.setDrawColor(209, 213, 219);
  doc.line(14, currentY, 196, currentY);

  currentY += 10;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Calculation Summary', 14, currentY);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  currentY += 10;
  doc.text(`Subtotal: ${currency} ${totals.subTotal?.toFixed(2)}`, 14, currentY);
  
  currentY += 8;
  const discountBreakdown = lineItems
    .filter(i => i.discountValue > 0)
    .map(i => {
      const vAdj = i.variant ? i.variant.priceAdjustment : 0;
      const effPrice = i.basePrice + vAdj;
      let val = i.discountType === 'PERCENTAGE' ? (effPrice * i.quantity * i.discountValue / 100) : i.discountValue;
      return `${currency}${val.toFixed(2)} from ${i.name}`;
    })
    .join(' + ');

  const discountText = `Total Discount: - ${currency} ${totals.totalDiscount?.toFixed(2)}${discountBreakdown ? ` (${discountBreakdown})` : ''}`;
  doc.text(discountText, 14, currentY);
  
  currentY += 8;
  doc.text(`Total GST: + ${currency} ${totals.gstAmount?.toFixed(2)}`, 14, currentY);

  currentY += 10;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`GRAND TOTAL: ${currency} ${totals.grandTotal?.toFixed(2)}`, 14, currentY);

  currentY += 10;
  doc.setDrawColor(209, 213, 219);
  doc.line(14, currentY, 196, currentY);

  // Section: Terms & Conditions
  currentY += 10;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Terms & Conditions', 14, currentY);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  currentY += 8;
  doc.text('1. Payment Terms: Payment is due within 15 days of the invoice date.', 20, currentY);
  currentY += 7;
  doc.text('2. Late Fees: A late fee of 2% per month will be applied to overdue balances.', 20, currentY);
  currentY += 7;
  doc.text('3. Jurisdiction: All disputes are subject to Bengaluru jurisdiction only.', 20, currentY);
  currentY += 7;
  doc.text('4. Thank you for choosing HealthyCafe!', 20, currentY);

  currentY += 10;
  doc.setDrawColor(209, 213, 219);
  doc.line(14, currentY, 196, currentY);

  if (action === 'preview') {
    // Open in new tab (legacy)
    const pdfBlob = doc.output('blob');
    const blobUrl = URL.createObjectURL(pdfBlob);
    window.open(blobUrl, '_blank');
  } else if (action === 'blobUrl') {
    const pdfBlob = doc.output('blob');
    return URL.createObjectURL(pdfBlob);
  } else {
    // Download
    const fileName = `Invoice_${invoiceNumber === 'DRAFT' ? 'Preview' : invoiceNumber}.pdf`;
    
    // Generate ArrayBuffer and create Blob explicitly to ensure proper MIME type
    const pdfArrayBuffer = doc.output('arraybuffer');
    const pdfBlob = new Blob([pdfArrayBuffer], { type: 'application/pdf' });
    const blobUrl = URL.createObjectURL(pdfBlob);
    
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName; // Explicitly set download filename
    link.style.display = 'none'; // Hide the element
    
    document.body.appendChild(link);
    
    // Trigger download
    link.click();
    
    // Clean up with a longer timeout to ensure browser starts download
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
  }
};
