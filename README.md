# Lakeside Angler

3D first-person fishing simulator for the browser (React, TypeScript, Vite, Three.js, React Three Fiber, Zustand).

```
npm install
npm run dev
npm run build
npm test
npm run simulate
```

## Controls
| Input | Action |
|---|---|
| Mouse | Look |
| W A S D, Shift | Walk along the shore (line in) |
| Space / Left click | Hold to charge and release to cast. Press to set the hook on a bite. Hold to reel during a fight |
| F / Right click | Hold to give line and ease tension |
| R | Reel the line in while waiting |
| E / Q | Keep or release a caught fish |
| Esc / P | Release the mouse, open pause menu (shop, equipment, collection, statistics, settings) |

## Implemented
- Milestone 1: lake scene, water shader, vegetation, first-person camera, rod, casting, bobber.
- Milestone 2: bite waiting with nibbles, bite window, hook timing roll, fight simulation (tension, drag, stamina, pull and rest phases, line break, slack escape, line run-out), landing.
- Milestone 3: 8 data-driven species, weighted selection by bait, hook, depth, time of day and weather, equipment and bait shop with level unlocks, equipment screen, collection and catch log, statistics, progression, localStorage save with sanitising loader.
- Milestone 4: procedural WebAudio sound and ambience, day cycle with sun and sky changes, clear/overcast/rain weather affecting bite rates, rain particles, touch fallback controls, quality presets.

## Layout
```
src/
  app/            App, InputController, PointerLockManager, AudioController
  components/     hud/, menus/, screens/, ui/
  game/
    data/         fishSpecies, equipment, baits, locations
    fishing/      engine, biteSystem, fishFight, fishGeneration, config, runtime, gear
    scene/        Terrain, Water, Lighting, Vegetation, Rain, EffectsLayer
    player/       FirstPersonController, FishingRod, FishingLine, Bobber
    world/        terrain, waves, noise, environment
  store/          gameStore, settingsStore
  services/       persistence, audio, pointerLock
tests/            vitest unit tests
scripts/          fight balance simulation
```

## Known limitations
- Fish are stylised 2D illustrations (`FishIllustration.tsx`); swap in 3D models there later.
- All audio is synthesised, no sample files.
- One location (Quiet Lake); `locations.ts` is ready for more.
- Touch controls are basic (drag to look, on-screen action buttons, no walking).
