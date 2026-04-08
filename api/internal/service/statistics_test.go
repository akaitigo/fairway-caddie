package service_test

import (
	"math"
	"testing"

	"github.com/ryusei/fairway-caddie/api/internal/model"
	"github.com/ryusei/fairway-caddie/api/internal/service"
)

func TestMean(t *testing.T) {
	tests := []struct {
		name   string
		values []float64
		want   float64
	}{
		{"空配列", nil, 0},
		{"単一要素", []float64{5}, 5},
		{"複数要素", []float64{1, 2, 3, 4, 5}, 3},
		{"小数", []float64{10.5, 20.5}, 15.5},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := service.Mean(tt.values)
			if math.Abs(got-tt.want) > 1e-9 {
				t.Errorf("Mean() = %f, want %f", got, tt.want)
			}
		})
	}
}

func TestVariance(t *testing.T) {
	tests := []struct {
		name   string
		values []float64
		want   float64
	}{
		{"空配列", nil, 0},
		{"同一値", []float64{5, 5, 5}, 0},
		{"母分散", []float64{2, 4, 4, 4, 5, 5, 7, 9}, 4},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := service.Variance(tt.values)
			if math.Abs(got-tt.want) > 1e-9 {
				t.Errorf("Variance() = %f, want %f", got, tt.want)
			}
		})
	}
}

func TestStdDev(t *testing.T) {
	t.Run("空配列", func(t *testing.T) {
		got := service.StdDev(nil)
		if got != 0 {
			t.Errorf("StdDev(nil) = %f, want 0", got)
		}
	})

	t.Run("variance=4 → stdDev=2", func(t *testing.T) {
		got := service.StdDev([]float64{2, 4, 4, 4, 5, 5, 7, 9})
		if math.Abs(got-2) > 1e-9 {
			t.Errorf("StdDev() = %f, want 2", got)
		}
	})
}

func TestNormalPdf(t *testing.T) {
	t.Run("sigma<=0", func(t *testing.T) {
		if service.NormalPdf(0, 0, 0) != 0 {
			t.Error("NormalPdf(0,0,0) should be 0")
		}
		if service.NormalPdf(0, 0, -1) != 0 {
			t.Error("NormalPdf(0,0,-1) should be 0")
		}
	})

	t.Run("N(0,1)の中心", func(t *testing.T) {
		got := service.NormalPdf(0, 0, 1)
		if math.Abs(got-0.3989) > 0.001 {
			t.Errorf("NormalPdf(0,0,1) = %f, want ~0.3989", got)
		}
	})

	t.Run("中心が離れると値が小さくなる", func(t *testing.T) {
		center := service.NormalPdf(230, 230, 15)
		away := service.NormalPdf(260, 230, 15)
		if center <= away {
			t.Errorf("center (%f) should be > away (%f)", center, away)
		}
	})
}

func TestNormalCdf(t *testing.T) {
	t.Run("sigma<=0", func(t *testing.T) {
		if service.NormalCdf(0, 0, 0) != 1 {
			t.Error("NormalCdf(0,0,0) should be 1")
		}
		if service.NormalCdf(-1, 0, 0) != 0 {
			t.Error("NormalCdf(-1,0,0) should be 0")
		}
	})

	t.Run("N(0,1)の中心", func(t *testing.T) {
		got := service.NormalCdf(0, 0, 1)
		if math.Abs(got-0.5) > 0.001 {
			t.Errorf("NormalCdf(0,0,1) = %f, want ~0.5", got)
		}
	})

	t.Run("+1σ", func(t *testing.T) {
		got := service.NormalCdf(1, 0, 1)
		if math.Abs(got-0.8413) > 0.001 {
			t.Errorf("NormalCdf(1,0,1) = %f, want ~0.8413", got)
		}
	})

	t.Run("-1σ", func(t *testing.T) {
		got := service.NormalCdf(-1, 0, 1)
		if math.Abs(got-0.1587) > 0.001 {
			t.Errorf("NormalCdf(-1,0,1) = %f, want ~0.1587", got)
		}
	})
}

func TestGroupDistancesByClub(t *testing.T) {
	t.Run("空配列", func(t *testing.T) {
		result := service.GroupDistancesByClub(nil)
		if len(result) != 0 {
			t.Errorf("expected empty map, got %d entries", len(result))
		}
	})

	t.Run("クラブ別分類", func(t *testing.T) {
		shots := []model.Shot{
			{Club: model.ClubDriver, DistanceYards: 230},
			{Club: model.ClubDriver, DistanceYards: 240},
			{Club: model.Club7I, DistanceYards: 150},
		}
		result := service.GroupDistancesByClub(shots)
		driverDistances := result[model.ClubDriver]
		if len(driverDistances) != 2 {
			t.Errorf("driver should have 2 distances, got %d", len(driverDistances))
		}
		ironDistances := result[model.Club7I]
		if len(ironDistances) != 1 {
			t.Errorf("7i should have 1 distance, got %d", len(ironDistances))
		}
	})
}

func TestCalculateClubStats(t *testing.T) {
	t.Run("空配列", func(t *testing.T) {
		stats := service.CalculateClubStats(nil)
		if len(stats) != 0 {
			t.Errorf("expected empty stats, got %d", len(stats))
		}
	})

	t.Run("ドライバー統計", func(t *testing.T) {
		shots := []model.Shot{
			{Club: model.ClubDriver, DistanceYards: 220},
			{Club: model.ClubDriver, DistanceYards: 240},
			{Club: model.ClubDriver, DistanceYards: 230},
		}
		stats := service.CalculateClubStats(shots)
		if len(stats) != 1 {
			t.Fatalf("expected 1 club stat, got %d", len(stats))
		}
		s := stats[0]
		if s.ClubType != model.ClubDriver {
			t.Errorf("expected driver, got %s", s.ClubType)
		}
		if s.Count != 3 {
			t.Errorf("count = %d, want 3", s.Count)
		}
		if math.Abs(s.Mean-230) > 0.01 {
			t.Errorf("mean = %f, want 230", s.Mean)
		}
		if s.Min != 220 {
			t.Errorf("min = %f, want 220", s.Min)
		}
		if s.Max != 240 {
			t.Errorf("max = %f, want 240", s.Max)
		}
	})

	t.Run("複数クラブ", func(t *testing.T) {
		shots := []model.Shot{
			{Club: model.ClubDriver, DistanceYards: 230},
			{Club: model.Club7I, DistanceYards: 150},
			{Club: model.ClubPW, DistanceYards: 100},
		}
		stats := service.CalculateClubStats(shots)
		if len(stats) != 3 {
			t.Errorf("expected 3 club stats, got %d", len(stats))
		}
	})
}
