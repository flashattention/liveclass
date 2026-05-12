import type { Course } from "@/lib/types";
import { cn, formatDateRange } from "@/lib/utils";
import type { EnrollmentDraftInput } from "@/lib/validation";

export const stepLabels = [
	{
		id: 1,
		title: "강의 선택",
		description: "카테고리와 신청 유형을 정합니다.",
	},
	{
		id: 2,
		title: "수강생 정보",
		description: "개인 또는 단체 정보를 입력합니다.",
	},
	{
		id: 3,
		title: "확인 및 제출",
		description: "입력 내용을 검토하고 신청합니다.",
	},
] as const;

interface EnrollmentSidebarProps {
	step: number;
	isDirty: boolean;
	watchedType: EnrollmentDraftInput["type"];
	selectedCourse: Course | null;
}

export function EnrollmentSidebar({
	step,
	isDirty,
	watchedType,
	selectedCourse,
}: EnrollmentSidebarProps) {
	return (
		<aside className="card-surface rounded-3xl border border-(--color-border) p-6 lg:p-7 text-foreground">
			<p className="text-xs font-semibold uppercase tracking-[0.16em] text-(--color-sea)">
				LiveClass
			</p>
			<h1 className="mt-4 max-w-[12ch] text-4xl leading-tight sm:text-5xl">
				LIVE CLASS
			</h1>
			<p className="mt-4 max-w-[30ch] text-sm leading-7 text-(--color-muted)">
				관심 있는 강의를 고르고, 필요한 정보만 입력한 뒤 한 번에 접수할
				수 있습니다.
			</p>

			<div className="mt-8 grid grid-cols-2 gap-3">
				<div className="rounded-2xl border border-(--color-border) bg-(--color-panel-strong) p-4">
					<p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-(--color-muted)">
						작성 상태
					</p>
					<p className="mt-2 text-lg font-semibold text-foreground">
						{isDirty ? "작성 중" : "새 신청"}
					</p>
				</div>
				<div className="rounded-2xl border border-(--color-border) bg-(--color-panel-strong) p-4">
					<p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-(--color-muted)">
						신청 유형
					</p>
					<p className="mt-2 text-lg font-semibold text-foreground">
						{watchedType === "personal" ? "개인" : "단체"}
					</p>
				</div>
			</div>

			<ol className="mt-8 space-y-3">
				{stepLabels.map((item) => (
					<li
						key={item.id}
						className={cn(
							"rounded-2xl border px-4 py-4",
							step === item.id
								? "border-(--color-sea)/35 bg-(--color-sky)/45"
								: item.id < step
									? "border-(--color-border) bg-(--color-panel-strong)"
									: "border-(--color-border) bg-(--color-panel)",
						)}
					>
						<div className="flex items-center gap-3">
							<div
								className={cn(
									"flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold",
									step === item.id
										? "bg-(--color-sea) text-white"
										: item.id < step
											? "bg-(--color-sky) text-(--color-sea)"
											: "bg-(--color-panel-strong) text-(--color-muted)",
								)}
							>
								{item.id}
							</div>
							<div>
								<p className="font-semibold text-foreground">
									{item.title}
								</p>
								<p className="text-xs text-(--color-muted)">
									{item.description}
								</p>
							</div>
						</div>
					</li>
				))}
			</ol>

			<div className="mt-8 rounded-2xl border border-(--color-border) bg-(--color-panel-strong) p-4 text-sm text-foreground">
				<p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-(--color-muted)">
					현재 선택
				</p>
				<p className="mt-2 text-base font-semibold text-foreground">
					{selectedCourse?.title ?? "강의를 선택해 주세요"}
				</p>
				<p className="mt-2 leading-6 text-(--color-muted)">
					{selectedCourse
						? formatDateRange(
								selectedCourse.startDate,
								selectedCourse.endDate,
							)
						: "카테고리를 고른 뒤 원하는 수업을 선택하면 상세 정보가 표시됩니다."}
				</p>
			</div>
		</aside>
	);
}
