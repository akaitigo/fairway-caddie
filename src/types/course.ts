import type { Coordinate } from "./shot";

/** ハザード種別 */
export const HAZARD_TYPES = ["bunker", "water", "ob", "tree", "rough"] as const;

export type HazardType = (typeof HAZARD_TYPES)[number];

/** ハザード定義 */
export interface Hazard {
	readonly id: string;
	readonly type: HazardType;
	readonly position: Coordinate;
	/** ハザードの半径 (ヤード) */
	readonly radiusYards: number;
}

/** ホール定義 */
export interface Hole {
	readonly number: number;
	readonly par: number;
	/** ティーからピンまでの距離 (ヤード) */
	readonly distanceYards: number;
	readonly teePosition: Coordinate;
	readonly pinPosition: Coordinate;
	readonly fairwayCenter: Coordinate;
	readonly hazards: readonly Hazard[];
}

/** コース定義 */
export interface Course {
	readonly id: string;
	readonly name: string;
	readonly holes: readonly Hole[];
}

/** HazardType のガード */
export function isHazardType(value: unknown): value is HazardType {
	return typeof value === "string" && (HAZARD_TYPES as readonly string[]).includes(value);
}
