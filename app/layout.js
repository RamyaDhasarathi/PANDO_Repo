import { Plus_Jakarta_Sans } from "next/font/google";
import "@/styles/globals.css";
import TopNav from "@/components/TopNav";
import { AuthProvider } from "@/providers/AuthProvider";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

export const metadata = {
  title: "Hi Pando — Find your place in Dubai",
  description:
    "Discover apartments, villas, townhouses and commercial spaces for sale and rent across Dubai.",
  icons: {
    icon: "/pando-favicon.png",
    apple: "/pando-favicon.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={plusJakarta.variable}>
      <body>
        <AuthProvider>
          <TopNav />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
