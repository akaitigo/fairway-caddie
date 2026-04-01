import { StrictMode, useCallback, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { ClubComparison } from "./components/ClubComparison";
import { ClubSelector } from "./components/ClubSelector";
import { CourseMap } from "./components/CourseMap";
import { DistanceDistribution } from "./components/DistanceDistribution";
import { Recommendation } from "./components/Recommendation";
import { RoundSummary } from "./components/RoundSummary";
import { ShotList } from "./components/ShotList";
import { ShotScatter } from "./components/ShotScatter";
import { StatsPanel } from "./components/StatsPanel";
import { useRound } from "./hooks/useRound";
import { getCourseById, listCourses } from "./lib/courses";
import { RuleBasedEngine } from "./lib/recommendation";
import { calculateClubStats, groupDistancesByClub } from "./lib/statistics";
import type { Hazard } from "./types/course";

const recommendationEngine = new RuleBasedEngine();

/** デフォルトのコースID */
const DEFAULT_COURSE_ID = "mock-course-001";

function App() {
	const { round, selectedClub, selectClub, recordShot, undoLastShot, startRound, endRound } = useRound();
	const [error, setError] = useState<string | null>(null);
	const [showStats, setShowStats] = useState(false);
	const [isRoundEnded, setIsRoundEnded] = useState(false);
	const [selectedCourseId, setSelectedCourseId] = useState(DEFAULT_COURSE_ID);

	const courses = useMemo(() => listCourses(), []);
	const currentCourse = useMemo(() => getCourseById(selectedCourseId), [selectedCourseId]);

	/** 現在のホール番号 (MVPでは常にホール1) */
	const currentHoleNumber = 1;

	/** 現在のホール情報 */
	const currentHole = useMemo(() => {
		if (!currentCourse) return undefined;
		return currentCourse.holes.find((h) => h.number === currentHoleNumber);
	}, [currentCourse]);

	const handleStartRound = useCallback(() => {
		startRound(selectedCourseId);
		setError(null);
		setIsRoundEnded(false);
		setShowStats(false);
	}, [startRound, selectedCourseId]);

	const handleEndRound = useCallback(() => {
		if (!round) return;
		endRound(round.shots.length);
		setIsRoundEnded(true);
	}, [round, endRound]);

	const handleNewRound = useCallback(() => {
		setIsRoundEnded(false);
		setShowStats(false);
		setError(null);
		startRound(selectedCourseId);
	}, [startRound, selectedCourseId]);

	const stats = useMemo(() => (round ? calculateClubStats(round.shots) : []), [round]);

	const distancesByClub = useMemo(() => (round ? groupDistancesByClub(round.shots) : new Map()), [round]);

	// クラブ推薦: ターゲット位置をコースデータから動的に取得
	const recommendations = useMemo(() => {
		if (!round || round.shots.length === 0 || !currentHole) return [];
		const lastShot = round.shots[round.shots.length - 1];
		if (!lastShot) return [];
		const currentPos = lastShot.landingPosition;
		const targetPos = currentHole.pinPosition;
		const hazards: readonly Hazard[] = currentHole.hazards;
		return recommendationEngine.recommend(currentPos, targetPos, hazards, round.shots, 0);
	}, [round, currentHole]);

	return (
		<StrictMode>
			<div style={{ maxWidth: "800px", margin: "0 auto", padding: "16px" }}>
				<h1 style={{ fontSize: "24px", marginBottom: "8px" }}>fairway-caddie</h1>
				<p style={{ color: "#6b7280", marginBottom: "16px" }}>
					クラブ別飛距離分布を可視化し、コース攻略を確率的に最適化するAIキャディ
				</p>

				{!round ? (
					<div>
						{/* コース選択 */}
						<div style={{ marginBottom: "16px" }}>
							<label
								htmlFor="course-select"
								style={{
									display: "block",
									fontSize: "14px",
									color: "#374151",
									marginBottom: "4px",
								}}
							>
								コースを選択:
							</label>
							<select
								id="course-select"
								value={selectedCourseId}
								onChange={(e) => setSelectedCourseId(e.target.value)}
								style={{
									padding: "8px 12px",
									fontSize: "14px",
									border: "1px solid #d1d5db",
									borderRadius: "6px",
									width: "100%",
									maxWidth: "400px",
								}}
							>
								{courses.map((c) => (
									<option key={c.id} value={c.id}>
										{c.name}
									</option>
								))}
							</select>
						</div>
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
					</div>
				) : isRoundEnded ? (
					<RoundSummary round={round} courseName={currentCourse?.name ?? "不明なコース"} onNewRound={handleNewRound} />
				) : (
					<>
						{/* コース情報ヘッダー */}
						{currentHole && (
							<div
								style={{
									display: "flex",
									justifyContent: "space-between",
									alignItems: "center",
									padding: "8px 12px",
									backgroundColor: "#f9fafb",
									borderRadius: "6px",
									marginBottom: "12px",
									fontSize: "14px",
								}}
							>
								<span>
									{currentCourse?.name} - Hole {currentHole.number} (Par {currentHole.par}, {currentHole.distanceYards}
									yd)
								</span>
								<button
									type="button"
									onClick={handleEndRound}
									style={{
										padding: "6px 14px",
										fontSize: "13px",
										backgroundColor: "#dc2626",
										color: "#ffffff",
										border: "none",
										borderRadius: "6px",
										cursor: "pointer",
									}}
								>
									ラウンド終了
								</button>
							</div>
						)}

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

						{recommendations.length > 0 && <Recommendation recommendations={recommendations} isGenericMode={true} />}

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
