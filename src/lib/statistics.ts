/**
 * クラブ別飛距離統計計算
 *
 * 平均・分散・標準偏差を計算する。
 * 将来の D3.js 可視化や推薦エンジンと連携する。
 */

import type { ClubType } from "../types/club";
import type { Shot } from "../types/shot";

/** 統計結果 */
export interface DistanceStats {
	readonly clubType: ClubType;
	readonly count: number;
	readonly mean: number;
	readonly variance: number;
	readonly stdDev: number;
	readonly min: number;
	readonly max: number;
}

/** 平均を計算 */
export function mean(values: readonly number[]): number {
	if (values.length === 0) return 0;
	let sum = 0;
	for (const v of values) {
		sum += v;
	}
	return sum / values.length;
}

/** 分散を計算 (母分散) */
export function variance(values: readonly number[]): number {
	if (values.length === 0) return 0;
	const avg = mean(values);
	let sumSq = 0;
	for (const v of values) {
		sumSq += (v - avg) ** 2;
	}
	return sumSq / values.length;
}

/** 標準偏差を計算 */
export function stdDev(values: readonly number[]): number {
	return Math.sqrt(variance(values));
}

/** ショットデータからクラブ別の飛距離リストを抽出 */
export function groupDistancesByClub(shots: readonly Shot[]): ReadonlyMap<ClubType, readonly number[]> {
	const map = new Map<ClubType, number[]>();
	for (const shot of shots) {
		const existing = map.get(shot.club);
		if (existing) {
			existing.push(shot.distanceYards);
		} else {
			map.set(shot.club, [shot.distanceYards]);
		}
	}
	return map;
}

/** クラブ別の飛距離統計を計算 */
export function calculateClubStats(shots: readonly Shot[]): readonly DistanceStats[] {
	const grouped = groupDistancesByClub(shots);
	const stats: DistanceStats[] = [];

	for (const [clubType, distances] of grouped) {
		if (distances.length === 0) continue;
		stats.push({
			clubType,
			count: distances.length,
			mean: mean(distances),
			variance: variance(distances),
			stdDev: stdDev(distances),
			min: Math.min(...distances),
			max: Math.max(...distances),
		});
	}

	return stats;
}

/**
 * 正規分布の確率密度関数 (PDF)
 * 推薦エンジンでの飛距離分布計算に使用
 */
export function normalPdf(x: number, mu: number, sigma: number): number {
	if (sigma <= 0) return 0;
	const z = (x - mu) / sigma;
	return Math.exp(-0.5 * z * z) / (sigma * Math.sqrt(2 * Math.PI));
}

/**
 * 正規分布の累積分布関数 (CDF) の近似
 * ハザード到達確率の計算に使用
 */
export function normalCdf(x: number, mu: number, sigma: number): number {
	if (sigma <= 0) return x >= mu ? 1 : 0;
	const z = (x - mu) / sigma;
	return 0.5 * (1 + erf(z / Math.SQRT2));
}

/**
 * 誤差関数の近似 (Abramowitz and Stegun)
 */
function erf(x: number): number {
	const a1 = 0.254829592;
	const a2 = -0.284496736;
	const a3 = 1.421413741;
	const a4 = -1.453152027;
	const a5 = 1.061405429;
	const p = 0.3275911;

	const sign = x < 0 ? -1 : 1;
	const absX = Math.abs(x);
	const t = 1 / (1 + p * absX);
	const y = 1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX);
	return sign * y;
}
