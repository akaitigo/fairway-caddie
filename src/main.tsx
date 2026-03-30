import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { ClubSelector } from "./components/ClubSelector";
import { CourseMap } from "./components/CourseMap";
import { ShotList } from "./components/ShotList";
import { useRound } from "./hooks/useRound";

function App() {
	const { round, selectedClub, selectClub, recordShot, undoLastShot, startRound } = useRound();
	const [error, setError] = useState<string | null>(null);

	const handleStartRound = () => {
		startRound("mock-course-001");
		setError(null);
	};

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
