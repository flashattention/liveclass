import { cn } from "@/lib/utils";

export function inputClass(hasError: boolean) {
	return cn(
		"w-full rounded-lg border bg-(--color-panel) px-4 py-3 outline-none",
		hasError
			? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/25"
			: "border-(--color-border) focus:border-(--color-sea) focus:field-ring",
	);
}
