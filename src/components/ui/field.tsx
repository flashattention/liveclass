import { InlineError } from "./inline-error";

export function Field({
	children,
	error,
	label,
	required,
}: {
	children: React.ReactNode;
	error?: string;
	label: string;
	required?: boolean;
}) {
	return (
		<label className="block text-sm text-foreground">
			<span className="mb-2 flex items-center gap-1 font-semibold">
				{label}
				{required && <span className="text-(--color-coral)">*</span>}
			</span>
			{children}
			{error && <InlineError message={error} />}
		</label>
	);
}
