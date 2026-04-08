package middleware_test

import (
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"github.com/ryusei/fairway-caddie/api/internal/middleware"
)

func TestCORS_DefaultOrigin(t *testing.T) {
	// CORS_ALLOWED_ORIGINS が未設定の場合、localhost:5173 を許可
	if err := os.Unsetenv("CORS_ALLOWED_ORIGINS"); err != nil {
		t.Fatalf("unsetenv error: %v", err)
	}

	inner := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})
	h := middleware.CORS(inner)

	req := httptest.NewRequest(http.MethodGet, "/api/test", nil)
	req.Header.Set("Origin", "http://localhost:5173")
	w := httptest.NewRecorder()
	h.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("status = %d, want %d", w.Code, http.StatusOK)
	}
	if got := w.Header().Get("Access-Control-Allow-Origin"); got != "http://localhost:5173" {
		t.Errorf("ACAO = %q, want http://localhost:5173", got)
	}
}

func TestCORS_PreflightOptions(t *testing.T) {
	if err := os.Unsetenv("CORS_ALLOWED_ORIGINS"); err != nil {
		t.Fatalf("unsetenv error: %v", err)
	}

	inner := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})
	h := middleware.CORS(inner)

	req := httptest.NewRequest(http.MethodOptions, "/api/test", nil)
	req.Header.Set("Origin", "http://localhost:5173")
	w := httptest.NewRecorder()
	h.ServeHTTP(w, req)

	if w.Code != http.StatusNoContent {
		t.Errorf("OPTIONS status = %d, want %d", w.Code, http.StatusNoContent)
	}
}

func TestCORS_DisallowedOrigin(t *testing.T) {
	if err := os.Unsetenv("CORS_ALLOWED_ORIGINS"); err != nil {
		t.Fatalf("unsetenv error: %v", err)
	}

	inner := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})
	h := middleware.CORS(inner)

	req := httptest.NewRequest(http.MethodGet, "/api/test", nil)
	req.Header.Set("Origin", "http://evil.example.com")
	w := httptest.NewRecorder()
	h.ServeHTTP(w, req)

	if got := w.Header().Get("Access-Control-Allow-Origin"); got != "" {
		t.Errorf("ACAO should be empty for disallowed origin, got %q", got)
	}
}

func TestCORS_CustomOrigins(t *testing.T) {
	t.Setenv("CORS_ALLOWED_ORIGINS", "http://example.com, http://another.com")

	inner := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})
	h := middleware.CORS(inner)

	req := httptest.NewRequest(http.MethodGet, "/api/test", nil)
	req.Header.Set("Origin", "http://example.com")
	w := httptest.NewRecorder()
	h.ServeHTTP(w, req)

	if got := w.Header().Get("Access-Control-Allow-Origin"); got != "http://example.com" {
		t.Errorf("ACAO = %q, want http://example.com", got)
	}
}
