package model_test

import (
	"math"
	"testing"

	"github.com/ryusei/fairway-caddie/api/internal/model"
)

func TestEuclideanDistanceYards(t *testing.T) {
	tests := []struct {
		name string
		from model.Coordinate
		to   model.Coordinate
		want float64
	}{
		{
			"同一地点",
			model.Coordinate{Lat: 75, Lng: 0},
			model.Coordinate{Lat: 75, Lng: 0},
			0,
		},
		{
			"水平方向",
			model.Coordinate{Lat: 75, Lng: 0},
			model.Coordinate{Lat: 75, Lng: 200},
			200,
		},
		{
			"垂直方向",
			model.Coordinate{Lat: 0, Lng: 100},
			model.Coordinate{Lat: 100, Lng: 100},
			100,
		},
		{
			"ピタゴラス (3-4-5)",
			model.Coordinate{Lat: 0, Lng: 0},
			model.Coordinate{Lat: 30, Lng: 40},
			50,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := model.EuclideanDistanceYards(tt.from, tt.to)
			if math.Abs(got-tt.want) > 1e-6 {
				t.Errorf("EuclideanDistanceYards() = %f, want %f", got, tt.want)
			}
		})
	}
}

func TestValidateDistance(t *testing.T) {
	tests := []struct {
		name     string
		distance float64
		wantErr  bool
	}{
		{"有効 (200)", 200, false},
		{"境界値 (0)", 0, false},
		{"境界値 (400)", 400, false},
		{"負値", -1, true},
		{"超過", 401, true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := model.ValidateDistance(tt.distance)
			if (err != nil) != tt.wantErr {
				t.Errorf("ValidateDistance() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

func TestShotValidate(t *testing.T) {
	validShot := model.Shot{
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

	t.Run("有効なショット", func(t *testing.T) {
		if err := validShot.Validate(); err != nil {
			t.Errorf("Validate() unexpected error: %v", err)
		}
	})

	t.Run("空ID", func(t *testing.T) {
		shot := validShot
		shot.ID = ""
		if err := shot.Validate(); err == nil {
			t.Error("Validate() should return error for empty ID")
		}
	})

	t.Run("空ラウンドID", func(t *testing.T) {
		shot := validShot
		shot.RoundID = ""
		if err := shot.Validate(); err == nil {
			t.Error("Validate() should return error for empty RoundID")
		}
	})

	t.Run("無効なホール番号", func(t *testing.T) {
		shot := validShot
		shot.HoleNumber = 0
		if err := shot.Validate(); err == nil {
			t.Error("Validate() should return error for invalid hole number")
		}
	})

	t.Run("無効なクラブ", func(t *testing.T) {
		shot := validShot
		shot.Club = "invalid"
		if err := shot.Validate(); err == nil {
			t.Error("Validate() should return error for invalid club")
		}
	})

	t.Run("飛距離超過", func(t *testing.T) {
		shot := validShot
		shot.DistanceYards = 401
		if err := shot.Validate(); err == nil {
			t.Error("Validate() should return error for distance > 400")
		}
	})

	t.Run("空タイムスタンプ", func(t *testing.T) {
		shot := validShot
		shot.Timestamp = ""
		if err := shot.Validate(); err == nil {
			t.Error("Validate() should return error for empty timestamp")
		}
	})
}
