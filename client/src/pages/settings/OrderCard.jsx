import { Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import usePublicSettings from '../../hooks/usePublicSettings.js';

const OrderCard = ({ order }) => {
  const navigate = useNavigate();
  const settings = usePublicSettings();

  const statusConfig = {
    pending:    { label: 'Order Placed',       color: 'bg-amber-50 text-amber-500' },
    processing: { label: 'Ready for Shipment', color: 'bg-amber-50 text-amber-500' },
    shipped:    { label: 'Out for Delivery',   color: 'bg-amber-50 text-amber-500' },
    in_transit: { label: 'In Transit',         color: 'bg-amber-50 text-amber-500' },
    delivered:  { label: 'Delivered',          color: 'bg-green-50 text-green-500' },
    cancelled:  { label: 'Cancelled',          color: 'bg-red-50 text-red-500'     },
    failed:     { label: 'Failed',             color: 'bg-red-50 text-red-500'     },
  };

  const config =
    statusConfig[order.status] || {
      label: order.status,
      color: 'bg-gray-50 text-gray-500',
    };

  // Route: From = admin-set dispatch location (Settings), To = the order's own
  // shipping address. Street-level, not just city — most customers are in the
  // same city, so "city, state" made every order look identical.
  const from = settings.dispatch_location || 'Ojodu Berger, Lagos';
  const addr = order.shippingAddress ?? {};
  const to   = [addr.addressLine1, addr.city].filter(Boolean).join(', ')
            || [addr.city, addr.state].filter(Boolean).join(', ')
            || '—';

  const isCancelled = order.status === 'cancelled';

  return (
    <div
      onClick={() => navigate(`${order.id}`)}
      className="bg-white border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow relative cursor-pointer w-full"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="space-y-2 w-full">

          {/* Order ID */}
          <div className="flex items-center">
            <p className="text-[10px] font-bold text-gray-400 uppercase w-24">
              Order ID
            </p>
            <p className="text-sm font-black text-gray-900 whitespace-nowrap">
              {order.orderNumber || order.id}
            </p>
            {order.status === 'failed' && (
              <span className="text-red-500 text-xs ml-2">●</span>
            )}
          </div>

          {/* Estimated delivery — admin-editable; meaningless once cancelled */}
          {!isCancelled && (
            <div className="flex items-center">
              <p className="text-[10px] font-bold text-gray-400 uppercase w-24">
                Est. Delivery
              </p>
              <p className="text-sm font-bold text-gray-900">
                {order.expectedDelivery
                  ? new Date(order.expectedDelivery).toLocaleDateString('en-GB', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })
                  : <span className="text-gray-400 font-medium">To be confirmed</span>}
              </p>
            </div>
          )}

          {/* Status */}
          <div className="flex items-center">
            <p className="text-[10px] font-bold text-gray-400 uppercase w-24">
              Status
            </p>
            <span
              className={`px-3 py-1 rounded-md text-[10px] font-bold ${config.color}`}
            >
              {config.label}
            </span>
          </div>

        </div>
      </div>

      {/* Shipping Route */}
      <div className="mt-5">
        <p className="text-[10px] font-bold text-gray-400 uppercase mb-3">
          Shipping Route
        </p>

        <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between relative">

          {/* From */}
          <div className="z-10">
            <p className="text-[8px] font-bold text-gray-400 uppercase">
              From
            </p>
            <p className="text-[11px] font-black text-gray-900 truncate max-w-[120px]">
              {from}
            </p>
          </div>

          {/* Route line */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1/2 flex items-center">
            <div className="h-[1px] w-full border-t border-dashed border-gray-300 relative">
              <div className="absolute left-1/2 -top-2 -translate-x-1/2 bg-gray-50 px-1">
                <Package size={16} className="text-amber-400" />
              </div>
            </div>
          </div>

          {/* To */}
          <div className="text-right z-10">
            <p className="text-[8px] font-bold text-gray-400 uppercase">
              To
            </p>
            <p className="text-[11px] font-black text-gray-900 truncate max-w-[120px]">
              {to}
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default OrderCard;
