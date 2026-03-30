/**
 * 推薦結果の表示UIコンポーネント
 *
 * 推薦クラブのランキング（1位~3位）、
 * 各クラブの期待値スコアと内訳を表示する。
 */

import type { ClubRecommendation } from "../lib/recommendation";

interface RecommendationProps {
	readonly recommendations: readonly ClubRecommendation[];
	readonly isGenericMode: boolean;
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

const RANK_COLORS = ["#eab308", "#9ca3af", "#b45309"];
const RANK_LABELS = ["1st", "2nd", "3rd"];

function formatPercent(value: number): string {
	return `${(value * 100).toFixed(1)}%`;
}

export function Recommendation({ recommendations, isGenericMode }: RecommendationProps) {
	if (recommendations.length === 0) {
		return (
			<div style={{ padding: "16px", textAlign: "center", color: "#6b7280" }}>
				推薦データがありません。ショットを記録してください。
			</div>
		);
	}

	return (
		<div aria-label="クラブ推薦" style={{ padding: "12px" }}>
			<h3 style={{ fontSize: "16px", marginBottom: "8px" }}>クラブ推薦</h3>
			{isGenericMode && (
				<div
					style={{
						padding: "6px 10px",
						backgroundColor: "#fef3c7",
						color: "#92400e",
						fontSize: "12px",
						borderRadius: "4px",
						marginBottom: "12px",
					}}
				>
					データが5ラウンド未満のため、汎用統計に基づく推薦です
				</div>
			)}
			<div
				style={{
					display: "grid",
					gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
					gap: "12px",
				}}
			>
				{recommendations.map((rec, index) => (
					<div
						key={rec.club}
						style={{
							border: "2px solid",
							borderColor: RANK_COLORS[index] ?? "#e5e7eb",
							borderRadius: "10px",
							padding: "14px",
							backgroundColor: index === 0 ? "#fefce8" : "#ffffff",
						}}
					>
						<div
							style={{
								display: "flex",
								justifyContent: "space-between",
								alignItems: "center",
								marginBottom: "10px",
							}}
						>
							<span
								style={{
									fontSize: "12px",
									fontWeight: "bold",
									color: RANK_COLORS[index] ?? "#6b7280",
								}}
							>
								{RANK_LABELS[index]}
							</span>
							<span style={{ fontSize: "18px", fontWeight: "bold" }}>{CLUB_DISPLAY[rec.club] ?? rec.club}</span>
						</div>

						<div style={{ fontSize: "12px", lineHeight: "1.8" }}>
							<div style={{ display: "flex", justifyContent: "space-between" }}>
								<span style={{ color: "#6b7280" }}>期待値:</span>
								<span
									style={{
										fontWeight: "bold",
										color: rec.expectedValue >= 0 ? "#059669" : "#dc2626",
									}}
								>
									{rec.expectedValue.toFixed(3)}
								</span>
							</div>
							<div style={{ display: "flex", justifyContent: "space-between" }}>
								<span style={{ color: "#6b7280" }}>FWキープ率:</span>
								<span>{formatPercent(rec.fairwayKeepRate)}</span>
							</div>
							<div style={{ display: "flex", justifyContent: "space-between" }}>
								<span style={{ color: "#6b7280" }}>ハザードリスク:</span>
								<span
									style={{
										color: rec.hazardRisk > 0.1 ? "#dc2626" : "#059669",
									}}
								>
									{formatPercent(rec.hazardRisk)}
								</span>
							</div>
							<div style={{ display: "flex", justifyContent: "space-between" }}>
								<span style={{ color: "#6b7280" }}>平均飛距離:</span>
								<span>{rec.distanceMean.toFixed(0)}yd</span>
							</div>
							{rec.isGeneric && (
								<div
									style={{
										fontSize: "10px",
										color: "#9ca3af",
										marginTop: "4px",
									}}
								>
									* 汎用統計
								</div>
							)}
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
