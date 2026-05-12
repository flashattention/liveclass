import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { formatPhoneNumber } from "@/lib/utils";
import { Field } from "@/components/ui/field";
import { InlineError } from "@/components/ui/inline-error";
import { inputClass } from "@/components/ui/input-class";
import { type EnrollmentDraftInput } from "@/lib/validation";

interface ApplicantStepProps {
	onNext: () => void;
	onPrev: () => void;
}

export function ApplicantStep({ onNext, onPrev }: ApplicantStepProps) {
	const {
		register,
		formState: { errors },
	} = useFormContext<EnrollmentDraftInput>();

	const watchedType = useWatch<EnrollmentDraftInput, "type">({
		name: "type",
	});

	const { fields: participantFields } = useFieldArray<
		EnrollmentDraftInput,
		"group.participants"
	>({
		name: "group.participants",
	});

	return (
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
					onClick={onPrev}
					className="self-start rounded-lg border border-(--color-border) px-4 py-2 text-sm font-medium text-foreground hover:bg-(--color-sky)"
				>
					이전 단계
				</button>
			</div>

			<div className="grid gap-4 sm:grid-cols-2">
				<Field
					label="이름"
					required
					error={errors.applicant?.name?.message}
				>
					<input
						className={inputClass(Boolean(errors.applicant?.name))}
						{...register("applicant.name")}
					/>
				</Field>
				<Field
					label="이메일"
					required
					error={errors.applicant?.email?.message}
				>
					<input
						className={inputClass(Boolean(errors.applicant?.email))}
						{...register("applicant.email")}
					/>
				</Field>
				<Field
					label="전화번호"
					required
					error={errors.applicant?.phone?.message}
				>
					<input
						className={inputClass(Boolean(errors.applicant?.phone))}
						placeholder="010-1234-5678"
						{...register("applicant.phone", {
							onChange: (event) => {
								event.target.value = formatPhoneNumber(
									event.target.value,
								);
							},
						})}
					/>
				</Field>
				<div className="sm:col-span-2">
					<Field
						label="수강 동기"
						error={errors.applicant?.motivation?.message}
					>
						<textarea
							rows={5}
							maxLength={300}
							className={inputClass(
								Boolean(errors.applicant?.motivation),
							)}
							{...register("applicant.motivation")}
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
							error={errors.group?.organizationName?.message}
						>
							<input
								className={inputClass(
									Boolean(errors.group?.organizationName),
								)}
								{...register("group.organizationName")}
							/>
						</Field>
						<Field
							label="신청 인원수"
							required
							error={errors.group?.headCount?.message}
						>
							<select
								className={inputClass(
									Boolean(errors.group?.headCount),
								)}
								{...register("group.headCount", {
									valueAsNumber: true,
								})}
							>
								{Array.from(
									{ length: 9 },
									(_, index) => index + 2,
								).map((count) => (
									<option key={count} value={count}>
										{count}명
									</option>
								))}
							</select>
						</Field>
						<Field
							label="담당자 연락처"
							required
							error={errors.group?.contactPerson?.message}
						>
							<input
								className={inputClass(
									Boolean(errors.group?.contactPerson),
								)}
								placeholder="010-1234-5678"
								{...register("group.contactPerson", {
									onChange: (event) => {
										event.target.value = formatPhoneNumber(
											event.target.value,
										);
									},
								})}
							/>
						</Field>
					</div>

					<div>
						<div className="mb-3 flex items-center justify-between gap-3">
							<p className="text-sm font-semibold">참가자 명단</p>
							<p className="text-xs text-(--color-muted)">
								참가자 이메일은 중복될 수 없습니다.
							</p>
						</div>
						<div className="space-y-3">
							{participantFields.map((field, index) => (
								<div
									key={field.id}
									className="grid gap-3 rounded-xl border border-(--color-border) bg-(--color-panel) p-4 sm:grid-cols-2"
								>
									<Field
										label={`참가자 ${index + 1} 이름`}
										required
										error={
											errors.group?.participants?.[index]
												?.name?.message
										}
									>
										<input
											className={inputClass(
												Boolean(
													errors.group
														?.participants?.[index]
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
											errors.group?.participants?.[index]
												?.email?.message
										}
									>
										<input
											className={inputClass(
												Boolean(
													errors.group
														?.participants?.[index]
														?.email,
												),
											)}
											{...register(
												`group.participants.${index}.email`,
											)}
										/>
									</Field>
								</div>
							))}
						</div>
						{typeof errors.group?.participants?.message ===
							"string" && (
							<InlineError
								message={errors.group.participants.message}
							/>
						)}
					</div>
				</div>
			)}

			<div className="flex justify-end gap-3">
				<button
					type="button"
					onClick={onPrev}
					className="rounded-xl border border-(--color-border) px-5 py-3 text-sm font-semibold text-foreground hover:bg-(--color-sky)"
				>
					이전 단계
				</button>
				<button
					type="button"
					onClick={onNext}
					className="rounded-xl bg-background px-5 py-3 text-sm font-semibold text-white hover:opacity-92"
				>
					검토 화면으로
				</button>
			</div>
		</div>
	);
}
