import type { Course, CourseCategory } from "@/lib/types";

export const categories: CourseCategory[] = [
	"development",
	"design",
	"marketing",
	"business",
];

export const initialCourses: Course[] = [
	{
		id: "dev-react-bootcamp",
		title: "React Product Bootcamp",
		description:
			"실무형 대시보드와 폼 UX를 중심으로 제품 개발 흐름을 다룹니다.",
		category: "development",
		price: 420000,
		maxCapacity: 24,
		currentEnrollment: 18,
		startDate: "2026-06-03T10:00:00+09:00",
		endDate: "2026-06-24T13:00:00+09:00",
		instructor: "이서윤",
	},
	{
		id: "dev-testing-lab",
		title: "Frontend Testing Lab",
		description:
			"유닛 테스트부터 시나리오 테스트까지 프론트엔드 안정성을 설계합니다.",
		category: "development",
		price: 310000,
		maxCapacity: 20,
		currentEnrollment: 19,
		startDate: "2026-06-10T19:30:00+09:00",
		endDate: "2026-07-01T21:30:00+09:00",
		instructor: "박현호",
	},
	{
		id: "design-brand-system",
		title: "Brand System for Growth Teams",
		description:
			"일관된 브랜드 시스템을 제품 경험에 녹이는 방법을 다룹니다.",
		category: "design",
		price: 360000,
		maxCapacity: 18,
		currentEnrollment: 11,
		startDate: "2026-06-08T14:00:00+09:00",
		endDate: "2026-06-29T17:00:00+09:00",
		instructor: "정민아",
	},
	{
		id: "marketing-campaign-ops",
		title: "Campaign Ops Deep Dive",
		description:
			"퍼포먼스 캠페인 운영과 분석 루틴을 템플릿 중심으로 정리합니다.",
		category: "marketing",
		price: 280000,
		maxCapacity: 30,
		currentEnrollment: 16,
		startDate: "2026-06-05T20:00:00+09:00",
		endDate: "2026-06-26T22:00:00+09:00",
		instructor: "김소이",
	},
	{
		id: "business-pricing-strategy",
		title: "Pricing Strategy Workshop",
		description:
			"B2C/B2B 제품 가격 전략과 실험 설계 프레임워크를 학습합니다.",
		category: "business",
		price: 390000,
		maxCapacity: 16,
		currentEnrollment: 16,
		startDate: "2026-06-12T15:00:00+09:00",
		endDate: "2026-07-03T18:00:00+09:00",
		instructor: "한도윤",
	},
];

let courses = [...initialCourses];
const submittedPairs = new Set<string>();

export function getCourses(category?: string) {
	if (!category || category === "all") {
		return courses;
	}

	return courses.filter((course) => course.category === category);
}

export function findCourse(courseId: string) {
	return courses.find((course) => course.id === courseId);
}

export function increaseEnrollment(courseId: string) {
	courses = courses.map((course) =>
		course.id === courseId
			? { ...course, currentEnrollment: course.currentEnrollment + 1 }
			: course,
	);
}

export function isDuplicateEnrollment(courseId: string, email: string) {
	return submittedPairs.has(`${courseId}:${email.toLowerCase()}`);
}

export function markEnrollment(courseId: string, email: string) {
	submittedPairs.add(`${courseId}:${email.toLowerCase()}`);
}

export function resetMockState() {
	courses = [...initialCourses];
	submittedPairs.clear();
}
