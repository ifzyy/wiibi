export default function TabBar({ tabs, active, onChange }) {
  return (
    <div style={styles.tabBar}>
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          style={{
            ...styles.tab,
            ...(active === tab ? styles.tabActive : {}),
          }}
        >
          {tab}
          {active === tab && <span style={styles.underline} />}
        </button>
      ))}
    </div>
  );
}

const styles = {
  tabBar: {
    display: "flex",
    gap: 4,
    alignItems: "flex-end",
  },
  tab: {
    position: "relative",
    background: "none",
    border: "none",
    padding: "6px 12px",
    fontSize: 13,
    fontWeight: 500,
    color: "#999",
    cursor: "pointer",
    paddingBottom: 10,
  },
  tabActive: {
    color: "#111",
    fontWeight: 700,
  },
  underline: {
    position: "absolute",
    bottom: 0,
    left: 8,
    right: 8,
    height: 2,
    background: "#F5A623",
    borderRadius: 2,
    display: "block",
  },
};