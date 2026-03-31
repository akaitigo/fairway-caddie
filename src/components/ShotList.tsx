/**
 * ショット一覧コンポーネント
 *
 * 現在のラウンドで記録済みのショットを時系列で表示する。
 */

import type { Shot } from "../types/shot";

interface ShotListProps {
	readonly shots: readonly Shot[];
	readonly onUndo: () => void;
}

const CLUB_DISPLAY: Record<string, string> = {
	driver: "ドライバー",
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
	putter: "パター",
};

function formatTime(timestamp: string): string {
	const date = new Date(timestamp);
	return date.toLocaleTimeString("ja-JP", {
		hour: "2-digit",
		minute: "2-digit",
	});
}

export function ShotList({ shots, onUndo }: ShotListProps) {
	if (shots.length === 0) {
		return (
			<section style={{ padding: "16px", textAlign: "center", color: "#6b7280" }} aria-label="ショット一覧">
				ショットが記録されていません。マップをタップしてショットを記録してください。
			</section>
		);
	}

	return (
		<section aria-label="ショット一覧">
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					padding: "8px 12px",
				}}
			>
				<h3 style={{ margin: 0, fontSize: "16px" }}>ショット一覧 ({shots.length})</h3>
				<button
					type="button"
					onClick={onUndo}
					aria-label="最後のショットを取り消す"
					style={{
						padding: "6px 12px",
						fontSize: "12px",
						backgroundColor: "#fef2f2",
						color: "#dc2626",
						border: "1px solid #fecaca",
						borderRadius: "6px",
						cursor: "pointer",
					}}
				>
					取り消し
				</button>
			</div>
			<ul
				style={{
					listStyle: "none",
					padding: 0,
					margin: 0,
					maxHeight: "200px",
					overflowY: "auto",
				}}
			>
				{shots.map((shot, index) => (
					<li
						key={shot.id}
						style={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
							padding: "8px 12px",
							borderBottom: "1px solid #e5e7eb",
							backgroundColor: index % 2 === 0 ? "#ffffff" : "#f9fafb",
						}}
					>
						<span style={{ fontWeight: "bold", minWidth: "24px" }}>#{shot.shotNumber}</span>
						<span style={{ flex: 1, marginLeft: "8px" }}>{CLUB_DISPLAY[shot.club] ?? shot.club}</span>
						<span style={{ color: "#4b5563", marginRight: "8px" }}>{shot.distanceYards}yd</span>
						<span style={{ color: "#9ca3af", fontSize: "12px" }}>{formatTime(shot.timestamp)}</span>
					</li>
				))}
			</ul>
		</section>
	);
}
