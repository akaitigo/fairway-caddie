package handler

import (
	"encoding/json"
	"net/http"

	"github.com/ryusei/fairway-caddie/api/internal/model"
	"github.com/ryusei/fairway-caddie/api/internal/store"
)

// RoundHandler はラウンドAPIのハンドラ。
type RoundHandler struct {
	store     store.RoundStore
	shotStore store.ShotStore
}

// NewRoundHandler は新しいRoundHandlerを作成する。
func NewRoundHandler(s store.RoundStore, ss store.ShotStore) *RoundHandler {
	return &RoundHandler{store: s, shotStore: ss}
}

// HandleRounds は /api/rounds エンドポイントのハンドラ。
func (h *RoundHandler) HandleRounds(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		h.listRounds(w, r)
	case http.MethodPost:
		h.createRound(w, r)
	default:
		respondError(w, http.StatusMethodNotAllowed, "メソッドが許可されていません")
	}
}

// HandleRoundByID は /api/rounds/{id} エンドポイントのハンドラ。
func (h *RoundHandler) HandleRoundByID(w http.ResponseWriter, r *http.Request) {
	id := extractIDFromPath(r.URL.Path, "/api/rounds/")
	if id == "" {
		respondError(w, http.StatusBadRequest, "ラウンドIDが指定されていません")
		return
	}

	switch r.Method {
	case http.MethodGet:
		h.getRound(w, r, id)
	case http.MethodPut:
		h.updateRound(w, r, id)
	case http.MethodDelete:
		h.deleteRound(w, r, id)
	default:
		respondError(w, http.StatusMethodNotAllowed, "メソッドが許可されていません")
	}
}

func (h *RoundHandler) listRounds(w http.ResponseWriter, r *http.Request) {
	rounds, err := h.store.List(r.Context())
	if err != nil {
		respondError(w, http.StatusInternalServerError, "ラウンドの取得に失敗しました")
		return
	}
	if rounds == nil {
		rounds = []model.Round{}
	}

	// 各ラウンドにShotStoreのショットを同期する
	if h.shotStore != nil {
		for i, round := range rounds {
			shots, shotErr := h.shotStore.ListByRound(r.Context(), round.ID)
			if shotErr != nil {
				respondError(w, http.StatusInternalServerError, "ショットの取得に失敗しました")
				return
			}
			if shots == nil {
				shots = []model.Shot{}
			}
			rounds[i].Shots = shots
		}
	}

	respondJSON(w, http.StatusOK, rounds)
}

func (h *RoundHandler) getRound(w http.ResponseWriter, r *http.Request, id string) {
	round, err := h.store.GetByID(r.Context(), id)
	if err != nil {
		respondError(w, http.StatusNotFound, "ラウンドが見つかりません")
		return
	}

	// ShotStoreからこのラウンドのショットを動的に取得して同期する
	if h.shotStore != nil {
		shots, shotErr := h.shotStore.ListByRound(r.Context(), id)
		if shotErr != nil {
			respondError(w, http.StatusInternalServerError, "ショットの取得に失敗しました")
			return
		}
		if shots == nil {
			shots = []model.Shot{}
		}
		round.Shots = shots
	}

	respondJSON(w, http.StatusOK, round)
}

func (h *RoundHandler) createRound(w http.ResponseWriter, r *http.Request) {
	limitRequestBody(w, r)

	var round model.Round
	if err := json.NewDecoder(r.Body).Decode(&round); err != nil {
		if isMaxBytesError(err) {
			respondError(w, http.StatusRequestEntityTooLarge, "リクエストボディが大きすぎます")
			return
		}
		respondError(w, http.StatusBadRequest, "リクエストボディのパースに失敗しました")
		return
	}

	if err := round.Validate(); err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}

	// ShotsをshotStoreに同期するため退避し、roundStoreには保存しない
	shotsToSync := round.Shots
	round.Shots = nil

	created, err := h.store.Create(r.Context(), round)
	if err != nil {
		respondError(w, http.StatusConflict, err.Error())
		return
	}

	// リクエストに含まれるショットをshotStoreに同期
	if h.shotStore != nil {
		for _, shot := range shotsToSync {
			shot.RoundID = created.ID
			if _, syncErr := h.shotStore.Create(r.Context(), shot); syncErr != nil {
				// 重複IDは無視（既にshotStoreに存在する場合）
				continue
			}
		}
	}

	// レスポンスにはshotStoreのショットを反映
	if h.shotStore != nil {
		shots, shotErr := h.shotStore.ListByRound(r.Context(), created.ID)
		if shotErr == nil {
			if shots == nil {
				shots = []model.Shot{}
			}
			created.Shots = shots
		}
	}
	if created.Shots == nil {
		created.Shots = []model.Shot{}
	}

	respondJSON(w, http.StatusCreated, created)
}

func (h *RoundHandler) updateRound(w http.ResponseWriter, r *http.Request, id string) {
	limitRequestBody(w, r)

	var round model.Round
	if err := json.NewDecoder(r.Body).Decode(&round); err != nil {
		if isMaxBytesError(err) {
			respondError(w, http.StatusRequestEntityTooLarge, "リクエストボディが大きすぎます")
			return
		}
		respondError(w, http.StatusBadRequest, "リクエストボディのパースに失敗しました")
		return
	}
	round.ID = id

	if err := round.Validate(); err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}

	// ShotsをshotStoreに同期するため退避し、roundStoreには保存しない
	shotsToSync := round.Shots
	round.Shots = nil

	updated, err := h.store.Update(r.Context(), round)
	if err != nil {
		respondError(w, http.StatusNotFound, err.Error())
		return
	}

	// リクエストに含まれるショットをshotStoreに同期
	if h.shotStore != nil {
		for _, shot := range shotsToSync {
			shot.RoundID = updated.ID
			// 既存のショットは更新、新規は作成
			if _, syncErr := h.shotStore.Update(r.Context(), shot); syncErr != nil {
				if _, createErr := h.shotStore.Create(r.Context(), shot); createErr != nil {
					continue
				}
			}
		}
	}

	// レスポンスにはshotStoreのショットを反映
	if h.shotStore != nil {
		shots, shotErr := h.shotStore.ListByRound(r.Context(), updated.ID)
		if shotErr == nil {
			if shots == nil {
				shots = []model.Shot{}
			}
			updated.Shots = shots
		}
	}
	if updated.Shots == nil {
		updated.Shots = []model.Shot{}
	}

	respondJSON(w, http.StatusOK, updated)
}

func (h *RoundHandler) deleteRound(w http.ResponseWriter, r *http.Request, id string) {
	if err := h.store.Delete(r.Context(), id); err != nil {
		respondError(w, http.StatusNotFound, err.Error())
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
