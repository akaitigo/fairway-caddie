package model

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
