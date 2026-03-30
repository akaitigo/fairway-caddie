/**
 * 統計数値パネル
 *
 * 平均・分散・標準偏差・最大・最小を数値で表示する。
 */

import type { DistanceStats } from "../lib/statistics";

interface StatsPanelProps {
	readonly stats: readonly DistanceStats[];
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

export function StatsPanel({ stats }: StatsPanelProps) {
	if (stats.length === 0) {
		return (
			<div style={{ padding: "16px", textAlign: "center", color: "#6b7280" }}>
				統計データがありません。ショットを記録してください。
			</div>
		);
	}

	return (
		<div aria-label="統計パネル" style={{ padding: "12px" }}>
			<h3 style={{ fontSize: "16px", marginBottom: "12px" }}>クラブ別統計</h3>
			<div
				style={{
					display: "grid",
					gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
					gap: "12px",
				}}
			>
				{stats.map((s) => (
					<div
						key={s.clubType}
						style={{
							border: "1px solid #e5e7eb",
							borderRadius: "8px",
							padding: "12px",
							backgroundColor: "#f9fafb",
						}}
					>
						<h4
							style={{
								margin: "0 0 8px 0",
								fontSize: "14px",
								fontWeight: "bold",
							}}
						>
							{CLUB_DISPLAY[s.clubType] ?? s.clubType}
						</h4>
						<div style={{ fontSize: "12px", lineHeight: "1.8" }}>
							<div>
								<span style={{ color: "#6b7280" }}>ショット数:</span> {s.count}
							</div>
							<div>
								<span style={{ color: "#6b7280" }}>平均:</span> {s.mean.toFixed(1)}yd
							</div>
							<div>
								<span style={{ color: "#6b7280" }}>標準偏差:</span> {s.stdDev.toFixed(1)}yd
							</div>
							<div>
								<span style={{ color: "#6b7280" }}>最小:</span> {s.min}yd
							</div>
							<div>
								<span style={{ color: "#6b7280" }}>最大:</span> {s.max}yd
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
