/**
 * コースデータ管理
 *
 * MVP ではモックデータを使用する。
 * Phase 1 で PostGIS + API から取得に切り替え予定。
 */

import type { Course, Hole } from "../types/course";

/** モックコース: サンプルパー4ホール */
const MOCK_HOLE_1: Hole = {
	number: 1,
	par: 4,
	distanceYards: 370,
	teePosition: { lat: 75, lng: 0 },
	pinPosition: { lat: 75, lng: 370 },
	fairwayCenter: { lat: 75, lng: 185 },
	hazards: [
		{
			id: "h-bunker-1",
			type: "bunker",
			position: { lat: 120, lng: 200 },
			radiusYards: 15,
		},
		{
			id: "h-water-1",
			type: "water",
			position: { lat: 30, lng: 280 },
			radiusYards: 20,
		},
	],
};

/** モックコース定義 */
const MOCK_COURSE: Course = {
	id: "mock-course-001",
	name: "サンプルゴルフコース",
	holes: [MOCK_HOLE_1],
};

/** 利用可能なコース一覧 */
const COURSES: ReadonlyMap<string, Course> = new Map([[MOCK_COURSE.id, MOCK_COURSE]]);

/** コースIDからコースを取得する */
export function getCourseById(courseId: string): Course | undefined {
	return COURSES.get(courseId);
}

/** 利用可能なコース一覧を返す */
export function listCourses(): readonly Course[] {
	return [...COURSES.values()];
}

/** コースの特定ホールからピン位置を取得する */
export function getPinPosition(courseId: string, holeNumber: number): { lat: number; lng: number } | undefined {
	const course = COURSES.get(courseId);
	if (!course) return undefined;
	const hole = course.holes.find((h) => h.number === holeNumber);
	return hole?.pinPosition;
}

/** コースの特定ホールからティー位置を取得する */
export function getTeePosition(courseId: string, holeNumber: number): { lat: number; lng: number } | undefined {
	const course = COURSES.get(courseId);
	if (!course) return undefined;
	const hole = course.holes.find((h) => h.number === holeNumber);
	return hole?.teePosition;
}

/** コースの特定ホールからハザード一覧を取得する */
export function getHoleHazards(
	courseId: string,
	holeNumber: number,
): readonly {
	id: string;
	type: string;
	position: { lat: number; lng: number };
	radiusYards: number;
}[] {
	const course = COURSES.get(courseId);
	if (!course) return [];
	const hole = course.holes.find((h) => h.number === holeNumber);
	return hole?.hazards ?? [];
}
