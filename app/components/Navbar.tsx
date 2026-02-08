import Link from "next/link";

export default function Navbar() {
  const navWrap: React.CSSProperties = {
    position: "sticky",
    top: 0,
    zIndex: 50,
    backdropFilter: "blur(10px)",
    background: "rgba(15, 23, 42, 0.85)",
    borderBottom: "1px solid rgba(255,255,255,0.10)",
  };

  const inner: React.CSSProperties = {
    maxWidth: 980,
    margin: "0 auto",
    padding: "12px 18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  };

  const brand: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 10,
    color: "white",
    fontWeight: 900,
    letterSpacing: "-0.02em",
    textDecoration: "none",
  };

  const pill: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 700,
    padding: "6px 10px",
    borderRadius: 999,
    background: "rgba(59,130,246,0.15)",
    border: "1px solid rgba(59,130,246,0.25)",
    color: "rgba(255,255,255,0.90)",
  };

  const links: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 10,
  };

  const linkStyle: React.CSSProperties = {
    color: "rgba(255,255,255,0.90)",
    textDecoration: "none",
    fontWeight: 750,
    fontSize: 14,
    padding: "8px 10px",
    borderRadius: 10,
  };

  return (
    <div style={navWrap}>
      <div style={inner}>
        <Link href="/" style={brand}>
          <span style={{ fontSize: 18 }}>🚗</span>
          <span>Next Mile Ride</span>
          <span style={pill}>MVP</span>
        </Link>

        <div style={links}>
          <Link href="/request" style={linkStyle}>
            Request a Ride
          </Link>
          <Link href="/admin" style={linkStyle}>
            Admin
          </Link>
        </div>
      </div>
    </div>
  );
}

