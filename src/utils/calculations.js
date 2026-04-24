export const calculateRowTotal = (quantity, basePrice, discountType, discountValue, gstPercentage, variantPriceAdjustment = 0) => {
  let discountAmount = 0;
  const effectivePrice = basePrice + variantPriceAdjustment;

  if (discountType === 'PERCENTAGE') {
    discountAmount = (effectivePrice * quantity) * (discountValue / 100);
  } else {
    discountAmount = discountValue;
  }

  // Ensure discount doesn't exceed total cost
  if (discountAmount > effectivePrice * quantity) {
    discountAmount = effectivePrice * quantity;
  }

  const rowTotalBeforeGST = (effectivePrice * quantity) - discountAmount;
  const rowTotalWithGST = rowTotalBeforeGST * (1 + (gstPercentage / 100));

  return parseFloat(rowTotalWithGST.toFixed(2));
};

export const calculateTotals = (lineItems, gstPercentage) => {
  let subTotal = 0;
  let totalDiscount = 0;

  lineItems.forEach(item => {
    let discountAmount = 0;
    const variantAdjustment = item.variant ? item.variant.priceAdjustment : 0;
    const effectivePrice = item.basePrice + variantAdjustment;

    if (item.discountType === 'PERCENTAGE') {
      discountAmount = (effectivePrice * item.quantity) * (item.discountValue / 100);
    } else {
      discountAmount = item.discountValue;
    }

    if (discountAmount > effectivePrice * item.quantity) {
      discountAmount = effectivePrice * item.quantity;
    }

    subTotal += (effectivePrice * item.quantity) - discountAmount;
    totalDiscount += discountAmount;
  });

  const gstAmount = subTotal * (gstPercentage / 100);
  const grandTotal = subTotal + gstAmount;

  return {
    subTotal: parseFloat(subTotal.toFixed(2)),
    totalDiscount: parseFloat(totalDiscount.toFixed(2)),
    gstAmount: parseFloat(gstAmount.toFixed(2)),
    grandTotal: parseFloat(grandTotal.toFixed(2))
  };
};
