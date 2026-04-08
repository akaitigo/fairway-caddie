package store_test

import (
	"context"
	"testing"

	"github.com/ryusei/fairway-caddie/api/internal/model"
	"github.com/ryusei/fairway-caddie/api/internal/store"
)

func TestMemoryShotStore_CRUD(t *testing.T) {
	ctx := context.Background()
	s := store.NewMemoryShotStore()

	shot := model.Shot{
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

	t.Run("Create", func(t *testing.T) {
		created, err := s.Create(ctx, shot)
		if err != nil {
			t.Fatalf("Create() error: %v", err)
		}
		if created.ID != shot.ID {
			t.Errorf("created ID = %s, want %s", created.ID, shot.ID)
		}
	})

	t.Run("Create_重複", func(t *testing.T) {
		_, err := s.Create(ctx, shot)
		if err == nil {
			t.Error("Create() should return error for duplicate ID")
		}
	})

	t.Run("GetByID", func(t *testing.T) {
		got, err := s.GetByID(ctx, "shot-1")
		if err != nil {
			t.Fatalf("GetByID() error: %v", err)
		}
		if got.DistanceYards != 230 {
			t.Errorf("distance = %f, want 230", got.DistanceYards)
		}
	})

	t.Run("GetByID_存在しない", func(t *testing.T) {
		_, err := s.GetByID(ctx, "nonexistent")
		if err == nil {
			t.Error("GetByID() should return error for nonexistent ID")
		}
	})

	t.Run("List", func(t *testing.T) {
		shots, err := s.List(ctx)
		if err != nil {
			t.Fatalf("List() error: %v", err)
		}
		if len(shots) != 1 {
			t.Errorf("List() returned %d shots, want 1", len(shots))
		}
	})

	t.Run("ListByRound", func(t *testing.T) {
		shot2 := model.Shot{
			ID:              "shot-2",
			RoundID:         "round-2",
			HoleNumber:      1,
			ShotNumber:      1,
			Club:            model.Club7I,
			Position:        model.Coordinate{Lat: 75, Lng: 0},
			LandingPosition: model.Coordinate{Lat: 75, Lng: 140},
			DistanceYards:   140,
			Timestamp:       "2026-01-01T00:00:00Z",
		}
		if _, err := s.Create(ctx, shot2); err != nil {
			t.Fatalf("Create shot2 error: %v", err)
		}

		shots, err := s.ListByRound(ctx, "round-1")
		if err != nil {
			t.Fatalf("ListByRound() error: %v", err)
		}
		if len(shots) != 1 {
			t.Errorf("ListByRound() returned %d shots, want 1", len(shots))
		}
	})

	t.Run("Update", func(t *testing.T) {
		updated := shot
		updated.DistanceYards = 250
		result, err := s.Update(ctx, updated)
		if err != nil {
			t.Fatalf("Update() error: %v", err)
		}
		if result.DistanceYards != 250 {
			t.Errorf("updated distance = %f, want 250", result.DistanceYards)
		}
	})

	t.Run("Update_存在しない", func(t *testing.T) {
		_, err := s.Update(ctx, model.Shot{ID: "nonexistent"})
		if err == nil {
			t.Error("Update() should return error for nonexistent ID")
		}
	})

	t.Run("Delete", func(t *testing.T) {
		if err := s.Delete(ctx, "shot-1"); err != nil {
			t.Fatalf("Delete() error: %v", err)
		}
		_, err := s.GetByID(ctx, "shot-1")
		if err == nil {
			t.Error("GetByID() should return error after delete")
		}
	})

	t.Run("Delete_存在しない", func(t *testing.T) {
		if err := s.Delete(ctx, "nonexistent"); err == nil {
			t.Error("Delete() should return error for nonexistent ID")
		}
	})
}

func TestMemoryRoundStore_CRUD(t *testing.T) {
	ctx := context.Background()
	s := store.NewMemoryRoundStore()

	round := model.Round{
		ID:       "round-1",
		CourseID: "course-1",
		Date:     "2025-06-01",
		Shots:    []model.Shot{},
	}

	t.Run("Create", func(t *testing.T) {
		created, err := s.Create(ctx, round)
		if err != nil {
			t.Fatalf("Create() error: %v", err)
		}
		if created.ID != round.ID {
			t.Errorf("created ID = %s, want %s", created.ID, round.ID)
		}
	})

	t.Run("Create_重複", func(t *testing.T) {
		_, err := s.Create(ctx, round)
		if err == nil {
			t.Error("Create() should return error for duplicate ID")
		}
	})

	t.Run("GetByID", func(t *testing.T) {
		got, err := s.GetByID(ctx, "round-1")
		if err != nil {
			t.Fatalf("GetByID() error: %v", err)
		}
		if got.CourseID != "course-1" {
			t.Errorf("courseId = %s, want course-1", got.CourseID)
		}
	})

	t.Run("List", func(t *testing.T) {
		rounds, err := s.List(ctx)
		if err != nil {
			t.Fatalf("List() error: %v", err)
		}
		if len(rounds) != 1 {
			t.Errorf("List() returned %d rounds, want 1", len(rounds))
		}
	})

	t.Run("Count", func(t *testing.T) {
		count, err := s.Count(ctx)
		if err != nil {
			t.Fatalf("Count() error: %v", err)
		}
		if count != 1 {
			t.Errorf("Count() = %d, want 1", count)
		}
	})

	t.Run("Update", func(t *testing.T) {
		score := 85
		updated := round
		updated.TotalScore = &score
		result, err := s.Update(ctx, updated)
		if err != nil {
			t.Fatalf("Update() error: %v", err)
		}
		if result.TotalScore == nil || *result.TotalScore != 85 {
			t.Error("TotalScore should be 85")
		}
	})

	t.Run("Delete", func(t *testing.T) {
		if err := s.Delete(ctx, "round-1"); err != nil {
			t.Fatalf("Delete() error: %v", err)
		}
		count, err := s.Count(ctx)
		if err != nil {
			t.Fatalf("Count() error: %v", err)
		}
		if count != 0 {
			t.Errorf("Count() = %d after delete, want 0", count)
		}
	})
}

func TestMemoryCourseStore(t *testing.T) {
	ctx := context.Background()
	s := store.NewMemoryCourseStore()

	t.Run("List", func(t *testing.T) {
		courses, err := s.List(ctx)
		if err != nil {
			t.Fatalf("List() error: %v", err)
		}
		if len(courses) == 0 {
			t.Error("List() should return at least 1 course (mock data)")
		}
		if courses[0].Name != "サンプルゴルフコース" {
			t.Errorf("course name = %s, want サンプルゴルフコース", courses[0].Name)
		}
	})

	t.Run("GetByID_モックコース", func(t *testing.T) {
		course, err := s.GetByID(ctx, "mock-course-001")
		if err != nil {
			t.Fatalf("GetByID() error: %v", err)
		}
		if len(course.Holes) == 0 {
			t.Error("mock course should have holes")
		}
		hole := course.Holes[0]
		if hole.Par != 4 {
			t.Errorf("hole 1 par = %d, want 4", hole.Par)
		}
		if len(hole.Hazards) != 2 {
			t.Errorf("hole 1 hazards = %d, want 2", len(hole.Hazards))
		}
	})

	t.Run("GetByID_存在しない", func(t *testing.T) {
		_, err := s.GetByID(ctx, "nonexistent")
		if err == nil {
			t.Error("GetByID() should return error for nonexistent ID")
		}
	})
}
