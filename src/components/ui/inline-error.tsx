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
				"mt-2 text-sm",
				tone === "danger" ? "text-[#a11a1a]" : "text-[#b42318]",
			)}
		>
			{message}
		</p>
	);
}
