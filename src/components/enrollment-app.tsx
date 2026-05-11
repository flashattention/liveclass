"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import {
	FormProvider,
	useFieldArray,
	useForm,
	useWatch,
} from "react-hook-form";
import type {
	Course,
	EnrollmentResponse,
	EnrollmentSuccess,
	ErrorResponse,
} from "@/lib/types";
import { fetchCourses, submitEnrollment } from "@/lib/api";
import {
	cn,
	formatDateRange,
	formatPhoneNumber,
	formatPrice,
} from "@/lib/utils";
import {
	buildParticipantList,
	defaultEnrollmentDraft,
	enrollmentDraftSchema,
	submitSchema,
	type EnrollmentDraftInput,
} from "@/lib/validation";
import { useEnrollmentFlowStore } from "@/store/enrollment-flow-store";

const STORAGE_KEY = "liveclass-enrollment-draft";

const stepLabels = [
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

function getApiErrorMessage(error: ErrorResponse | null) {
	if (!error) return null;

	if (error.code === "COURSE_FULL") {
		return "선택한 강의가 정원 마감되었습니다. 다른 강의를 선택해 주세요.";
	}

	if (error.code === "DUPLICATE_ENROLLMENT") {
		return "이미 동일한 이메일로 신청된 강의입니다. 다른 이메일로 다시 시도해 주세요.";
	}

	if (error.code === "INVALID_INPUT") {
		return error.message;
	}

	return "신청 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";
}

export function EnrollmentApp() {
	const [success, setSuccess] = useState<EnrollmentSuccess | null>(null);
	const [submitError, setSubmitError] = useState<ErrorResponse | null>(null);
	const [groupSwitchConfirmOpen, setGroupSwitchConfirmOpen] = useState(false);
	const pendingTypeRef = useRef<EnrollmentDraftInput["type"] | null>(null);
	const step = useEnrollmentFlowStore((state) => state.step);
	const category = useEnrollmentFlowStore((state) => state.category);
	const setStep = useEnrollmentFlowStore((state) => state.setStep);
	const nextStep = useEnrollmentFlowStore((state) => state.nextStep);
	const prevStep = useEnrollmentFlowStore((state) => state.prevStep);
	const setCategory = useEnrollmentFlowStore((state) => state.setCategory);
	const setDirtyDraft = useEnrollmentFlowStore(
		(state) => state.setDirtyDraft,
	);
	const resetFlow = useEnrollmentFlowStore((state) => state.resetFlow);

	const methods = useForm<EnrollmentDraftInput>({
		resolver: zodResolver(enrollmentDraftSchema),
		mode: "onBlur",
		defaultValues: defaultEnrollmentDraft,
	});

	const {
		control,
		formState: { errors, isDirty, isSubmitting },
		getValues,
		handleSubmit,
		register,
		reset,
		setFocus,
		setValue,
		trigger,
	} = methods;

	const draftValues = useWatch({ control });
	const watchedType = useWatch({ control, name: "type" });
	const watchedCourseId = useWatch({ control, name: "courseId" });
	const watchedHeadCount = useWatch({ control, name: "group.headCount" });
	const watchedTerms = useWatch({ control, name: "agreedToTerms" });

	const participantsFieldArray = useFieldArray({
		control,
		name: "group.participants",
	});

	const coursesQuery = useQuery({
		queryKey: ["courses", category],
		queryFn: () => fetchCourses(category),
	});

	const allCourses = useMemo(
		() => coursesQuery.data?.courses ?? [],
		[coursesQuery.data?.courses],
	);
	const selectedCourse =
		allCourses.find((course) => course.id === watchedCourseId) ?? null;

	const mutation = useMutation<
		EnrollmentResponse,
		ErrorResponse,
		EnrollmentDraftInput
	>({
		mutationFn: submitEnrollment,
		onSuccess: (result) => {
			const snapshot = getValues();
			if (!selectedCourse) {
				return;
			}

			setSuccess({
				...result,
				course: selectedCourse,
				type: snapshot.type,
				applicant: snapshot.applicant,
				group: snapshot.type === "group" ? snapshot.group : undefined,
			});
			localStorage.removeItem(STORAGE_KEY);
			reset(defaultEnrollmentDraft);
			resetFlow();
			setSubmitError(null);
			setDirtyDraft(false);
		},
		onError: (error) => {
			setSubmitError(error);
		},
	});

	useEffect(() => {
		const saved = window.localStorage.getItem(STORAGE_KEY);
		if (!saved) {
			return;
		}

		try {
			const parsed = JSON.parse(saved) as EnrollmentDraftInput;
			reset(parsed);
			setDirtyDraft(true);
		} catch {
			window.localStorage.removeItem(STORAGE_KEY);
		}
	}, [reset, setDirtyDraft]);

	useEffect(() => {
		if (!draftValues) {
			return;
		}

		window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draftValues));
	}, [draftValues]);

	useEffect(() => {
		setDirtyDraft(isDirty);
	}, [isDirty, setDirtyDraft]);

	useEffect(() => {
		if (watchedType !== "group") {
			return;
		}

		const nextCount = Number(watchedHeadCount) || 2;
		const current = getValues("group.participants");
		if (current.length === nextCount) {
			return;
		}

		participantsFieldArray.replace(
			Array.from(
				{ length: nextCount },
				(_, index) => current[index] ?? { name: "", email: "" },
			),
		);
	}, [getValues, participantsFieldArray, watchedHeadCount, watchedType]);

	useEffect(() => {
		const handleBeforeUnload = (event: BeforeUnloadEvent) => {
			if (!isDirty || success) {
				return;
			}
			event.preventDefault();
			event.returnValue = "";
		};

		window.addEventListener("beforeunload", handleBeforeUnload);
		return () =>
			window.removeEventListener("beforeunload", handleBeforeUnload);
	}, [isDirty, success]);

	useEffect(() => {
		let rafId = 0;
		let lastUpdate = 0;
		let scrollTimeout: NodeJS.Timeout;
		const THROTTLE_MS = 16; // ~60fps
		const root = document.documentElement;

		const updatePointerVars = (event: PointerEvent) => {
			const now = performance.now();
			if (now - lastUpdate < THROTTLE_MS) {
				return;
			}
			lastUpdate = now;

			const x = event.clientX;
			const y = event.clientY;

			if (rafId) {
				cancelAnimationFrame(rafId);
			}

			rafId = requestAnimationFrame(() => {
				root.style.setProperty("--mx", `${x}px`);
				root.style.setProperty("--my", `${y}px`);
			});
		};

		const handleScroll = () => {
			// 스크롤 중에는 레이저 비활성화
			root.style.setProperty("--laser-opacity", "0");

			if (scrollTimeout) {
				clearTimeout(scrollTimeout);
			}

			scrollTimeout = setTimeout(() => {
				// 스크롤 완료 후 레이저 복구
				root.style.setProperty("--laser-opacity", "1");
			}, 150);
		};

		window.addEventListener("pointermove", updatePointerVars, {
			passive: true,
		});
		window.addEventListener("scroll", handleScroll, { passive: true });

		return () => {
			window.removeEventListener("pointermove", updatePointerVars);
			window.removeEventListener("scroll", handleScroll);
			if (rafId) {
				cancelAnimationFrame(rafId);
			}
			if (scrollTimeout) {
				clearTimeout(scrollTimeout);
			}
		};
	}, []);

	const goToApplicantStep = async () => {
		const isValid = await trigger(["courseId", "type"]);
		if (!isValid) {
			if (errors.courseId) {
				setFocus("courseId");
			}
			return;
		}
		nextStep();
	};

	const goToReviewStep = async () => {
		const baseFields = [
			"applicant.name",
			"applicant.email",
			"applicant.phone",
			"applicant.motivation",
		] as const;
		const groupFields = [
			"group.organizationName",
			"group.headCount",
			"group.participants",
			"group.contactPerson",
		] as const;

		const isValid = await trigger(
			watchedType === "group"
				? [...baseFields, ...groupFields]
				: baseFields,
		);
		if (!isValid) {
			setFocus(
				watchedType === "group" && errors.group?.organizationName
					? "group.organizationName"
					: errors.applicant?.name
						? "applicant.name"
						: errors.applicant?.email
							? "applicant.email"
							: "applicant.phone",
			);
			return;
		}
		nextStep();
	};

	const onSubmit = handleSubmit(async (values) => {
		const parsed = submitSchema.safeParse(values);
		if (!parsed.success) {
			const firstIssue = parsed.error.issues[0];
			if (firstIssue?.path.join(".") === "agreedToTerms") {
				setFocus("agreedToTerms");
			}
			return;
		}

		await mutation.mutateAsync(values);
	});

	const requestTypeChange = (nextType: EnrollmentDraftInput["type"]) => {
		if (nextType === watchedType) {
			return;
		}

		if (watchedType === "group" && nextType === "personal") {
			const currentGroup = getValues("group");
			const hasGroupInput =
				currentGroup.organizationName.trim() ||
				currentGroup.contactPerson.trim() ||
				currentGroup.participants.some(
					(participant) =>
						participant.name.trim() || participant.email.trim(),
				);

			if (hasGroupInput) {
				pendingTypeRef.current = nextType;
				setGroupSwitchConfirmOpen(true);
				return;
			}
		}

		setValue("type", nextType, { shouldDirty: true, shouldValidate: true });
	};

	const confirmGroupReset = () => {
		setValue("type", "personal", {
			shouldDirty: true,
			shouldValidate: true,
		});
		setValue(
			"group",
			{
				organizationName: "",
				headCount: 2,
				participants: buildParticipantList(2),
				contactPerson: "",
			},
			{ shouldDirty: true },
		);
		setGroupSwitchConfirmOpen(false);
		pendingTypeRef.current = null;
	};

	const cancelGroupReset = () => {
		setGroupSwitchConfirmOpen(false);
		pendingTypeRef.current = null;
	};

	if (success) {
		return (
			<main className="mx-auto flex w-full max-w-6xl flex-1 items-center px-4 py-10 sm:px-6 lg:px-8">
				<section className="card-surface mx-auto w-full max-w-3xl rounded-3xl border border-(--color-border) px-6 py-8 text-foreground sm:px-10 sm:py-12">
					<p className="text-sm font-semibold uppercase tracking-[0.28em] text-(--color-sea)">
						Enrollment confirmed
					</p>
					<h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl leading-tight sm:text-5xl">
						신청이 접수되었습니다.
					</h1>
					<p className="mt-4 text-base leading-7 text-(--color-muted)">
						신청 번호와 요약 정보를 확인해 주세요. 동일한
						브라우저에서는 새 신청을 다시 진행할 수 있습니다.
					</p>

					<div className="mt-8 grid gap-4 rounded-2xl border border-(--color-border) bg-(--color-panel-strong) p-5 sm:grid-cols-2">
						<SummaryItem
							label="신청 번호"
							value={success.enrollmentId}
						/>
						<SummaryItem
							label="상태"
							value={
								success.status === "confirmed" ? "확정" : "대기"
							}
						/>
						<SummaryItem
							label="강의"
							value={success.course.title}
						/>
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
						onClick={() => setSuccess(null)}
						className="mt-8 rounded-xl bg-background px-5 py-3 text-sm font-semibold text-white hover:opacity-92"
					>
						새 신청 작성
					</button>
				</section>
			</main>
		);
	}

	return (
		<FormProvider {...methods}>
			<main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
				<section className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-8">
					<aside className="card-surface rounded-3xl border border-(--color-border) p-6 lg:p-7 text-foreground">
						<p className="text-xs font-semibold uppercase tracking-[0.16em] text-(--color-sea)">
							LiveClass
						</p>
						<h1 className="mt-4 max-w-[12ch] font-[family-name:var(--font-display)] text-4xl leading-tight sm:text-5xl">
							LiveClass
						</h1>
						<p className="mt-4 max-w-[30ch] text-sm leading-7 text-(--color-muted)">
							관심 있는 강의를 고르고, 필요한 정보만 입력한 뒤 한
							번에 접수할 수 있습니다.
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
									{watchedType === "personal"
										? "개인"
										: "단체"}
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
								{selectedCourse?.title ??
									"강의를 선택해 주세요"}
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

					<section className="card-surface min-h-[720px] rounded-3xl border border-white/12 bg-[linear-gradient(180deg,#050505_0%,#000000_100%)] px-5 py-6 text-foreground sm:px-8 sm:py-8">
						<div className="step-enter">
							{step === 1 && (
								<div className="space-y-6">
									<div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
										<div>
											<p className="text-sm font-semibold uppercase tracking-[0.22em] text-(--color-sea)">
												Step 1
											</p>
											<h2 className="mt-2 text-3xl font-semibold">
												강의와 신청 유형을 선택해
												주세요.
											</h2>
										</div>
										<div className="flex flex-wrap gap-2 rounded-xl border border-(--color-border) bg-(--color-panel-strong) p-1.5">
											{Object.entries(categoryLabels).map(
												([value, label]) => (
													<button
														key={value}
														type="button"
														onClick={() =>
															setCategory(value)
														}
														className={cn(
															"rounded-lg border px-4 py-2 text-sm font-medium",
															category === value
																? "border-[var(--color-ink)] bg-background text-white"
																: "border-transparent bg-transparent text-foreground hover:bg-(--color-panel)",
														)}
													>
														{label}
													</button>
												),
											)}
										</div>
									</div>

									<div className="grid gap-4 lg:grid-cols-2">
										{coursesQuery.isLoading &&
											Array.from({ length: 4 }).map(
												(_, index) => (
													<div
														key={index}
														className="animate-pulse rounded-2xl border border-(--color-border) bg-(--color-panel-strong) p-5"
													>
														<div className="h-4 w-20 rounded bg-black/10" />
														<div className="mt-4 h-8 w-2/3 rounded bg-black/10" />
														<div className="mt-4 h-20 rounded bg-black/10" />
													</div>
												),
											)}

										{!coursesQuery.isLoading &&
											allCourses.length === 0 && (
												<div className="rounded-[1.5rem] border border-dashed border-(--color-border) bg-(--color-panel)/60 p-6 text-sm text-(--color-muted) lg:col-span-2">
													선택한 카테고리에 등록
													가능한 강의가 없습니다. 다른
													카테고리를 확인해 주세요.
												</div>
											)}

										{allCourses.map((course) => {
											const badge =
												getCourseBadge(course);
											const isSelected =
												watchedCourseId === course.id;
											const isClosed =
												course.currentEnrollment >=
												course.maxCapacity;

											return (
												<label
													key={course.id}
													className={cn(
														"relative flex cursor-pointer flex-col rounded-2xl border p-5",
														isSelected
															? "border-[var(--color-sea)] bg-(--color-mint)/35"
															: "border-(--color-border) bg-(--color-panel) hover:border-[var(--color-sea)]/40",
														isClosed &&
															"cursor-not-allowed opacity-58",
													)}
												>
													<input
														type="radio"
														value={course.id}
														className="sr-only"
														disabled={isClosed}
														{...register(
															"courseId",
														)}
													/>
													<div className="flex items-start justify-between gap-3">
														<div>
															<p className="text-xs font-semibold uppercase tracking-[0.2em] text-(--color-sea)">
																{
																	categoryLabels[
																		course
																			.category
																	]
																}
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
																{
																	course.instructor
																}
															</dd>
														</div>
														<div className="flex justify-between gap-4">
															<dt className="text-(--color-muted)">
																수강료
															</dt>
															<dd className="font-medium">
																{formatPrice(
																	course.price,
																)}
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
													value={formatPrice(
														selectedCourse.price,
													)}
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
													value: "personal",
													title: "개인 신청",
													body: "본인 정보만 입력하고 바로 신청합니다.",
												},
												{
													value: "group",
													title: "단체 신청",
													body: "참가자 명단과 담당자 연락처를 함께 제출합니다.",
												},
											].map((option) => (
												<button
													key={option.value}
													type="button"
													onClick={() =>
														requestTypeChange(
															option.value as EnrollmentDraftInput["type"],
														)
													}
													className={cn(
														"rounded-xl border p-4 text-left",
														watchedType ===
															option.value
															? "border-[var(--color-sea)] bg-(--color-mint)/30"
															: "border-(--color-border) bg-(--color-panel) hover:border-[var(--color-sea)]/40",
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
										<InlineError
											message={errors.courseId.message}
										/>
									)}

									<div className="flex justify-end">
										<button
											type="button"
											onClick={() =>
												void goToApplicantStep()
											}
											className="rounded-xl bg-background px-5 py-3 text-sm font-semibold text-white hover:opacity-92"
										>
											다음 단계
										</button>
									</div>
								</div>
							)}

							{step === 2 && (
								<div className="space-y-6">
									<div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
										<div>
											<p className="text-sm font-semibold uppercase tracking-[0.22em] text-(--color-sea)">
												Step 2
											</p>
											<h2 className="mt-2 text-3xl font-semibold">
												수강생 정보를 입력해 주세요.
											</h2>
										</div>
										<button
											type="button"
											onClick={prevStep}
											className="self-start rounded-lg border border-(--color-border) px-4 py-2 text-sm font-medium text-foreground hover:bg-(--color-sky)"
										>
											이전 단계
										</button>
									</div>

									<div className="grid gap-4 sm:grid-cols-2">
										<Field
											label="이름"
											required
											error={
												errors.applicant?.name?.message
											}
										>
											<input
												className={inputClass(
													Boolean(
														errors.applicant?.name,
													),
												)}
												{...register("applicant.name")}
											/>
										</Field>
										<Field
											label="이메일"
											required
											error={
												errors.applicant?.email?.message
											}
										>
											<input
												className={inputClass(
													Boolean(
														errors.applicant?.email,
													),
												)}
												{...register("applicant.email")}
											/>
										</Field>
										<Field
											label="전화번호"
											required
											error={
												errors.applicant?.phone?.message
											}
										>
											<input
												className={inputClass(
													Boolean(
														errors.applicant?.phone,
													),
												)}
												placeholder="010-1234-5678"
												{...register(
													"applicant.phone",
													{
														onChange: (event) => {
															event.target.value =
																formatPhoneNumber(
																	event.target
																		.value,
																);
														},
													},
												)}
											/>
										</Field>
										<div className="sm:col-span-2">
											<Field
												label="수강 동기"
												error={
													errors.applicant?.motivation
														?.message
												}
											>
												<textarea
													rows={5}
													maxLength={300}
													className={inputClass(
														Boolean(
															errors.applicant
																?.motivation,
														),
													)}
													{...register(
														"applicant.motivation",
													)}
												/>
											</Field>
										</div>
									</div>

									{watchedType === "group" && (
										<div className="space-y-4 rounded-2xl border border-(--color-sea)/20 bg-(--color-mint)/20 p-5">
											<div>
												<p className="text-sm font-semibold uppercase tracking-[0.22em] text-(--color-sea)">
													Group details
												</p>
												<h3 className="mt-2 text-2xl font-semibold">
													단체 신청 정보
												</h3>
											</div>

											<div className="grid gap-4 sm:grid-cols-2">
												<Field
													label="단체명"
													required
													error={
														errors.group
															?.organizationName
															?.message
													}
												>
													<input
														className={inputClass(
															Boolean(
																errors.group
																	?.organizationName,
															),
														)}
														{...register(
															"group.organizationName",
														)}
													/>
												</Field>
												<Field
													label="신청 인원수"
													required
													error={
														errors.group?.headCount
															?.message
													}
												>
													<select
														className={inputClass(
															Boolean(
																errors.group
																	?.headCount,
															),
														)}
														{...register(
															"group.headCount",
															{
																valueAsNumber: true,
															},
														)}
													>
														{Array.from(
															{ length: 9 },
															(_, index) =>
																index + 2,
														).map((count) => (
															<option
																key={count}
																value={count}
															>
																{count}명
															</option>
														))}
													</select>
												</Field>
												<Field
													label="담당자 연락처"
													required
													error={
														errors.group
															?.contactPerson
															?.message
													}
												>
													<input
														className={inputClass(
															Boolean(
																errors.group
																	?.contactPerson,
															),
														)}
														placeholder="010-1234-5678"
														{...register(
															"group.contactPerson",
															{
																onChange: (
																	event,
																) => {
																	event.target.value =
																		formatPhoneNumber(
																			event
																				.target
																				.value,
																		);
																},
															},
														)}
													/>
												</Field>
											</div>

											<div>
												<div className="mb-3 flex items-center justify-between gap-3">
													<p className="text-sm font-semibold">
														참가자 명단
													</p>
													<p className="text-xs text-(--color-muted)">
														참가자 이메일은 중복될
														수 없습니다.
													</p>
												</div>
												<div className="space-y-3">
													{participantsFieldArray.fields.map(
														(field, index) => (
															<div
																key={field.id}
																className="grid gap-3 rounded-xl border border-(--color-border) bg-(--color-panel) p-4 sm:grid-cols-2"
															>
																<Field
																	label={`참가자 ${index + 1} 이름`}
																	required
																	error={
																		errors
																			.group
																			?.participants?.[
																			index
																		]?.name
																			?.message
																	}
																>
																	<input
																		className={inputClass(
																			Boolean(
																				errors
																					.group
																					?.participants?.[
																					index
																				]
																					?.name,
																			),
																		)}
																		{...register(
																			`group.participants.${index}.name`,
																		)}
																	/>
																</Field>
																<Field
																	label={`참가자 ${index + 1} 이메일`}
																	required
																	error={
																		errors
																			.group
																			?.participants?.[
																			index
																		]?.email
																			?.message
																	}
																>
																	<input
																		className={inputClass(
																			Boolean(
																				errors
																					.group
																					?.participants?.[
																					index
																				]
																					?.email,
																			),
																		)}
																		{...register(
																			`group.participants.${index}.email`,
																		)}
																	/>
																</Field>
															</div>
														),
													)}
												</div>
												{typeof errors.group
													?.participants?.message ===
													"string" && (
													<InlineError
														message={
															errors.group
																.participants
																.message
														}
													/>
												)}
											</div>
										</div>
									)}

									<div className="flex justify-end gap-3">
										<button
											type="button"
											onClick={prevStep}
											className="rounded-xl border border-(--color-border) px-5 py-3 text-sm font-semibold text-foreground hover:bg-(--color-sky)"
										>
											이전 단계
										</button>
										<button
											type="button"
											onClick={() =>
												void goToReviewStep()
											}
											className="rounded-xl bg-background px-5 py-3 text-sm font-semibold text-white hover:opacity-92"
										>
											검토 화면으로
										</button>
									</div>
								</div>
							)}

							{step === 3 && (
								<form className="space-y-6" onSubmit={onSubmit}>
									<div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
										<div>
											<p className="text-sm font-semibold uppercase tracking-[0.22em] text-(--color-sea)">
												Step 3
											</p>
											<h2 className="mt-2 text-3xl font-semibold">
												입력 내용을 확인하고 제출해
												주세요.
											</h2>
										</div>
										<button
											type="button"
											onClick={prevStep}
											className="self-start rounded-lg border border-(--color-border) px-4 py-2 text-sm font-medium text-foreground hover:bg-(--color-sky)"
										>
											이전 단계
										</button>
									</div>

									<SummarySection
										title="강의 정보"
										onEdit={() => setStep(1)}
									>
										{selectedCourse ? (
											<div className="grid gap-2 sm:grid-cols-2">
												<SummaryItem
													label="강의명"
													value={selectedCourse.title}
												/>
												<SummaryItem
													label="신청 유형"
													value={
														watchedType ===
														"personal"
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
													value={formatPrice(
														selectedCourse.price,
													)}
												/>
											</div>
										) : (
											<p className="text-sm text-(--color-muted)">
												선택된 강의가 없습니다.
											</p>
										)}
									</SummarySection>

									<SummarySection
										title="신청자 정보"
										onEdit={() => setStep(2)}
									>
										<div className="grid gap-2 sm:grid-cols-2">
											<SummaryItem
												label="이름"
												value={getValues(
													"applicant.name",
												)}
											/>
											<SummaryItem
												label="이메일"
												value={getValues(
													"applicant.email",
												)}
											/>
											<SummaryItem
												label="전화번호"
												value={getValues(
													"applicant.phone",
												)}
											/>
											<SummaryItem
												label="수강 동기"
												value={
													getValues(
														"applicant.motivation",
													) || "미입력"
												}
											/>
										</div>
									</SummarySection>

									{watchedType === "group" && (
										<SummarySection
											title="단체 정보"
											onEdit={() => setStep(2)}
										>
											<div className="grid gap-2 sm:grid-cols-2">
												<SummaryItem
													label="단체명"
													value={getValues(
														"group.organizationName",
													)}
												/>
												<SummaryItem
													label="인원수"
													value={`${getValues("group.headCount")}명`}
												/>
												<SummaryItem
													label="담당자 연락처"
													value={getValues(
														"group.contactPerson",
													)}
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
														{getValues(
															"group.participants",
														).map(
															(
																participant,
																index,
															) => (
																<tr
																	key={`${participant.email}-${index}`}
																>
																	<td className="px-4 py-3">
																		{
																			participant.name
																		}
																	</td>
																	<td className="px-4 py-3">
																		{
																			participant.email
																		}
																	</td>
																</tr>
															),
														)}
													</tbody>
												</table>
											</div>
										</SummarySection>
									)}

									<label className="flex items-start gap-3 rounded-xl border border-(--color-border) bg-(--color-panel-strong) p-4">
										<input
											type="checkbox"
											className="mt-1 h-4 w-4"
											{...register("agreedToTerms")}
										/>
										<span>
											<span className="block text-sm font-semibold">
												이용약관 및 개인정보 수집에
												동의합니다.
											</span>
											<span className="mt-1 block text-sm leading-6 text-(--color-muted)">
												제출 이후에는 운영자가 확인하며,
												서버 유효성 검증 결과에 따라
												대기 상태로 접수될 수 있습니다.
											</span>
										</span>
									</label>
									{errors.agreedToTerms?.message && (
										<InlineError
											message={
												errors.agreedToTerms.message
											}
										/>
									)}

									{submitError && (
										<InlineError
											tone="danger"
											message={
												getApiErrorMessage(
													submitError,
												) ?? "오류가 발생했습니다."
											}
										/>
									)}

									<div className="flex items-center justify-between gap-4 rounded-xl border border-(--color-border) bg-(--color-panel-strong) p-5 text-foreground">
										<div>
											<p className="text-sm text-(--color-muted)">
												자동 저장
											</p>
											<p className="text-base font-semibold">
												{watchedTerms
													? "약관 동의 완료"
													: "초안은 localStorage에 자동 저장됩니다."}
											</p>
										</div>
										<button
											type="submit"
											disabled={
												isSubmitting ||
												mutation.isPending
											}
											className="rounded-lg bg-(--color-coral) px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
										>
											{mutation.isPending
												? "제출 중..."
												: "수강 신청 제출"}
										</button>
									</div>
								</form>
							)}
						</div>
					</section>
				</section>

				{groupSwitchConfirmOpen && (
					<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
						<div className="card-surface w-full max-w-md rounded-2xl border border-(--color-border) p-6 text-foreground">
							<p className="text-sm font-semibold uppercase tracking-[0.22em] text-(--color-sea)">
								유형 전환 확인
							</p>
							<h2 className="mt-3 text-2xl font-semibold">
								단체 정보를 초기화할까요?
							</h2>
							<p className="mt-3 text-sm leading-6 text-(--color-muted)">
								개인 신청으로 바꾸면 참가자 명단과 단체 정보가
								제거됩니다. 의도한 변경인지 확인해 주세요.
							</p>
							<div className="mt-6 flex justify-end gap-3">
								<button
									type="button"
									onClick={cancelGroupReset}
									className="rounded-lg border border-(--color-border) px-4 py-2 text-sm font-semibold"
								>
									취소
								</button>
								<button
									type="button"
									onClick={confirmGroupReset}
									className="rounded-lg bg-background px-4 py-2 text-sm font-semibold text-white"
								>
									초기화하고 전환
								</button>
							</div>
						</div>
					</div>
				)}
			</main>
		</FormProvider>
	);
}

function Field({
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

function SummarySection({
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

function SummaryItem({
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
			<p
				className={cn(
					"text-xs uppercase tracking-[0.16em]",
					inverse ? "text-(--color-muted)" : "text-(--color-muted)",
				)}
			>
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

function InlineError({
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

function inputClass(hasError: boolean) {
	return cn(
		"w-full rounded-lg border bg-(--color-panel) px-4 py-3 outline-none",
		hasError
			? "border-[#d92d20] focus:field-ring"
			: "border-(--color-border) focus:border-(--color-sea) focus:field-ring",
	);
}
