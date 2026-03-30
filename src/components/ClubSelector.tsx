/**
 * クラブ選択コンポーネント
 *
 * ボタングリッドでクラブを選択する。
 * モバイルビューポートで操作しやすいサイズ。
 */

import { CLUB_TYPES, type ClubType } from "../types/club";

interface ClubSelectorProps {
	readonly selectedClub: ClubType | null;
	readonly onSelect: (club: ClubType) => void;
}

const CLUB_LABELS: Record<ClubType, string> = {
	driver: "DR",
	"3w": "3W",
	"5w": "5W",
	"7w": "7W",
	"3i": "3I",
	"4i": "4I",
	"5i": "5I",
	"6i": "6I",
	"7i": "7I",
	"8i": "8I",
	"9i": "9I",
	pw: "PW",
	aw: "AW",
	sw: "SW",
	lw: "LW",
	putter: "PT",
};

export function ClubSelector({ selectedClub, onSelect }: ClubSelectorProps) {
	return (
		<fieldset
			aria-label="クラブ選択"
			style={{
				display: "grid",
				gridTemplateColumns: "repeat(4, 1fr)",
				gap: "8px",
				padding: "12px",
				border: "none",
				margin: 0,
			}}
		>
			{CLUB_TYPES.map((club) => (
				<label
					key={club}
					style={{
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						padding: "12px 8px",
						fontSize: "14px",
						fontWeight: selectedClub === club ? "bold" : "normal",
						backgroundColor: selectedClub === club ? "#2563eb" : "#f3f4f6",
						color: selectedClub === club ? "#ffffff" : "#1f2937",
						border: "1px solid",
						borderColor: selectedClub === club ? "#1d4ed8" : "#d1d5db",
						borderRadius: "8px",
						cursor: "pointer",
						minHeight: "44px",
					}}
				>
					<input
						type="radio"
						name="club"
						value={club}
						checked={selectedClub === club}
						onChange={() => onSelect(club)}
						style={{
							position: "absolute",
							width: "1px",
							height: "1px",
							overflow: "hidden",
							clip: "rect(0,0,0,0)",
						}}
					/>
					{CLUB_LABELS[club]}
				</label>
			))}
		</fieldset>
	);
}
