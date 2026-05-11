import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
	return clsx(inputs);
}

export function formatPrice(price: number) {
	return new Intl.NumberFormat("ko-KR", {
		style: "currency",
		currency: "KRW",
		maximumFractionDigits: 0,
	}).format(price);
}

export function formatDateRange(startDate: string, endDate: string) {
	const formatter = new Intl.DateTimeFormat("ko-KR", {
		month: "long",
		day: "numeric",
		weekday: "short",
		hour: "numeric",
		minute: "2-digit",
	});

	return `${formatter.format(new Date(startDate))} - ${formatter.format(new Date(endDate))}`;
}

export function formatPhoneNumber(value: string) {
	const digits = value.replace(/\D/g, "").slice(0, 11);

	if (digits.length < 4) return digits;
	if (digits.length < 8) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
	if (digits.length < 11)
		return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
	return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}
