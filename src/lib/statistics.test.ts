import { describe, expect, it } from "vitest";
import type { Shot } from "../types/shot";
import { calculateClubStats, groupDistancesByClub, mean, normalCdf, normalPdf, stdDev, variance } from "./statistics";

describe("mean", () => {
	it("空配列に対して0を返す", () => {
		expect(mean([])).toBe(0);
	});

	it("単一要素の平均を返す", () => {
		expect(mean([5])).toBe(5);
	});

	it("複数要素の平均を返す", () => {
		expect(mean([1, 2, 3, 4, 5])).toBe(3);
	});

	it("小数を含む平均を返す", () => {
		expect(mean([10.5, 20.5])).toBeCloseTo(15.5);
	});
});

describe("variance", () => {
	it("空配列に対して0を返す", () => {
		expect(variance([])).toBe(0);
	});

	it("同一値の分散は0", () => {
		expect(variance([5, 5, 5])).toBe(0);
	});

	it("母分散を正しく計算する", () => {
		// [2, 4, 4, 4, 5, 5, 7, 9] → mean=5, variance=4
		expect(variance([2, 4, 4, 4, 5, 5, 7, 9])).toBe(4);
	});
});

describe("stdDev", () => {
	it("空配列に対して0を返す", () => {
		expect(stdDev([])).toBe(0);
	});

	it("標準偏差を正しく計算する", () => {
		// variance=4 → stdDev=2
		expect(stdDev([2, 4, 4, 4, 5, 5, 7, 9])).toBe(2);
	});
});

function createShot(overrides: Partial<Shot> & Pick<Shot, "club" | "distanceYards">): Shot {
	return {
		id: "shot-1",
		roundId: "round-1",
		holeNumber: 1,
		shotNumber: 1,
		position: { lat: 35.0, lng: 139.0 },
		landingPosition: { lat: 35.001, lng: 139.001 },
		timestamp: "2026-01-01T00:00:00Z",
		...overrides,
	};
}

describe("groupDistancesByClub", () => {
	it("空配列に対して空マップを返す", () => {
		const result = groupDistancesByClub([]);
		expect(result.size).toBe(0);
	});

	it("クラブ別に飛距離を分類する", () => {
		const shots: Shot[] = [
			createShot({ id: "s1", club: "driver", distanceYards: 230 }),
			createShot({ id: "s2", club: "driver", distanceYards: 240 }),
			createShot({ id: "s3", club: "7i", distanceYards: 150 }),
		];
		const result = groupDistancesByClub(shots);
		expect(result.get("driver")).toEqual([230, 240]);
		expect(result.get("7i")).toEqual([150]);
	});
});

describe("calculateClubStats", () => {
	it("空配列に対して空配列を返す", () => {
		expect(calculateClubStats([])).toEqual([]);
	});

	it("クラブ別の統計を正しく計算する", () => {
		const shots: Shot[] = [
			createShot({ id: "s1", club: "driver", distanceYards: 220 }),
			createShot({ id: "s2", club: "driver", distanceYards: 240 }),
			createShot({ id: "s3", club: "driver", distanceYards: 230 }),
		];
		const stats = calculateClubStats(shots);
		expect(stats).toHaveLength(1);
		const driverStats = stats[0];
		expect(driverStats).toBeDefined();
		expect(driverStats?.clubType).toBe("driver");
		expect(driverStats?.count).toBe(3);
		expect(driverStats?.mean).toBeCloseTo(230);
		expect(driverStats?.min).toBe(220);
		expect(driverStats?.max).toBe(240);
	});

	it("複数クラブの統計を計算する", () => {
		const shots: Shot[] = [
			createShot({ id: "s1", club: "driver", distanceYards: 230 }),
			createShot({ id: "s2", club: "7i", distanceYards: 150 }),
			createShot({ id: "s3", club: "pw", distanceYards: 100 }),
		];
		const stats = calculateClubStats(shots);
		expect(stats).toHaveLength(3);
	});
});

describe("normalPdf", () => {
	it("sigma <= 0 の場合は0を返す", () => {
		expect(normalPdf(0, 0, 0)).toBe(0);
		expect(normalPdf(0, 0, -1)).toBe(0);
	});

	it("標準正規分布の中心で正しい値を返す", () => {
		// N(0,1) の x=0 での PDF ≈ 0.3989
		expect(normalPdf(0, 0, 1)).toBeCloseTo(0.3989, 3);
	});

	it("平均から離れると値が小さくなる", () => {
		const center = normalPdf(230, 230, 15);
		const away = normalPdf(260, 230, 15);
		expect(center).toBeGreaterThan(away);
	});
});

describe("normalCdf", () => {
	it("sigma <= 0 の場合のエッジケース", () => {
		expect(normalCdf(0, 0, 0)).toBe(1);
		expect(normalCdf(-1, 0, 0)).toBe(0);
	});

	it("標準正規分布の中心で0.5を返す", () => {
		expect(normalCdf(0, 0, 1)).toBeCloseTo(0.5, 3);
	});

	it("十分大きいxで1に近づく", () => {
		expect(normalCdf(5, 0, 1)).toBeCloseTo(1, 3);
	});

	it("十分小さいxで0に近づく", () => {
		expect(normalCdf(-5, 0, 1)).toBeCloseTo(0, 3);
	});

	it("+1σ で ≈ 0.8413", () => {
		expect(normalCdf(1, 0, 1)).toBeCloseTo(0.8413, 3);
	});

	it("-1σ で ≈ 0.1587", () => {
		expect(normalCdf(-1, 0, 1)).toBeCloseTo(0.1587, 3);
	});
});
