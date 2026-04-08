package model

import "fmt"

// ClubType はクラブ種別を表す。
type ClubType string

const (
	ClubDriver ClubType = "driver"
	Club3W     ClubType = "3w"
	Club5W     ClubType = "5w"
	Club7W     ClubType = "7w"
	Club3I     ClubType = "3i"
	Club4I     ClubType = "4i"
	Club5I     ClubType = "5i"
	Club6I     ClubType = "6i"
	Club7I     ClubType = "7i"
	Club8I     ClubType = "8i"
	Club9I     ClubType = "9i"
	ClubPW     ClubType = "pw"
	ClubAW     ClubType = "aw"
	ClubSW     ClubType = "sw"
	ClubLW     ClubType = "lw"
	ClubPutter ClubType = "putter"
)

// AllClubTypes は全クラブ種別のスライス。
var AllClubTypes = []ClubType{
	ClubDriver, Club3W, Club5W, Club7W,
	Club3I, Club4I, Club5I, Club6I, Club7I, Club8I, Club9I,
	ClubPW, ClubAW, ClubSW, ClubLW, ClubPutter,
}

// IsValidClubType はクラブ種別が有効か判定する。
func IsValidClubType(s string) bool {
	for _, ct := range AllClubTypes {
		if string(ct) == s {
			return true
		}
	}
	return false
}

// Club はクラブ定義。
type Club struct {
	ID         string   `json:"id"`
	Type       ClubType `json:"type"`
	CustomName string   `json:"customName"`
}

// ValidateClubName はクラブ名のバリデーションを行う。
func ValidateClubName(name string) error {
	if len([]rune(name)) == 0 {
		return fmt.Errorf("クラブ名は空にできません")
	}
	if len([]rune(name)) > 30 {
		return fmt.Errorf("クラブ名は30文字以内にしてください")
	}
	return nil
}
