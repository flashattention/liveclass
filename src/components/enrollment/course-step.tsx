import { useFormContext, useWatch } from "react-hook-form";
import type { Course } from "@/lib/types";
import { formatDateRange, formatPrice, cn } from "@/lib/utils";
import { InlineError } from "@/components/ui/inline-error";
import { SummaryItem } from "@/components/ui/summary";
import { type EnrollmentDraftInput } from "@/lib/validation";

const categoryLabels: Record<string, string> = {
	all: "전체",
	development: "개발",
	design: "디자인",
	marketing: "마케팅",
	business: "비즈니스",
};

function getCourseBadge(course: Course) {
	const remaining = course.maxCapacity - course.currentEnrollment;
	if (remaining <= 0) {
		return { label: "마감", tone: "bg-(--color-coral) text-white" };
	}
	if (remaining <= 2) {
		return {
			label: `잔여 ${remaining}석`,
			tone: "bg-[#fff0b8] text-[#614500]",
		};
	}
	return {
		label: `잔여 ${remaining}석`,
		tone: "bg-(--color-mint) text-(--color-sea)",
	};
}

interface CourseStepProps {
	courses: Course[];
	isLoading: boolean;
	category: string;
	onCategoryChange: (category: string) => void;
	onRequestTypeChange: (type: EnrollmentDraftInput["type"]) => void;
	onNext: () => void;
}

export function CourseStep({
	courses,
	isLoading,
	category,
	onCategoryChange,
	onRequestTypeChange,
	onNext,
}: CourseStepProps) {
	const form = useFormContext<EnrollmentDraftInput>();
	const { register } = form;
	const { errors } = form.formState;

	const watchedCourseId = useWatch<EnrollmentDraftInput, "courseId">({
		name: "courseId",
	});
	const watchedType = useWatch<EnrollmentDraftInput, "type">({
		name: "type",
	});

	const selectedCourse =
		courses.find((c) => c.id === watchedCourseId) ?? null;

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
				<div>
					<p className="text-sm font-semibold uppercase tracking-[0.22em] text-(--color-sea)">
						Step 1
					</p>
					<h2 className="mt-2 text-3xl font-semibold">
						강의 및 신청 유형
					</h2>
				</div>
				<div className="flex flex-wrap gap-2 rounded-xl border border-(--color-border) bg-(--color-panel-strong) p-1.5">
					{Object.entries(categoryLabels).map(([value, label]) => (
						<button
							key={value}
							type="button"
							onClick={() => onCategoryChange(value)}
							className={cn(
								"rounded-lg border px-4 py-2 text-sm font-medium",
								category === value
									? "border-foreground bg-background text-white"
									: "border-transparent bg-transparent text-foreground hover:bg-(--color-panel)",
							)}
						>
							{label}
						</button>
					))}
				</div>
			</div>

			<div className="grid gap-4 lg:grid-cols-2">
				{isLoading &&
					Array.from({ length: 4 }).map((_, index) => (
						<div
							key={index}
							className="animate-pulse rounded-2xl border border-(--color-border) bg-(--color-panel-strong) p-5"
						>
							<div className="h-4 w-20 rounded bg-black/10" />
							<div className="mt-4 h-8 w-2/3 rounded bg-black/10" />
							<div className="mt-4 h-20 rounded bg-black/10" />
						</div>
					))}

				{!isLoading && courses.length === 0 && (
					<div className="rounded-3xl border border-dashed border-(--color-border) bg-(--color-panel)/60 p-6 text-sm text-(--color-muted) lg:col-span-2">
						선택한 카테고리에 등록 가능한 강의가 없습니다. 다른
						카테고리를 확인해 주세요.
					</div>
				)}

				{courses.map((course) => {
					const badge = getCourseBadge(course);
					const isSelected = watchedCourseId === course.id;
					const isClosed =
						course.currentEnrollment >= course.maxCapacity;

					return (
						<label
							key={course.id}
							className={cn(
								"relative flex cursor-pointer flex-col rounded-2xl border p-5",
								errors.courseId && !isSelected
									? "border-red-500"
									: "",
								isSelected
									? "border-white bg-(--color-mint)/35"
									: "border-(--color-border) bg-(--color-panel) hover:border-(--color-sea)/40",
								isClosed && "cursor-not-allowed opacity-58",
							)}
						>
							<input
								type="radio"
								value={course.id}
								className="sr-only"
								disabled={isClosed}
								{...register("courseId")}
							/>
							<div className="flex items-start justify-between gap-3">
								<div>
									<p className="text-xs font-semibold uppercase tracking-[0.2em] text-(--color-sea)">
										{categoryLabels[course.category]}
									</p>
									<h3 className="mt-2 text-xl font-semibold">
										{course.title}
									</h3>
								</div>
								<span
									className={cn(
										"rounded-full px-3 py-1 text-xs font-semibold",
										badge.tone,
									)}
								>
									{badge.label}
								</span>
							</div>
							<p className="mt-4 text-sm leading-6 text-(--color-muted)">
								{course.description}
							</p>
							<dl className="mt-5 grid gap-2 text-sm">
								<div className="flex justify-between gap-4">
									<dt className="text-(--color-muted)">
										일정
									</dt>
									<dd className="text-right font-medium">
										{formatDateRange(
											course.startDate,
											course.endDate,
										)}
									</dd>
								</div>
								<div className="flex justify-between gap-4">
									<dt className="text-(--color-muted)">
										강사
									</dt>
									<dd className="font-medium">
										{course.instructor}
									</dd>
								</div>
								<div className="flex justify-between gap-4">
									<dt className="text-(--color-muted)">
										수강료
									</dt>
									<dd className="font-medium">
										{formatPrice(course.price)}
									</dd>
								</div>
							</dl>
						</label>
					);
				})}
			</div>

			{selectedCourse && (
				<div className="overflow-hidden rounded-2xl border border-(--color-border) bg-(--color-panel-strong) p-5 text-foreground">
					<p className="text-xs font-semibold uppercase tracking-[0.16em] text-(--color-sea)">
						선택한 강의 요약
					</p>
					<div className="mt-3 grid gap-2 sm:grid-cols-2">
						<SummaryItem
							inverse
							label="강의명"
							value={selectedCourse.title}
						/>
						<SummaryItem
							inverse
							label="가격"
							value={formatPrice(selectedCourse.price)}
						/>
						<SummaryItem
							inverse
							label="일정"
							value={formatDateRange(
								selectedCourse.startDate,
								selectedCourse.endDate,
							)}
						/>
						<SummaryItem
							inverse
							label="신청 현황"
							value={`${selectedCourse.currentEnrollment}/${selectedCourse.maxCapacity}`}
						/>
					</div>
				</div>
			)}

			<div className="rounded-2xl border border-(--color-border) bg-(--color-panel-strong) p-5">
				<p className="text-sm font-semibold text-(--color-muted)">
					신청 유형
				</p>
				<div className="mt-3 grid gap-3 sm:grid-cols-2">
					{[
						{
							value: "personal" as const,
							title: "개인 신청",
							body: "본인 정보만 입력하고 바로 신청합니다.",
						},
						{
							value: "group" as const,
							title: "단체 신청",
							body: "참가자 명단과 담당자 연락처를 함께 제출합니다.",
						},
					].map((option) => (
						<button
							key={option.value}
							type="button"
							onClick={() => onRequestTypeChange(option.value)}
							className={cn(
								"rounded-xl border p-4 text-left",
								watchedType === option.value
									? "border-white bg-(--color-mint)/30"
									: "border-(--color-border) bg-(--color-panel) hover:border-(--color-sea)/40",
							)}
						>
							<p className="text-base font-semibold">
								{option.title}
							</p>
							<p className="mt-2 text-sm leading-6 text-(--color-muted)">
								{option.body}
							</p>
						</button>
					))}
				</div>
			</div>

			{errors.courseId && (
				<InlineError message={errors.courseId.message} />
			)}

			<div className="flex justify-end">
				<button
					type="button"
					onClick={onNext}
					className="rounded-xl bg-background px-5 py-3 text-sm font-semibold text-white hover:opacity-92"
				>
					다음 단계
				</button>
			</div>
		</div>
	);
}
