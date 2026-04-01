import type { ClubType } from "./club";

/** コースマップ上のヤード座標 (横方向: lng, 縦方向: lat) */
export interface Coordinate {
	/** 縦位置 (ヤード, 0 ~ 150) */
	readonly lat: number;
	/** 横位置 (ヤード, 0 ~ 400) */
	readonly lng: number;
}

/** ショット定義 */
export interface Shot {
	readonly id: string;
	readonly roundId: string;
	readonly holeNumber: number;
	readonly shotNumber: number;
	readonly club: ClubType;
	readonly position: Coordinate;
	readonly landingPosition: Coordinate;
	/** 飛距離 (ヤード, 0 ~ 400) */
	readonly distanceYards: number;
	readonly timestamp: string;
}

/** 座標バリデーション (ヤード座標系) */
export function validateCoordinate(coord: Coordinate): string | null {
	if (coord.lat < 0 || coord.lat > 150) {
		return "縦位置は0~150ヤードの範囲で指定してください";
	}
	if (coord.lng < 0 || coord.lng > 400) {
		return "横位置は0~400ヤードの範囲で指定してください";
	}
	return null;
}

/** 2点間のユークリッド距離 (ヤード) */
export function euclideanDistanceYards(from: Coordinate, to: Coordinate): number {
	const dx = to.lng - from.lng;
	const dy = to.lat - from.lat;
	return Math.sqrt(dx * dx + dy * dy);
}

/** 飛距離バリデーション */
export function validateDistance(distance: number): string | null {
	if (distance < 0) {
		return "飛距離は0以上で指定してください";
	}
	if (distance > 400) {
		return "飛距離は400ヤード以下で指定してください";
	}
	return null;
}
