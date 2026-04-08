package model

import "fmt"

// Coordinate はコースマップ上のヤード座標を表す。
type Coordinate struct {
	// 縦位置 (ヤード, 0~150)
	Lat float64 `json:"lat"`
	// 横位置 (ヤード, 0~400)
	Lng float64 `json:"lng"`
}

// Validate は座標のバリデーションを行う。
func (c Coordinate) Validate() error {
	if c.Lat < 0 || c.Lat > 150 {
		return fmt.Errorf("縦位置は0~150ヤードの範囲で指定してください (got: %f)", c.Lat)
	}
	if c.Lng < 0 || c.Lng > 400 {
		return fmt.Errorf("横位置は0~400ヤードの範囲で指定してください (got: %f)", c.Lng)
	}
	return nil
}
