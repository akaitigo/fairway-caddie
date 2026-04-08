package service

import (
	"math"

	"github.com/ryusei/fairway-caddie/api/internal/model"
)

// Mean は平均を計算する。
func Mean(values []float64) float64 {
	if len(values) == 0 {
		return 0
	}
	var sum float64
	for _, v := range values {
		sum += v
	}
	return sum / float64(len(values))
}

// Variance は母分散を計算する。
func Variance(values []float64) float64 {
	if len(values) == 0 {
		return 0
	}
	avg := Mean(values)
	var sumSq float64
	for _, v := range values {
		d := v - avg
		sumSq += d * d
	}
	return sumSq / float64(len(values))
}

// StdDev は標準偏差を計算する。
func StdDev(values []float64) float64 {
	return math.Sqrt(Variance(values))
}

// GroupDistancesByClub はショットデータからクラブ別の飛距離リストを抽出する。
func GroupDistancesByClub(shots []model.Shot) map[model.ClubType][]float64 {
	result := make(map[model.ClubType][]float64)
	for _, s := range shots {
		result[s.Club] = append(result[s.Club], s.DistanceYards)
	}
	return result
}

// CalculateClubStats はクラブ別の飛距離統計を計算する。
func CalculateClubStats(shots []model.Shot) []model.DistanceStats {
	grouped := GroupDistancesByClub(shots)
	var stats []model.DistanceStats

	for clubType, distances := range grouped {
		if len(distances) == 0 {
			continue
		}
		stats = append(stats, model.DistanceStats{
			ClubType: clubType,
			Count:    len(distances),
			Mean:     Mean(distances),
			Variance: Variance(distances),
			StdDev:   StdDev(distances),
			Min:      minOf(distances),
			Max:      maxOf(distances),
		})
	}

	return stats
}

// NormalPdf は正規分布の確率密度関数 (PDF) を計算する。
func NormalPdf(x, mu, sigma float64) float64 {
	if sigma <= 0 {
		return 0
	}
	z := (x - mu) / sigma
	return math.Exp(-0.5*z*z) / (sigma * math.Sqrt(2*math.Pi))
}

// NormalCdf は正規分布の累積分布関数 (CDF) の近似を計算する。
func NormalCdf(x, mu, sigma float64) float64 {
	if sigma <= 0 {
		if x >= mu {
			return 1
		}
		return 0
	}
	z := (x - mu) / sigma
	return 0.5 * (1 + erf(z/math.Sqrt2))
}

// erf は誤差関数の近似 (Abramowitz and Stegun)。
func erf(x float64) float64 {
	const (
		a1 = 0.254829592
		a2 = -0.284496736
		a3 = 1.421413741
		a4 = -1.453152027
		a5 = 1.061405429
		p  = 0.3275911
	)

	sign := 1.0
	if x < 0 {
		sign = -1.0
	}
	absX := math.Abs(x)
	t := 1.0 / (1.0 + p*absX)
	y := 1.0 - ((((a5*t+a4)*t+a3)*t+a2)*t+a1)*t*math.Exp(-absX*absX)
	return sign * y
}

func minOf(values []float64) float64 {
	result := math.Inf(1)
	for _, v := range values {
		if v < result {
			result = v
		}
	}
	return result
}

func maxOf(values []float64) float64 {
	result := math.Inf(-1)
	for _, v := range values {
		if v > result {
			result = v
		}
	}
	return result
}
