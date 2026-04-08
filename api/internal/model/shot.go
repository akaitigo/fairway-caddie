package model

import (
	"fmt"
	"math"
)

// Shot はショット定義。
type Shot struct {
	ID              string     `json:"id"`
	RoundID         string     `json:"roundId"`
	HoleNumber      int        `json:"holeNumber"`
	ShotNumber      int        `json:"shotNumber"`
	Club            ClubType   `json:"club"`
	Position        Coordinate `json:"position"`
	LandingPosition Coordinate `json:"landingPosition"`
	// 飛距離 (ヤード, 0~400)
	DistanceYards float64 `json:"distanceYards"`
	Timestamp     string  `json:"timestamp"`
}

// Validate はショットのバリデーションを行う。
func (s Shot) Validate() error {
	if s.ID == "" {
		return fmt.Errorf("ショットIDは必須です")
	}
	if s.RoundID == "" {
		return fmt.Errorf("ラウンドIDは必須です")
	}
	if s.HoleNumber < 1 || s.HoleNumber > 18 {
		return fmt.Errorf("ホール番号は1~18の範囲で指定してください")
	}
	if s.ShotNumber < 1 {
		return fmt.Errorf("ショット番号は1以上で指定してください")
	}
	if !IsValidClubType(string(s.Club)) {
		return fmt.Errorf("無効なクラブ種別です: %s", s.Club)
	}
	if err := s.Position.Validate(); err != nil {
		return fmt.Errorf("打点座標が不正です: %w", err)
	}
	if err := s.LandingPosition.Validate(); err != nil {
		return fmt.Errorf("着弾座標が不正です: %w", err)
	}
	if err := ValidateDistance(s.DistanceYards); err != nil {
		return err
	}
	if s.Timestamp == "" {
		return fmt.Errorf("タイムスタンプは必須です")
	}
	return nil
}

// ValidateDistance は飛距離のバリデーションを行う。
func ValidateDistance(distance float64) error {
	if distance < 0 {
		return fmt.Errorf("飛距離は0以上で指定してください")
	}
	if distance > 400 {
		return fmt.Errorf("飛距離は400ヤード以下で指定してください")
	}
	return nil
}

// EuclideanDistanceYards は2点間のユークリッド距離(ヤード)を計算する。
func EuclideanDistanceYards(from, to Coordinate) float64 {
	dx := to.Lng - from.Lng
	dy := to.Lat - from.Lat
	return math.Sqrt(dx*dx + dy*dy)
}
