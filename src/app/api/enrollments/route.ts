import { NextResponse } from "next/server";
import { z } from "zod";
import {
	findCourse,
	increaseEnrollment,
	isDuplicateEnrollment,
	markEnrollment,
} from "@/lib/mock-data";
import { applicantSchema, groupSchema } from "@/lib/validation";

const requestSchema = z.discriminatedUnion("type", [
	z.object({
		courseId: z.string().min(1),
		type: z.literal("personal"),
		applicant: applicantSchema,
		agreedToTerms: z.literal(true),
	}),
	z.object({
		courseId: z.string().min(1),
		type: z.literal("group"),
		applicant: applicantSchema,
		group: groupSchema,
		agreedToTerms: z.literal(true),
	}),
]);

function detailsFromIssue(path: (string | number)[], message: string) {
	return { [path.join(".")]: message };
}

function normalizeIssuePath(path: PropertyKey[]) {
	return path.filter(
		(segment): segment is string | number =>
			typeof segment === "string" || typeof segment === "number",
	);
}

export async function POST(request: Request) {
	const body = await request.json();
	const parsed = requestSchema.safeParse(body);

	await new Promise((resolve) => setTimeout(resolve, 700));

	if (!parsed.success) {
		const details = parsed.error.issues.reduce<Record<string, string>>(
			(accumulator, issue) => {
				return {
					...accumulator,
					...detailsFromIssue(
						normalizeIssuePath(issue.path),
						issue.message,
					),
				};
			},
			{},
		);

		return NextResponse.json(
			{
				code: "INVALID_INPUT",
				message: "입력값을 다시 확인해 주세요.",
				details,
			},
			{ status: 400 },
		);
	}

	const payload = parsed.data;
	const course = findCourse(payload.courseId);

	if (!course) {
		return NextResponse.json(
			{
				code: "INVALID_INPUT",
				message: "존재하지 않는 강의입니다.",
				details: { courseId: "강의를 다시 선택해 주세요." },
			},
			{ status: 400 },
		);
	}

	if (course.currentEnrollment >= course.maxCapacity) {
		return NextResponse.json(
			{
				code: "COURSE_FULL",
				message: "정원이 마감된 강의입니다.",
			},
			{ status: 409 },
		);
	}

	if (isDuplicateEnrollment(payload.courseId, payload.applicant.email)) {
		return NextResponse.json(
			{
				code: "DUPLICATE_ENROLLMENT",
				message: "이미 같은 이메일로 신청된 강의입니다.",
			},
			{ status: 409 },
		);
	}

	markEnrollment(payload.courseId, payload.applicant.email);
	increaseEnrollment(payload.courseId);

	return NextResponse.json({
		enrollmentId: `ENR-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
		status:
			course.maxCapacity - course.currentEnrollment <= 2
				? "pending"
				: "confirmed",
		enrolledAt: new Date().toISOString(),
	});
}
