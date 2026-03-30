import type { Shot } from "./shot";

/** ラウンド定義 */
export interface Round {
	readonly id: string;
	readonly courseId: string;
	readonly date: string;
	readonly shots: readonly Shot[];
	readonly totalScore: number | null;
}

/** ラウンド日時バリデーション */
export function validateRoundDate(date: string): string | null {
	const parsed = new Date(date);
	if (Number.isNaN(parsed.getTime())) {
		return "有効な日付を指定してください";
	}
	if (parsed.getTime() > Date.now()) {
		return "未来日のラウンドは登録できません";
	}
	return null;
}
