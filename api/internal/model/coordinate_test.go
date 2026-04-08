package model_test

import (
	"testing"

	"github.com/ryusei/fairway-caddie/api/internal/model"
)

func TestCoordinateValidate(t *testing.T) {
	tests := []struct {
		name    string
		coord   model.Coordinate
		wantErr bool
	}{
		{"有効な座標", model.Coordinate{Lat: 75, Lng: 200}, false},
		{"境界値 (0,0)", model.Coordinate{Lat: 0, Lng: 0}, false},
		{"境界値 (150,400)", model.Coordinate{Lat: 150, Lng: 400}, false},
		{"Lat超過", model.Coordinate{Lat: 151, Lng: 0}, true},
		{"Lat負値", model.Coordinate{Lat: -1, Lng: 0}, true},
		{"Lng超過", model.Coordinate{Lat: 0, Lng: 401}, true},
		{"Lng負値", model.Coordinate{Lat: 0, Lng: -1}, true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := tt.coord.Validate()
			if (err != nil) != tt.wantErr {
				t.Errorf("Validate() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}
