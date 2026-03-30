import { describe, expect, it } from "vitest";
import { isClubType, validateClubName } from "./club";
import { isHazardType } from "./course";
import { validateRoundDate } from "./round";
import { validateCoordinate, validateDistance } from "./shot";

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

describe("validateCoordinate", () => {
	it("有効な座標はnullを返す", () => {
		expect(validateCoordinate({ lat: 35.6812, lng: 139.7671 })).toBeNull();
	});

	it("緯度が範囲外の場合はエラーを返す", () => {
		expect(validateCoordinate({ lat: 91, lng: 0 })).not.toBeNull();
		expect(validateCoordinate({ lat: -91, lng: 0 })).not.toBeNull();
	});

	it("経度が範囲外の場合はエラーを返す", () => {
		expect(validateCoordinate({ lat: 0, lng: 181 })).not.toBeNull();
		expect(validateCoordinate({ lat: 0, lng: -181 })).not.toBeNull();
	});

	it("境界値はnullを返す", () => {
		expect(validateCoordinate({ lat: 90, lng: 180 })).toBeNull();
		expect(validateCoordinate({ lat: -90, lng: -180 })).toBeNull();
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
