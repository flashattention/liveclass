export const COURSE_CATEGORIES = [
	"development",
	"design",
	"marketing",
	"business",
] as const;

export type CourseCategory = (typeof COURSE_CATEGORIES)[number];

export interface Course {
	id: string;
	title: string;
	description: string;
	category: CourseCategory;
	price: number;
	maxCapacity: number;
	currentEnrollment: number;
	startDate: string;
	endDate: string;
	instructor: string;
}

export interface CourseListResponse {
	courses: Course[];
	categories: CourseCategory[];
}

export interface Applicant {
	name: string;
	email: string;
	phone: string;
	motivation?: string;
}

export interface GroupParticipant {
	name: string;
	email: string;
}

export interface GroupInfo {
	organizationName: string;
	headCount: number;
	participants: GroupParticipant[];
	contactPerson: string;
}

export interface PersonalEnrollmentRequest {
	courseId: string;
	type: "personal";
	applicant: Applicant;
	agreedToTerms: boolean;
}

export interface GroupEnrollmentRequest {
	courseId: string;
	type: "group";
	applicant: Applicant;
	group: GroupInfo;
	agreedToTerms: boolean;
}

export type EnrollmentRequest =
	| PersonalEnrollmentRequest
	| GroupEnrollmentRequest;

export interface EnrollmentResponse {
	enrollmentId: string;
	status: "confirmed" | "pending";
	enrolledAt: string;
}

export interface ErrorResponse {
	code: string;
	message: string;
	details?: Record<string, string>;
}

export interface EnrollmentDraft {
	courseId: string;
	type: "personal" | "group";
	applicant: Applicant;
	group: GroupInfo;
	agreedToTerms: boolean;
}

export interface EnrollmentSuccess extends EnrollmentResponse {
	course: Course;
	type: EnrollmentDraft["type"];
	applicant: Applicant;
	group?: GroupInfo;
}
