import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "INVITIX — Gérez. Invitez. Rassemblez.",
  description:
    "Plateforme de gestion d'événements et d'invitations professionnelle. Créez, gérez et contrôlez vos invitations en toute simplicité.",
  keywords: "événements, invitations, QR code, gestion, INVITIX",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🎉</text></svg>",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
