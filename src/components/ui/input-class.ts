import { cn } from "@/lib/utils";

export function inputClass(hasError: boolean) {
	return cn(
		"w-full rounded-lg border bg-(--color-panel) px-4 py-3 outline-none",
		hasError
			? "border-[#d92d20] focus:field-ring"
			: "border-(--color-border) focus:border-(--color-sea) focus:field-ring",
	);
}
