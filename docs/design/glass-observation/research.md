# Liquid Glass: shape of a glass control on press and hold (research, 2026-11-25)

## Stated (Apple primary sources)

### WWDC25 219 "Meet Liquid Glass" — https://developer.apple.com/videos/play/wwdc2025/219/
- "Liquid Glass responds to interaction by instantly flexing and energizing with light."
- "And it has an inherent gel-like flexibility to it that communicates its transient and malleable nature, as it moves in tandem with your interaction."
- "This lets the resting state stay visually quiet, while it comes to life on touch."
- "When you interact with Liquid Glass, the material illuminates from within as a form of feedback."
- "Starting right under your fingertips, the glow spreads throughout the element and onto any Liquid Glass elements nearby, interacting with the flexible properties of the material in a way that feels natural and fluid."
- "When glass flexes and morphs to larger sizes – like when presenting a menu from a toolbar button – its material characteristics change to simulate a thicker, more substantial material."
- "Reduced Motion decreases the intensity of some effects and disables any elastic properties for the material."

### WWDC25 323 "Build a SwiftUI app with the new design" — https://developer.apple.com/videos/play/wwdc2025/323/
- "On iOS, for custom controls or for containers with interactive elements, add the interactive modifier to the glass effect."
- "Glass reacts to user interaction by scaling, bouncing, and shimmering, matching the effect provided by toolbar buttons and sliders."

### WWDC25 284 "Build a UIKit app with the new design" — https://developer.apple.com/videos/play/wwdc2025/284/
- "When tapping the button, it scales and bounces."
- "To get that same kind of interactivity in your custom views, set isInteractive to true on the glassEffect."
- Sliders: "in addition to the liquid glass effects on the thumb, they now preserve momentum and stretch when they are moved."

### WWDC25 356 "Get to know the new design system" — https://developer.apple.com/videos/play/wwdc2025/356/
- No statement about press shape.

### API reference
- `Glass.interactive(_:)`: "Returns a copy of the structure configured to be interactive." — https://developer.apple.com/documentation/swiftui/glass/interactive(_:)
- `UIGlassEffect.isInteractive`: "Enables interactive behavior for the glass effect." — https://developer.apple.com/documentation/uikit/uiglasseffect/isinteractive
- Applying Liquid Glass to custom views: "Add interactive(_:) to custom components to make them react to touch and pointer interactions. This applies the same responsive and fluid reactions that glass provides to standard buttons." — https://developer.apple.com/documentation/swiftui/applying-liquid-glass-to-custom-views
- None of the reference pages gives a scale factor, an origin, a direction, or a duration.

### HIG
- Buttons: "Always include a press state for a custom button." — https://developer.apple.com/design/human-interface-guidelines/buttons
- Materials and Toolbars: no statement about press shape. — https://developer.apple.com/design/human-interface-guidelines/materials

## Observed

- No observation was made. `xcrun simctl list runtimes` lists only iOS 18.1 and 18.6 and watchOS 11.x. No iOS 26 runtime is installed, and the task forbids installing one. (simctl also has no tap command.)
- No secondary source was found that measures the press shape frame by frame.

## Secondary (third-party recreation, not observation of iOS)

- Flutter package liquid_glass_easy, https://pub.dev/documentation/liquid_glass_easy/latest/ . It describes its own design and does not claim to match measured iOS behavior:
  - "Press it and it swells under your finger; drag it and it elongates along the pull"
  - "pinches in the cross axis, leans after your thumb, then springs back with a wobble."
  - "the half nearest your finger deforms more than the far half"
  - "The lens never moves — only its shape and its content deform."
  - It gives no numeric values.

## Inferred (my reading of the quotes, not verified)

- The primary sources describe a size change ("scaling"), a spring ("bouncing", "elastic"), and a deformation that follows the finger ("flexing", "gel-like", "moves in tandem with your interaction"). "Moves in tandem" implies the glass keeps reacting while the finger is held and moved, not only on touch-down. This is an inference.
- "Scaling" alone does not say up or down. Apple's own wording, "flexes and morphs to larger sizes", points to growth, but that sentence is about a menu opening from a toolbar button, not a press.
- The light is anchored at the finger: the glow starts "right under your fingertips" and spreads to the whole element and to nearby glass. So the touch point is the origin for the light. Apple's text does not say whether the touch point is also the origin for the shape.

## Spec the sources support

| Item | Supported by sources | Strength |
|---|---|---|
| What changes | The size changes ("scaling"), the shape flexes ("flexing", "gel-like"), and light appears ("energizing with light", "shimmering", "illuminates from within") | Stated |
| Timing words | "instantly" on touch; "bouncing" / "elastic" (spring with overshoot); the effect stays alive during the touch ("comes to life on touch", "moves in tandem") | Stated |
| Rest state | "visually quiet" | Stated |
| Glow origin | Under the fingertip, then spreads across the element and onto neighboring glass elements (relevant for a two-button bar) | Stated |
| Following the finger while held | Moves "in tandem with your interaction"; the slider thumb stretches with movement and keeps momentum | Stated in general terms; no direction or amount given |
| Scale direction (up or down) | Not stated | Unknown |
| Scale origin (center or touch point) | Not stated | Unknown |
| Stretch toward the finger, squeeze in the other axis | Only the Flutter recreation says so | Secondary |
| Reduced Motion | Elastic properties turn off | Stated |

Implication for the web bar (inferred): Apple treats the press as uniform scale plus a gel-like flex that follows the finger and an inner glow that starts at the touch point. A bare uniform scale from the center drops the flex and the glow. The sources therefore back adding (a) a spring with overshoot, (b) a radial light centered at the pointer that spreads across both buttons, and (c) a deformation that follows the pointer while it is held. Apple does not state the direction or size of (c).

## Unknown

- Whether the press scales up or down, and by how much.
- Whether the scale origin is the center or the touch point.
- The axis and amount of stretch while the finger is held and moved, and whether the cross axis narrows.
- Spring parameters (duration, damping) and the glow's spread speed.
- Settling these needs footage from an iOS 26 device or simulator, recorded frame by frame.
