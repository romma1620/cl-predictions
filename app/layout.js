import './globals.css';

export const metadata = {
  title: 'Champions League 2026 Predictions',
  description: 'Simple predictions app for Champions League 2026 bracket.'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
