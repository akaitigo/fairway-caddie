package model_test

import (
	"testing"

	"github.com/ryusei/fairway-caddie/api/internal/model"
)

func TestIsValidHazardType(t *testing.T) {
	tests := []struct {
		name  string
		input string
		want  bool
	}{
		{"bunker", "bunker", true},
		{"water", "water", true},
		{"ob", "ob", true},
		{"tree", "tree", true},
		{"rough", "rough", true},
		{"invalid", "invalid", false},
		{"empty", "", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := model.IsValidHazardType(tt.input)
			if got != tt.want {
				t.Errorf("IsValidHazardType(%q) = %v, want %v", tt.input, got, tt.want)
			}
		})
	}
}
