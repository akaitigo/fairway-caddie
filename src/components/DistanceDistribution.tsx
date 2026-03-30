/**
 * クラブ別飛距離分布ヒストグラム
 *
 * D3.js で飛距離のヒストグラムを描画する。
 * 平均線と1σ/2σ範囲を視覚的に表示する。
 */

import * as d3 from "d3";
import { useEffect, useRef } from "react";
import { mean, stdDev } from "../lib/statistics";

interface DistanceDistributionProps {
	readonly distances: readonly number[];
	readonly clubName: string;
	readonly width?: number;
	readonly height?: number;
}

export function DistanceDistribution({ distances, clubName, width = 400, height = 250 }: DistanceDistributionProps) {
	const svgRef = useRef<SVGSVGElement>(null);

	useEffect(() => {
		const svg = svgRef.current;
		if (!svg || distances.length === 0) return;

		const margin = { top: 20, right: 20, bottom: 40, left: 50 };
		const innerWidth = width - margin.left - margin.right;
		const innerHeight = height - margin.top - margin.bottom;

		const d3Svg = d3.select(svg);
		d3Svg.selectAll("*").remove();
		d3Svg.attr("width", width).attr("height", height);

		const g = d3Svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

		// ヒストグラムのビン計算
		const extent = d3.extent(distances) as [number, number];
		const xScale = d3
			.scaleLinear()
			.domain([extent[0] - 10, extent[1] + 10])
			.range([0, innerWidth]);

		const histogram = d3
			.bin()
			.domain(xScale.domain() as [number, number])
			.thresholds(xScale.ticks(15));

		const bins = histogram(distances as number[]);
		const maxCount = d3.max(bins, (d) => d.length) ?? 0;
		const yScale = d3.scaleLinear().domain([0, maxCount]).range([innerHeight, 0]);

		// バー描画
		g.selectAll("rect")
			.data(bins)
			.join("rect")
			.attr("x", (d) => xScale(d.x0 ?? 0))
			.attr("y", (d) => yScale(d.length))
			.attr("width", (d) => Math.max(0, xScale(d.x1 ?? 0) - xScale(d.x0 ?? 0) - 1))
			.attr("height", (d) => innerHeight - yScale(d.length))
			.attr("fill", "#3b82f6")
			.attr("opacity", 0.7);

		// 平均線
		const avg = mean(distances);
		const sd = stdDev(distances);

		g.append("line")
			.attr("x1", xScale(avg))
			.attr("x2", xScale(avg))
			.attr("y1", 0)
			.attr("y2", innerHeight)
			.attr("stroke", "#dc2626")
			.attr("stroke-width", 2)
			.attr("stroke-dasharray", "4,2");

		// 1σ範囲
		g.append("rect")
			.attr("x", xScale(avg - sd))
			.attr("y", 0)
			.attr("width", xScale(avg + sd) - xScale(avg - sd))
			.attr("height", innerHeight)
			.attr("fill", "#fca5a5")
			.attr("opacity", 0.15);

		// 2σ範囲
		g.append("rect")
			.attr("x", xScale(avg - 2 * sd))
			.attr("y", 0)
			.attr("width", xScale(avg + 2 * sd) - xScale(avg - 2 * sd))
			.attr("height", innerHeight)
			.attr("fill", "#fecaca")
			.attr("opacity", 0.1);

		// X軸
		g.append("g")
			.attr("transform", `translate(0,${innerHeight})`)
			.call(d3.axisBottom(xScale).ticks(8))
			.selectAll("text")
			.attr("font-size", "10px");

		// Y軸
		g.append("g").call(d3.axisLeft(yScale).ticks(5)).selectAll("text").attr("font-size", "10px");

		// X軸ラベル
		g.append("text")
			.attr("x", innerWidth / 2)
			.attr("y", innerHeight + 35)
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
			.text(`${clubName} 飛距離分布`);

		// 凡例
		const legend = g.append("g").attr("transform", `translate(${innerWidth - 120}, 10)`);
		legend
			.append("line")
			.attr("x1", 0)
			.attr("x2", 20)
			.attr("y1", 0)
			.attr("y2", 0)
			.attr("stroke", "#dc2626")
			.attr("stroke-width", 2)
			.attr("stroke-dasharray", "4,2");
		legend
			.append("text")
			.attr("x", 25)
			.attr("y", 4)
			.attr("font-size", "10px")
			.attr("fill", "#374151")
			.text(`平均: ${avg.toFixed(1)}yd`);
		legend
			.append("rect")
			.attr("x", 0)
			.attr("y", 10)
			.attr("width", 20)
			.attr("height", 10)
			.attr("fill", "#fca5a5")
			.attr("opacity", 0.3);
		legend
			.append("text")
			.attr("x", 25)
			.attr("y", 19)
			.attr("font-size", "10px")
			.attr("fill", "#374151")
			.text(`1σ: ${sd.toFixed(1)}yd`);
	}, [distances, clubName, width, height]);

	if (distances.length === 0) {
		return <div style={{ padding: "16px", textAlign: "center", color: "#6b7280" }}>データがありません</div>;
	}

	return <svg ref={svgRef} style={{ maxWidth: "100%" }} />;
}
