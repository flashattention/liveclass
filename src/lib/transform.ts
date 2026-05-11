import type { EnrollmentDraft, EnrollmentRequest } from "@/lib/types";

export function toEnrollmentRequest(
	values: EnrollmentDraft,
): EnrollmentRequest {
	if (values.type === "personal") {
		return {
			courseId: values.courseId,
			type: "personal",
			applicant: values.applicant,
			agreedToTerms: values.agreedToTerms,
		};
	}

	return {
		courseId: values.courseId,
		type: "group",
		applicant: values.applicant,
		group: values.group,
		agreedToTerms: values.agreedToTerms,
	};
}
