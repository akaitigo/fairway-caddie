package model

import (
	"fmt"
	"time"
)

// Round はラウンド定義。
type Round struct {
	ID         string  `json:"id"`
	CourseID   string  `json:"courseId"`
	Date       string  `json:"date"`
	Shots      []Shot  `json:"shots"`
	TotalScore *int    `json:"totalScore"`
}

// Validate はラウンドのバリデーションを行う。
func (r Round) Validate() error {
	if r.ID == "" {
		return fmt.Errorf("ラウンドIDは必須です")
	}
	if r.CourseID == "" {
		return fmt.Errorf("コースIDは必須です")
	}
	if err := ValidateRoundDate(r.Date); err != nil {
		return err
	}
	for i, s := range r.Shots {
		if err := s.Validate(); err != nil {
			return fmt.Errorf("ショット[%d]: %w", i, err)
		}
	}
	return nil
}

// ValidateRoundDate はラウンド日時のバリデーションを行う。
// 日付はAsia/Tokyoタイムゾーンで評価し、未来日チェックは日付文字列のみで比較する。
func ValidateRoundDate(dateStr string) error {
	if dateStr == "" {
		return fmt.Errorf("日付は必須です")
	}

	jst, err := time.LoadLocation("Asia/Tokyo")
	if err != nil {
		return fmt.Errorf("タイムゾーンの読み込みに失敗しました: %w", err)
	}

	var dateOnly string
	// ISO8601 形式をまず試す
	t, parseErr := time.Parse(time.RFC3339, dateStr)
	if parseErr != nil {
		// YYYY-MM-DD 形式を試す
		t, parseErr = time.Parse("2006-01-02", dateStr)
		if parseErr != nil {
			return fmt.Errorf("有効な日付を指定してください")
		}
		dateOnly = dateStr
	} else {
		// RFC3339の場合、JSTでの日付部分を取得
		_ = t // suppress unused warning
		dateOnly = t.In(jst).Format("2006-01-02")
	}

	// 今日の日付（JST）と文字列比較で未来日チェック
	todayStr := time.Now().In(jst).Format("2006-01-02")
	if dateOnly > todayStr {
		return fmt.Errorf("未来日のラウンドは登録できません")
	}
	return nil
}
