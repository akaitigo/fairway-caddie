package handler

import (
	"encoding/json"
	"errors"
	"net/http"
)

// maxRequestBodySize はリクエストボディの最大サイズ (1MB)。
const maxRequestBodySize = 1 << 20

// limitRequestBody はリクエストボディのサイズを制限する。
// 制限を超えた場合は413エラーレスポンスを返してfalseを返す。
func limitRequestBody(w http.ResponseWriter, r *http.Request) bool {
	r.Body = http.MaxBytesReader(w, r.Body, maxRequestBodySize)
	return true
}

// isMaxBytesError はMaxBytesReaderによるサイズ超過エラーかを判定する。
func isMaxBytesError(err error) bool {
	var maxBytesErr *http.MaxBytesError
	return errors.As(err, &maxBytesErr)
}

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
