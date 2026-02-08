"use client";

import { useEffect, useMemo, useState } from "react";

type TripType = "Work/Job" | "Tourism/Tour";
type PaymentMethod = "Zelle" | "CashApp" | "PayPal";

function yearsBetween(dobISO: string) {
  const dob = new Date(dobISO);
  const now = new Date();
  let years = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) years--;
  return years;
}

function hoursFromNow(dateTimeLocal: string) {
  const dt = new Date(dateTimeLocal);
  const diffMs = dt.getTime() - Date.now();
  return diffMs / (1000 * 60 * 60);
}

export default function RequestPage() {
  // Core
  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState("");
  const [tripType, setTripType] = useState<TripType>("Work/Job");
  const [pickupAddress, setPickupAddress] = useState("");
  const [destinationAddress, setDestinationAddress] = useState("");
  const [pickupDateTime, setPickupDateTime] = useState("");
  const [returnDateTime, setReturnDateTime] = useState("");
  const [partySize, setPartySize] = useState(1);

  // Verification uploads (MVP: filenames only)
  const [photoIdFile, setPhotoIdFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);

  // Payment + Acknowledgements
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Zelle");
  const [ackOnTime, setAckOnTime] = useState(false);
  const [ackPayment24h, setAckPayment24h] = useState(false);
  const [ackCancelFee, setAckCancelFee] = useState(false);

  // Distance
  const [distanceMiles, setDistanceMiles] = useState<number>(NaN);
  const [distanceLoading, setDistanceLoading] = useState(false);

  // After-save UI
  const [savedRequestId, setSavedRequestId] = useState<string | null>(null);
  const [paymentSubmitted, setPaymentSubmitted] = useState(false);

  const age = useMemo(() => (dob ? yearsBetween(dob) : null), [dob]);
  const hoursAhead = useMemo(
    () => (pickupDateTime ? hoursFromNow(pickupDateTime) : null),
    [pickupDateTime]
  );

  const paymentInfo = {
    Zelle: "Provided by Admin (set later)",
    CashApp: "Provided by Admin (set later)",
    PayPal: "Provided by Admin (set later)",
  } as const;

  const errors = useMemo(() => {
    const e: string[] = [];

    if (!fullName.trim()) e.push("Full name is required.");
    if (!dob) e.push("Date of birth is required.");
    if (age !== null && age < 21) e.push("Requester must be at least 21 years old.");

    if (!photoIdFile) e.push("Picture ID is required.");
    if (!selfieFile) e.push("Selfie is required for verification.");

    if (!pickupAddress.trim()) e.push("Pickup address is required.");
    if (!destinationAddress.trim()) e.push("Destination address is required.");
    if (!pickupDateTime) e.push("Pickup date/time is required.");

    if (hoursAhead !== null) {
      if (hoursAhead < 48) e.push("Requests must be submitted at least 48 hours in advance.");
      if (hoursAhead > 72) e.push("Requests must be submitted no more than 72 hours in advance.");
    }

    if (partySize < 1) e.push("Party size must be at least 1.");

    // Tourism rules
    if (tripType === "Tourism/Tour") {
      if (!Number.isFinite(distanceMiles)) e.push("Distance must be calculated for Tourism/Tour trips.");
      else if (distanceMiles < 25) e.push("Tourism/Tour trips must be 25+ miles from pickup location.");
    }

    // Acknowledgements
    if (!ackOnTime) e.push("You must acknowledge: be ready at least 5 minutes before pickup time.");
    if (!ackPayment24h) e.push("You must acknowledge: payment must be submitted and confirmed 24 hours prior.");
    if (!ackCancelFee) e.push("You must acknowledge: cancellation fee applies if cancelled < 6 hours.");

    return e;
  }, [
    fullName,
    dob,
    age,
    photoIdFile,
    selfieFile,
    pickupAddress,
    destinationAddress,
    pickupDateTime,
    hoursAhead,
    partySize,
    distanceMiles,
    tripType,
    ackOnTime,
    ackPayment24h,
    ackCancelFee,
  ]);

  async function calculateDistance() {
    if (!pickupAddress.trim() || !destinationAddress.trim()) return;

    setDistanceLoading(true);
    try {
      const res = await fetch("/api/distance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ origin: pickupAddress, destination: destinationAddress }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) return;

      setDistanceMiles(data.miles);
    } finally {
      setDistanceLoading(false);
    }
  }

  // Debounced auto-calc
  useEffect(() => {
    if (!pickupAddress.trim() || !destinationAddress.trim()) return;
    const t = setTimeout(() => {
      calculateDistance();
    }, 900);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickupAddress, destinationAddress]);

  async function submit() {
    // If there are errors, do nothing (button is disabled anyway)
    if (errors.length) return;

    const payload = {
      fullName,
      dob,
      tripType,
      pickupAddress,
      destinationAddress,
      pickupDateTime,
      returnDateTime: returnDateTime || null,
      partySize,
      distanceMiles: Number.isFinite(distanceMiles) ? distanceMiles : null,

      photoIdFileName: photoIdFile?.name ?? null,
      selfieFileName: selfieFile?.name ?? null,

      paymentMethod,
      ackOnTime,
      ackPayment24h,
      ackCancelFee,
    };

    const res = await fetch("/api/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert(data?.error || "Submit failed");
      return;
    }

    // IMPORTANT: this is what makes Payment Status + Request ID show
    if (!data?.id) {
      alert("Saved, but no request ID returned from /api/requests.");
      return;
    }

    setSavedRequestId(data.id);
    setPaymentSubmitted(false);
    alert(`Request saved! ID: ${data.id}`);
  }

  async function markPaymentSubmittedFn() {
    if (!savedRequestId) return;

    const res = await fetch(`/api/requests/${savedRequestId}/payment-submitted`, {
      method: "POST",
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert(data?.error || "Failed to mark payment submitted");
      return;
    }

    setPaymentSubmitted(true);
    alert("Payment marked as SUBMITTED. Admin will confirm once verified.");
  }

  // ---------- Styles ----------
  const colors = {
    bg: "#0b1220",
    panel: "#ffffff",
    panel2: "#f3f6ff",
    border: "#d6dbe7",
    text: "#0b1220",
    muted: "#5b6475",
    primary: "#3b82f6",
    primaryDark: "#1d4ed8",
    dangerBg: "#fff1f2",
    dangerText: "#9f1239",
    frameBorder: "rgba(255,255,255,0.12)",
  };

  const pageWrap: React.CSSProperties = {
    minHeight: "100vh",
    background: `radial-gradient(1200px 600px at 20% 0%, rgba(59,130,246,0.25), transparent 60%),
radial-gradient(900px 500px at 90% 10%, rgba(29,78,216,0.25), transparent 55%),
${colors.bg}`,
    padding: 24,
    fontFamily: "system-ui",
  };

  const container: React.CSSProperties = { maxWidth: 980, margin: "22px auto 40px" };

  const headerFrame: React.CSSProperties = {
    background: "linear-gradient(135deg, rgba(59,130,246,0.28), rgba(29,78,216,0.12))",
    border: `1px solid ${colors.frameBorder}`,
    borderRadius: 18,
    padding: 20,
    color: "white",
    boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
    backdropFilter: "blur(10px)",
  };

  const panel: React.CSSProperties = {
    marginTop: 18,
    background: colors.panel,
    borderRadius: 18,
    padding: 22,
    boxShadow: "0 18px 55px rgba(0,0,0,0.25)",
  };

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: 14,
  width: "100%",
};

const fullRow: React.CSSProperties = { gridColumn: "1 / -1" };

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 13,
  fontWeight: 800,
  color: "#1f2937",
};
const buttonRow: React.CSSProperties = {
  gridColumn: "1 / -1",
  display: "flex",
  flexWrap: "wrap",
  gap: 12,
  alignItems: "center",
  justifyContent: "stretch",
};

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: 12,
    marginTop: 6,
    borderRadius: 12,
    border: `1px solid ${colors.border}`,
    background: colors.panel2,
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
  };

  const card: React.CSSProperties = {
    padding: 14,
    borderRadius: 14,
    background: colors.panel2,
    border: `1px solid ${colors.border}`,
    fontSize: 14,
  };

  const checkboxRow: React.CSSProperties = {
    display: "flex",
    gap: 10,
    alignItems: "flex-start",
    padding: 12,
    borderRadius: 14,
    background: "#fff",
    border: `1px solid ${colors.border}`,
  };

  const errorBox: React.CSSProperties = {
    padding: 14,
    borderRadius: 14,
    background: colors.dangerBg,
    color: colors.dangerText,
    border: "1px solid rgba(159,18,57,0.22)",
    fontSize: 14,
  };

  const primaryButton = (disabled: boolean): React.CSSProperties => ({
    width: "100%",
    padding: 14,
    borderRadius: 14,
    background: disabled
      ? "#cbd5e1"
      : `linear-gradient(135deg, ${colors.primary}, ${colors.primaryDark})`,
    color: disabled ? "#475569" : "#fff",
    border: "none",
    fontSize: 16,
    fontWeight: 900,
    cursor: disabled ? "not-allowed" : "pointer",
    boxShadow: disabled ? "none" : "0 10px 30px rgba(59,130,246,0.35)",
  });

  const smallBtn: React.CSSProperties = {
    padding: "10px 12px",
    borderRadius: 12,
    background: "white",
    border: `1px solid ${colors.border}`,
    fontSize: 14,
    fontWeight: 800,
    cursor: "pointer",
  };

  const mutedSmall: React.CSSProperties = {
    fontSize: 12,
    color: colors.muted,
    marginTop: 6,
    lineHeight: 1.4,
  };

  return (
    <main style={pageWrap}>
      <div style={container}>
        <header style={headerFrame}>
          <h1 style={{ fontSize: 34, fontWeight: 900, margin: 0, letterSpacing: "-0.02em" }}>
            Next Mile Ride
          </h1>
          <p
            style={{
              marginTop: 8,
              marginBottom: 0,
              color: "rgba(255,255,255,0.85)",
              lineHeight: 1.5,
            }}
          >
            Work commutes and tourism trips. Tourism requires <b>25+ miles</b>. Requests must be{" "}
            <b>48–72 hours</b> ahead. Must be <b>21+</b>.
          </p>
        </header>

        <section style={panel}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: colors.text }}>Ride Request Form</h2>
          <p style={{ marginTop: 6, marginBottom: 16, color: colors.muted, lineHeight: 1.5 }}>
            Distance auto-calculates after pickup + destination. Upload Picture ID and Selfie for verification.
          </p>

          <div className="nm-grid" style={grid}>
            <div>
              <label style={labelStyle}>Full Name</label>
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>Date of Birth</label>
              <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} style={inputStyle} />
              {age !== null && (
                <div style={mutedSmall}>
                  Age: <b>{age}</b>
                </div>
              )}
            </div>

            <div className="nm-buttonRow" style={buttonRow}>
              <label style={labelStyle}>Trip Type</label>
              <select value={tripType} onChange={(e) => setTripType(e.target.value as TripType)} style={inputStyle}>
                <option>Work/Job</option>
                <option>Tourism/Tour</option>
              </select>
              <div style={mutedSmall}>Work/Job can be short distance. Tourism/Tour must be 25+ miles.</div>
            </div>

<div className="nm-buttonRow" style={buttonRow}>
              <label style={labelStyle}>Picture ID</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setPhotoIdFile(e.target.files?.[0] ?? null)}
                style={inputStyle}
              />
            </div>

<div className="nm-buttonRow" style={buttonRow}>
              <label style={labelStyle}>Selfie</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setSelfieFile(e.target.files?.[0] ?? null)}
                style={inputStyle}
              />
            </div>

<div className="nm-buttonRow" style={buttonRow}>
              <label style={labelStyle}>Pickup Address (Point A)</label>
              <input
                value={pickupAddress}
                onChange={(e) => {
                  setPickupAddress(e.target.value);
                  setDistanceMiles(NaN);
                }}
                placeholder="123 Main St, Raleigh, NC"
                style={inputStyle}
              />
            </div>

<div className="nm-buttonRow" style={buttonRow}>
              <label style={labelStyle}>Destination Address (Point B)</label>
              <input
                value={destinationAddress}
                onChange={(e) => {
                  setDestinationAddress(e.target.value);
                  setDistanceMiles(NaN);
                }}
                placeholder="Myrtle Beach, SC"
                style={inputStyle}
              />
            </div>

<div className="nm-buttonRow" style={buttonRow}>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <div style={{ ...card, flex: 1, minWidth: 240 }}>
                  <div style={{ fontWeight: 900, color: "#111827" }}>Distance</div>
                  <div style={{ marginTop: 6, color: "#374151" }}>
                    {distanceLoading
                      ? "Calculating..."
                      : Number.isFinite(distanceMiles)
                        ? `${distanceMiles} miles`
                        : "Enter both addresses to calculate"}
                  </div>

                  {tripType === "Tourism/Tour" && Number.isFinite(distanceMiles) && distanceMiles < 25 && (
                    <div style={{ marginTop: 8, color: colors.dangerText, fontWeight: 900 }}>
                      Tourism minimum is 25 miles.
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={calculateDistance}
                    disabled={distanceLoading}
                    style={{ ...smallBtn, marginTop: 10, opacity: distanceLoading ? 0.6 : 1 }}
                  >
                    Calculate now
                  </button>
                </div>

                <div style={{ ...card, flex: 1, minWidth: 240 }}>
                  <div style={{ fontWeight: 900, color: "#111827" }}>Service rules</div>
                  <div style={{ marginTop: 6, color: "#374151", lineHeight: 1.5 }}>
                    • Be ready <b>5 minutes early</b> for pickup.
                    <br />
                    • Payment must be <b>submitted & confirmed 24 hours</b> prior.
                    <br />
                    • Cancellation fee applies if cancelled <b>&lt; 6 hours</b>.
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label style={labelStyle}>Pickup Date & Time</label>
              <input
                type="datetime-local"
                value={pickupDateTime}
                onChange={(e) => setPickupDateTime(e.target.value)}
                style={inputStyle}
              />
              <div style={mutedSmall}>Arrive ready at least 5 minutes before the pickup time.</div>
            </div>

            <div>
              <label style={labelStyle}>Estimated Return (optional)</label>
              <input
                type="datetime-local"
                value={returnDateTime}
                onChange={(e) => setReturnDateTime(e.target.value)}
                style={inputStyle}
              />
            </div>

<div className="nm-buttonRow" style={buttonRow}>            
              <label style={labelStyle}>Party Size</label>
              <input
                type="number"
                min={1}
                value={partySize}
                onChange={(e) => setPartySize(parseInt(e.target.value || "1", 10))}
                style={inputStyle}
              />
            </div>

<div className="nm-buttonRow" style={buttonRow}>
              <label style={labelStyle}>Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                style={inputStyle}
              >
                <option>Zelle</option>
                <option>CashApp</option>
                <option>PayPal</option>
              </select>
              <div style={mutedSmall}>
                Payment info: <b>{paymentMethod}</b> — {paymentInfo[paymentMethod]}
              </div>
            </div>

            <div style={{ ...buttonRow, display: "grid", gap: 10 }}>
              <div style={checkboxRow}>
                <input
                  type="checkbox"
                  checked={ackOnTime}
                  onChange={(e) => setAckOnTime(e.target.checked)}
                  style={{ marginTop: 3 }}
                />
                <div>
                  <div style={{ fontWeight: 900 }}>On-time requirement</div>
                  <div style={mutedSmall}>
                    I will be ready at least <b>5 minutes</b> before the pickup time.
                  </div>
                </div>
              </div>

              <div style={checkboxRow}>
                <input
                  type="checkbox"
                  checked={ackPayment24h}
                  onChange={(e) => setAckPayment24h(e.target.checked)}
                  style={{ marginTop: 3 }}
                />
                <div>
                  <div style={{ fontWeight: 900 }}>Payment requirement</div>
                  <div style={mutedSmall}>
                    Payment must be submitted and confirmed <b>24 hours</b> prior to pickup.
                  </div>
                </div>
              </div>

              <div style={checkboxRow}>
                <input
                  type="checkbox"
                  checked={ackCancelFee}
                  onChange={(e) => setAckCancelFee(e.target.checked)}
                  style={{ marginTop: 3 }}
                />
                <div>
                  <div style={{ fontWeight: 900 }}>Cancellation fee</div>
                  <div style={mutedSmall}>
                    A cancellation fee applies if cancelled <b>less than 6 hours</b> before pickup.
                  </div>
                </div>
              </div>
            </div>

            {errors.length > 0 && (
              <div style={{ ...errorBox, ...fullRow }}>
                <strong>Please fix:</strong>
                <ul style={{ marginTop: 8, marginBottom: 0 }}>
                  {errors.map((msg) => (
                    <li key={msg}>{msg}</li>
                  ))}
                </ul>
              </div>
            )}

<div
  style={{
    width: "100%",
    display: "flex",
    justifyContent: "center",
    marginTop: 16,
  }}
>
  <button
    onClick={submit}
    disabled={errors.length > 0}
    style={{
      ...primaryButton(errors.length > 0),
      width: "100%",
      maxWidth: 360,
      padding: "14px 16px",
      whiteSpace: "normal",
      textAlign: "center",
    }}
  >
    Submit Ride Request
  </button>
</div>

            {savedRequestId && (
              <div style={{ ...card, ...fullRow }}>
                <div style={{ fontWeight: 900, marginBottom: 6 }}>Payment Status</div>

                <div style={{ color: "#374151" }}>
                  Request ID: <b>{savedRequestId}</b>
                </div>

                <div style={{ marginTop: 6, color: "#374151" }}>
                  Status:{" "}
                  <b>{paymentSubmitted ? "SUBMITTED (waiting for Admin confirmation)" : "NOT SUBMITTED"}</b>
                </div>

                <button
                  type="button"
                  onClick={markPaymentSubmittedFn}
                  disabled={paymentSubmitted}
                  style={{ ...smallBtn, marginTop: 10, opacity: paymentSubmitted ? 0.6 : 1 }}
                >
                  Mark Payment Submitted
                </button>

                <div style={{ marginTop: 8, fontSize: 12, color: "#6b7280", lineHeight: 1.4 }}>
                  Reminder: payment must be submitted and confirmed at least <b>24 hours</b> prior to pickup.
                </div>
              </div>
            )}
          </div>
        </section>

        <footer style={{ marginTop: 16, textAlign: "center", color: "rgba(255,255,255,0.75)", fontSize: 12 }}>
          © {new Date().getFullYear()} Next Mile Ride
        </footer>
      </div>
<style jsx global>{`
  /* Prevent accidental horizontal scrolling */
  html, body {
    max-width: 100%;
    overflow-x: hidden;
  }

  /* Portrait / small screens */
  @media (max-width: 520px) {
    .nm-grid {
      grid-template-columns: 1fr !important;
    }

    .nm-buttonRow {
      flex-direction: column !important;
      align-items: stretch !important;
    }

    .nm-buttonRow > button {
      width: 100% !important;
      max-width: 100% !important;
    }
  }
`}</style>
    
</main>
  );
}

