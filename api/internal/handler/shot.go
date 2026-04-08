package handler

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/ryusei/fairway-caddie/api/internal/model"
	"github.com/ryusei/fairway-caddie/api/internal/store"
)

// ShotHandler はショットAPIのハンドラ。
type ShotHandler struct {
	store store.ShotStore
}

// NewShotHandler は新しいShotHandlerを作成する。
func NewShotHandler(s store.ShotStore) *ShotHandler {
	return &ShotHandler{store: s}
}

// HandleShots は /api/shots エンドポイントのハンドラ。
func (h *ShotHandler) HandleShots(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		h.listShots(w, r)
	case http.MethodPost:
		h.createShot(w, r)
	default:
		respondError(w, http.StatusMethodNotAllowed, "メソッドが許可されていません")
	}
}

// HandleShotByID は /api/shots/{id} エンドポイントのハンドラ。
func (h *ShotHandler) HandleShotByID(w http.ResponseWriter, r *http.Request) {
	id := extractIDFromPath(r.URL.Path, "/api/shots/")
	if id == "" {
		respondError(w, http.StatusBadRequest, "ショットIDが指定されていません")
		return
	}

	switch r.Method {
	case http.MethodGet:
		h.getShot(w, r, id)
	case http.MethodPut:
		h.updateShot(w, r, id)
	case http.MethodDelete:
		h.deleteShot(w, r, id)
	default:
		respondError(w, http.StatusMethodNotAllowed, "メソッドが許可されていません")
	}
}

func (h *ShotHandler) listShots(w http.ResponseWriter, r *http.Request) {
	roundID := r.URL.Query().Get("roundId")
	var shots []model.Shot
	var err error

	if roundID != "" {
		shots, err = h.store.ListByRound(r.Context(), roundID)
	} else {
		shots, err = h.store.List(r.Context())
	}
	if err != nil {
		respondError(w, http.StatusInternalServerError, "ショットの取得に失敗しました")
		return
	}

	if shots == nil {
		shots = []model.Shot{}
	}
	respondJSON(w, http.StatusOK, shots)
}

func (h *ShotHandler) getShot(w http.ResponseWriter, r *http.Request, id string) {
	shot, err := h.store.GetByID(r.Context(), id)
	if err != nil {
		respondError(w, http.StatusNotFound, "ショットが見つかりません")
		return
	}
	respondJSON(w, http.StatusOK, shot)
}

func (h *ShotHandler) createShot(w http.ResponseWriter, r *http.Request) {
	limitRequestBody(w, r)

	var shot model.Shot
	if err := json.NewDecoder(r.Body).Decode(&shot); err != nil {
		if isMaxBytesError(err) {
			respondError(w, http.StatusRequestEntityTooLarge, "リクエストボディが大きすぎます")
			return
		}
		respondError(w, http.StatusBadRequest, "リクエストボディのパースに失敗しました")
		return
	}

	if err := shot.Validate(); err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}

	created, err := h.store.Create(r.Context(), shot)
	if err != nil {
		respondError(w, http.StatusConflict, err.Error())
		return
	}
	respondJSON(w, http.StatusCreated, created)
}

func (h *ShotHandler) updateShot(w http.ResponseWriter, r *http.Request, id string) {
	limitRequestBody(w, r)

	var shot model.Shot
	if err := json.NewDecoder(r.Body).Decode(&shot); err != nil {
		if isMaxBytesError(err) {
			respondError(w, http.StatusRequestEntityTooLarge, "リクエストボディが大きすぎます")
			return
		}
		respondError(w, http.StatusBadRequest, "リクエストボディのパースに失敗しました")
		return
	}
	shot.ID = id

	if err := shot.Validate(); err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}

	updated, err := h.store.Update(r.Context(), shot)
	if err != nil {
		respondError(w, http.StatusNotFound, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, updated)
}

func (h *ShotHandler) deleteShot(w http.ResponseWriter, r *http.Request, id string) {
	if err := h.store.Delete(r.Context(), id); err != nil {
		respondError(w, http.StatusNotFound, err.Error())
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// extractIDFromPath はパスからIDを抽出する。
func extractIDFromPath(path, prefix string) string {
	trimmed := strings.TrimPrefix(path, prefix)
	// スラッシュが含まれている場合は最初のセグメントのみ取得
	if idx := strings.Index(trimmed, "/"); idx >= 0 {
		trimmed = trimmed[:idx]
	}
	return trimmed
}
