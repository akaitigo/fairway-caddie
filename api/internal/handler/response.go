package handler

import (
	"encoding/json"
	"net/http"
)

// ErrorResponse はAPIエラーレスポンス。
type ErrorResponse struct {
	Error string `json:"error"`
}

// respondJSON はJSONレスポンスを返す。
func respondJSON(w http.ResponseWriter, status int, payload interface{}) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(payload); err != nil {
		http.Error(w, `{"error":"レスポンスのエンコードに失敗しました"}`, http.StatusInternalServerError)
	}
}

// respondError はエラーレスポンスを返す。
func respondError(w http.ResponseWriter, status int, message string) {
	respondJSON(w, status, ErrorResponse{Error: message})
}
