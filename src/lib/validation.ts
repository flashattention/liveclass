import { z } from "zod";

const koreanPhonePattern = /^(01[016789])-?\d{3,4}-?\d{4}$/;

export const applicantSchema = z.object({
	name: z
		.string()
		.trim()
		.min(2, "이름은 2자 이상 입력해 주세요.")
		.max(20, "이름은 20자 이하로 입력해 주세요."),
	email: z.email("올바른 이메일 형식을 입력해 주세요."),
	phone: z
		.string()
		.trim()
		.regex(koreanPhonePattern, "한국 전화번호 형식으로 입력해 주세요."),
	motivation: z
		.string()
		.trim()
		.max(300, "수강 동기는 300자 이하로 입력해 주세요.")
		.optional()
		.or(z.literal("")),
});

export const participantSchema = z.object({
	name: z
		.string()
		.trim()
		.min(2, "참가자 이름은 2자 이상 입력해 주세요.")
		.max(20, "참가자 이름은 20자 이하로 입력해 주세요."),
	email: z.email("참가자 이메일 형식을 확인해 주세요."),
});

const participantDraftSchema = z.object({
	name: z.string().trim(),
	email: z.string().trim(),
});

const groupDraftSchema = z.object({
	organizationName: z.string().trim(),
	headCount: z
		.number({ error: "신청 인원수를 입력해 주세요." })
		.int("신청 인원수는 정수여야 합니다.")
		.min(2, "단체 신청은 최소 2명부터 가능합니다.")
		.max(10, "단체 신청은 최대 10명까지 가능합니다."),
	participants: z.array(participantDraftSchema),
	contactPerson: z.string().trim(),
});

export const groupSchema = z
	.object({
		organizationName: z.string().trim().min(1, "단체명을 입력해 주세요."),
		headCount: z
			.number({ error: "신청 인원수를 입력해 주세요." })
			.int("신청 인원수는 정수여야 합니다.")
			.min(2, "단체 신청은 최소 2명부터 가능합니다.")
			.max(10, "단체 신청은 최대 10명까지 가능합니다."),
		participants: z.array(participantSchema),
		contactPerson: z
			.string()
			.trim()
			.regex(
				koreanPhonePattern,
				"담당자 연락처는 한국 전화번호 형식이어야 합니다.",
			),
	})
	.superRefine((value, context) => {
		if (value.participants.length !== value.headCount) {
			context.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["participants"],
				message: "참가자 명단은 신청 인원수와 같아야 합니다.",
			});
		}

		const seen = new Set<string>();

		value.participants.forEach((participant, index) => {
			const normalized = participant.email.trim().toLowerCase();
			if (seen.has(normalized)) {
				context.addIssue({
					code: z.ZodIssueCode.custom,
					path: ["participants", index, "email"],
					message: "참가자 이메일은 중복될 수 없습니다.",
				});
			}
			seen.add(normalized);
		});
	});

export const enrollmentDraftSchema = z
	.object({
		courseId: z.string().min(1, "강의를 선택해 주세요."),
		type: z.enum(["personal", "group"]),
		applicant: applicantSchema,
		group: groupDraftSchema,
		agreedToTerms: z.boolean(),
	})
	.superRefine((value, context) => {
		if (value.type === "group") {
			const groupResult = groupSchema.safeParse(value.group);
			if (!groupResult.success) {
				groupResult.error.issues.forEach((issue) => {
					context.addIssue({
						code: z.ZodIssueCode.custom,
						path: ["group", ...issue.path],
						message: issue.message,
					});
				});
			}

			return;
		}

		if (
			value.group.headCount !== 2 ||
			value.group.organizationName ||
			value.group.contactPerson
		) {
			return;
		}

		if (
			value.group.participants.some(
				(participant) => participant.name || participant.email,
			)
		) {
			context.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["type"],
				message:
					"개인 신청으로 전환되면 단체 정보는 제출되지 않습니다.",
			});
		}
	});

export const submitSchema = enrollmentDraftSchema.superRefine(
	(value, context) => {
		if (!value.agreedToTerms) {
			context.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["agreedToTerms"],
				message: "이용약관에 동의해 주세요.",
			});
		}
	},
);

export type EnrollmentDraftInput = z.infer<typeof enrollmentDraftSchema>;

export const emptyParticipant = () => ({ name: "", email: "" });

export const defaultEnrollmentDraft: EnrollmentDraftInput = {
	courseId: "",
	type: "personal",
	applicant: {
		name: "",
		email: "",
		phone: "",
		motivation: "",
	},
	group: {
		organizationName: "",
		headCount: 2,
		participants: [emptyParticipant(), emptyParticipant()],
		contactPerson: "",
	},
	agreedToTerms: false,
};

export function buildParticipantList(headCount: number) {
	return Array.from({ length: headCount }, () => emptyParticipant());
}
