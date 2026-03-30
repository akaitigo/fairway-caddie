/** クラブ種別 */
export const CLUB_TYPES = [
	"driver",
	"3w",
	"5w",
	"7w",
	"3i",
	"4i",
	"5i",
	"6i",
	"7i",
	"8i",
	"9i",
	"pw",
	"aw",
	"sw",
	"lw",
	"putter",
] as const;

export type ClubType = (typeof CLUB_TYPES)[number];

/** クラブ定義 */
export interface Club {
	readonly id: string;
	readonly type: ClubType;
	/** ユーザーカスタム名 (最大30文字) */
	readonly customName: string;
}

/** クラブ名バリデーション */
export function validateClubName(name: string): string | null {
	if (name.trim().length === 0) {
		return "クラブ名は空にできません";
	}
	if (name.length > 30) {
		return "クラブ名は30文字以内にしてください";
	}
	return null;
}

/** ClubType のガード */
export function isClubType(value: unknown): value is ClubType {
	return typeof value === "string" && (CLUB_TYPES as readonly string[]).includes(value);
}
