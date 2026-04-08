/**
 * ラウンド状態管理のカスタムフック
 *
 * ショットの記録、アンドゥ、クラブ選択の管理を行う。
 * ローカルストレージと連携して永続化する。
 */

import { useCallback, useState } from "react";
import { getTeePosition } from "../lib/courses";
import { LocalStorageAdapter } from "../lib/storage";
import type { ClubType } from "../types/club";
import type { Round } from "../types/round";
import type { Coordinate, Shot } from "../types/shot";
import { euclideanDistanceYards, validateCoordinate, validateDistance } from "../types/shot";

const storage = new LocalStorageAdapter();
const ROUNDS_KEY = "rounds";

/** ユニークIDを生成 */
function generateId(): string {
	return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** ショットの原点座標を決定する */
function resolveOrigin(lastShotPosition: Coordinate | null, courseId: string, holeNumber: number): Coordinate | null {
	if (lastShotPosition) return lastShotPosition;
	return getTeePosition(courseId, holeNumber) ?? null;
}

/** ショットオブジェクトを構築する */
function buildShot(
	round: Round,
	club: ClubType,
	position: Coordinate,
	origin: Coordinate | null,
	holeNumber: number,
	shotNumber: number,
): Shot {
	const distanceYards = origin ? euclideanDistanceYards(origin, position) : 0;
	return {
		id: generateId(),
		roundId: round.id,
		holeNumber,
		shotNumber,
		club,
		position: origin ?? position,
		landingPosition: position,
		distanceYards: Math.round(distanceYards),
		timestamp: new Date().toISOString(),
	};
}

export interface UseRoundReturn {
	readonly round: Round | null;
	readonly selectedClub: ClubType | null;
	readonly selectClub: (club: ClubType) => void;
	readonly recordShot: (position: Coordinate) => string | null;
	readonly undoLastShot: () => void;
	readonly startRound: (courseId: string) => void;
	readonly endRound: (totalScore: number) => string | null;
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

			const origin = resolveOrigin(lastShotPosition, round.courseId, currentHole);
			const distanceYards = origin ? euclideanDistanceYards(origin, position) : 0;

			const distanceError = validateDistance(distanceYards);
			if (distanceError) return distanceError;

			const shot = buildShot(round, selectedClub, position, origin, currentHole, shotNumber);

			setRound({ ...round, shots: [...round.shots, shot] });
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
		(totalScore: number): string | null => {
			if (!round) return "ラウンドが開始されていません";

			const finalRound: Round = {
				...round,
				totalScore,
			};
			const result = storage.save(ROUNDS_KEY, finalRound);
			if (!result.ok) {
				return `ラウンドの保存に失敗しました: ${result.error}`;
			}
			setRound(finalRound);
			return null;
		},
		[round],
	);

	return {
		round,
		selectedClub,
		selectClub,
		recordShot,
		undoLastShot,
		startRound,
		endRound,
	};
}
