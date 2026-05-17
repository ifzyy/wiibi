/* ─── Colour palette ──────────────────────────────────────────────────────── */
export const C = {
  amber:    "#FFAA14",
  amberBg:  "#FFF8E7",
  bg:       "#F9F9F9",
  border:   "#F1F1F1",
  ink:      "#1A1102",
  inkMid:   "#6B6040",
  inkFaint: "#B8A98A",
  white:    "#FFFFFF",
};

/* ─── Fulfillment statuses ────────────────────────────────────────────────── */
export const FULFILLMENT = {
  pending:    { label: "Pending",    ring: C.inkFaint, step: 0 },
  processing: { label: "Processing", ring: C.amber,    step: 1 },
  shipped:    { label: "Shipped",    ring: C.inkMid,   step: 2 },
  delivered:  { label: "Delivered",  ring: C.ink,      step: 3 },
  cancelled:  { label: "Cancelled",  ring: C.inkFaint, step: -1 },
  returned:   { label: "Returned",   ring: C.inkMid,   step: -1 },
};

/* ─── Payment statuses ────────────────────────────────────────────────────── */
export const PAYMENT = {
  unpaid:             { label: "Unpaid",         ring: C.inkFaint },
  paid:               { label: "Paid",           ring: C.ink      },
  partially_refunded: { label: "Part. Refunded", ring: C.amber    },
  refunded:           { label: "Refunded",       ring: C.inkMid   },
};

/* ─── Audit trail event labels ────────────────────────────────────────────── */
export const EVENT_LABEL = {
  order_placed:           "Order placed",
  payment_received:       "Payment received",
  status_changed:         "Status updated",
  shipped:                "Shipped",
  delivered:              "Delivered",
  cancellation_requested: "Cancel requested",
  cancelled:              "Order cancelled",
  refund_issued:          "Refund issued",
  return_requested:       "Return requested",
  returned:               "Items returned",
};

/* ─── Refund methods ──────────────────────────────────────────────────────── */
export const REFUND_METHODS = [
  "Paystack",
  "Bank Transfer",
  "Cash",
  "Flutterwave",
  "Credit Note",
];

/* ─── Table column definitions ────────────────────────────────────────────── */
export const TABLE_COLS = [
  { label: "Order No.",    k: null        },
  { label: "Customer",     k: "customer"  },
  { label: "Total",        k: "total"     },
  { label: "Items",        k: null        },
  { label: "Date",         k: "date"      },
  { label: "Fulfillment",  k: null        },
  { label: "Payment",      k: null        },
  { label: "",             k: null        },
];

export const COLS_TEMPLATE = "160px 1fr 130px 60px 110px 120px 126px 76px";