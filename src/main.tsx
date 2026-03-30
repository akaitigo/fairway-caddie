import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

function App() {
	return (
		<StrictMode>
			<div>
				<h1>fairway-caddie</h1>
				<p>クラブ別飛距離分布を可視化し、コース攻略を確率的に最適化するAIキャディ</p>
			</div>
		</StrictMode>
	);
}

const root = document.getElementById("root");
if (root) {
	createRoot(root).render(<App />);
}
