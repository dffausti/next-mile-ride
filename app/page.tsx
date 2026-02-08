export default function Home() {
  return (
    <main style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1 style={{ fontSize: 32, fontWeight: 800 }}>Next Mile Ride ✅</h1>
      <p style={{ marginTop: 8 }}>
        Local development server is running.
      </p>

      <ul style={{ marginTop: 16, lineHeight: 1.8 }}>
        <li>
          <a href="/request">Request a Ride</a>
        </li>
        <li>
          <a href="/admin">Admin</a>
        </li>
      </ul>
    </main>
  );
}
