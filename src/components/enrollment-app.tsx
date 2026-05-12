"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { FormProvider, useFieldArray, useForm, useWatch } from "react-hook-form";
import type { EnrollmentResponse, EnrollmentSuccess, ErrorResponse } from "@/lib/types";
import { fetchCourses, submitEnrollment } from "@/lib/api";
import {
	buildParticipantList,
	defaultEnrollmentDraft,
	enrollmentDraftSchema,
	submitSchema,
	type EnrollmentDraftInput,
} from "@/lib/validation";
import { useEnrollmentFlowStore } from "@/store/enrollment-flow-store";
import { ApplicantStep } from "@/components/enrollment/applicant-step";
import { CourseStep } from "@/components/enrollment/course-step";
import { EnrollmentSidebar } from "@/components/enrollment/enrollment-sidebar";
import { ReviewStep } from "@/components/enrollment/review-step";
import { SuccessScreen } from "@/components/enrollment/success-screen";

const STORAGE_KEY = "liveclass-enrollment-draft";

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
	const setDirtyDraft = useEnrollmentFlowStore((state) => state.setDirtyDraft);
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
		reset,
		setFocus,
		setValue,
		trigger,
	} = methods;

	const draftValues = useWatch({ control });
	const watchedType = useWatch({ control, name: "type" });
	const watchedCourseId = useWatch({ control, name: "courseId" });
	const watchedHeadCount = useWatch({ control, name: "group.headCount" });

	const participantsFieldArray = useFieldArray({ control, name: "group.participants" });

	const coursesQuery = useQuery({
		queryKey: ["courses", category],
		queryFn: () => fetchCourses(category),
	});

	const allCourses = useMemo(
		() => coursesQuery.data?.courses ?? [],
		[coursesQuery.data?.courses],
	);
	const selectedCourse = allCourses.find((c) => c.id === watchedCourseId) ?? null;

	const mutation = useMutation<EnrollmentResponse, ErrorResponse, EnrollmentDraftInput>({
		mutationFn: submitEnrollment,
		onSuccess: (result) => {
			const snapshot = getValues();
			if (!selectedCourse) return;
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
		onError: (error) => setSubmitError(error),
	});

	// localStorage 복구
	useEffect(() => {
		const saved = window.localStorage.getItem(STORAGE_KEY);
		if (!saved) return;
		try {
			const parsed = JSON.parse(saved) as EnrollmentDraftInput;
			reset(parsed);
			setDirtyDraft(true);
		} catch {
			window.localStorage.removeItem(STORAGE_KEY);
		}
	}, [reset, setDirtyDraft]);

	// localStorage 자동 저장
	useEffect(() => {
		if (!draftValues) return;
		window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draftValues));
	}, [draftValues]);

	// isDirty 동기화
	useEffect(() => {
		setDirtyDraft(isDirty);
	}, [isDirty, setDirtyDraft]);

	// 단체 참가자 수 동기화
	useEffect(() => {
		if (watchedType !== "group") return;
		const nextCount = Number(watchedHeadCount) || 2;
		const current = getValues("group.participants");
		if (current.length === nextCount) return;
		participantsFieldArray.replace(
			Array.from({ length: nextCount }, (_, i) => current[i] ?? { name: "", email: "" }),
		);
	}, [getValues, participantsFieldArray, watchedHeadCount, watchedType]);

	// beforeunload 경고
	useEffect(() => {
		const handleBeforeUnload = (event: BeforeUnloadEvent) => {
			if (!isDirty || success) return;
			event.preventDefault();
			event.returnValue = "";
		};
		window.addEventListener("beforeunload", handleBeforeUnload);
		return () => window.removeEventListener("beforeunload", handleBeforeUnload);
	}, [isDirty, success]);

	// 마우스 포인터 + 스크롤 레이저 효과
	useEffect(() => {
		let rafId = 0;
		let lastUpdate = 0;
		let scrollTimeout: NodeJS.Timeout;
		const THROTTLE_MS = 16;
		const root = document.documentElement;

		const updatePointerVars = (event: PointerEvent) => {
			const now = performance.now();
			if (now - lastUpdate < THROTTLE_MS) return;
			lastUpdate = now;
			if (rafId) cancelAnimationFrame(rafId);
			rafId = requestAnimationFrame(() => {
				root.style.setProperty("--mx", `\${event.clientX}px`);
				root.style.setProperty("--my", `\${event.clientY}px`);
			});
		};

		const handleScroll = () => {
			root.style.setProperty("--laser-opacity", "0");
			if (scrollTimeout) clearTimeout(scrollTimeout);
			scrollTimeout = setTimeout(() => {
				root.style.setProperty("--laser-opacity", "1");
			}, 150);
		};

		window.addEventListener("pointermove", updatePointerVars, { passive: true });
		window.addEventListener("scroll", handleScroll, { passive: true });
		return () => {
			window.removeEventListener("pointermove", updatePointerVars);
			window.removeEventListener("scroll", handleScroll);
			if (rafId) cancelAnimationFrame(rafId);
			if (scrollTimeout) clearTimeout(scrollTimeout);
		};
	}, []);

	const goToApplicantStep = async () => {
		const isValid = await trigger(["courseId", "type"]);
		if (!isValid) {
			if (errors.courseId) setFocus("courseId");
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
			watchedType === "group" ? [...baseFields, ...groupFields] : baseFields,
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
			if (firstIssue?.path.join(".") === "agreedToTerms") setFocus("agreedToTerms");
			return;
		}
		await mutation.mutateAsync(values);
	});

	const requestTypeChange = (nextType: EnrollmentDraftInput["type"]) => {
		if (nextType === watchedType) return;
		if (watchedType === "group" && nextType === "personal") {
			const currentGroup = getValues("group");
			const hasGroupInput =
				currentGroup.organizationName.trim() ||
				currentGroup.contactPerson.trim() ||
				currentGroup.participants.some((p) => p.name.trim() || p.email.trim());
			if (hasGroupInput) {
				pendingTypeRef.current = nextType;
				setGroupSwitchConfirmOpen(true);
				return;
			}
		}
		setValue("type", nextType, { shouldDirty: true, shouldValidate: true });
	};

	const confirmGroupReset = () => {
		setValue("type", "personal", { shouldDirty: true, shouldValidate: true });
		setValue(
			"group",
			{ organizationName: "", headCount: 2, participants: buildParticipantList(2), contactPerson: "" },
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
		return <SuccessScreen success={success} onReset={() => setSuccess(null)} />;
	}

	return (
		<FormProvider {...methods}>
			<main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
				<section className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-8">
					<EnrollmentSidebar
						step={step}
						isDirty={isDirty}
						watchedType={watchedType}
						selectedCourse={selectedCourse}
					/>

					<section className="card-surface min-h-[720px] rounded-3xl border border-white/12 bg-[linear-gradient(180deg,#050505_0%,#000000_100%)] px-5 py-6 text-foreground sm:px-8 sm:py-8">
						<div className="step-enter">
							{step === 1 && (
								<CourseStep
									courses={allCourses}
									isLoading={coursesQuery.isLoading}
									category={category}
									onCategoryChange={setCategory}
									onRequestTypeChange={requestTypeChange}
									onNext={() => void goToApplicantStep()}
								/>
							)}
							{step === 2 && (
								<ApplicantStep
									onNext={() => void goToReviewStep()}
									onPrev={prevStep}
								/>
							)}
							{step === 3 && (
								<ReviewStep
									selectedCourse={selectedCourse}
									isPending={mutation.isPending || isSubmitting}
									submitError={submitError}
									onPrev={prevStep}
									onGoToStep={setStep}
									onSubmit={onSubmit}
								/>
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
							<h2 className="mt-3 text-2xl font-semibold">단체 정보를 초기화할까요?</h2>
							<p className="mt-3 text-sm leading-6 text-(--color-muted)">
								개인 신청으로 바꾸면 참가자 명단과 단체 정보가 제거됩니다. 의도한 변경인지 확인해 주세요.
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
