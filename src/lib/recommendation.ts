/**
 * クラブ推薦エンジン
 *
 * 飛距離分布 x ハザードリスクの期待値計算に基づき、
 * 最適なクラブをランキング形式で推薦する。
 *
 * ADR-002: ルールベース (正規分布近似 + 閾値判定) を採用。
 */

import type { ClubType } from "../types/club";
import type { Hazard } from "../types/course";
import type { Coordinate, Shot } from "../types/shot";
import { euclideanDistanceYards } from "../types/shot";
import { mean, normalCdf, stdDev } from "./statistics";

/** ハザード種別ごとのペナルティコスト */
const HAZARD_PENALTY: Record<string, number> = {
	water: 2.0,
	bunker: 1.0,
	ob: 3.0,
	tree: 0.5,
	rough: 0.3,
};

/** コールドスタート用ジェネリック統計 (プロ平均ベース) */
const GENERIC_STATS: ReadonlyMap<ClubType, { mean: number; stdDev: number }> = new Map([
	["driver", { mean: 230, stdDev: 20 }],
	["3w", { mean: 210, stdDev: 18 }],
	["5w", { mean: 195, stdDev: 16 }],
	["7w", { mean: 180, stdDev: 15 }],
	["3i", { mean: 180, stdDev: 14 }],
	["4i", { mean: 170, stdDev: 13 }],
	["5i", { mean: 160, stdDev: 12 }],
	["6i", { mean: 150, stdDev: 11 }],
	["7i", { mean: 140, stdDev: 10 }],
	["8i", { mean: 130, stdDev: 9 }],
	["9i", { mean: 120, stdDev: 8 }],
	["pw", { mean: 110, stdDev: 7 }],
	["aw", { mean: 95, stdDev: 6 }],
	["sw", { mean: 80, stdDev: 5 }],
	["lw", { mean: 60, stdDev: 5 }],
	["putter", { mean: 10, stdDev: 3 }],
]);

/** 推薦結果 */
export interface ClubRecommendation {
	readonly club: ClubType;
	readonly expectedValue: number;
	readonly fairwayKeepRate: number;
	readonly hazardRisk: number;
	readonly distanceMean: number;
	readonly distanceStdDev: number;
	readonly isGeneric: boolean;
}

/** 推薦エンジンのインターフェース (将来の ML 移行用) */
export interface RecommendationEngine {
	recommend(
		currentPosition: Coordinate,
		targetPosition: Coordinate,
		hazards: readonly Hazard[],
		shots: readonly Shot[],
		roundCount: number,
	): readonly ClubRecommendation[];
}

/** クラブ別の飛距離統計を取得 */
function getClubDistanceStats(shots: readonly Shot[], club: ClubType): { mean: number; stdDev: number } | null {
	const distances = shots.filter((s) => s.club === club).map((s) => s.distanceYards);
	if (distances.length === 0) return null;
	return { mean: mean(distances), stdDev: stdDev(distances) };
}

/** フェアウェイ/グリーンオン確率を計算 */
function calculateFairwayRate(targetDistance: number, clubMean: number, clubStdDev: number, tolerance: number): number {
	if (clubStdDev <= 0) return targetDistance === clubMean ? 1 : 0;
	// ターゲット距離 +/- tolerance の範囲に入る確率
	const lower = normalCdf(targetDistance - tolerance, clubMean, clubStdDev);
	const upper = normalCdf(targetDistance + tolerance, clubMean, clubStdDev);
	return upper - lower;
}

/** ハザード到達確率を計算 (ユークリッド距離) */
function calculateHazardRisk(
	currentPosition: Coordinate,
	hazards: readonly Hazard[],
	clubMean: number,
	clubStdDev: number,
): number {
	if (hazards.length === 0) return 0;
	if (clubStdDev <= 0) return 0;

	let totalRisk = 0;
	for (const hazard of hazards) {
		const hazardDistance = euclideanDistanceYards(currentPosition, hazard.position);
		const hazardNear = hazardDistance - hazard.radiusYards;
		const hazardFar = hazardDistance + hazard.radiusYards;

		// ハザード範囲に飛距離が入る確率
		const probability = normalCdf(hazardFar, clubMean, clubStdDev) - normalCdf(hazardNear, clubMean, clubStdDev);
		const penalty = HAZARD_PENALTY[hazard.type] ?? 1.0;
		totalRisk += probability * penalty;
	}

	return totalRisk;
}

/** ルールベース推薦エンジン */
export class RuleBasedEngine implements RecommendationEngine {
	/** コールドスタート閾値 (ラウンド数) */
	private readonly coldStartThreshold: number;

	constructor(coldStartThreshold = 5) {
		this.coldStartThreshold = coldStartThreshold;
	}

	recommend(
		currentPosition: Coordinate,
		targetPosition: Coordinate,
		hazards: readonly Hazard[],
		shots: readonly Shot[],
		roundCount: number,
	): readonly ClubRecommendation[] {
		const targetDistance = euclideanDistanceYards(currentPosition, targetPosition);
		const isGeneric = roundCount < this.coldStartThreshold;
		const tolerance = 15; // ターゲットからの許容誤差 (ヤード)

		const recommendations: ClubRecommendation[] = [];

		for (const [club, genericStats] of GENERIC_STATS) {
			// putter はティーショット推薦対象外
			if (club === "putter" && targetDistance > 30) continue;

			let clubMean: number;
			let clubStdDev: number;
			let useGeneric: boolean;

			if (isGeneric) {
				clubMean = genericStats.mean;
				clubStdDev = genericStats.stdDev;
				useGeneric = true;
			} else {
				const userStats = getClubDistanceStats(shots, club);
				if (userStats && userStats.stdDev > 0) {
					clubMean = userStats.mean;
					clubStdDev = userStats.stdDev;
					useGeneric = false;
				} else {
					clubMean = genericStats.mean;
					clubStdDev = genericStats.stdDev;
					useGeneric = true;
				}
			}

			const fairwayKeepRate = calculateFairwayRate(targetDistance, clubMean, clubStdDev, tolerance);
			const hazardRisk = calculateHazardRisk(currentPosition, hazards, clubMean, clubStdDev);

			// 期待値 = フェアウェイキープ率 - ハザードリスク
			const expectedValue = fairwayKeepRate - hazardRisk;

			recommendations.push({
				club,
				expectedValue,
				fairwayKeepRate,
				hazardRisk,
				distanceMean: clubMean,
				distanceStdDev: clubStdDev,
				isGeneric: useGeneric,
			});
		}

		// 期待値降順でソート、上位3つを返す
		return [...recommendations].sort((a, b) => b.expectedValue - a.expectedValue).slice(0, 3);
	}
}
