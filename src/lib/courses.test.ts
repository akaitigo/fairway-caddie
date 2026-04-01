import { describe, expect, it } from "vitest";
import { getCourseById, getHoleHazards, getPinPosition, getTeePosition, listCourses } from "./courses";

describe("getCourseById", () => {
	it("モックコースを取得できる", () => {
		const course = getCourseById("mock-course-001");
		expect(course).toBeDefined();
		expect(course?.name).toBe("サンプルゴルフコース");
		expect(course?.holes.length).toBeGreaterThan(0);
	});

	it("存在しないコースIDでundefinedを返す", () => {
		expect(getCourseById("nonexistent")).toBeUndefined();
	});
});

describe("listCourses", () => {
	it("利用可能なコース一覧を返す", () => {
		const courses = listCourses();
		expect(courses.length).toBeGreaterThan(0);
		const first = courses[0];
		expect(first).toBeDefined();
		expect(first?.id).toBe("mock-course-001");
	});
});

describe("getPinPosition", () => {
	it("ホール1のピン位置を返す", () => {
		const pin = getPinPosition("mock-course-001", 1);
		expect(pin).toBeDefined();
		expect(pin?.lat).toBe(75);
		expect(pin?.lng).toBe(370);
	});

	it("存在しないホールでundefinedを返す", () => {
		expect(getPinPosition("mock-course-001", 999)).toBeUndefined();
	});

	it("存在しないコースでundefinedを返す", () => {
		expect(getPinPosition("nonexistent", 1)).toBeUndefined();
	});
});

describe("getTeePosition", () => {
	it("ホール1のティー位置を返す", () => {
		const tee = getTeePosition("mock-course-001", 1);
		expect(tee).toBeDefined();
		expect(tee?.lat).toBe(75);
		expect(tee?.lng).toBe(0);
	});

	it("存在しないホールでundefinedを返す", () => {
		expect(getTeePosition("mock-course-001", 999)).toBeUndefined();
	});
});

describe("getHoleHazards", () => {
	it("ホール1のハザード一覧を返す", () => {
		const hazards = getHoleHazards("mock-course-001", 1);
		expect(hazards.length).toBe(2);
		const bunker = hazards.find((h) => h.type === "bunker");
		expect(bunker).toBeDefined();
		const water = hazards.find((h) => h.type === "water");
		expect(water).toBeDefined();
	});

	it("存在しないホールで空配列を返す", () => {
		expect(getHoleHazards("mock-course-001", 999)).toEqual([]);
	});

	it("存在しないコースで空配列を返す", () => {
		expect(getHoleHazards("nonexistent", 1)).toEqual([]);
	});
});
