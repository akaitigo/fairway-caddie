package model_test

import (
	"testing"

	"github.com/ryusei/fairway-caddie/api/internal/model"
)

func TestValidateRoundDate(t *testing.T) {
	tests := []struct {
		name    string
		date    string
		wantErr bool
	}{
		{"有効な日付 (YYYY-MM-DD)", "2025-01-01", false},
		{"有効な日付 (ISO8601)", "2025-01-01T00:00:00Z", false},
		{"有効な日付 (ISO8601 JST)", "2025-01-01T09:00:00+09:00", false},
		{"未来日", "2099-12-31T00:00:00Z", true},
		{"不正な形式", "not-a-date", true},
		{"空文字", "", true},
		// UTC midnight = JST 翌日の場合でも日付部分で判定する
		{"今日のUTC midnight", "2025-06-01T00:00:00Z", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := model.ValidateRoundDate(tt.date)
			if (err != nil) != tt.wantErr {
				t.Errorf("ValidateRoundDate(%q) error = %v, wantErr %v", tt.date, err, tt.wantErr)
			}
		})
	}
}

func TestRoundValidate(t *testing.T) {
	t.Run("有効なラウンド", func(t *testing.T) {
		round := model.Round{
			ID:       "round-1",
			CourseID: "course-1",
			Date:     "2025-06-01",
			Shots:    []model.Shot{},
		}
		if err := round.Validate(); err != nil {
			t.Errorf("Validate() unexpected error: %v", err)
		}
	})

	t.Run("空ID", func(t *testing.T) {
		round := model.Round{
			ID:       "",
			CourseID: "course-1",
			Date:     "2025-06-01",
		}
		if err := round.Validate(); err == nil {
			t.Error("Validate() should return error for empty ID")
		}
	})

	t.Run("空コースID", func(t *testing.T) {
		round := model.Round{
			ID:       "round-1",
			CourseID: "",
			Date:     "2025-06-01",
		}
		if err := round.Validate(); err == nil {
			t.Error("Validate() should return error for empty CourseID")
		}
	})

	t.Run("不正な日付", func(t *testing.T) {
		round := model.Round{
			ID:       "round-1",
			CourseID: "course-1",
			Date:     "invalid",
		}
		if err := round.Validate(); err == nil {
			t.Error("Validate() should return error for invalid date")
		}
	})
}
