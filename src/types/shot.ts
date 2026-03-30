import type { ClubType } from "./club";

/** WGS84 座標 (EPSG:4326) */
export interface Coordinate {
	/** 緯度 (-90.0 ~ 90.0) */
	readonly lat: number;
	/** 経度 (-180.0 ~ 180.0) */
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

/** 座標バリデーション */
export function validateCoordinate(coord: Coordinate): string | null {
	if (coord.lat < -90 || coord.lat > 90) {
		return "緯度は-90~90の範囲で指定してください";
	}
	if (coord.lng < -180 || coord.lng > 180) {
		return "経度は-180~180の範囲で指定してください";
	}
	return null;
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
