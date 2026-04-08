package store

import (
	"context"
	"fmt"
	"sync"

	"github.com/ryusei/fairway-caddie/api/internal/model"
)

// ShotStore はショットデータのストアインターフェース。
type ShotStore interface {
	List(ctx context.Context) ([]model.Shot, error)
	ListByRound(ctx context.Context, roundID string) ([]model.Shot, error)
	GetByID(ctx context.Context, id string) (model.Shot, error)
	Create(ctx context.Context, shot model.Shot) (model.Shot, error)
	Update(ctx context.Context, shot model.Shot) (model.Shot, error)
	Delete(ctx context.Context, id string) error
}

// RoundStore はラウンドデータのストアインターフェース。
type RoundStore interface {
	List(ctx context.Context) ([]model.Round, error)
	GetByID(ctx context.Context, id string) (model.Round, error)
	Create(ctx context.Context, round model.Round) (model.Round, error)
	Update(ctx context.Context, round model.Round) (model.Round, error)
	Delete(ctx context.Context, id string) error
	Count(ctx context.Context) (int, error)
}

// CourseStore はコースデータのストアインターフェース。
type CourseStore interface {
	List(ctx context.Context) ([]model.Course, error)
	GetByID(ctx context.Context, id string) (model.Course, error)
}

// MemoryShotStore はインメモリのショットストア。
type MemoryShotStore struct {
	mu    sync.RWMutex
	shots map[string]model.Shot
	order []string
}

// NewMemoryShotStore は新しいインメモリショットストアを作成する。
func NewMemoryShotStore() *MemoryShotStore {
	return &MemoryShotStore{
		shots: make(map[string]model.Shot),
	}
}

func (s *MemoryShotStore) List(_ context.Context) ([]model.Shot, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	result := make([]model.Shot, 0, len(s.order))
	for _, id := range s.order {
		if shot, ok := s.shots[id]; ok {
			result = append(result, shot)
		}
	}
	return result, nil
}

func (s *MemoryShotStore) ListByRound(_ context.Context, roundID string) ([]model.Shot, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	var result []model.Shot
	for _, id := range s.order {
		if shot, ok := s.shots[id]; ok && shot.RoundID == roundID {
			result = append(result, shot)
		}
	}
	return result, nil
}

func (s *MemoryShotStore) GetByID(_ context.Context, id string) (model.Shot, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	shot, ok := s.shots[id]
	if !ok {
		return model.Shot{}, fmt.Errorf("ショットが見つかりません: %s", id)
	}
	return shot, nil
}

func (s *MemoryShotStore) Create(_ context.Context, shot model.Shot) (model.Shot, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if _, exists := s.shots[shot.ID]; exists {
		return model.Shot{}, fmt.Errorf("ショットID %s は既に存在します", shot.ID)
	}
	s.shots[shot.ID] = shot
	s.order = append(s.order, shot.ID)
	return shot, nil
}

func (s *MemoryShotStore) Update(_ context.Context, shot model.Shot) (model.Shot, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if _, exists := s.shots[shot.ID]; !exists {
		return model.Shot{}, fmt.Errorf("ショットが見つかりません: %s", shot.ID)
	}
	s.shots[shot.ID] = shot
	return shot, nil
}

func (s *MemoryShotStore) Delete(_ context.Context, id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	if _, exists := s.shots[id]; !exists {
		return fmt.Errorf("ショットが見つかりません: %s", id)
	}
	delete(s.shots, id)
	newOrder := make([]string, 0, len(s.order)-1)
	for _, oid := range s.order {
		if oid != id {
			newOrder = append(newOrder, oid)
		}
	}
	s.order = newOrder
	return nil
}

// MemoryRoundStore はインメモリのラウンドストア。
type MemoryRoundStore struct {
	mu     sync.RWMutex
	rounds map[string]model.Round
	order  []string
}

// NewMemoryRoundStore は新しいインメモリラウンドストアを作成する。
func NewMemoryRoundStore() *MemoryRoundStore {
	return &MemoryRoundStore{
		rounds: make(map[string]model.Round),
	}
}

func (s *MemoryRoundStore) List(_ context.Context) ([]model.Round, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	result := make([]model.Round, 0, len(s.order))
	for _, id := range s.order {
		if round, ok := s.rounds[id]; ok {
			result = append(result, round)
		}
	}
	return result, nil
}

func (s *MemoryRoundStore) GetByID(_ context.Context, id string) (model.Round, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	round, ok := s.rounds[id]
	if !ok {
		return model.Round{}, fmt.Errorf("ラウンドが見つかりません: %s", id)
	}
	return round, nil
}

func (s *MemoryRoundStore) Create(_ context.Context, round model.Round) (model.Round, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if _, exists := s.rounds[round.ID]; exists {
		return model.Round{}, fmt.Errorf("ラウンドID %s は既に存在します", round.ID)
	}
	s.rounds[round.ID] = round
	s.order = append(s.order, round.ID)
	return round, nil
}

func (s *MemoryRoundStore) Update(_ context.Context, round model.Round) (model.Round, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if _, exists := s.rounds[round.ID]; !exists {
		return model.Round{}, fmt.Errorf("ラウンドが見つかりません: %s", round.ID)
	}
	s.rounds[round.ID] = round
	return round, nil
}

func (s *MemoryRoundStore) Delete(_ context.Context, id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	if _, exists := s.rounds[id]; !exists {
		return fmt.Errorf("ラウンドが見つかりません: %s", id)
	}
	delete(s.rounds, id)
	newOrder := make([]string, 0, len(s.order)-1)
	for _, oid := range s.order {
		if oid != id {
			newOrder = append(newOrder, oid)
		}
	}
	s.order = newOrder
	return nil
}

func (s *MemoryRoundStore) Count(_ context.Context) (int, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return len(s.rounds), nil
}

// MemoryCourseStore はインメモリのコースストア（モックデータ付き）。
type MemoryCourseStore struct {
	mu      sync.RWMutex
	courses map[string]model.Course
	order   []string
}

// NewMemoryCourseStore は新しいインメモリコースストアをモックデータ付きで作成する。
func NewMemoryCourseStore() *MemoryCourseStore {
	mockCourse := model.Course{
		ID:   "mock-course-001",
		Name: "サンプルゴルフコース",
		Holes: []model.Hole{
			{
				Number:        1,
				Par:           4,
				DistanceYards: 370,
				TeePosition:   model.Coordinate{Lat: 75, Lng: 0},
				PinPosition:   model.Coordinate{Lat: 75, Lng: 370},
				FairwayCenter: model.Coordinate{Lat: 75, Lng: 185},
				Hazards: []model.Hazard{
					{
						ID:          "h-bunker-1",
						Type:        model.HazardBunker,
						Position:    model.Coordinate{Lat: 120, Lng: 200},
						RadiusYards: 15,
					},
					{
						ID:          "h-water-1",
						Type:        model.HazardWater,
						Position:    model.Coordinate{Lat: 30, Lng: 280},
						RadiusYards: 20,
					},
				},
			},
		},
	}

	return &MemoryCourseStore{
		courses: map[string]model.Course{
			mockCourse.ID: mockCourse,
		},
		order: []string{mockCourse.ID},
	}
}

func (s *MemoryCourseStore) List(_ context.Context) ([]model.Course, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	result := make([]model.Course, 0, len(s.order))
	for _, id := range s.order {
		if course, ok := s.courses[id]; ok {
			result = append(result, course)
		}
	}
	return result, nil
}

func (s *MemoryCourseStore) GetByID(_ context.Context, id string) (model.Course, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	course, ok := s.courses[id]
	if !ok {
		return model.Course{}, fmt.Errorf("コースが見つかりません: %s", id)
	}
	return course, nil
}
