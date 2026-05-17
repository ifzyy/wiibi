import { StatCard } from "./ui.jsx";
import { fmt } from "../utils/format.js";
const StatsRow = ({ stats, totalOrders, refundCount, loading }) => {
  console.log(stats);

  return (
    <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
      <StatCard
        label="Gross Revenue"
        value={fmt(stats.revenue)}
        sub={`${totalOrders} total orders`}
        primary
        loading={loading}
      />
      <StatCard
        label="Total Refunded"
        value={fmt(stats.refunded)}
        sub={`${refundCount} order${refundCount !== 1 ? "s" : ""}`}
        loading={loading}
      />
      <StatCard
        label="Processing"
        value={stats.processing}
        sub="Awaiting dispatch"
        loading={loading}
      />
      <StatCard
        label="Unpaid"
        value={stats.unpaid}
        sub="Awaiting payment"
        loading={loading}
      />
      <StatCard
        label="Cancelled"
        value={stats.cancelled}
        sub="This period"
        loading={loading}
      />
    </div>
  );
};
export default StatsRow;