/**
 * ショット散布図コンポーネント
 *
 * 着弾点の2Dプロットをクラブ別色分けで表示する。
 * ツールチップ対応（ホバー/タップで詳細表示）。
 */

import * as d3 from "d3";
import { useEffect, useRef, useState } from "react";
import type { Shot } from "../types/shot";

interface ShotScatterProps {
	readonly shots: readonly Shot[];
	readonly width?: number;
	readonly height?: number;
	/** パフォーマンス上限: 10,000ショット */
	readonly maxShots?: number;
}

const MAX_SHOTS_DEFAULT = 10000;

export function ShotScatter({ shots, width = 500, height = 400, maxShots = MAX_SHOTS_DEFAULT }: ShotScatterProps) {
	const svgRef = useRef<SVGSVGElement>(null);
	const [tooltip, setTooltip] = useState<{
		x: number;
		y: number;
		text: string;
	} | null>(null);

	const displayShots = shots.length > maxShots ? shots.slice(-maxShots) : shots;
	const isTruncated = shots.length > maxShots;

	useEffect(() => {
		const svg = svgRef.current;
		if (!svg || displayShots.length === 0) return;

		const margin = { top: 20, right: 20, bottom: 40, left: 50 };
		const innerWidth = width - margin.left - margin.right;
		const innerHeight = height - margin.top - margin.bottom;

		const d3Svg = d3.select(svg);
		d3Svg.selectAll("*").remove();
		d3Svg.attr("width", width).attr("height", height);

		const g = d3Svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

		// スケール
		const xExtent = d3.extent(displayShots, (s) => s.landingPosition.lng) as [number, number];
		const yExtent = d3.extent(displayShots, (s) => s.landingPosition.lat) as [number, number];

		const xScale = d3
			.scaleLinear()
			.domain([xExtent[0] - 5, xExtent[1] + 5])
			.range([0, innerWidth]);
		const yScale = d3
			.scaleLinear()
			.domain([yExtent[0] - 5, yExtent[1] + 5])
			.range([innerHeight, 0]);

		const colorScale = d3
			.scaleOrdinal<string>()
			.domain(["driver", "3w", "5w", "7w", "3i", "4i", "5i", "6i", "7i", "8i", "9i", "pw", "aw", "sw", "lw", "putter"])
			.range(d3.schemeCategory10);

		// 軸
		g.append("g")
			.attr("transform", `translate(0,${innerHeight})`)
			.call(d3.axisBottom(xScale).ticks(8))
			.selectAll("text")
			.attr("font-size", "10px");

		g.append("g").call(d3.axisLeft(yScale).ticks(8)).selectAll("text").attr("font-size", "10px");

		// ドット描画
		g.selectAll("circle")
			.data(displayShots)
			.join("circle")
			.attr("cx", (d) => xScale(d.landingPosition.lng))
			.attr("cy", (d) => yScale(d.landingPosition.lat))
			.attr("r", 5)
			.attr("fill", (d) => colorScale(d.club))
			.attr("stroke", "#ffffff")
			.attr("stroke-width", 1)
			.attr("opacity", 0.7)
			.on("mouseenter", (_event, d) => {
				const x = xScale(d.landingPosition.lng) + margin.left;
				const y = yScale(d.landingPosition.lat) + margin.top - 15;
				setTooltip({
					x,
					y,
					text: `#${d.shotNumber} ${d.club} ${d.distanceYards}yd`,
				});
			})
			.on("mouseleave", () => {
				setTooltip(null);
			});

		// タイトル
		g.append("text")
			.attr("x", innerWidth / 2)
			.attr("y", -5)
			.attr("text-anchor", "middle")
			.attr("font-size", "14px")
			.attr("font-weight", "bold")
			.attr("fill", "#1f2937")
			.text("ショット散布図");
	}, [displayShots, width, height]);

	if (displayShots.length === 0) {
		return <div style={{ padding: "16px", textAlign: "center", color: "#6b7280" }}>ショットデータがありません</div>;
	}

	return (
		<div style={{ position: "relative" }}>
			{isTruncated && (
				<div
					role="alert"
					style={{
						padding: "4px 8px",
						backgroundColor: "#fef3c7",
						color: "#92400e",
						fontSize: "12px",
						borderRadius: "4px",
						marginBottom: "4px",
					}}
				>
					パフォーマンスのため直近{maxShots.toLocaleString()}件を表示しています
				</div>
			)}
			<svg ref={svgRef} style={{ maxWidth: "100%" }} />
			{tooltip && (
				<div
					style={{
						position: "absolute",
						left: `${tooltip.x}px`,
						top: `${tooltip.y}px`,
						backgroundColor: "#1f2937",
						color: "#ffffff",
						padding: "4px 8px",
						borderRadius: "4px",
						fontSize: "12px",
						pointerEvents: "none",
						transform: "translateX(-50%)",
						whiteSpace: "nowrap",
					}}
				>
					{tooltip.text}
				</div>
			)}
		</div>
	);
}
