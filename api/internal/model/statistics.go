package model

import "fmt"

// DistanceStats はクラブ別飛距離統計結果。
type DistanceStats struct {
	ClubType ClubType `json:"clubType"`
	Count    int      `json:"count"`
	Mean     float64  `json:"mean"`
	Variance float64  `json:"variance"`
	StdDev   float64  `json:"stdDev"`
	Min      float64  `json:"min"`
	Max      float64  `json:"max"`
}

// ClubRecommendation は推薦結果。
type ClubRecommendation struct {
	Club           ClubType `json:"club"`
	ExpectedValue  float64  `json:"expectedValue"`
	FairwayKeepRate float64 `json:"fairwayKeepRate"`
	HazardRisk     float64  `json:"hazardRisk"`
	DistanceMean   float64  `json:"distanceMean"`
	DistanceStdDev float64  `json:"distanceStdDev"`
	IsGeneric      bool     `json:"isGeneric"`
}

// RecommendRequest はクラブ推薦APIのリクエスト。
type RecommendRequest struct {
	CurrentPosition Coordinate `json:"currentPosition"`
	TargetPosition  Coordinate `json:"targetPosition"`
	Hazards         []Hazard   `json:"hazards"`
	Shots           []Shot     `json:"shots"`
	RoundCount      int        `json:"roundCount"`
}

// Validate はRecommendRequestのバリデーションを行う。
func (r RecommendRequest) Validate() error {
	if err := r.CurrentPosition.Validate(); err != nil {
		return fmt.Errorf("現在位置が不正です: %w", err)
	}
	if err := r.TargetPosition.Validate(); err != nil {
		return fmt.Errorf("ターゲット位置が不正です: %w", err)
	}

	for i, h := range r.Hazards {
		if !IsValidHazardType(string(h.Type)) {
			return fmt.Errorf("ハザード[%d]: 無効なハザード種別です: %s", i, h.Type)
		}
		if h.RadiusYards < 0 {
			return fmt.Errorf("ハザード[%d]: 半径は0以上で指定してください", i)
		}
	}

	for i, s := range r.Shots {
		if !IsValidClubType(string(s.Club)) {
			return fmt.Errorf("ショット[%d]: 無効なクラブ種別です: %s", i, s.Club)
		}
		if s.DistanceYards < 0 {
			return fmt.Errorf("ショット[%d]: 飛距離は0以上で指定してください", i)
		}
		if s.DistanceYards > 400 {
			return fmt.Errorf("ショット[%d]: 飛距離は400ヤード以下で指定してください", i)
		}
		if s.HoleNumber < 1 || s.HoleNumber > 18 {
			return fmt.Errorf("ショット[%d]: ホール番号は1~18の範囲で指定してください", i)
		}
		if s.Timestamp == "" {
			return fmt.Errorf("ショット[%d]: タイムスタンプは必須です", i)
		}
		if err := s.Position.Validate(); err != nil {
			return fmt.Errorf("ショット[%d]: 打点座標が不正です: %w", i, err)
		}
		if err := s.LandingPosition.Validate(); err != nil {
			return fmt.Errorf("ショット[%d]: 着弾座標が不正です: %w", i, err)
		}
	}

	if r.RoundCount < 0 {
		return fmt.Errorf("ラウンド数は0以上で指定してください")
	}

	return nil
}
