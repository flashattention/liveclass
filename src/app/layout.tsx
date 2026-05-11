import type { Metadata } from "next";
import { Fraunces, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const sans = Inter({
	variable: "--font-sans",
	subsets: ["latin"],
});

const serif = Fraunces({
	variable: "--font-display",
	subsets: ["latin"],
});

const mono = JetBrains_Mono({
	variable: "--font-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "LiveClass Enrollment",
	description: "Multi-step enrollment flow for online courses.",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html
			lang="ko"
			className={`${sans.variable} ${serif.variable} ${mono.variable} h-full antialiased`}
		>
			<body className="min-h-full flex flex-col">
				<Providers>{children}</Providers>
			</body>
		</html>
	);
}
