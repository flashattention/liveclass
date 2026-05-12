import { cn } from "@/lib/utils";

export function InlineError({
	message,
	tone = "default",
}: {
	message?: string;
	tone?: "default" | "danger";
}) {
	if (!message) {
		return null;
	}

	return (
		<p
			className={cn(
				"mt-2 text-sm font-medium",
				tone === "danger" ? "text-red-500" : "text-red-400",
			)}
			role="alert"
			aria-live="polite"
		>
			{message}
		</p>
	);
}
