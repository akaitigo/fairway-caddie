/**
 * ラウンド終了サマリーコンポーネント
 *
 * ラウンド終了時にスコア集計・クラブ別統計・ベストショット等を表示する。
 */

import { useMemo } from "react";
import { calculateClubStats } from "../lib/statistics";
import type { Round } from "../types/round";

interface RoundSummaryProps {
	readonly round: Round;
	readonly courseName: string;
	readonly onNewRound: () => void;
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

export function RoundSummary({ round, courseName, onNewRound }: RoundSummaryProps) {
	const stats = useMemo(() => calculateClubStats(round.shots), [round.shots]);

	const totalShots = round.shots.length;

	const longestShot = useMemo(() => {
		if (round.shots.length === 0) return undefined;
		let best = round.shots[0];
		for (const shot of round.shots) {
			if (best && shot.distanceYards > best.distanceYards) {
				best = shot;
			}
		}
		return best;
	}, [round.shots]);

	const averageDistance = useMemo(() => {
		if (round.shots.length === 0) return 0;
		let sum = 0;
		for (const shot of round.shots) {
			sum += shot.distanceYards;
		}
		return Math.round(sum / round.shots.length);
	}, [round.shots]);

	const clubsUsed = useMemo(() => {
		const clubs = new Set<string>();
		for (const shot of round.shots) {
			clubs.add(shot.club);
		}
		return clubs.size;
	}, [round.shots]);

	return (
		<section
			aria-label="ラウンドサマリー"
			style={{
				border: "2px solid #2563eb",
				borderRadius: "12px",
				padding: "20px",
				backgroundColor: "#f0f9ff",
			}}
		>
			<h2
				style={{
					fontSize: "20px",
					marginBottom: "4px",
					color: "#1e40af",
				}}
			>
				ラウンド終了
			</h2>
			<p style={{ color: "#6b7280", margin: "0 0 16px 0", fontSize: "14px" }}>
				{courseName} - {new Date(round.date).toLocaleDateString("ja-JP")}
			</p>

			{/* サマリー数値 */}
			<div
				style={{
					display: "grid",
					gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
					gap: "12px",
					marginBottom: "20px",
				}}
			>
				<SummaryCard label="総ショット数" value={String(totalShots)} />
				<SummaryCard label="使用クラブ数" value={String(clubsUsed)} />
				<SummaryCard label="平均飛距離" value={`${String(averageDistance)}yd`} />
				<SummaryCard
					label="最長飛距離"
					value={longestShot ? `${String(longestShot.distanceYards)}yd` : "-"}
					sub={longestShot ? (CLUB_DISPLAY[longestShot.club] ?? longestShot.club) : undefined}
				/>
			</div>

			{/* クラブ別統計テーブル */}
			{stats.length > 0 && (
				<div style={{ marginBottom: "20px" }}>
					<h3 style={{ fontSize: "16px", marginBottom: "8px" }}>クラブ別統計</h3>
					<table
						style={{
							width: "100%",
							borderCollapse: "collapse",
							fontSize: "13px",
						}}
					>
						<thead>
							<tr
								style={{
									borderBottom: "2px solid #d1d5db",
									textAlign: "left",
								}}
							>
								<th style={{ padding: "6px 8px" }}>クラブ</th>
								<th style={{ padding: "6px 8px", textAlign: "right" }}>回数</th>
								<th style={{ padding: "6px 8px", textAlign: "right" }}>平均</th>
								<th style={{ padding: "6px 8px", textAlign: "right" }}>標準偏差</th>
								<th style={{ padding: "6px 8px", textAlign: "right" }}>最長</th>
							</tr>
						</thead>
						<tbody>
							{stats.map((s) => (
								<tr key={s.clubType} style={{ borderBottom: "1px solid #e5e7eb" }}>
									<td style={{ padding: "6px 8px", fontWeight: "bold" }}>{CLUB_DISPLAY[s.clubType] ?? s.clubType}</td>
									<td style={{ padding: "6px 8px", textAlign: "right" }}>{s.count}</td>
									<td style={{ padding: "6px 8px", textAlign: "right" }}>{s.mean.toFixed(1)}yd</td>
									<td style={{ padding: "6px 8px", textAlign: "right" }}>{s.stdDev.toFixed(1)}yd</td>
									<td style={{ padding: "6px 8px", textAlign: "right" }}>{s.max}yd</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}

			{totalShots === 0 && (
				<p style={{ color: "#6b7280", textAlign: "center", padding: "16px" }}>ショットデータがありません。</p>
			)}

			{/* 新規ラウンドボタン */}
			<button
				type="button"
				onClick={onNewRound}
				style={{
					width: "100%",
					padding: "12px 24px",
					fontSize: "16px",
					backgroundColor: "#2563eb",
					color: "#ffffff",
					border: "none",
					borderRadius: "8px",
					cursor: "pointer",
				}}
			>
				新しいラウンドを開始
			</button>
		</section>
	);
}

/** サマリーカード小コンポーネント */
function SummaryCard({ label, value, sub }: { readonly label: string; readonly value: string; readonly sub?: string }) {
	return (
		<div
			style={{
				backgroundColor: "#ffffff",
				border: "1px solid #e5e7eb",
				borderRadius: "8px",
				padding: "12px",
				textAlign: "center",
			}}
		>
			<div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "4px" }}>{label}</div>
			<div style={{ fontSize: "22px", fontWeight: "bold", color: "#1f2937" }}>{value}</div>
			{sub && <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "2px" }}>{sub}</div>}
		</div>
	);
}
