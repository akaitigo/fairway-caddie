/**
 * コースマップコンポーネント
 *
 * D3.js (SVG) でコースマップを描画し、タップ/クリックでショット位置を記録する。
 * MVP ではモックコースレイアウトを使用する。
 */

import * as d3 from "d3";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Coordinate, Shot } from "../types/shot";

interface CourseMapProps {
	readonly shots: readonly Shot[];
	readonly onTap: (position: Coordinate) => void;
	readonly disabled?: boolean;
}

/** MVP用モックコースのサイズ (ヤード) */
const COURSE_WIDTH = 400;
const COURSE_HEIGHT = 150;

/** デバウンス用タイマー */
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
const DEBOUNCE_MS = 300;

export function CourseMap({ shots, onTap, disabled = false }: CourseMapProps) {
	const svgRef = useRef<SVGSVGElement>(null);
	const containerRef = useRef<HTMLElement>(null);
	const [dimensions, setDimensions] = useState({ width: 600, height: 300 });

	// レスポンシブ対応: リサイズ監視
	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		const observer = new ResizeObserver((entries) => {
			const entry = entries[0];
			if (entry) {
				const { width } = entry.contentRect;
				setDimensions({
					width: Math.max(width, 300),
					height: Math.max(width * 0.5, 200),
				});
			}
		});

		observer.observe(container);
		return () => observer.disconnect();
	}, []);

	// D3.js によるコースマップ描画
	useEffect(() => {
		const svg = svgRef.current;
		if (!svg) return;

		const { width, height } = dimensions;
		const margin = { top: 20, right: 20, bottom: 20, left: 20 };
		const innerWidth = width - margin.left - margin.right;
		const innerHeight = height - margin.top - margin.bottom;

		// スケール: コース座標 → SVG座標
		const xScale = d3.scaleLinear().domain([0, COURSE_WIDTH]).range([0, innerWidth]);
		const yScale = d3.scaleLinear().domain([0, COURSE_HEIGHT]).range([innerHeight, 0]);

		const d3Svg = d3.select(svg);
		d3Svg.selectAll("*").remove();

		const g = d3Svg
			.attr("width", width)
			.attr("height", height)
			.append("g")
			.attr("transform", `translate(${margin.left},${margin.top})`);

		// フェアウェイ (背景)
		g.append("rect")
			.attr("x", 0)
			.attr("y", 0)
			.attr("width", innerWidth)
			.attr("height", innerHeight)
			.attr("fill", "#86efac")
			.attr("rx", 8);

		// グリーン
		g.append("ellipse")
			.attr("cx", xScale(370))
			.attr("cy", yScale(75))
			.attr("rx", xScale(30) - xScale(0))
			.attr("ry", (yScale(0) - yScale(25)) / 2)
			.attr("fill", "#22c55e");

		// バンカー (モック)
		g.append("ellipse")
			.attr("cx", xScale(200))
			.attr("cy", yScale(120))
			.attr("rx", xScale(15) - xScale(0))
			.attr("ry", (yScale(0) - yScale(10)) / 2)
			.attr("fill", "#fde68a");

		// 池 (モック)
		g.append("ellipse")
			.attr("cx", xScale(280))
			.attr("cy", yScale(30))
			.attr("rx", xScale(20) - xScale(0))
			.attr("ry", (yScale(0) - yScale(15)) / 2)
			.attr("fill", "#93c5fd");

		// ティーイングエリア
		g.append("rect")
			.attr("x", xScale(0))
			.attr("y", yScale(85))
			.attr("width", xScale(15) - xScale(0))
			.attr("height", yScale(65) - yScale(85))
			.attr("fill", "#4ade80")
			.attr("rx", 4);

		// ピン
		g.append("circle").attr("cx", xScale(370)).attr("cy", yScale(75)).attr("r", 3).attr("fill", "#dc2626");

		// ショットをプロット
		const colorScale = d3
			.scaleOrdinal<string>()
			.domain(["driver", "3w", "5w", "7w", "3i", "4i", "5i", "6i", "7i", "8i", "9i", "pw", "aw", "sw", "lw", "putter"])
			.range(d3.schemeCategory10);

		// ショット座標をコース座標に変換 (MVP: 0~400, 0~150の範囲にマッピング)
		for (const shot of shots) {
			// 着弾点をプロット (MVP: 簡易座標マッピング)
			const x = xScale(((shot.landingPosition.lng % COURSE_WIDTH) + COURSE_WIDTH) % COURSE_WIDTH);
			const y = yScale(((shot.landingPosition.lat % COURSE_HEIGHT) + COURSE_HEIGHT) % COURSE_HEIGHT);

			g.append("circle")
				.attr("cx", x)
				.attr("cy", y)
				.attr("r", 6)
				.attr("fill", colorScale(shot.club))
				.attr("stroke", "#ffffff")
				.attr("stroke-width", 2)
				.attr("opacity", 0.8);

			g.append("text")
				.attr("x", x)
				.attr("y", y - 10)
				.attr("text-anchor", "middle")
				.attr("font-size", "10px")
				.attr("fill", "#374151")
				.text(`#${shot.shotNumber}`);
		}
	}, [dimensions, shots]);

	// クリック/タップハンドラ (透明オーバーレイ経由)
	const handleOverlayClick = useCallback(
		(event: React.MouseEvent<HTMLButtonElement>) => {
			if (disabled) return;

			// デバウンス処理
			if (debounceTimer) {
				clearTimeout(debounceTimer);
			}

			debounceTimer = setTimeout(() => {
				const svg = svgRef.current;
				if (!svg) return;

				const rect = svg.getBoundingClientRect();
				const { width, height } = dimensions;
				const margin = { top: 20, right: 20, bottom: 20, left: 20 };

				// SVG座標 → コース座標
				const svgX = event.clientX - rect.left - margin.left;
				const svgY = event.clientY - rect.top - margin.top;
				const innerWidth = width - margin.left - margin.right;
				const innerHeight = height - margin.top - margin.bottom;

				// 有効範囲チェック
				if (svgX < 0 || svgX > innerWidth || svgY < 0 || svgY > innerHeight) {
					return;
				}

				const courseX = (svgX / innerWidth) * COURSE_WIDTH;
				const courseY = COURSE_HEIGHT - (svgY / innerHeight) * COURSE_HEIGHT;

				// MVP: コース座標をそのまま緯度経度として使用
				const position: Coordinate = {
					lat: courseY,
					lng: courseX,
				};

				onTap(position);
			}, DEBOUNCE_MS);
		},
		[disabled, dimensions, onTap],
	);

	return (
		<section
			ref={containerRef}
			aria-label="コースマップ"
			style={{
				width: "100%",
				minWidth: "300px",
				position: "relative",
			}}
		>
			<svg
				ref={svgRef}
				style={{
					width: "100%",
					height: "auto",
					pointerEvents: "none",
				}}
			/>
			{/* 透明なインタラクティブオーバーレイ: SVGの上に重ねてクリック/タッチを受け取る */}
			<button
				type="button"
				onClick={handleOverlayClick}
				aria-label="コースマップをクリックしてショット位置を記録"
				disabled={disabled}
				style={{
					position: "absolute",
					top: 0,
					left: 0,
					width: "100%",
					height: "100%",
					background: "transparent",
					border: "none",
					cursor: disabled ? "not-allowed" : "crosshair",
					touchAction: "none",
					padding: 0,
				}}
			/>
		</section>
	);
}
