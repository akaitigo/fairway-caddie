package model_test

import (
	"testing"

	"github.com/ryusei/fairway-caddie/api/internal/model"
)

func validRecommendShot() model.Shot {
	return model.Shot{
		ID:              "shot-1",
		RoundID:         "round-1",
		HoleNumber:      1,
		ShotNumber:      1,
		Club:            model.ClubDriver,
		Position:        model.Coordinate{Lat: 75, Lng: 0},
		LandingPosition: model.Coordinate{Lat: 75, Lng: 230},
		DistanceYards:   230,
		Timestamp:       "2026-01-01T00:00:00Z",
	}
}

func validRecommendRequest() model.RecommendRequest {
	return model.RecommendRequest{
		CurrentPosition: model.Coordinate{Lat: 75, Lng: 0},
		TargetPosition:  model.Coordinate{Lat: 75, Lng: 230},
		Hazards:         []model.Hazard{},
		Shots:           []model.Shot{},
		RoundCount:      0,
	}
}

func TestRecommendRequest_Validate(t *testing.T) {
	t.Run("有効なリクエスト（ショットなし）", func(t *testing.T) {
		req := validRecommendRequest()
		if err := req.Validate(); err != nil {
			t.Errorf("Validate() unexpected error: %v", err)
		}
	})

	t.Run("有効なリクエスト（ショットあり）", func(t *testing.T) {
		req := validRecommendRequest()
		req.Shots = []model.Shot{validRecommendShot()}
		if err := req.Validate(); err != nil {
			t.Errorf("Validate() unexpected error: %v", err)
		}
	})

	t.Run("不正な現在位置", func(t *testing.T) {
		req := validRecommendRequest()
		req.CurrentPosition = model.Coordinate{Lat: 999, Lng: 0}
		if err := req.Validate(); err == nil {
			t.Error("Validate() should return error for invalid current position")
		}
	})

	t.Run("不正なターゲット位置", func(t *testing.T) {
		req := validRecommendRequest()
		req.TargetPosition = model.Coordinate{Lat: 0, Lng: 999}
		if err := req.Validate(); err == nil {
			t.Error("Validate() should return error for invalid target position")
		}
	})

	t.Run("飛距離超過(>400)", func(t *testing.T) {
		req := validRecommendRequest()
		shot := validRecommendShot()
		shot.DistanceYards = 401
		req.Shots = []model.Shot{shot}
		if err := req.Validate(); err == nil {
			t.Error("Validate() should return error for distance > 400")
		}
	})

	t.Run("負の飛距離", func(t *testing.T) {
		req := validRecommendRequest()
		shot := validRecommendShot()
		shot.DistanceYards = -10
		req.Shots = []model.Shot{shot}
		if err := req.Validate(); err == nil {
			t.Error("Validate() should return error for negative distance")
		}
	})

	t.Run("不正なホール番号(0)", func(t *testing.T) {
		req := validRecommendRequest()
		shot := validRecommendShot()
		shot.HoleNumber = 0
		req.Shots = []model.Shot{shot}
		if err := req.Validate(); err == nil {
			t.Error("Validate() should return error for hole number 0")
		}
	})

	t.Run("不正なホール番号(19)", func(t *testing.T) {
		req := validRecommendRequest()
		shot := validRecommendShot()
		shot.HoleNumber = 19
		req.Shots = []model.Shot{shot}
		if err := req.Validate(); err == nil {
			t.Error("Validate() should return error for hole number 19")
		}
	})

	t.Run("空タイムスタンプ", func(t *testing.T) {
		req := validRecommendRequest()
		shot := validRecommendShot()
		shot.Timestamp = ""
		req.Shots = []model.Shot{shot}
		if err := req.Validate(); err == nil {
			t.Error("Validate() should return error for empty timestamp")
		}
	})

	t.Run("不正な打点座標", func(t *testing.T) {
		req := validRecommendRequest()
		shot := validRecommendShot()
		shot.Position = model.Coordinate{Lat: -1, Lng: 0}
		req.Shots = []model.Shot{shot}
		if err := req.Validate(); err == nil {
			t.Error("Validate() should return error for invalid position")
		}
	})

	t.Run("不正な着弾座標", func(t *testing.T) {
		req := validRecommendRequest()
		shot := validRecommendShot()
		shot.LandingPosition = model.Coordinate{Lat: 75, Lng: 999}
		req.Shots = []model.Shot{shot}
		if err := req.Validate(); err == nil {
			t.Error("Validate() should return error for invalid landing position")
		}
	})

	t.Run("不正なクラブ種別", func(t *testing.T) {
		req := validRecommendRequest()
		shot := validRecommendShot()
		shot.Club = "invalid-club"
		req.Shots = []model.Shot{shot}
		if err := req.Validate(); err == nil {
			t.Error("Validate() should return error for invalid club type")
		}
	})

	t.Run("不正なハザード種別", func(t *testing.T) {
		req := validRecommendRequest()
		req.Hazards = []model.Hazard{
			{ID: "h-1", Type: "invalid-hazard", Position: model.Coordinate{Lat: 75, Lng: 100}, RadiusYards: 10},
		}
		if err := req.Validate(); err == nil {
			t.Error("Validate() should return error for invalid hazard type")
		}
	})

	t.Run("負のラウンド数", func(t *testing.T) {
		req := validRecommendRequest()
		req.RoundCount = -1
		if err := req.Validate(); err == nil {
			t.Error("Validate() should return error for negative round count")
		}
	})

	t.Run("境界値ホール番号(1)", func(t *testing.T) {
		req := validRecommendRequest()
		shot := validRecommendShot()
		shot.HoleNumber = 1
		req.Shots = []model.Shot{shot}
		if err := req.Validate(); err != nil {
			t.Errorf("Validate() unexpected error for hole 1: %v", err)
		}
	})

	t.Run("境界値ホール番号(18)", func(t *testing.T) {
		req := validRecommendRequest()
		shot := validRecommendShot()
		shot.HoleNumber = 18
		req.Shots = []model.Shot{shot}
		if err := req.Validate(); err != nil {
			t.Errorf("Validate() unexpected error for hole 18: %v", err)
		}
	})

	t.Run("境界値飛距離(400)", func(t *testing.T) {
		req := validRecommendRequest()
		shot := validRecommendShot()
		shot.DistanceYards = 400
		req.Shots = []model.Shot{shot}
		if err := req.Validate(); err != nil {
			t.Errorf("Validate() unexpected error for distance 400: %v", err)
		}
	})
}
