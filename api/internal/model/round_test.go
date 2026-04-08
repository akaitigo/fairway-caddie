package model_test

import (
	"fmt"
	"testing"
	"time"

	"github.com/ryusei/fairway-caddie/api/internal/model"
)

func TestValidateRoundDate(t *testing.T) {
	jst, err := time.LoadLocation("Asia/Tokyo")
	if err != nil {
		t.Fatalf("タイムゾーンの読み込みに失敗: %v", err)
	}

	now := time.Now()
	today := now.In(jst).Format("2006-01-02")
	yesterday := now.In(jst).AddDate(0, 0, -1).Format("2006-01-02")
	tomorrow := now.In(jst).AddDate(0, 0, 1).Format("2006-01-02")

	tests := []struct {
		name    string
		date    string
		wantErr bool
	}{
		{"今日の日付 (YYYY-MM-DD)", today, false},
		{"昨日の日付 (YYYY-MM-DD)", yesterday, false},
		{"過去日 (ISO8601)", yesterday + "T09:00:00+09:00", false},
		{"今日のISO8601 JST", today + "T09:00:00+09:00", false},
		{"明日の日付 (未来日)", tomorrow, true},
		{"遠い未来日", "2099-12-31T00:00:00Z", true},
		{"不正な形式", "not-a-date", true},
		{"空文字", "", true},
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

func TestValidateRoundDate_UTCJSTBoundary(t *testing.T) {
	jst, err := time.LoadLocation("Asia/Tokyo")
	if err != nil {
		t.Fatalf("タイムゾーンの読み込みに失敗: %v", err)
	}

	now := time.Now()
	todayJST := now.In(jst).Format("2006-01-02")
	yesterdayJST := now.In(jst).AddDate(0, 0, -1).Format("2006-01-02")

	t.Run("UTC midnight今日 → JSTでは今日", func(t *testing.T) {
		// 今日のUTC 00:00:00 → JSTでは今日の09:00:00
		dateStr := todayJST + "T00:00:00+09:00"
		err := model.ValidateRoundDate(dateStr)
		if err != nil {
			t.Errorf("ValidateRoundDate(%q) unexpected error: %v", dateStr, err)
		}
	})

	t.Run("UTC深夜の昨日 → JSTでも昨日", func(t *testing.T) {
		// 昨日のJST 23:59:59
		dateStr := yesterdayJST + "T23:59:59+09:00"
		err := model.ValidateRoundDate(dateStr)
		if err != nil {
			t.Errorf("ValidateRoundDate(%q) unexpected error: %v", dateStr, err)
		}
	})

	t.Run("UTC 15:00今日 = JST翌日0:00 → JSTの日付で判定", func(t *testing.T) {
		// 今日のUTC 15:00 → JSTでは翌日の00:00
		// JSTでの日付が明日になるため未来日エラーになるべき
		dateStr := fmt.Sprintf("%sT15:00:00Z", todayJST)
		// UTC 15:00 → JST 翌日00:00
		parsed, parseErr := time.Parse(time.RFC3339, dateStr)
		if parseErr != nil {
			t.Fatalf("parse error: %v", parseErr)
		}
		jstDate := parsed.In(jst).Format("2006-01-02")
		tomorrow := now.In(jst).AddDate(0, 0, 1).Format("2006-01-02")

		err := model.ValidateRoundDate(dateStr)
		if jstDate == tomorrow {
			// JSTで翌日に跨いでいる場合はエラーが期待される
			if err == nil {
				t.Errorf("ValidateRoundDate(%q) should return error: JST date=%s is tomorrow", dateStr, jstDate)
			}
		} else {
			// JSTでまだ今日の場合はエラーなし
			if err != nil {
				t.Errorf("ValidateRoundDate(%q) unexpected error: %v (JST date=%s)", dateStr, err, jstDate)
			}
		}
	})

	t.Run("早朝UTCは前日JST → 過去日として有効", func(t *testing.T) {
		// 昨日のUTC 20:00 → JSTでは今日の05:00
		dateStr := fmt.Sprintf("%sT20:00:00Z", yesterdayJST)
		parsed, parseErr := time.Parse(time.RFC3339, dateStr)
		if parseErr != nil {
			t.Fatalf("parse error: %v", parseErr)
		}
		jstDate := parsed.In(jst).Format("2006-01-02")
		_ = jstDate // JSTでの日付を確認

		err := model.ValidateRoundDate(dateStr)
		if err != nil {
			t.Errorf("ValidateRoundDate(%q) unexpected error: %v", dateStr, err)
		}
	})
}

func TestRoundValidate(t *testing.T) {
	jst, err := time.LoadLocation("Asia/Tokyo")
	if err != nil {
		t.Fatalf("タイムゾーンの読み込みに失敗: %v", err)
	}
	today := time.Now().In(jst).Format("2006-01-02")

	t.Run("有効なラウンド", func(t *testing.T) {
		round := model.Round{
			ID:       "round-1",
			CourseID: "course-1",
			Date:     today,
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
			Date:     today,
		}
		if err := round.Validate(); err == nil {
			t.Error("Validate() should return error for empty ID")
		}
	})

	t.Run("空コースID", func(t *testing.T) {
		round := model.Round{
			ID:       "round-1",
			CourseID: "",
			Date:     today,
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
