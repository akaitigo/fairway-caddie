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
func ValidateRoundDate(dateStr string) error {
	if dateStr == "" {
		return fmt.Errorf("日付は必須です")
	}
	// ISO8601 形式をまず試す
	t, err := time.Parse(time.RFC3339, dateStr)
	if err != nil {
		// YYYY-MM-DD 形式を試す
		t, err = time.Parse("2006-01-02", dateStr)
		if err != nil {
			return fmt.Errorf("有効な日付を指定してください")
		}
	}
	if t.After(time.Now()) {
		return fmt.Errorf("未来日のラウンドは登録できません")
	}
	return nil
}
