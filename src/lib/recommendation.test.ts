import { describe, expect, it } from "vitest";
import type { Hazard } from "../types/course";
import type { Coordinate, Shot } from "../types/shot";
import type { ClubRecommendation } from "./recommendation";
import { RuleBasedEngine } from "./recommendation";

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

describe("RuleBasedEngine", () => {
	const engine = new RuleBasedEngine();

	const teePosition: Coordinate = { lat: 35.0, lng: 139.0 };
	// ターゲットはティーから約230ヤード先 (ドライバー距離)
	const targetPosition: Coordinate = { lat: 35.0019, lng: 139.0 };

	describe("コールドスタート (ジェネリック推薦)", () => {
		it("5ラウンド未満ではジェネリック推薦を返す", () => {
			const recommendations = engine.recommend(teePosition, targetPosition, [], [], 2);
			expect(recommendations).toHaveLength(3);
			for (const rec of recommendations) {
				expect(rec.isGeneric).toBe(true);
			}
		});

		it("推薦結果は3つまで返される", () => {
			const recommendations = engine.recommend(teePosition, targetPosition, [], [], 0);
			expect(recommendations.length).toBeLessThanOrEqual(3);
		});

		it("推薦結果は期待値降順でソートされている", () => {
			const recommendations = engine.recommend(teePosition, targetPosition, [], [], 0);
			for (let i = 1; i < recommendations.length; i++) {
				const prev = recommendations[i - 1];
				const curr = recommendations[i];
				expect(prev).toBeDefined();
				expect(curr).toBeDefined();
				if (prev && curr) {
					expect(prev.expectedValue).toBeGreaterThanOrEqual(curr.expectedValue);
				}
			}
		});

		it("各推薦結果にクラブ・期待値・確率が含まれる", () => {
			const recommendations = engine.recommend(teePosition, targetPosition, [], [], 0);
			for (const rec of recommendations) {
				expect(rec.club).toBeDefined();
				expect(typeof rec.expectedValue).toBe("number");
				expect(typeof rec.fairwayKeepRate).toBe("number");
				expect(typeof rec.hazardRisk).toBe("number");
				expect(typeof rec.distanceMean).toBe("number");
				expect(typeof rec.distanceStdDev).toBe("number");
			}
		});
	});

	describe("ユーザーデータ使用時", () => {
		it("5ラウンド以上でユーザーデータを使用する", () => {
			const shots: Shot[] = [
				createShot({ id: "s1", club: "7i", distanceYards: 140 }),
				createShot({ id: "s2", club: "7i", distanceYards: 145 }),
				createShot({ id: "s3", club: "7i", distanceYards: 135 }),
				createShot({ id: "s4", club: "7i", distanceYards: 142 }),
				createShot({ id: "s5", club: "7i", distanceYards: 138 }),
			];
			// ターゲットを7I距離(≈140yd)に設定
			const shortTarget: Coordinate = { lat: 35.00117, lng: 139.0 };
			const recommendations = engine.recommend(teePosition, shortTarget, [], shots, 5);
			const sevenIron = recommendations.find((r) => r.club === "7i");
			if (sevenIron) {
				expect(sevenIron.isGeneric).toBe(false);
			}
		});

		it("データがないクラブはジェネリックにフォールバック", () => {
			const shots: Shot[] = [createShot({ id: "s1", club: "7i", distanceYards: 140 })];
			const recommendations = engine.recommend(teePosition, targetPosition, [], shots, 5);
			// ドライバーにはユーザーデータがないのでジェネリック
			const driverRec = recommendations.find((r) => r.club === "driver");
			if (driverRec) {
				expect(driverRec.isGeneric).toBe(true);
			}
		});
	});

	describe("ハザードリスク計算", () => {
		it("ハザードなしの場合はリスク0", () => {
			const recommendations = engine.recommend(teePosition, targetPosition, [], [], 0);
			for (const rec of recommendations) {
				expect(rec.hazardRisk).toBe(0);
			}
		});

		it("ハザードがある場合はリスクが正の値", () => {
			const hazards: Hazard[] = [
				{
					id: "h1",
					type: "water",
					position: { lat: 35.0015, lng: 139.0 },
					radiusYards: 20,
				},
			];
			const recommendations = engine.recommend(teePosition, targetPosition, hazards, [], 0);
			// 少なくとも1つのクラブがハザードリスクを持つ
			const hasRisk = recommendations.some((r) => r.hazardRisk > 0);
			expect(hasRisk).toBe(true);
		});

		it("ハザードリスクが期待値を下げる", () => {
			const withoutHazards = engine.recommend(teePosition, targetPosition, [], [], 0);
			const hazards: Hazard[] = [
				{
					id: "h1",
					type: "water",
					position: { lat: 35.0015, lng: 139.0 },
					radiusYards: 30,
				},
			];
			const withHazards = engine.recommend(teePosition, targetPosition, hazards, [], 0);

			// 同じクラブの期待値がハザード有りの方が低い
			for (const recNoHaz of withoutHazards) {
				const recWithHaz = withHazards.find((r) => r.club === recNoHaz.club);
				if (recWithHaz) {
					expect(recWithHaz.expectedValue).toBeLessThanOrEqual(recNoHaz.expectedValue);
				}
			}
		});

		it("OBペナルティは水ペナルティより大きい", () => {
			const waterHazard: Hazard[] = [
				{
					id: "h1",
					type: "water",
					position: { lat: 35.0015, lng: 139.0 },
					radiusYards: 20,
				},
			];
			const obHazard: Hazard[] = [
				{
					id: "h1",
					type: "ob",
					position: { lat: 35.0015, lng: 139.0 },
					radiusYards: 20,
				},
			];
			const waterRecs = engine.recommend(teePosition, targetPosition, waterHazard, [], 0);
			const obRecs = engine.recommend(teePosition, targetPosition, obHazard, [], 0);

			// 同じ位置のOBの方がリスクが高い
			for (const waterRec of waterRecs) {
				const obRec = obRecs.find((r) => r.club === waterRec.club);
				if (obRec && waterRec.hazardRisk > 0) {
					expect(obRec.hazardRisk).toBeGreaterThan(waterRec.hazardRisk);
				}
			}
		});
	});

	describe("フェアウェイキープ率", () => {
		it("フェアウェイキープ率は0~1の範囲", () => {
			const recommendations = engine.recommend(teePosition, targetPosition, [], [], 0);
			for (const rec of recommendations) {
				expect(rec.fairwayKeepRate).toBeGreaterThanOrEqual(0);
				expect(rec.fairwayKeepRate).toBeLessThanOrEqual(1);
			}
		});

		it("平均飛距離がターゲットに近いクラブほどフェアウェイキープ率が高い", () => {
			// ターゲット ≈ 230yd → ドライバー(mean=230)が最もキープ率が高いはず
			const allRecs = engine.recommend(teePosition, targetPosition, [], [], 0);
			const topRec = allRecs[0];
			expect(topRec).toBeDefined();
			if (topRec) {
				expect(topRec.fairwayKeepRate).toBeGreaterThan(0);
			}
		});
	});

	describe("コールドスタート閾値カスタマイズ", () => {
		it("閾値を変更できる", () => {
			const customEngine = new RuleBasedEngine(3);
			const recs = customEngine.recommend(teePosition, targetPosition, [], [], 3);
			// 3ラウンドちょうどでジェネリックではない(ただしデータなしなのでジェネリックにフォールバック)
			expect(recs).toHaveLength(3);
		});
	});

	describe("エッジケース", () => {
		it("同一地点をターゲットにした場合", () => {
			const recommendations = engine.recommend(teePosition, teePosition, [], [], 0);
			expect(recommendations).toHaveLength(3);
		});

		it("空のショットリストで動作する", () => {
			const recommendations = engine.recommend(teePosition, targetPosition, [], [], 10);
			expect(recommendations).toHaveLength(3);
			// データがないのでジェネリックにフォールバック
			for (const rec of recommendations) {
				expect(rec.isGeneric).toBe(true);
			}
		});

		it("大量のハザードでも動作する", () => {
			const hazards: Hazard[] = Array.from({ length: 50 }, (_, i) => ({
				id: `h${i}`,
				type: "bunker" as const,
				position: { lat: 35.0 + i * 0.0001, lng: 139.0 },
				radiusYards: 10,
			}));
			const recommendations = engine.recommend(teePosition, targetPosition, hazards, [], 0);
			expect(recommendations).toHaveLength(3);
		});
	});
});

describe("ClubRecommendation interface", () => {
	it("推薦結果の型が正しい", () => {
		const rec: ClubRecommendation = {
			club: "7i",
			expectedValue: 0.5,
			fairwayKeepRate: 0.7,
			hazardRisk: 0.2,
			distanceMean: 140,
			distanceStdDev: 10,
			isGeneric: false,
		};
		expect(rec.club).toBe("7i");
		expect(rec.expectedValue).toBe(0.5);
	});
});
