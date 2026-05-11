import type {
	CourseListResponse,
	EnrollmentDraft,
	EnrollmentResponse,
	ErrorResponse,
} from "@/lib/types";
import { toEnrollmentRequest } from "@/lib/transform";

async function parseJson<T>(response: Response): Promise<T> {
	return response.json() as Promise<T>;
}

export async function fetchCourses(category?: string) {
	const search =
		category && category !== "all" ? `?category=${category}` : "";
	const response = await fetch(`/api/courses${search}`);

	if (!response.ok) {
		throw new Error("강의 목록을 불러오지 못했습니다.");
	}

	return parseJson<CourseListResponse>(response);
}

export async function submitEnrollment(values: EnrollmentDraft) {
	const response = await fetch("/api/enrollments", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(toEnrollmentRequest(values)),
	});

	if (!response.ok) {
		throw (await parseJson<ErrorResponse>(
			response,
		)) satisfies ErrorResponse;
	}

	return parseJson<EnrollmentResponse>(response);
}
