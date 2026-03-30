/**
 * クラブ比較コンポーネント
 *
 * 複数クラブの飛距離分布を重ねて比較するグラフ。
 */

import * as d3 from "d3";
import { useEffect, useRef } from "react";
import type { DistanceStats } from "../lib/statistics";

interface ClubComparisonProps {
	readonly stats: readonly DistanceStats[];
	readonly width?: number;
	readonly height?: number;
}

const CLUB_DISPLAY: Record<string, string> = {
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

export function ClubComparison({ stats, width = 500, height = 300 }: ClubComparisonProps) {
	const svgRef = useRef<SVGSVGElement>(null);

	useEffect(() => {
		const svg = svgRef.current;
		if (!svg || stats.length === 0) return;

		const margin = { top: 20, right: 20, bottom: 60, left: 50 };
		const innerWidth = width - margin.left - margin.right;
		const innerHeight = height - margin.top - margin.bottom;

		const d3Svg = d3.select(svg);
		d3Svg.selectAll("*").remove();
		d3Svg.attr("width", width).attr("height", height);

		const g = d3Svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

		// ソート: 平均飛距離の降順
		const sorted = [...stats].sort((a, b) => b.mean - a.mean);

		const xScale = d3
			.scaleBand()
			.domain(sorted.map((s) => s.clubType))
			.range([0, innerWidth])
			.padding(0.2);

		const maxDistance = d3.max(sorted, (s) => s.max) ?? 300;
		const yScale = d3
			.scaleLinear()
			.domain([0, maxDistance + 20])
			.range([innerHeight, 0]);

		const colorScale = d3
			.scaleOrdinal<string>()
			.domain(sorted.map((s) => s.clubType))
			.range(d3.schemeCategory10);

		// バー: 平均飛距離
		g.selectAll(".bar")
			.data(sorted)
			.join("rect")
			.attr("class", "bar")
			.attr("x", (d) => xScale(d.clubType) ?? 0)
			.attr("y", (d) => yScale(d.mean))
			.attr("width", xScale.bandwidth())
			.attr("height", (d) => innerHeight - yScale(d.mean))
			.attr("fill", (d) => colorScale(d.clubType))
			.attr("opacity", 0.7);

		// エラーバー: 標準偏差
		for (const s of sorted) {
			const cx = (xScale(s.clubType) ?? 0) + xScale.bandwidth() / 2;
			g.append("line")
				.attr("x1", cx)
				.attr("x2", cx)
				.attr("y1", yScale(s.mean - s.stdDev))
				.attr("y2", yScale(s.mean + s.stdDev))
				.attr("stroke", "#374151")
				.attr("stroke-width", 2);

			// キャップ (上)
			g.append("line")
				.attr("x1", cx - 5)
				.attr("x2", cx + 5)
				.attr("y1", yScale(s.mean + s.stdDev))
				.attr("y2", yScale(s.mean + s.stdDev))
				.attr("stroke", "#374151")
				.attr("stroke-width", 2);

			// キャップ (下)
			g.append("line")
				.attr("x1", cx - 5)
				.attr("x2", cx + 5)
				.attr("y1", yScale(s.mean - s.stdDev))
				.attr("y2", yScale(s.mean - s.stdDev))
				.attr("stroke", "#374151")
				.attr("stroke-width", 2);
		}

		// X軸
		g.append("g")
			.attr("transform", `translate(0,${innerHeight})`)
			.call(d3.axisBottom(xScale).tickFormat((d) => CLUB_DISPLAY[d] ?? d))
			.selectAll("text")
			.attr("font-size", "10px")
			.attr("transform", "rotate(-45)")
			.attr("text-anchor", "end");

		// Y軸
		g.append("g").call(d3.axisLeft(yScale).ticks(6)).selectAll("text").attr("font-size", "10px");

		// Y軸ラベル
		g.append("text")
			.attr("x", -innerHeight / 2)
			.attr("y", -35)
			.attr("transform", "rotate(-90)")
			.attr("text-anchor", "middle")
			.attr("font-size", "12px")
			.attr("fill", "#374151")
			.text("飛距離 (ヤード)");

		// タイトル
		g.append("text")
			.attr("x", innerWidth / 2)
			.attr("y", -5)
			.attr("text-anchor", "middle")
			.attr("font-size", "14px")
			.attr("font-weight", "bold")
			.attr("fill", "#1f2937")
			.text("クラブ別飛距離比較");
	}, [stats, width, height]);

	if (stats.length === 0) {
		return <div style={{ padding: "16px", textAlign: "center", color: "#6b7280" }}>比較データがありません</div>;
	}

	return <svg ref={svgRef} style={{ maxWidth: "100%" }} />;
}
