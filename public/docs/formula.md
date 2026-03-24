# Formula

## Composite structure

`R(t) = B(t) + G(t) + M(t) - C(t)`

- `B(t)` baseline structural trend
- `G(t)` gradual accumulation
- `M(t)` milestone shocks
- `C(t)` friction and constraints

## Practical v1 model

The current public build uses weighted signal families and an explicit milestone shock layer.

Each signal family has:

- a value on a bounded public scale
- a direction: advance or delay
- a public label and rationale
- a versioned weight

Milestone shocks are stored as explicit event entries instead of hidden logic.

## Display mapping

The displayed clock is a visual mapping of the raw estimate to a 12-hour countdown.

- `720` minutes represents `12:00`
- `0` minutes represents `00:00`
- the midnight threshold is defined in the formula config

The site should always show both the dramatic clock face and the underlying estimate.
