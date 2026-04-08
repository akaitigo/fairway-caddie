package handler

import (
	"net/http"

	"github.com/ryusei/fairway-caddie/api/internal/store"
)

// CourseHandler はコースAPIのハンドラ。
type CourseHandler struct {
	store store.CourseStore
}

// NewCourseHandler は新しいCourseHandlerを作成する。
func NewCourseHandler(s store.CourseStore) *CourseHandler {
	return &CourseHandler{store: s}
}

// HandleCourses は /api/courses エンドポイントのハンドラ。
func (h *CourseHandler) HandleCourses(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		h.listCourses(w, r)
	default:
		respondError(w, http.StatusMethodNotAllowed, "メソッドが許可されていません")
	}
}

// HandleCourseByID は /api/courses/{id} エンドポイントのハンドラ。
func (h *CourseHandler) HandleCourseByID(w http.ResponseWriter, r *http.Request) {
	id := extractIDFromPath(r.URL.Path, "/api/courses/")
	if id == "" {
		respondError(w, http.StatusBadRequest, "コースIDが指定されていません")
		return
	}

	switch r.Method {
	case http.MethodGet:
		h.getCourse(w, r, id)
	default:
		respondError(w, http.StatusMethodNotAllowed, "メソッドが許可されていません")
	}
}

func (h *CourseHandler) listCourses(w http.ResponseWriter, r *http.Request) {
	courses, err := h.store.List(r.Context())
	if err != nil {
		respondError(w, http.StatusInternalServerError, "コースの取得に失敗しました")
		return
	}
	respondJSON(w, http.StatusOK, courses)
}

func (h *CourseHandler) getCourse(w http.ResponseWriter, r *http.Request, id string) {
	course, err := h.store.GetByID(r.Context(), id)
	if err != nil {
		respondError(w, http.StatusNotFound, "コースが見つかりません")
		return
	}
	respondJSON(w, http.StatusOK, course)
}
