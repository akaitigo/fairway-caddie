package service_test

import (
	"testing"

	"github.com/ryusei/fairway-caddie/api/internal/model"
	"github.com/ryusei/fairway-caddie/api/internal/service"
)

func TestRecommendationService_ColdStart(t *testing.T) {
	engine := service.NewRecommendationService(5)
	teePosition := model.Coordinate{Lat: 75, Lng: 0}
	targetPosition := model.Coordinate{Lat: 75, Lng: 230}

	t.Run("5ラウンド未満ではジェネリック推薦", func(t *testing.T) {
		recs := engine.Recommend(teePosition, targetPosition, nil, nil, 2)
		if len(recs) != 3 {
			t.Errorf("expected 3 recommendations, got %d", len(recs))
		}
		for _, rec := range recs {
			if !rec.IsGeneric {
				t.Errorf("expected generic recommendation for club %s", rec.Club)
			}
		}
	})

	t.Run("推薦結果は3つまで", func(t *testing.T) {
		recs := engine.Recommend(teePosition, targetPosition, nil, nil, 0)
		if len(recs) > 3 {
			t.Errorf("expected at most 3 recommendations, got %d", len(recs))
		}
	})

	t.Run("期待値降順ソート", func(t *testing.T) {
		recs := engine.Recommend(teePosition, targetPosition, nil, nil, 0)
		for i := 1; i < len(recs); i++ {
			if recs[i-1].ExpectedValue < recs[i].ExpectedValue {
				t.Errorf("recommendations not sorted by expected value: %f < %f",
					recs[i-1].ExpectedValue, recs[i].ExpectedValue)
			}
		}
	})

	t.Run("推薦結果のフィールド確認", func(t *testing.T) {
		recs := engine.Recommend(teePosition, targetPosition, nil, nil, 0)
		for _, rec := range recs {
			if rec.Club == "" {
				t.Error("club should not be empty")
			}
			if rec.DistanceMean <= 0 {
				t.Errorf("distanceMean should be > 0, got %f", rec.DistanceMean)
			}
			if rec.DistanceStdDev <= 0 {
				t.Errorf("distanceStdDev should be > 0, got %f", rec.DistanceStdDev)
			}
		}
	})
}

func TestRecommendationService_UserData(t *testing.T) {
	engine := service.NewRecommendationService(5)
	teePosition := model.Coordinate{Lat: 75, Lng: 0}

	t.Run("5ラウンド以上でユーザーデータ使用", func(t *testing.T) {
		shots := []model.Shot{
			{Club: model.Club7I, DistanceYards: 140},
			{Club: model.Club7I, DistanceYards: 145},
			{Club: model.Club7I, DistanceYards: 135},
			{Club: model.Club7I, DistanceYards: 142},
			{Club: model.Club7I, DistanceYards: 138},
		}
		shortTarget := model.Coordinate{Lat: 75, Lng: 140}
		recs := engine.Recommend(teePosition, shortTarget, nil, shots, 5)
		found := false
		for _, rec := range recs {
			if rec.Club == model.Club7I {
				found = true
				if rec.IsGeneric {
					t.Error("7i should use user data, not generic")
				}
			}
		}
		if !found {
			// 7iが推薦に含まれない場合もあり得るのでスキップ
			t.Log("7i not in top 3 recommendations")
		}
	})

	t.Run("データなしクラブはジェネリックにフォールバック", func(t *testing.T) {
		shots := []model.Shot{
			{Club: model.Club7I, DistanceYards: 140},
		}
		targetPosition := model.Coordinate{Lat: 75, Lng: 230}
		recs := engine.Recommend(teePosition, targetPosition, nil, shots, 5)
		for _, rec := range recs {
			if rec.Club == model.ClubDriver {
				if !rec.IsGeneric {
					t.Error("driver should be generic since no user data")
				}
			}
		}
	})
}

func TestRecommendationService_HazardRisk(t *testing.T) {
	engine := service.NewRecommendationService(5)
	teePosition := model.Coordinate{Lat: 75, Lng: 0}
	targetPosition := model.Coordinate{Lat: 75, Lng: 230}

	t.Run("ハザードなし: リスク0", func(t *testing.T) {
		recs := engine.Recommend(teePosition, targetPosition, nil, nil, 0)
		for _, rec := range recs {
			if rec.HazardRisk != 0 {
				t.Errorf("hazard risk should be 0 without hazards, got %f for %s",
					rec.HazardRisk, rec.Club)
			}
		}
	})

	t.Run("ハザードありで期待値低下", func(t *testing.T) {
		hazards := []model.Hazard{
			{
				ID:          "h1",
				Type:        model.HazardWater,
				Position:    model.Coordinate{Lat: 75, Lng: 230},
				RadiusYards: 30,
			},
		}
		withHazards := engine.Recommend(teePosition, targetPosition, hazards, nil, 0)
		withoutHazards := engine.Recommend(teePosition, targetPosition, nil, nil, 0)

		// ハザードありではトップのクラブが変わるか、期待値が下がる
		if withHazards[0].Club == withoutHazards[0].Club {
			if withHazards[0].ExpectedValue >= withoutHazards[0].ExpectedValue {
				t.Error("hazards should decrease expected value")
			}
		}
	})

	t.Run("OBペナルティ > 水ペナルティ", func(t *testing.T) {
		waterHazard := []model.Hazard{
			{ID: "h1", Type: model.HazardWater, Position: model.Coordinate{Lat: 75, Lng: 200}, RadiusYards: 20},
		}
		obHazard := []model.Hazard{
			{ID: "h1", Type: model.HazardOB, Position: model.Coordinate{Lat: 75, Lng: 200}, RadiusYards: 20},
		}
		waterRecs := engine.Recommend(teePosition, targetPosition, waterHazard, nil, 0)
		obRecs := engine.Recommend(teePosition, targetPosition, obHazard, nil, 0)

		for _, wr := range waterRecs {
			for _, obr := range obRecs {
				if wr.Club == obr.Club && wr.HazardRisk > 0 {
					if obr.HazardRisk <= wr.HazardRisk {
						t.Errorf("OB risk (%f) should be > water risk (%f) for %s",
							obr.HazardRisk, wr.HazardRisk, wr.Club)
					}
				}
			}
		}
	})
}

func TestRecommendationService_FairwayKeepRate(t *testing.T) {
	engine := service.NewRecommendationService(5)
	teePosition := model.Coordinate{Lat: 75, Lng: 0}
	targetPosition := model.Coordinate{Lat: 75, Lng: 230}

	t.Run("フェアウェイキープ率は0~1", func(t *testing.T) {
		recs := engine.Recommend(teePosition, targetPosition, nil, nil, 0)
		for _, rec := range recs {
			if rec.FairwayKeepRate < 0 || rec.FairwayKeepRate > 1 {
				t.Errorf("fairway keep rate out of range: %f for %s",
					rec.FairwayKeepRate, rec.Club)
			}
		}
	})
}

func TestRecommendationService_EdgeCases(t *testing.T) {
	engine := service.NewRecommendationService(5)
	teePosition := model.Coordinate{Lat: 75, Lng: 0}

	t.Run("同一地点をターゲット", func(t *testing.T) {
		recs := engine.Recommend(teePosition, teePosition, nil, nil, 0)
		if len(recs) != 3 {
			t.Errorf("expected 3 recommendations, got %d", len(recs))
		}
	})

	t.Run("空ショットリストでジェネリック", func(t *testing.T) {
		targetPosition := model.Coordinate{Lat: 75, Lng: 230}
		recs := engine.Recommend(teePosition, targetPosition, nil, nil, 10)
		for _, rec := range recs {
			if !rec.IsGeneric {
				t.Errorf("expected generic for club %s (no data)", rec.Club)
			}
		}
	})

	t.Run("大量ハザード", func(t *testing.T) {
		targetPosition := model.Coordinate{Lat: 75, Lng: 230}
		hazards := make([]model.Hazard, 50)
		for i := range hazards {
			hazards[i] = model.Hazard{
				ID:          "h",
				Type:        model.HazardBunker,
				Position:    model.Coordinate{Lat: 75, Lng: float64(i * 8)},
				RadiusYards: 10,
			}
		}
		recs := engine.Recommend(teePosition, targetPosition, hazards, nil, 0)
		if len(recs) != 3 {
			t.Errorf("expected 3 recommendations, got %d", len(recs))
		}
	})

	t.Run("カスタム閾値", func(t *testing.T) {
		customEngine := service.NewRecommendationService(3)
		targetPosition := model.Coordinate{Lat: 75, Lng: 230}
		recs := customEngine.Recommend(teePosition, targetPosition, nil, nil, 3)
		if len(recs) != 3 {
			t.Errorf("expected 3 recommendations, got %d", len(recs))
		}
	})
}
