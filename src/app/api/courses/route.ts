import { NextResponse } from "next/server";
import { categories, getCourses } from "@/lib/mock-data";

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const category = searchParams.get("category") ?? undefined;

	await new Promise((resolve) => setTimeout(resolve, 300));

	return NextResponse.json({
		courses: getCourses(category),
		categories,
	});
}
