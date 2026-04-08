package handler_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/ryusei/fairway-caddie/api/internal/handler"
	"github.com/ryusei/fairway-caddie/api/internal/model"
	"github.com/ryusei/fairway-caddie/api/internal/service"
	"github.com/ryusei/fairway-caddie/api/internal/store"
)

func setupShotHandler() (*handler.ShotHandler, *store.MemoryShotStore) {
	s := store.NewMemoryShotStore()
	h := handler.NewShotHandler(s)
	return h, s
}

func setupRoundHandler() (*handler.RoundHandler, *store.MemoryRoundStore) {
	s := store.NewMemoryRoundStore()
	h := handler.NewRoundHandler(s)
	return h, s
}

func validShot() model.Shot {
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

func validRound() model.Round {
	return model.Round{
		ID:       "round-1",
		CourseID: "mock-course-001",
		Date:     "2025-06-01",
		Shots:    []model.Shot{},
	}
}

func TestShotHandler_CreateAndList(t *testing.T) {
	h, _ := setupShotHandler()

	// POST /api/shots
	body, marshalErr := json.Marshal(validShot())
	if marshalErr != nil {
		t.Fatalf("marshal error: %v", marshalErr)
	}
	req := httptest.NewRequest(http.MethodPost, "/api/shots", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	h.HandleShots(w, req)

	if w.Code != http.StatusCreated {
		t.Errorf("POST /api/shots status = %d, want %d", w.Code, http.StatusCreated)
	}

	// GET /api/shots
	req = httptest.NewRequest(http.MethodGet, "/api/shots", nil)
	w = httptest.NewRecorder()
	h.HandleShots(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("GET /api/shots status = %d, want %d", w.Code, http.StatusOK)
	}

	var shots []model.Shot
	if err := json.NewDecoder(w.Body).Decode(&shots); err != nil {
		t.Fatalf("decode error: %v", err)
	}
	if len(shots) != 1 {
		t.Errorf("expected 1 shot, got %d", len(shots))
	}
}

func TestShotHandler_GetByID(t *testing.T) {
	h, s := setupShotHandler()
	if _, err := s.Create(nil, validShot()); err != nil {
		t.Fatalf("setup error: %v", err)
	}

	req := httptest.NewRequest(http.MethodGet, "/api/shots/shot-1", nil)
	w := httptest.NewRecorder()
	h.HandleShotByID(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("GET /api/shots/shot-1 status = %d, want %d", w.Code, http.StatusOK)
	}
}

func TestShotHandler_GetByID_NotFound(t *testing.T) {
	h, _ := setupShotHandler()

	req := httptest.NewRequest(http.MethodGet, "/api/shots/nonexistent", nil)
	w := httptest.NewRecorder()
	h.HandleShotByID(w, req)

	if w.Code != http.StatusNotFound {
		t.Errorf("GET /api/shots/nonexistent status = %d, want %d", w.Code, http.StatusNotFound)
	}
}

func TestShotHandler_Update(t *testing.T) {
	h, s := setupShotHandler()
	if _, err := s.Create(nil, validShot()); err != nil {
		t.Fatalf("setup error: %v", err)
	}

	updated := validShot()
	updated.DistanceYards = 250
	body, marshalErr := json.Marshal(updated)
	if marshalErr != nil {
		t.Fatalf("marshal error: %v", marshalErr)
	}
	req := httptest.NewRequest(http.MethodPut, "/api/shots/shot-1", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	h.HandleShotByID(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("PUT /api/shots/shot-1 status = %d, want %d", w.Code, http.StatusOK)
	}
}

func TestShotHandler_Delete(t *testing.T) {
	h, s := setupShotHandler()
	if _, err := s.Create(nil, validShot()); err != nil {
		t.Fatalf("setup error: %v", err)
	}

	req := httptest.NewRequest(http.MethodDelete, "/api/shots/shot-1", nil)
	w := httptest.NewRecorder()
	h.HandleShotByID(w, req)

	if w.Code != http.StatusNoContent {
		t.Errorf("DELETE /api/shots/shot-1 status = %d, want %d", w.Code, http.StatusNoContent)
	}
}

func TestShotHandler_InvalidMethod(t *testing.T) {
	h, _ := setupShotHandler()

	req := httptest.NewRequest(http.MethodPatch, "/api/shots", nil)
	w := httptest.NewRecorder()
	h.HandleShots(w, req)

	if w.Code != http.StatusMethodNotAllowed {
		t.Errorf("PATCH /api/shots status = %d, want %d", w.Code, http.StatusMethodNotAllowed)
	}
}

func TestShotHandler_InvalidBody(t *testing.T) {
	h, _ := setupShotHandler()

	req := httptest.NewRequest(http.MethodPost, "/api/shots", bytes.NewReader([]byte("invalid")))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	h.HandleShots(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("POST /api/shots with invalid body status = %d, want %d", w.Code, http.StatusBadRequest)
	}
}

func TestShotHandler_ValidationError(t *testing.T) {
	h, _ := setupShotHandler()

	shot := validShot()
	shot.Club = "invalid"
	body, marshalErr := json.Marshal(shot)
	if marshalErr != nil {
		t.Fatalf("marshal error: %v", marshalErr)
	}
	req := httptest.NewRequest(http.MethodPost, "/api/shots", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	h.HandleShots(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("POST /api/shots with invalid club status = %d, want %d", w.Code, http.StatusBadRequest)
	}
}

func TestShotHandler_ListByRound(t *testing.T) {
	h, s := setupShotHandler()

	shot1 := validShot()
	shot2 := validShot()
	shot2.ID = "shot-2"
	shot2.RoundID = "round-2"

	if _, err := s.Create(nil, shot1); err != nil {
		t.Fatalf("create shot1 error: %v", err)
	}
	if _, err := s.Create(nil, shot2); err != nil {
		t.Fatalf("create shot2 error: %v", err)
	}

	req := httptest.NewRequest(http.MethodGet, "/api/shots?roundId=round-1", nil)
	w := httptest.NewRecorder()
	h.HandleShots(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("GET /api/shots?roundId=round-1 status = %d, want %d", w.Code, http.StatusOK)
	}

	var shots []model.Shot
	if err := json.NewDecoder(w.Body).Decode(&shots); err != nil {
		t.Fatalf("decode error: %v", err)
	}
	if len(shots) != 1 {
		t.Errorf("expected 1 shot for round-1, got %d", len(shots))
	}
}

func TestRoundHandler_CreateAndList(t *testing.T) {
	h, _ := setupRoundHandler()

	body, marshalErr := json.Marshal(validRound())
	if marshalErr != nil {
		t.Fatalf("marshal error: %v", marshalErr)
	}
	req := httptest.NewRequest(http.MethodPost, "/api/rounds", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	h.HandleRounds(w, req)

	if w.Code != http.StatusCreated {
		t.Errorf("POST /api/rounds status = %d, want %d. Body: %s", w.Code, http.StatusCreated, w.Body.String())
	}

	req = httptest.NewRequest(http.MethodGet, "/api/rounds", nil)
	w = httptest.NewRecorder()
	h.HandleRounds(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("GET /api/rounds status = %d, want %d", w.Code, http.StatusOK)
	}

	var rounds []model.Round
	if err := json.NewDecoder(w.Body).Decode(&rounds); err != nil {
		t.Fatalf("decode error: %v", err)
	}
	if len(rounds) != 1 {
		t.Errorf("expected 1 round, got %d", len(rounds))
	}
}

func TestCourseHandler_ListAndGet(t *testing.T) {
	s := store.NewMemoryCourseStore()
	h := handler.NewCourseHandler(s)

	// GET /api/courses
	req := httptest.NewRequest(http.MethodGet, "/api/courses", nil)
	w := httptest.NewRecorder()
	h.HandleCourses(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("GET /api/courses status = %d, want %d", w.Code, http.StatusOK)
	}

	var courses []model.Course
	if err := json.NewDecoder(w.Body).Decode(&courses); err != nil {
		t.Fatalf("decode error: %v", err)
	}
	if len(courses) == 0 {
		t.Error("expected at least 1 course")
	}

	// GET /api/courses/mock-course-001
	req = httptest.NewRequest(http.MethodGet, "/api/courses/mock-course-001", nil)
	w = httptest.NewRecorder()
	h.HandleCourseByID(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("GET /api/courses/mock-course-001 status = %d, want %d", w.Code, http.StatusOK)
	}
}

func TestStatsHandler(t *testing.T) {
	shotStore := store.NewMemoryShotStore()
	h := handler.NewStatsHandler(shotStore)

	// 空の状態
	req := httptest.NewRequest(http.MethodGet, "/api/stats", nil)
	w := httptest.NewRecorder()
	h.HandleStats(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("GET /api/stats status = %d, want %d", w.Code, http.StatusOK)
	}

	// データ投入
	shot := validShot()
	if _, err := shotStore.Create(nil, shot); err != nil {
		t.Fatalf("setup error: %v", err)
	}

	req = httptest.NewRequest(http.MethodGet, "/api/stats", nil)
	w = httptest.NewRecorder()
	h.HandleStats(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("GET /api/stats with data status = %d, want %d", w.Code, http.StatusOK)
	}

	var stats []model.DistanceStats
	if err := json.NewDecoder(w.Body).Decode(&stats); err != nil {
		t.Fatalf("decode error: %v", err)
	}
	if len(stats) != 1 {
		t.Errorf("expected 1 stat, got %d", len(stats))
	}

	// Method not allowed
	req = httptest.NewRequest(http.MethodPost, "/api/stats", nil)
	w = httptest.NewRecorder()
	h.HandleStats(w, req)

	if w.Code != http.StatusMethodNotAllowed {
		t.Errorf("POST /api/stats status = %d, want %d", w.Code, http.StatusMethodNotAllowed)
	}
}

func TestRecommendationHandler(t *testing.T) {
	engine := service.NewRecommendationService(5)
	h := handler.NewRecommendationHandler(engine)

	reqBody := model.RecommendRequest{
		CurrentPosition: model.Coordinate{Lat: 75, Lng: 0},
		TargetPosition:  model.Coordinate{Lat: 75, Lng: 230},
		Hazards:         []model.Hazard{},
		Shots:           []model.Shot{},
		RoundCount:      0,
	}

	body, marshalErr := json.Marshal(reqBody)
	if marshalErr != nil {
		t.Fatalf("marshal error: %v", marshalErr)
	}

	t.Run("正常リクエスト", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/api/recommend", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		h.HandleRecommend(w, req)

		if w.Code != http.StatusOK {
			t.Errorf("POST /api/recommend status = %d, want %d. Body: %s", w.Code, http.StatusOK, w.Body.String())
		}

		var recs []model.ClubRecommendation
		if err := json.NewDecoder(w.Body).Decode(&recs); err != nil {
			t.Fatalf("decode error: %v", err)
		}
		if len(recs) != 3 {
			t.Errorf("expected 3 recommendations, got %d", len(recs))
		}
	})

	t.Run("不正なメソッド", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/recommend", nil)
		w := httptest.NewRecorder()
		h.HandleRecommend(w, req)

		if w.Code != http.StatusMethodNotAllowed {
			t.Errorf("GET /api/recommend status = %d, want %d", w.Code, http.StatusMethodNotAllowed)
		}
	})

	t.Run("不正なボディ", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/api/recommend", bytes.NewReader([]byte("invalid")))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		h.HandleRecommend(w, req)

		if w.Code != http.StatusBadRequest {
			t.Errorf("POST /api/recommend with invalid body status = %d, want %d", w.Code, http.StatusBadRequest)
		}
	})

	t.Run("不正な座標", func(t *testing.T) {
		invalidReq := model.RecommendRequest{
			CurrentPosition: model.Coordinate{Lat: 999, Lng: 0},
			TargetPosition:  model.Coordinate{Lat: 75, Lng: 230},
		}
		invalidBody, marshalErr := json.Marshal(invalidReq)
		if marshalErr != nil {
			t.Fatalf("marshal error: %v", marshalErr)
		}
		req := httptest.NewRequest(http.MethodPost, "/api/recommend", bytes.NewReader(invalidBody))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		h.HandleRecommend(w, req)

		if w.Code != http.StatusBadRequest {
			t.Errorf("POST /api/recommend with invalid coordinate status = %d, want %d", w.Code, http.StatusBadRequest)
		}
	})
}
