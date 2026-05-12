import { describe, expect, it } from "vitest";
import { toEnrollmentRequest } from "@/lib/transform";
import { defaultEnrollmentDraft, submitSchema } from "@/lib/validation";

describe("submitSchema", () => {
	it("개인 신청 필수값이 모두 있으면 통과한다", () => {
		const result = submitSchema.safeParse({
			...defaultEnrollmentDraft,
			courseId: "dev-react-bootcamp",
			applicant: {
				name: "홍길동",
				email: "hong@example.com",
				phone: "010-1234-5678",
				motivation: "실무 역량 강화를 위해 신청합니다.",
			},
			agreedToTerms: true,
		});

		expect(result.success).toBe(true);
	});

	it("010-8939-9977 형식의 휴대폰 번호를 허용한다", () => {
		const result = submitSchema.safeParse({
			...defaultEnrollmentDraft,
			courseId: "dev-react-bootcamp",
			applicant: {
				name: "홍길동",
				email: "hong@example.com",
				phone: "010-8939-9977",
				motivation: "실무 역량 강화를 위해 신청합니다.",
			},
			agreedToTerms: true,
		});

		expect(result.success).toBe(true);
	});

	it("TLD가 1자인 이메일을 거부한다", () => {
		const result = submitSchema.safeParse({
			...defaultEnrollmentDraft,
			courseId: "dev-react-bootcamp",
			applicant: {
				name: "홍길동",
				email: "a@a.a",
				phone: "010-1234-5678",
				motivation: "실무 역량 강화를 위해 신청합니다.",
			},
			agreedToTerms: true,
		});

		expect(result.success).toBe(false);
	});

	it("단체 신청에서 참가자 이메일 중복을 막는다", () => {
		const result = submitSchema.safeParse({
			...defaultEnrollmentDraft,
			courseId: "dev-react-bootcamp",
			type: "group",
			applicant: {
				name: "홍길동",
				email: "hong@example.com",
				phone: "010-1234-5678",
				motivation: "팀 교육 목적입니다.",
			},
			group: {
				organizationName: "라이브클래스",
				headCount: 2,
				contactPerson: "010-2222-3333",
				participants: [
					{ name: "김하나", email: "team@example.com" },
					{ name: "이둘", email: "team@example.com" },
				],
			},
			agreedToTerms: true,
		});

		expect(result.success).toBe(false);
	});

	it("약관 미동의 상태로는 제출할 수 없다", () => {
		const result = submitSchema.safeParse({
			...defaultEnrollmentDraft,
			courseId: "dev-react-bootcamp",
			applicant: {
				name: "홍길동",
				email: "hong@example.com",
				phone: "010-1234-5678",
				motivation: "실무 역량 강화를 위해 신청합니다.",
			},
			agreedToTerms: false,
		});

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(
				result.error.issues.some(
					(issue) => issue.path.join(".") === "agreedToTerms",
				),
			).toBe(true);
		}
	});

	it("단체 신청에서 참가자 수와 인원수가 다르면 실패한다", () => {
		const result = submitSchema.safeParse({
			...defaultEnrollmentDraft,
			courseId: "dev-react-bootcamp",
			type: "group",
			applicant: {
				name: "홍길동",
				email: "hong@example.com",
				phone: "010-1234-5678",
				motivation: "팀 교육 목적입니다.",
			},
			group: {
				organizationName: "라이브클래스",
				headCount: 3,
				contactPerson: "010-2222-3333",
				participants: [
					{ name: "김하나", email: "team1@example.com" },
					{ name: "이둘", email: "team2@example.com" },
				],
			},
			agreedToTerms: true,
		});

		expect(result.success).toBe(false);
	});

	it("단체 담당자 연락처는 숫자만 입력해도 유효하다", () => {
		const result = submitSchema.safeParse({
			...defaultEnrollmentDraft,
			courseId: "dev-react-bootcamp",
			type: "group",
			applicant: {
				name: "홍길동",
				email: "hong@example.com",
				phone: "010-1234-5678",
				motivation: "팀 교육 목적입니다.",
			},
			group: {
				organizationName: "라이브클래스",
				headCount: 2,
				contactPerson: "01022223333",
				participants: [
					{ name: "김하나", email: "team1@example.com" },
					{ name: "이둘", email: "team2@example.com" },
				],
			},
			agreedToTerms: true,
		});

		expect(result.success).toBe(true);
	});

	it("단체 담당자 연락처가 유선 번호면 실패한다", () => {
		const result = submitSchema.safeParse({
			...defaultEnrollmentDraft,
			courseId: "dev-react-bootcamp",
			type: "group",
			applicant: {
				name: "홍길동",
				email: "hong@example.com",
				phone: "010-1234-5678",
				motivation: "팀 교육 목적입니다.",
			},
			group: {
				organizationName: "라이브클래스",
				headCount: 2,
				contactPerson: "02-123-4567",
				participants: [
					{ name: "김하나", email: "team1@example.com" },
					{ name: "이둘", email: "team2@example.com" },
				],
			},
			agreedToTerms: true,
		});

		expect(result.success).toBe(false);
	});
});

describe("toEnrollmentRequest", () => {
	it("개인 신청 payload에는 group 정보를 포함하지 않는다", () => {
		const payload = toEnrollmentRequest({
			...defaultEnrollmentDraft,
			courseId: "dev-react-bootcamp",
			applicant: {
				name: "홍길동",
				email: "hong@example.com",
				phone: "010-1234-5678",
				motivation: "실무 역량 강화를 위해 신청합니다.",
			},
			agreedToTerms: true,
		});

		expect(payload.type).toBe("personal");
		expect("group" in payload).toBe(false);
	});

	it("단체 신청 payload에는 group 정보를 포함한다", () => {
		const payload = toEnrollmentRequest({
			...defaultEnrollmentDraft,
			courseId: "dev-react-bootcamp",
			type: "group",
			applicant: {
				name: "홍길동",
				email: "hong@example.com",
				phone: "010-1234-5678",
				motivation: "팀 교육 목적입니다.",
			},
			group: {
				organizationName: "라이브클래스",
				headCount: 2,
				contactPerson: "010-2222-3333",
				participants: [
					{ name: "김하나", email: "team1@example.com" },
					{ name: "이둘", email: "team2@example.com" },
				],
			},
			agreedToTerms: true,
		});

		expect(payload.type).toBe("group");
		expect("group" in payload).toBe(true);
		if (payload.type === "group") {
			expect(payload.group.organizationName).toBe("라이브클래스");
		}
	});
});
