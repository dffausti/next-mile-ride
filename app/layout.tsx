import Navbar from "./components/Navbar";

export const metadata = {
  title: "Next Mile Ride",
  description: "Ride requests for work commutes and tourism trips.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui" }}>
        <Navbar />
        {children}
      </body>
    </html>
  );
}

