/**
 * ラウンド状態管理のカスタムフック
 *
 * ショットの記録、アンドゥ、クラブ選択の管理を行う。
 * ローカルストレージと連携して永続化する。
 */

import { useCallback, useState } from "react";
import { LocalStorageAdapter } from "../lib/storage";
import type { ClubType } from "../types/club";
import type { Round } from "../types/round";
import type { Coordinate, Shot } from "../types/shot";
import { validateCoordinate, validateDistance } from "../types/shot";

const storage = new LocalStorageAdapter();
const ROUNDS_KEY = "rounds";

/** 座標間の距離をヤードで計算 (Haversine formula) */
function calculateDistanceYards(from: Coordinate, to: Coordinate): number {
	const R = 6371000; // 地球の半径 (メートル)
	const toRad = (deg: number) => (deg * Math.PI) / 180;

	const dLat = toRad(to.lat - from.lat);
	const dLng = toRad(to.lng - from.lng);
	const a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos(toRad(from.lat)) * Math.cos(toRad(to.lat)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	const meters = R * c;
	return meters * 1.09361; // メートル → ヤード
}

/** ユニークIDを生成 */
function generateId(): string {
	return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export interface UseRoundReturn {
	readonly round: Round | null;
	readonly selectedClub: ClubType | null;
	readonly lastShotPosition: Coordinate | null;
	readonly selectClub: (club: ClubType) => void;
	readonly recordShot: (position: Coordinate) => string | null;
	readonly undoLastShot: () => void;
	readonly startRound: (courseId: string) => void;
	readonly endRound: (totalScore: number) => void;
}

export function useRound(): UseRoundReturn {
	const [round, setRound] = useState<Round | null>(null);
	const [selectedClub, setSelectedClub] = useState<ClubType | null>(null);
	const [lastShotPosition, setLastShotPosition] = useState<Coordinate | null>(null);

	const selectClub = useCallback((club: ClubType) => {
		setSelectedClub(club);
	}, []);

	const startRound = useCallback((courseId: string) => {
		const newRound: Round = {
			id: generateId(),
			courseId,
			date: new Date().toISOString(),
			shots: [],
			totalScore: null,
		};
		setRound(newRound);
		setLastShotPosition(null);
		setSelectedClub(null);
	}, []);

	const recordShot = useCallback(
		(position: Coordinate): string | null => {
			if (!round) return "ラウンドが開始されていません";
			if (!selectedClub) return "クラブが選択されていません";

			const coordError = validateCoordinate(position);
			if (coordError) return coordError;

			const currentHole = round.shots.length > 0 ? (round.shots[round.shots.length - 1]?.holeNumber ?? 1) : 1;

			const shotNumber = round.shots.filter((s) => s.holeNumber === currentHole).length + 1;

			// 飛距離: 前のショットの着弾位置から計算、なければ0
			const distanceYards = lastShotPosition ? calculateDistanceYards(lastShotPosition, position) : 0;

			const distanceError = validateDistance(distanceYards);
			if (distanceError) return distanceError;

			const shot: Shot = {
				id: generateId(),
				roundId: round.id,
				holeNumber: currentHole,
				shotNumber,
				club: selectedClub,
				position: lastShotPosition ?? position,
				landingPosition: position,
				distanceYards: Math.round(distanceYards),
				timestamp: new Date().toISOString(),
			};

			const updatedRound: Round = {
				...round,
				shots: [...round.shots, shot],
			};
			setRound(updatedRound);
			setLastShotPosition(position);
			return null;
		},
		[round, selectedClub, lastShotPosition],
	);

	const undoLastShot = useCallback(() => {
		if (!round || round.shots.length === 0) return;

		const shots = round.shots.slice(0, -1);
		const prevPosition = shots.length > 0 ? (shots[shots.length - 1]?.landingPosition ?? null) : null;

		setRound({ ...round, shots });
		setLastShotPosition(prevPosition);
	}, [round]);

	const endRound = useCallback(
		(totalScore: number) => {
			if (!round) return;

			const finalRound: Round = {
				...round,
				totalScore,
			};
			storage.save(ROUNDS_KEY, finalRound);
			setRound(finalRound);
		},
		[round],
	);

	return {
		round,
		selectedClub,
		lastShotPosition,
		selectClub,
		recordShot,
		undoLastShot,
		startRound,
		endRound,
	};
}
