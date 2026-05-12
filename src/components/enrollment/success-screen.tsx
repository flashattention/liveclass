import type { EnrollmentSuccess } from "@/lib/types";
import { formatDateRange } from "@/lib/utils";
import { SummaryItem } from "@/components/ui/summary";

interface SuccessScreenProps {
	success: EnrollmentSuccess;
	onReset: () => void;
}

export function SuccessScreen({ success, onReset }: SuccessScreenProps) {
	return (
		<main className="mx-auto flex w-full max-w-6xl flex-1 items-center px-4 py-10 sm:px-6 lg:px-8">
			<section className="card-surface mx-auto w-full max-w-3xl rounded-3xl border border-(--color-border) px-6 py-8 text-foreground sm:px-10 sm:py-12">
				<p className="text-sm font-semibold uppercase tracking-[0.28em] text-(--color-sea)">
					Enrollment confirmed
				</p>
				<h1 className="mt-4 font-(family-name:--font-display) text-4xl leading-tight sm:text-5xl">
					신청이 접수되었습니다.
				</h1>
				<p className="mt-4 text-base leading-7 text-(--color-muted)">
					신청 번호와 요약 정보를 확인해 주세요. 동일한 브라우저에서는
					새 신청을 다시 진행할 수 있습니다.
				</p>

				<div className="mt-8 grid gap-4 rounded-2xl border border-(--color-border) bg-(--color-panel-strong) p-5 sm:grid-cols-2">
					<SummaryItem
						label="신청 번호"
						value={success.enrollmentId}
					/>
					<SummaryItem
						label="상태"
						value={success.status === "confirmed" ? "확정" : "대기"}
					/>
					<SummaryItem label="강의" value={success.course.title} />
					<SummaryItem
						label="신청 유형"
						value={
							success.type === "personal"
								? "개인 신청"
								: "단체 신청"
						}
					/>
					<SummaryItem
						label="일정"
						value={formatDateRange(
							success.course.startDate,
							success.course.endDate,
						)}
					/>
					<SummaryItem
						label="신청자 이메일"
						value={success.applicant.email}
					/>
				</div>

				<button
					type="button"
					onClick={onReset}
					className="mt-8 rounded-xl bg-background px-5 py-3 text-sm font-semibold text-white hover:opacity-92"
				>
					새 신청 작성
				</button>
			</section>
		</main>
	);
}
