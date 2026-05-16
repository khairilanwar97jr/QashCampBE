const PAYMENT_STATUS = {
  UNPAID: "UNPAID",           // not paid yet (walk-in created or online booking created)
  DEPOSIT_PAID: "DEPOSIT_PAID",
  PAID: "PAID",
  FAILED: "FAILED",
  EXPIRED: "EXPIRED",
};

module.exports = PAYMENT_STATUS;