export function calculateOrderFinancials(itemSubtotal: number, taxRate: number, deliveryFee: number,
  providerFee: number, serviceFee: number, tipAmount: number, couponDiscount: number,
  platformFeePercent = 0.20, taxHandlingMode = "restaurant") {

  const taxAmount        = itemSubtotal * taxRate;
  const platformFeeAmt   = itemSubtotal * platformFeePercent;
  const restaurantPayout = itemSubtotal - platformFeeAmt;
  const storeSettlement  = taxHandlingMode === "restaurant"
                           ? restaurantPayout + taxAmount
                           : restaurantPayout;
  const customerTotal    = itemSubtotal + taxAmount + deliveryFee
                           + providerFee + serviceFee + tipAmount
                           - couponDiscount;
  return {
    taxAmount, platformFeeAmt, restaurantPayout,
    storeSettlement, customerTotal
  };
}
