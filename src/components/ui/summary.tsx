import { cn } from "@/lib/utils";

export function SummaryItem({
	inverse,
	label,
	value,
}: {
	inverse?: boolean;
	label: string;
	value: string;
}) {
	return (
		<div>
			<p className="text-xs uppercase tracking-[0.16em] text-(--color-muted)">
				{label}
			</p>
			<p
				className={cn(
					"mt-1 text-sm leading-6 font-medium",
					inverse ? "text-white" : "text-foreground",
				)}
			>
				{value}
			</p>
		</div>
	);
}

export function SummarySection({
	children,
	onEdit,
	title,
}: {
	children: React.ReactNode;
	onEdit: () => void;
	title: string;
}) {
	return (
		<section className="rounded-xl border border-(--color-border) bg-(--color-panel-strong) p-5">
			<div className="flex items-center justify-between gap-3">
				<h3 className="text-lg font-semibold">{title}</h3>
				<button
					type="button"
					onClick={onEdit}
					className="text-sm font-semibold text-(--color-sea) underline-offset-4 hover:underline"
				>
					수정
				</button>
			</div>
			<div className="mt-4">{children}</div>
		</section>
	);
}
