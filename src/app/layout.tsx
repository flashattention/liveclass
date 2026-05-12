import type { Metadata } from "next";
import {
	IBM_Plex_Sans_KR,
	JetBrains_Mono,
	Noto_Serif_KR,
} from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const sans = IBM_Plex_Sans_KR({
	variable: "--font-sans",
	weight: ["300", "400", "500", "600", "700"],
	subsets: ["latin"],
});

const serif = Noto_Serif_KR({
	variable: "--font-display",
	weight: ["500", "700"],
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
