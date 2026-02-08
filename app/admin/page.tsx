"use client";

import { useEffect, useMemo, useState } from "react";

type Row = {
  id: string;
  createdAt: string;
  fullName: string;
  tripType: string;
  pickupAddress: string;
  destinationAddress: string;
  pickupDateTime: string;
  distanceMiles: number | null;
  partySize: number;
  paymentMethod: string;
  paymentSubmitted: boolean;
  paymentSubmittedAt: string | null;
  paymentConfirmed: boolean;
  paymentConfirmedAt: string | null;
};

const ADMIN_KEY_STORAGE = "next-mile-ride:adminKey";

export default function AdminPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Admin key (session-only)
  const [adminKey, setAdminKey] = useState<string>("");
  const [keySaved, setKeySaved] = useState(false);

  useEffect(() => {
    // Load saved key from sessionStorage
    try {
      const saved = sessionStorage.getItem(ADMIN_KEY_STORAGE) || "";
      if (saved) {
        setAdminKey(saved);
        setKeySaved(true);
      }
    } catch {
      // ignore
    }
  }, []);

  function saveKey() {
    try {
      sessionStorage.setItem(ADMIN_KEY_STORAGE, adminKey.trim());
      setKeySaved(true);
      alert("Admin key saved for this browser session.");
    } catch {
      alert("Unable to save key in this browser session.");
    }
  }

  function clearKey() {
    try {
      sessionStorage.removeItem(ADMIN_KEY_STORAGE);
    } catch {
      // ignore
    }
    setAdminKey("");
    setKeySaved(false);
    alert("Admin key cleared.");
  }

function authHeaders(): HeadersInit {
  const k = adminKey.trim();
  const headers: Record<string, string> = {};
  if (k) headers["x-admin-key"] = k;
  return headers;
}

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/requests", {
        cache: "no-store",
        headers: authHeaders(),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || "Failed to load requests");
        return;
      }
      setRows(data.rows || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function confirmPayment(id: string) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/requests/${id}/confirm-payment`, {
        method: "POST",
        headers: authHeaders(),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data?.error ? `${data.error}\n${data.details || ""}` : "Failed to confirm payment");
        return;
      }
      await load();
    } finally {
      setBusyId(null);
    }
  }

  const submittedCount = useMemo(() => rows.filter((r) => r.paymentSubmitted).length, [rows]);
  const confirmedCount = useMemo(() => rows.filter((r) => r.paymentConfirmed).length, [rows]);

  return (
    <main style={{ padding: 20, fontFamily: "system-ui" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <h1 style={{ margin: 0 }}>Admin Dashboard</h1>
        <p style={{ marginTop: 8, color: "#4b5563" }}>
          Review ride requests and confirm payments.
        </p>

        {/* Admin Key box */}
        <div style={{ ...card, marginTop: 14 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "flex-end" }}>
            <div style={{ flex: 1, minWidth: 260 }}>
              <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 800 }}>Admin Key (session only)</div>
              <input
                value={adminKey}
                onChange={(e) => {
                  setAdminKey(e.target.value);
                  setKeySaved(false);
                }}
                placeholder="Paste admin key (only needed if ADMIN_LOCAL_ONLY=false)"
                style={input}
              />
              <div style={{ fontSize: 12, color: "#6b7280", marginTop: 6, lineHeight: 1.4 }}>
                If admin is <b>local-only</b>, you can leave this blank. If remote access is enabled later,
                you’ll need the key to use admin APIs.
              </div>
            </div>

            <button onClick={saveKey} style={btn} disabled={!adminKey.trim()}>
              Save Key
            </button>
            <button onClick={clearKey} style={btn}>
              Clear
            </button>

            <div style={{ marginLeft: "auto", fontSize: 12, fontWeight: 900, color: keySaved ? "#047857" : "#6b7280" }}>
              {keySaved ? "Key saved for this session" : "No saved key"}
            </div>
          </div>
        </div>

        {/* Stats + Refresh */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 12 }}>
          <div style={card}>
            <div style={cardTitle}>Requests</div>
            <div style={cardValue}>{rows.length}</div>
          </div>
          <div style={card}>
            <div style={cardTitle}>Payment Submitted</div>
            <div style={cardValue}>{submittedCount}</div>
          </div>
          <div style={card}>
            <div style={cardTitle}>Payment Confirmed</div>
            <div style={cardValue}>{confirmedCount}</div>
          </div>

          <button onClick={load} style={btn} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {error && (
          <div
            style={{
              marginTop: 14,
              padding: 12,
              borderRadius: 12,
              background: "#fff1f2",
              color: "#9f1239",
              fontWeight: 800,
            }}
          >
            {error}
          </div>
        )}

        <div style={{ marginTop: 16, overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 980 }}>
            <thead>
              <tr>
                {["Created", "Name", "Trip", "Pickup → Destination", "Pickup Time", "Miles", "Party", "Payment", "Status", "Actions"].map(
                  (h) => (
                    <th key={h} style={th}>
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const status = r.paymentConfirmed ? "CONFIRMED" : r.paymentSubmitted ? "SUBMITTED" : "NOT SUBMITTED";

                return (
                  <tr key={r.id} style={{ borderTop: "1px solid #e5e7eb" }}>
                    <td style={td}>{new Date(r.createdAt).toLocaleString()}</td>
                    <td style={td}>
                      <div style={{ fontWeight: 800 }}>{r.fullName}</div>
                      <div style={{ fontSize: 12, color: "#6b7280" }}>ID: {r.id}</div>
                    </td>
                    <td style={td}>{r.tripType}</td>
                    <td style={td}>
                      <div style={{ fontSize: 13 }}>{r.pickupAddress}</div>
                      <div style={{ fontSize: 13, color: "#6b7280" }}>→ {r.destinationAddress}</div>
                    </td>
                    <td style={td}>{new Date(r.pickupDateTime).toLocaleString()}</td>
                    <td style={td}>{r.distanceMiles ?? "-"}</td>
                    <td style={td}>{r.partySize}</td>
                    <td style={td}>{r.paymentMethod}</td>
                    <td style={td}>
                      <span style={badge(status)}>{status}</span>

                      {r.paymentSubmittedAt && (
                        <div style={{ fontSize: 12, color: "#6b7280", marginTop: 6 }}>
                          Submitted: {new Date(r.paymentSubmittedAt).toLocaleString()}
                        </div>
                      )}
                      {r.paymentConfirmedAt && (
                        <div style={{ fontSize: 12, color: "#6b7280", marginTop: 6 }}>
                          Confirmed: {new Date(r.paymentConfirmedAt).toLocaleString()}
                        </div>
                      )}
                    </td>
                    <td style={td}>
                      <button
                        style={{ ...btnSmall, opacity: r.paymentConfirmed ? 0.55 : 1 }}
                        disabled={r.paymentConfirmed || busyId === r.id}
                        onClick={() => confirmPayment(r.id)}
                        title={r.paymentConfirmed ? "Already confirmed" : "Confirm payment"}
                      >
                        {busyId === r.id ? "Confirming..." : "Confirm Payment"}
                      </button>
                    </td>
                  </tr>
                );
              })}

              {rows.length === 0 && !loading && (
                <tr>
                  <td style={td} colSpan={10}>
                    No requests yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: 16, fontSize: 12, color: "#6b7280" }}>
          Tip: If remote admin APIs are enabled later, save the admin key here once per session to authorize actions.
        </div>
      </div>
    </main>
  );
}

const card: React.CSSProperties = {
  padding: 14,
  borderRadius: 14,
  border: "1px solid #e5e7eb",
  background: "#fff",
  minWidth: 160,
};

const cardTitle: React.CSSProperties = { fontSize: 12, color: "#6b7280", fontWeight: 800 };
const cardValue: React.CSSProperties = { fontSize: 24, fontWeight: 900, marginTop: 6 };

const input: React.CSSProperties = {
  width: "100%",
  padding: 12,
  marginTop: 6,
  borderRadius: 12,
  border: "1px solid #e5e7eb",
  background: "#f9fafb",
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
};

const btn: React.CSSProperties = {
  padding: "12px 14px",
  borderRadius: 14,
  border: "1px solid #e5e7eb",
  background: "#fff",
  fontWeight: 900,
  cursor: "pointer",
};

const btnSmall: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid #e5e7eb",
  background: "#fff",
  fontWeight: 900,
  cursor: "pointer",
};

const th: React.CSSProperties = {
  textAlign: "left",
  fontSize: 12,
  color: "#6b7280",
  padding: "10px 10px",
  borderBottom: "1px solid #e5e7eb",
  whiteSpace: "nowrap",
};

const td: React.CSSProperties = {
  padding: "10px 10px",
  verticalAlign: "top",
  fontSize: 13,
  color: "#111827",
};

function badge(status: string): React.CSSProperties {
  let bg = "#f3f4f6";
  let fg = "#111827";
  if (status === "SUBMITTED") {
    bg = "#eff6ff";
    fg = "#1d4ed8";
  }
  if (status === "CONFIRMED") {
    bg = "#ecfdf5";
    fg = "#047857";
  }
  return {
    display: "inline-block",
    padding: "6px 10px",
    borderRadius: 999,
    background: bg,
    color: fg,
    fontWeight: 900,
    fontSize: 12,
  };
}

