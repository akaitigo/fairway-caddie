package model_test

import (
	"testing"

	"github.com/ryusei/fairway-caddie/api/internal/model"
)

func TestIsValidClubType(t *testing.T) {
	tests := []struct {
		name  string
		input string
		want  bool
	}{
		{"driver", "driver", true},
		{"7i", "7i", true},
		{"putter", "putter", true},
		{"pw", "pw", true},
		{"invalid", "invalid", false},
		{"empty", "", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := model.IsValidClubType(tt.input)
			if got != tt.want {
				t.Errorf("IsValidClubType(%q) = %v, want %v", tt.input, got, tt.want)
			}
		})
	}
}

func TestValidateClubName(t *testing.T) {
	tests := []struct {
		name    string
		input   string
		wantErr bool
	}{
		{"有効な名前", "マイドライバー", false},
		{"空文字", "", true},
		{"30文字ちょうど", "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", false},
		{"31文字", "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := model.ValidateClubName(tt.input)
			if (err != nil) != tt.wantErr {
				t.Errorf("ValidateClubName(%q) error = %v, wantErr %v", tt.input, err, tt.wantErr)
			}
		})
	}
}
