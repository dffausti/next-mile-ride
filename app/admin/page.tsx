export default function AdminPage() {
  const wrap: React.CSSProperties = {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0b1220, #1e3a8a)",
    padding: 24,
    fontFamily: "system-ui",
    color: "white",
  };

  const panel: React.CSSProperties = {
    maxWidth: 900,
    margin: "20px auto",
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 16,
    padding: 18,
    backdropFilter: "blur(10px)",
  };

  return (
    <main style={wrap}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <h1 style={{ marginTop: 8, fontSize: 28, fontWeight: 900 }}>Admin</h1>
        <p style={{ opacity: 0.85 }}>
          This will be the dashboard to review ride requests, confirm payments, and update weekly service fees.
        </p>

        <div style={panel}>
          <h2 style={{ margin: 0, fontSize: 18 }}>Payment Info (Placeholder)</h2>
          <p style={{ opacity: 0.85, marginTop: 8 }}>
            Later we will let Admin update these values and show them on the Request form:
          </p>
          <ul style={{ lineHeight: 1.8 }}>
            <li>Zelle: Provided by Admin</li>
            <li>CashApp: Provided by Admin</li>
            <li>PayPal: Provided by Admin</li>
          </ul>
        </div>
      </div>
    </main>
  );
}

