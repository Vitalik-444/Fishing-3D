# Lakeside Angler — Milestone 1

3D first-person fishing simulator for the browser (React + TypeScript + Vite + Three.js / React Three Fiber).

```
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production build
```

## Controls
| Input | Action |
|---|---|
| Mouse | Look (click **Start fishing** to capture the mouse) |
| W A S D, Shift | Walk along the shore (only with the line in) |
| Hold **Space** or **Left click** | Charge cast power; release to cast |
| **R** | Reel the bobber back in |
| **Esc** or **P** | Release the mouse and pause |

## What Milestone 1 contains
- Lake scene: baked-depth water shader (animated waves, fresnel sky reflection, sun glint, shallows tint, shore foam), displaced-heightfield shoreline with sand/grass/rock colouring, hills, sky, fog, sun with soft shadows that follow the player.
- Instanced vegetation: pines, broadleaf trees, bushes, rocks, reeds and grass (reeds/grass sway in the wind).
- First-person camera with pointer lock, smoothing, pitch limits, shore walking that cannot enter the water.
- Rod that tilts back while charging, whips on release and flexes with a spring; bobber that flies on a ballistic arc, splashes, floats on the same wave field the shader draws, and can be reeled in. Casting on dry land is detected and handled.
- Menu, pause menu, settings (mouse sensitivity, graphics quality; persisted in localStorage), HUD with level / money / rod / bait / state / cast-power meter.

## Layout
```
src/
  app/            App, InputController, PointerLockManager
  components/     hud/, menus/
  game/
    fishing/      fishingTypes (state machine), fishingConfig, casting (pure math), fishingEngine (actions), fishingRuntime
    scene/        Terrain, Water, Lighting, Vegetation, procedural, EffectsLayer
    player/       FirstPersonController, FishingRod, Bobber, FishingLine, playerState
    world/        terrain height field, waves, noise, rng (shared by rendering and gameplay)
  store/          gameStore, settingsStore
  services/       pointerLock
```
High-frequency values (charge, bobber, rod tip) live in plain mutable objects, not React state.
`fishingTypes.ts` already defines every fishing state and the legal transitions for Milestone 2.

## Not in this milestone
Bites, hooking, fighting, fish, shop, inventory, catch log, save-game, audio, time of day / weather, touch controls.
