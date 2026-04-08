package service

import (
	"sort"

	"github.com/ryusei/fairway-caddie/api/internal/model"
)

// ハザード種別ごとのペナルティコスト。
var hazardPenalty = map[model.HazardType]float64{
	model.HazardWater:  2.0,
	model.HazardBunker: 1.0,
	model.HazardOB:     3.0,
	model.HazardTree:   0.5,
	model.HazardRough:  0.3,
}

// genericClubStats はコールドスタート用ジェネリック統計 (プロ平均ベース)。
type genericClubStats struct {
	Mean   float64
	StdDev float64
}

var genericStats = map[model.ClubType]genericClubStats{
	model.ClubDriver: {Mean: 230, StdDev: 20},
	model.Club3W:     {Mean: 210, StdDev: 18},
	model.Club5W:     {Mean: 195, StdDev: 16},
	model.Club7W:     {Mean: 180, StdDev: 15},
	model.Club3I:     {Mean: 180, StdDev: 14},
	model.Club4I:     {Mean: 170, StdDev: 13},
	model.Club5I:     {Mean: 160, StdDev: 12},
	model.Club6I:     {Mean: 150, StdDev: 11},
	model.Club7I:     {Mean: 140, StdDev: 10},
	model.Club8I:     {Mean: 130, StdDev: 9},
	model.Club9I:     {Mean: 120, StdDev: 8},
	model.ClubPW:     {Mean: 110, StdDev: 7},
	model.ClubAW:     {Mean: 95, StdDev: 6},
	model.ClubSW:     {Mean: 80, StdDev: 5},
	model.ClubLW:     {Mean: 60, StdDev: 5},
	model.ClubPutter: {Mean: 10, StdDev: 3},
}

// RecommendationService はクラブ推薦サービス。
type RecommendationService struct {
	coldStartThreshold int
}

// NewRecommendationService は新しい推薦サービスを作成する。
func NewRecommendationService(coldStartThreshold int) *RecommendationService {
	if coldStartThreshold <= 0 {
		coldStartThreshold = 5
	}
	return &RecommendationService{
		coldStartThreshold: coldStartThreshold,
	}
}

// Recommend はクラブ推薦を実行する。
func (rs *RecommendationService) Recommend(
	currentPosition model.Coordinate,
	targetPosition model.Coordinate,
	hazards []model.Hazard,
	shots []model.Shot,
	roundCount int,
) []model.ClubRecommendation {
	targetDistance := model.EuclideanDistanceYards(currentPosition, targetPosition)
	isGeneric := roundCount < rs.coldStartThreshold
	const tolerance = 15.0

	var recommendations []model.ClubRecommendation

	// 安定した順序のためAllClubTypesを使ってイテレートする
	for _, club := range model.AllClubTypes {
		gs, ok := genericStats[club]
		if !ok {
			continue
		}

		// putter はティーショット推薦対象外
		if club == model.ClubPutter && targetDistance > 30 {
			continue
		}

		var clubMean, clubStdDev float64
		var useGeneric bool

		if isGeneric {
			clubMean = gs.Mean
			clubStdDev = gs.StdDev
			useGeneric = true
		} else {
			userStats := getClubDistanceStats(shots, club)
			if userStats != nil && userStats.StdDev > 0 {
				clubMean = userStats.Mean
				clubStdDev = userStats.StdDev
				useGeneric = false
			} else {
				clubMean = gs.Mean
				clubStdDev = gs.StdDev
				useGeneric = true
			}
		}

		fairwayKeepRate := calculateFairwayRate(targetDistance, clubMean, clubStdDev, tolerance)
		hazardRisk := calculateHazardRisk(currentPosition, hazards, clubMean, clubStdDev)

		// 期待値 = フェアウェイキープ率 - ハザードリスク
		expectedValue := fairwayKeepRate - hazardRisk

		recommendations = append(recommendations, model.ClubRecommendation{
			Club:            club,
			ExpectedValue:   expectedValue,
			FairwayKeepRate: fairwayKeepRate,
			HazardRisk:      hazardRisk,
			DistanceMean:    clubMean,
			DistanceStdDev:  clubStdDev,
			IsGeneric:       useGeneric,
		})
	}

	// 期待値降順でソート
	sort.Slice(recommendations, func(i, j int) bool {
		return recommendations[i].ExpectedValue > recommendations[j].ExpectedValue
	})

	// 上位3つを返す
	if len(recommendations) > 3 {
		recommendations = recommendations[:3]
	}

	return recommendations
}

// getClubDistanceStats はクラブ別の飛距離統計を取得する。
func getClubDistanceStats(shots []model.Shot, club model.ClubType) *genericClubStats {
	var distances []float64
	for _, s := range shots {
		if s.Club == club {
			distances = append(distances, s.DistanceYards)
		}
	}
	if len(distances) == 0 {
		return nil
	}
	return &genericClubStats{
		Mean:   Mean(distances),
		StdDev: StdDev(distances),
	}
}

// calculateFairwayRate はフェアウェイ/グリーンオン確率を計算する。
func calculateFairwayRate(targetDistance, clubMean, clubStdDev, tolerance float64) float64 {
	if clubStdDev <= 0 {
		if targetDistance == clubMean {
			return 1
		}
		return 0
	}
	lower := NormalCdf(targetDistance-tolerance, clubMean, clubStdDev)
	upper := NormalCdf(targetDistance+tolerance, clubMean, clubStdDev)
	return upper - lower
}

// calculateHazardRisk はハザード到達確率を計算する。
func calculateHazardRisk(
	currentPosition model.Coordinate,
	hazards []model.Hazard,
	clubMean, clubStdDev float64,
) float64 {
	if len(hazards) == 0 || clubStdDev <= 0 {
		return 0
	}

	var totalRisk float64
	for _, hazard := range hazards {
		hazardDistance := model.EuclideanDistanceYards(currentPosition, hazard.Position)
		hazardNear := hazardDistance - hazard.RadiusYards
		hazardFar := hazardDistance + hazard.RadiusYards

		probability := NormalCdf(hazardFar, clubMean, clubStdDev) - NormalCdf(hazardNear, clubMean, clubStdDev)
		penalty, ok := hazardPenalty[hazard.Type]
		if !ok {
			penalty = 1.0
		}
		totalRisk += probability * penalty
	}

	return totalRisk
}
