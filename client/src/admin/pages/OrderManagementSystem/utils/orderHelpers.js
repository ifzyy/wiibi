import { FULFILLMENT, PAYMENT } from "../constants.js";

/** Resolve order number — prefer orderNumber, fall back to id */
export const getOrderNum = (order) =>
  order?.orderNumber ?? order?.order_number ?? order?.id ?? order?._id ?? "—";

/** Resolve customer display name from various DB shapes */
export const getCustomerName = (order) => {
  const userName = [order?.user?.firstName, order?.user?.lastName]
    .filter(Boolean).join(" ");
  return order?.shippingAddress?.fullName || userName || order?.guestEmail || "Guest";
};

/** Resolve customer email */
export const getCustomerEmail = (order) =>
  order?.customer?.email ?? order?.user?.email ?? order?.guestEmail ?? "—";

/** Resolve customer phone */
export const getCustomerPhone = (order) =>
  order?.shippingAddress?.phone ?? order?.user?.phoneNumber ?? "—";

/** Total item quantity across all line items */
export const getTotalQty = (order) =>
  (order?.items ?? []).reduce((s, it) => s + (it.quantity ?? it.qty ?? 0), 0);

/** Resolve the order total from whichever field is present */
export const getTotal = (order) =>
  order?.total ?? order?.totalAmount ?? 0;

/** Fulfillment config for the order's current status */
export const getFulfillmentCfg = (order) =>
  FULFILLMENT[order?.fulfillmentStatus ?? order?.status] ?? FULFILLMENT.pending;

/** Payment config */
export const getPaymentCfg = (order) =>
  PAYMENT[order?.paymentStatus] ?? PAYMENT.unpaid;

/**
 * Returns true if this order can accept a refund
 * (i.e. admin is switching to refunded/partially_refunded from paid)
 */
export const isNewRefund = (currentPaymentStatus, nextPaymentStatus) =>
  (nextPaymentStatus === "partially_refunded" || nextPaymentStatus === "refunded") &&
  currentPaymentStatus === "paid";

/** Derive the item image — prefers snapshotted URL, falls back to live product */
export const getItemImage = (item) =>
  item?.productImageUrl ?? item?.product?.featured_image_url ?? item?.image ?? null;

/** Derive item name */
export const getItemName = (item) =>
  item?.productName ?? item?.product?.name ?? item?.name ?? "—";

/** Derive item SKU */
export const getItemSku = (item) =>
  item?.product?.sku ?? item?.sku ?? "—";

/** Compute stats from a flat orders array */
export const computeStats = (orders) => ({
  revenue:    orders
    .filter(o => ["paid", "partially_refunded"].includes(o.paymentStatus))
    .reduce((s, o) => s + Number(getTotal(o) ?? 0), 0),
  refunded:   orders.reduce(
    (s, o) => s + (o.refunds ?? []).reduce((r, ref) => r + Number(ref.amount ?? 0), 0),
    0
  ),
  processing: orders.filter(o => (o.fulfillmentStatus ?? o.status) === "processing").length,
  unpaid:     orders.filter(o => o.paymentStatus === "unpaid").length,
  cancelled:  orders.filter(o => (o.fulfillmentStatus ?? o.status) === "cancelled").length,
  refundCount:orders.filter(o => (o.refunds ?? []).length > 0).length,
});