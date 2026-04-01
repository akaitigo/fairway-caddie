import { describe, expect, it } from "vitest";
import { isClubType, validateClubName } from "./club";
import { isHazardType } from "./course";
import { validateRoundDate } from "./round";
import { euclideanDistanceYards, validateCoordinate, validateDistance } from "./shot";

describe("validateClubName", () => {
	it("正常なクラブ名はnullを返す", () => {
		expect(validateClubName("マイドライバー")).toBeNull();
	});

	it("空文字の場合はエラーを返す", () => {
		expect(validateClubName("")).not.toBeNull();
	});

	it("空白のみの場合はエラーを返す", () => {
		expect(validateClubName("   ")).not.toBeNull();
	});

	it("31文字以上の場合はエラーを返す", () => {
		expect(validateClubName("a".repeat(31))).not.toBeNull();
	});

	it("30文字ちょうどはnullを返す", () => {
		expect(validateClubName("a".repeat(30))).toBeNull();
	});
});

describe("isClubType", () => {
	it("有効なクラブ種別でtrueを返す", () => {
		expect(isClubType("driver")).toBe(true);
		expect(isClubType("7i")).toBe(true);
		expect(isClubType("putter")).toBe(true);
	});

	it("無効な値でfalseを返す", () => {
		expect(isClubType("invalid")).toBe(false);
		expect(isClubType(123)).toBe(false);
		expect(isClubType(null)).toBe(false);
	});
});

describe("validateCoordinate (ヤード座標系)", () => {
	it("有効なヤード座標はnullを返す", () => {
		expect(validateCoordinate({ lat: 75, lng: 200 })).toBeNull();
	});

	it("縦位置が範囲外の場合はエラーを返す", () => {
		expect(validateCoordinate({ lat: 151, lng: 0 })).not.toBeNull();
		expect(validateCoordinate({ lat: -1, lng: 0 })).not.toBeNull();
	});

	it("横位置が範囲外の場合はエラーを返す", () => {
		expect(validateCoordinate({ lat: 0, lng: 401 })).not.toBeNull();
		expect(validateCoordinate({ lat: 0, lng: -1 })).not.toBeNull();
	});

	it("境界値はnullを返す", () => {
		expect(validateCoordinate({ lat: 150, lng: 400 })).toBeNull();
		expect(validateCoordinate({ lat: 0, lng: 0 })).toBeNull();
	});
});

describe("euclideanDistanceYards", () => {
	it("同一地点の距離は0", () => {
		expect(euclideanDistanceYards({ lat: 75, lng: 0 }, { lat: 75, lng: 0 })).toBe(0);
	});

	it("水平方向の距離を正しく計算する", () => {
		const d = euclideanDistanceYards({ lat: 75, lng: 0 }, { lat: 75, lng: 200 });
		expect(d).toBeCloseTo(200, 5);
	});

	it("垂直方向の距離を正しく計算する", () => {
		const d = euclideanDistanceYards({ lat: 0, lng: 100 }, { lat: 100, lng: 100 });
		expect(d).toBeCloseTo(100, 5);
	});

	it("斜め方向の距離をピタゴラスの定理で計算する", () => {
		const d = euclideanDistanceYards({ lat: 0, lng: 0 }, { lat: 30, lng: 40 });
		expect(d).toBeCloseTo(50, 5);
	});
});

describe("validateDistance", () => {
	it("有効な飛距離はnullを返す", () => {
		expect(validateDistance(200)).toBeNull();
	});

	it("負の飛距離はエラーを返す", () => {
		expect(validateDistance(-1)).not.toBeNull();
	});

	it("400超の飛距離はエラーを返す", () => {
		expect(validateDistance(401)).not.toBeNull();
	});

	it("境界値はnullを返す", () => {
		expect(validateDistance(0)).toBeNull();
		expect(validateDistance(400)).toBeNull();
	});
});

describe("validateRoundDate", () => {
	it("過去の日付はnullを返す", () => {
		expect(validateRoundDate("2025-01-01")).toBeNull();
	});

	it("未来の日付はエラーを返す", () => {
		expect(validateRoundDate("2099-12-31")).not.toBeNull();
	});

	it("不正な日付形式はエラーを返す", () => {
		expect(validateRoundDate("not-a-date")).not.toBeNull();
	});
});

describe("isHazardType", () => {
	it("有効なハザード種別でtrueを返す", () => {
		expect(isHazardType("bunker")).toBe(true);
		expect(isHazardType("water")).toBe(true);
		expect(isHazardType("ob")).toBe(true);
	});

	it("無効な値でfalseを返す", () => {
		expect(isHazardType("invalid")).toBe(false);
		expect(isHazardType(123)).toBe(false);
	});
});
