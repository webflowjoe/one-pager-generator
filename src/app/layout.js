import "./globals.css";

export const metadata = {
  title: "Webflow One-Pager Generator",
  description: "Generate sales one-pagers for Webflow features",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
