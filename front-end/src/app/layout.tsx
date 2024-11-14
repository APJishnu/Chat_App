
import "./globals.css";
import { Metadata } from "next";


export const metadata: Metadata = {
  title: "Chat App",
  description: "Generated by create next app",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
       {children}
      </body>
    </html>
  );
}