package handler

import (
	"net/http"

	"github.com/ryusei/fairway-caddie/api/internal/model"
	"github.com/ryusei/fairway-caddie/api/internal/service"
	"github.com/ryusei/fairway-caddie/api/internal/store"
)

// StatsHandler は統計APIのハンドラ。
type StatsHandler struct {
	shotStore store.ShotStore
}

// NewStatsHandler は新しいStatsHandlerを作成する。
func NewStatsHandler(s store.ShotStore) *StatsHandler {
	return &StatsHandler{shotStore: s}
}

// HandleStats は /api/stats エンドポイントのハンドラ。
// クエリパラメータ roundId でラウンド指定可能。
func (h *StatsHandler) HandleStats(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		respondError(w, http.StatusMethodNotAllowed, "メソッドが許可されていません")
		return
	}

	roundID := r.URL.Query().Get("roundId")
	var shots []model.Shot
	var err error

	if roundID != "" {
		shots, err = h.shotStore.ListByRound(r.Context(), roundID)
	} else {
		shots, err = h.shotStore.List(r.Context())
	}

	if err != nil {
		respondError(w, http.StatusInternalServerError, "ショットの取得に失敗しました")
		return
	}

	stats := service.CalculateClubStats(shots)
	if stats == nil {
		stats = []model.DistanceStats{}
	}
	respondJSON(w, http.StatusOK, stats)
}
