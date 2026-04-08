package handler

import (
	"encoding/json"
	"net/http"

	"github.com/ryusei/fairway-caddie/api/internal/model"
	"github.com/ryusei/fairway-caddie/api/internal/service"
)

// RecommendationHandler はクラブ推薦APIのハンドラ。
type RecommendationHandler struct {
	engine *service.RecommendationService
}

// NewRecommendationHandler は新しいRecommendationHandlerを作成する。
func NewRecommendationHandler(engine *service.RecommendationService) *RecommendationHandler {
	return &RecommendationHandler{engine: engine}
}

// HandleRecommend は /api/recommend エンドポイントのハンドラ。
func (h *RecommendationHandler) HandleRecommend(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		respondError(w, http.StatusMethodNotAllowed, "メソッドが許可されていません")
		return
	}

	var req model.RecommendRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "リクエストボディのパースに失敗しました")
		return
	}

	if err := req.CurrentPosition.Validate(); err != nil {
		respondError(w, http.StatusBadRequest, "現在位置が不正です: "+err.Error())
		return
	}
	if err := req.TargetPosition.Validate(); err != nil {
		respondError(w, http.StatusBadRequest, "ターゲット位置が不正です: "+err.Error())
		return
	}

	if req.Hazards == nil {
		req.Hazards = []model.Hazard{}
	}
	if req.Shots == nil {
		req.Shots = []model.Shot{}
	}

	recommendations := h.engine.Recommend(
		req.CurrentPosition,
		req.TargetPosition,
		req.Hazards,
		req.Shots,
		req.RoundCount,
	)

	respondJSON(w, http.StatusOK, recommendations)
}
