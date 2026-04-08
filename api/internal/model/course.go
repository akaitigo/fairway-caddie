package model

// HazardType はハザード種別を表す。
type HazardType string

const (
	HazardBunker HazardType = "bunker"
	HazardWater  HazardType = "water"
	HazardOB     HazardType = "ob"
	HazardTree   HazardType = "tree"
	HazardRough  HazardType = "rough"
)

// AllHazardTypes は全ハザード種別。
var AllHazardTypes = []HazardType{
	HazardBunker, HazardWater, HazardOB, HazardTree, HazardRough,
}

// IsValidHazardType はハザード種別が有効か判定する。
func IsValidHazardType(s string) bool {
	for _, ht := range AllHazardTypes {
		if string(ht) == s {
			return true
		}
	}
	return false
}

// Hazard はハザード定義。
type Hazard struct {
	ID          string     `json:"id"`
	Type        HazardType `json:"type"`
	Position    Coordinate `json:"position"`
	RadiusYards float64    `json:"radiusYards"`
}

// Hole はホール定義。
type Hole struct {
	Number        int        `json:"number"`
	Par           int        `json:"par"`
	DistanceYards float64    `json:"distanceYards"`
	TeePosition   Coordinate `json:"teePosition"`
	PinPosition   Coordinate `json:"pinPosition"`
	FairwayCenter Coordinate `json:"fairwayCenter"`
	Hazards       []Hazard   `json:"hazards"`
}

// Course はコース定義。
type Course struct {
	ID    string `json:"id"`
	Name  string `json:"name"`
	Holes []Hole `json:"holes"`
}
