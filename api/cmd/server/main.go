package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/ryusei/fairway-caddie/api/internal/handler"
	"github.com/ryusei/fairway-caddie/api/internal/middleware"
	"github.com/ryusei/fairway-caddie/api/internal/service"
	"github.com/ryusei/fairway-caddie/api/internal/store"
)

func main() {
	port := os.Getenv("API_PORT")
	if port == "" {
		port = "8080"
	}

	// ストア初期化
	shotStore := store.NewMemoryShotStore()
	roundStore := store.NewMemoryRoundStore()
	courseStore := store.NewMemoryCourseStore()

	// サービス初期化
	recommendService := service.NewRecommendationService(5)

	// ハンドラ初期化
	shotHandler := handler.NewShotHandler(shotStore)
	roundHandler := handler.NewRoundHandler(roundStore, shotStore)
	courseHandler := handler.NewCourseHandler(courseStore)
	statsHandler := handler.NewStatsHandler(shotStore)
	recommendHandler := handler.NewRecommendationHandler(recommendService)

	// ルーティング
	mux := http.NewServeMux()

	// ヘルスチェック
	mux.HandleFunc("/api/health", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			w.Header().Set("Content-Type", "application/json; charset=utf-8")
			w.WriteHeader(http.StatusMethodNotAllowed)
			if _, err := w.Write([]byte(`{"error":"メソッドが許可されていません"}`)); err != nil {
				log.Printf("ヘルスチェックエラーレスポンスの書き込みに失敗: %v", err)
			}
			return
		}
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		w.WriteHeader(http.StatusOK)
		if _, err := w.Write([]byte(`{"status":"ok"}`)); err != nil {
			log.Printf("ヘルスチェックレスポンスの書き込みに失敗: %v", err)
		}
	})

	// ショットAPI
	mux.HandleFunc("/api/shots", shotHandler.HandleShots)
	mux.HandleFunc("/api/shots/", func(w http.ResponseWriter, r *http.Request) {
		path := strings.TrimPrefix(r.URL.Path, "/api/shots/")
		if path == "" || strings.Contains(path, "/") {
			http.NotFound(w, r)
			return
		}
		shotHandler.HandleShotByID(w, r)
	})

	// ラウンドAPI
	mux.HandleFunc("/api/rounds", roundHandler.HandleRounds)
	mux.HandleFunc("/api/rounds/", func(w http.ResponseWriter, r *http.Request) {
		path := strings.TrimPrefix(r.URL.Path, "/api/rounds/")
		if path == "" || strings.Contains(path, "/") {
			http.NotFound(w, r)
			return
		}
		roundHandler.HandleRoundByID(w, r)
	})

	// コースAPI
	mux.HandleFunc("/api/courses", courseHandler.HandleCourses)
	mux.HandleFunc("/api/courses/", func(w http.ResponseWriter, r *http.Request) {
		path := strings.TrimPrefix(r.URL.Path, "/api/courses/")
		if path == "" || strings.Contains(path, "/") {
			http.NotFound(w, r)
			return
		}
		courseHandler.HandleCourseByID(w, r)
	})

	// 統計API
	mux.HandleFunc("/api/stats", statsHandler.HandleStats)

	// 推薦API
	mux.HandleFunc("/api/recommend", recommendHandler.HandleRecommend)

	// ミドルウェア適用
	var h http.Handler = mux
	h = middleware.CORS(h)
	h = middleware.Logging(h)

	server := &http.Server{
		Addr:              ":" + port,
		Handler:           h,
		ReadHeaderTimeout: 10 * time.Second,
		ReadTimeout:       30 * time.Second,
		WriteTimeout:      30 * time.Second,
		IdleTimeout:       120 * time.Second,
	}

	// Graceful shutdown
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	go func() {
		log.Printf("fairway-caddie API server starting on :%s", port)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("サーバーの起動に失敗しました: %v", err)
		}
	}()

	<-ctx.Done()
	log.Println("シャットダウンシグナルを受信しました...")

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := server.Shutdown(shutdownCtx); err != nil {
		log.Fatalf("サーバーのシャットダウンに失敗しました: %v", err)
	}
	log.Println("サーバーを正常にシャットダウンしました")
}
