import { StrictMode, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { ClubComparison } from "./components/ClubComparison";
import { ClubSelector } from "./components/ClubSelector";
import { CourseMap } from "./components/CourseMap";
import { DistanceDistribution } from "./components/DistanceDistribution";
import { ShotList } from "./components/ShotList";
import { ShotScatter } from "./components/ShotScatter";
import { StatsPanel } from "./components/StatsPanel";
import { useRound } from "./hooks/useRound";
import { calculateClubStats, groupDistancesByClub } from "./lib/statistics";

function App() {
	const { round, selectedClub, selectClub, recordShot, undoLastShot, startRound } = useRound();
	const [error, setError] = useState<string | null>(null);
	const [showStats, setShowStats] = useState(false);

	const handleStartRound = () => {
		startRound("mock-course-001");
		setError(null);
	};

	const stats = useMemo(() => (round ? calculateClubStats(round.shots) : []), [round]);

	const distancesByClub = useMemo(() => (round ? groupDistancesByClub(round.shots) : new Map()), [round]);

	return (
		<StrictMode>
			<div style={{ maxWidth: "800px", margin: "0 auto", padding: "16px" }}>
				<h1 style={{ fontSize: "24px", marginBottom: "8px" }}>fairway-caddie</h1>
				<p style={{ color: "#6b7280", marginBottom: "16px" }}>
					クラブ別飛距離分布を可視化し、コース攻略を確率的に最適化するAIキャディ
				</p>

				{!round ? (
					<button
						type="button"
						onClick={handleStartRound}
						style={{
							padding: "12px 24px",
							fontSize: "16px",
							backgroundColor: "#2563eb",
							color: "#ffffff",
							border: "none",
							borderRadius: "8px",
							cursor: "pointer",
						}}
					>
						ラウンドを開始
					</button>
				) : (
					<>
						<CourseMap
							shots={round.shots}
							onTap={(position) => {
								const err = recordShot(position);
								setError(err);
							}}
							disabled={!selectedClub}
						/>

						{error && (
							<div
								role="alert"
								style={{
									padding: "8px 12px",
									backgroundColor: "#fef2f2",
									color: "#dc2626",
									borderRadius: "6px",
									margin: "8px 0",
								}}
							>
								{error}
							</div>
						)}

						<ClubSelector selectedClub={selectedClub} onSelect={selectClub} />

						<ShotList shots={round.shots} onUndo={undoLastShot} />

						{round.shots.length > 0 && (
							<>
								<button
									type="button"
									onClick={() => setShowStats((prev) => !prev)}
									style={{
										padding: "8px 16px",
										fontSize: "14px",
										backgroundColor: "#f3f4f6",
										color: "#1f2937",
										border: "1px solid #d1d5db",
										borderRadius: "6px",
										cursor: "pointer",
										margin: "12px 0",
									}}
								>
									{showStats ? "統計を閉じる" : "統計を表示"}
								</button>

								{showStats && (
									<div>
										<StatsPanel stats={stats} />
										<ClubComparison stats={stats} />
										<ShotScatter shots={round.shots} />
										{[...distancesByClub.entries()].map(([club, distances]) => (
											<DistanceDistribution key={club} distances={distances} clubName={club} />
										))}
									</div>
								)}
							</>
						)}
					</>
				)}
			</div>
		</StrictMode>
	);
}

const root = document.getElementById("root");
if (root) {
	createRoot(root).render(<App />);
}
