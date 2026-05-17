import { useState, useEffect } from "react";
import { fetchOrder } from "../../../utils/api.js";

export const useOrderDetail = (orderId) => {
  const [order,   setOrder]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    if (!orderId) { setOrder(null); return; }

    setLoading(true);
    setError(null);

    fetchOrder(orderId)
      .then(res => setOrder(res.data ?? res))
      .catch(e  => setError(e?.response?.data?.message ?? "Failed to load order."))
      .finally(() => setLoading(false));
  }, [orderId]);

  return { order, loading, error };
};