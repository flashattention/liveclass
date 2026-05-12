import { useFormContext, useWatch } from "react-hook-form";
import type { Course } from "@/lib/types";
import type { ErrorResponse } from "@/lib/types";
import { cn, formatDateRange, formatPrice } from "@/lib/utils";
import { InlineError } from "@/components/ui/inline-error";
import { SummaryItem, SummarySection } from "@/components/ui/summary";
import { type EnrollmentDraftInput } from "@/lib/validation";

function getApiErrorMessage(error: ErrorResponse | null) {
	if (!error) return null;
	if (error.code === "COURSE_FULL")
		return "선택한 강의가 정원 마감되었습니다. 다른 강의를 선택해 주세요.";
	if (error.code === "DUPLICATE_ENROLLMENT")
		return "이미 동일한 이메일로 신청된 강의입니다. 다른 이메일로 다시 시도해 주세요.";
	if (error.code === "INVALID_INPUT") return error.message;
	return "신청 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";
}

interface ReviewStepProps {
	selectedCourse: Course | null;
	isPending: boolean;
	submitError: ErrorResponse | null;
	onPrev: () => void;
	onGoToStep: (step: number) => void;
	onSubmit: (event: React.FormEvent) => void;
}

export function ReviewStep({
	selectedCourse,
	isPending,
	submitError,
	onPrev,
	onGoToStep,
	onSubmit,
}: ReviewStepProps) {
	const form = useFormContext<EnrollmentDraftInput>();
	const { register, getValues } = form;
	const { errors, isSubmitting } = form.formState;

	const watchedType = useWatch<EnrollmentDraftInput, "type">({
		name: "type",
	});
	const watchedTerms = useWatch<EnrollmentDraftInput, "agreedToTerms">({
		name: "agreedToTerms",
	});

	return (
		<form className="space-y-6" onSubmit={onSubmit}>
			<div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
				<div>
					<p className="text-sm font-semibold uppercase tracking-[0.22em] text-(--color-sea)">
						Step 3
					</p>
					<h2 className="mt-2 text-3xl font-semibold">
						입력 내용을 확인하고 제출해 주세요.
					</h2>
				</div>
				<button
					type="button"
					onClick={onPrev}
					className="self-start rounded-lg border border-(--color-border) px-4 py-2 text-sm font-medium text-foreground hover:bg-(--color-sky)"
				>
					이전 단계
				</button>
			</div>

			<SummarySection title="강의 정보" onEdit={() => onGoToStep(1)}>
				{selectedCourse ? (
					<div className="grid gap-2 sm:grid-cols-2">
						<SummaryItem
							label="강의명"
							value={selectedCourse.title}
						/>
						<SummaryItem
							label="신청 유형"
							value={
								watchedType === "personal"
									? "개인 신청"
									: "단체 신청"
							}
						/>
						<SummaryItem
							label="일정"
							value={formatDateRange(
								selectedCourse.startDate,
								selectedCourse.endDate,
							)}
						/>
						<SummaryItem
							label="수강료"
							value={formatPrice(selectedCourse.price)}
						/>
					</div>
				) : (
					<p className="text-sm text-(--color-muted)">
						선택된 강의가 없습니다.
					</p>
				)}
			</SummarySection>

			<SummarySection title="신청자 정보" onEdit={() => onGoToStep(2)}>
				<div className="grid gap-2 sm:grid-cols-2">
					<SummaryItem
						label="이름"
						value={getValues("applicant.name")}
					/>
					<SummaryItem
						label="이메일"
						value={getValues("applicant.email")}
					/>
					<SummaryItem
						label="전화번호"
						value={getValues("applicant.phone")}
					/>
					<SummaryItem
						label="수강 동기"
						value={getValues("applicant.motivation") || "미입력"}
					/>
				</div>
			</SummarySection>

			{watchedType === "group" && (
				<SummarySection title="단체 정보" onEdit={() => onGoToStep(2)}>
					<div className="grid gap-2 sm:grid-cols-2">
						<SummaryItem
							label="단체명"
							value={getValues("group.organizationName")}
						/>
						<SummaryItem
							label="인원수"
							value={`${getValues("group.headCount")}명`}
						/>
						<SummaryItem
							label="담당자 연락처"
							value={getValues("group.contactPerson")}
						/>
					</div>
					<div className="mt-4 overflow-hidden rounded-xl border border-(--color-border)">
						<table className="min-w-full divide-y divide-(--color-border) text-sm">
							<thead className="bg-(--color-panel)/75 text-left">
								<tr>
									<th className="px-4 py-3 font-semibold">
										참가자
									</th>
									<th className="px-4 py-3 font-semibold">
										이메일
									</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-(--color-border) bg-(--color-panel)/55">
								{getValues("group.participants").map(
									(participant, index) => (
										<tr
											key={`${participant.email}-${index}`}
										>
											<td className="px-4 py-3">
												{participant.name}
											</td>
											<td className="px-4 py-3">
												{participant.email}
											</td>
										</tr>
									),
								)}
							</tbody>
						</table>
					</div>
				</SummarySection>
			)}

			<label
				className={cn(
					"flex items-start gap-3 rounded-xl border bg-(--color-panel-strong) p-4",
					errors.agreedToTerms
						? "border-red-500"
						: "border-(--color-border)",
				)}
			>
				<input
					type="checkbox"
					className="mt-1 h-4 w-4 border-red-500"
					{...register("agreedToTerms")}
				/>
				<span>
					<span className="block text-sm font-semibold">
						이용약관 및 개인정보 수집에 동의합니다.
					</span>
					<span className="mt-1 block text-sm leading-6 text-(--color-muted)">
						제출 이후에는 운영자가 확인하며, 서버 유효성 검증 결과에
						따라 대기 상태로 접수될 수 있습니다.
					</span>
				</span>
			</label>
			{errors.agreedToTerms?.message && (
				<InlineError message={errors.agreedToTerms.message} />
			)}

			{submitError && (
				<InlineError
					tone="danger"
					message={
						getApiErrorMessage(submitError) ??
						"오류가 발생했습니다."
					}
				/>
			)}

			<div className="flex items-center justify-between gap-4 rounded-xl border border-(--color-border) bg-(--color-panel-strong) p-5 text-foreground">
				<div>
					<p className="text-sm text-(--color-muted)">자동 저장</p>
					<p className="text-base font-semibold">
						{watchedTerms
							? "약관 동의 완료"
							: "초안은 localStorage에 자동 저장됩니다."}
					</p>
				</div>
				<button
					type="submit"
					disabled={isSubmitting || isPending}
					className="rounded-lg bg-(--color-coral) px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
				>
					{isPending ? "제출 중..." : "수강 신청 제출"}
				</button>
			</div>
		</form>
	);
}
