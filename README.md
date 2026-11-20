# Mech

Heavy mech 03. A squat, wide machine in slab armour, built entirely from code, with eight motions.

![The eight motions](model/heavy_mech_03_poster.png)

## What is here

| Path | What it is |
|---|---|
| `model/heavy_mech_03.glb` | The model with its eight motions, at the saved settings |
| `model/heavy_mech_03_poster.png` | A still of each motion |
| `dist/index.html` | The board. Open it in a browser to turn the mech, play its motions, change its paint and its build |
| `src/mech.js` | The model: every plate and part, and the joints they ride |
| `src/anim.js` | The motions |
| `src/main.js`, `src/page.html` | The board itself |
| `tools/` | Small scripts that write the model file, check it and make the poster |

## The saved settings

These were chosen on the board on 20 November 2026 and are now the defaults.

| Setting | Value |
|---|---|
| Bulk | 1.25 |
| Shoulders | 0.81 |
| Legs | 0.85 |
| Head | 1.12 |
| Paint | Olive |
| Edge lines | Off |

The four numbers are `BUILD_DEFAULT` in `src/mech.js`. The paint is the first entry of `PALETTES` in the same file. The board's sliders still move all four, and its paint buttons still offer slate, desert and night.

## The model

- Rigid parts on a tree of 41 joints. There is no skin: a part never bends, it rides its joint.
- 378 armour plates and parts. Each joint's parts are merged by material, which leaves 154 meshes and 12,172 triangles.
- It faces +Z, its own left is +X, and it stands on y = 0.
- It is built in its own units and stood in the scene at a scale of 1.15. At the saved settings the head tops out near 5.8, the feet span 5.2 from edge to edge, and its tallest point reaches 7.1. A unit of the game it was drawn for is 6.4 tall.
- Shade is baked into the vertex colours: a tint for each panel, a fall of tone down each panel, and darkening where parts crowd each other.
- The stencil marks come from one sheet, 1024 by 512, drawn when the model is built.
- Loadout: a heavy gun in the right hand, a shield on the left forearm, a folding cannon on the right of the back, a seven tube rocket pod over the left shoulder, two main thrusters and one on each calf.

## The motions

| Name | Length | Plays | What happens |
|---|---|---|---|
| Idle | 3.2 s | Loops | Stands wide and low, breathes, looks about |
| Walk | 1.5 s | Loops | A heavy, swaying step |
| Sprint | 0.8 s | Loops | A boost dash, leaning in, thrusters lit |
| Shoot | 0.6 s | Loops | Three shots from the gun, each with its kick |
| Cannon | 2.8 s | Once | The cannon swings over the shoulder, the barrel swings out, it fires, it folds away |
| Dodge | 0.6 s | Once | A boosted lunge to the side |
| Jump | 1.5 s | Once | Crouch, rise on the thrusters, land |
| Win | 2.6 s | Once | Stands up, brings the gun up beside the head |

Each motion is a function of time that poses the joints. The legs are placed by reaching for where a foot should be. The motions are then sampled 30 times a second into plain keyframe clips, so a game or a glTF viewer can play them as they are.

The clips keep the mech in place. On the board the ground moves under Walk and Sprint, the model is lifted 2.5 for Jump and the ground slides 3 for Dodge. Those movements belong to the board and are not in the clips.

## What the model file holds, and what it does not

It holds the parts, the joints, the eight clips, the paint as plain materials, the baked shade as vertex colours, and the stencil sheet as one picture.

It does not hold the board's ground, sky or lights, nor the thin edge lines the board can draw. The thruster plumes and muzzle flashes are in it as plain unlit shapes that fade along their length. They are scaled to nothing whenever they are not firing.

The glTF validator reports 0 errors and 0 warnings for the file. It has not been opened in any other program yet.

## Building it

```
npm install
npm run build
```

That writes `dist/`. Open `dist/index.html` in a browser. It works straight from the file.

The tools need Playwright and a Chromium that can run WebGL. Run them from this folder.

```
npm run glb      # writes model/heavy_mech_03.glb from the board's own exporter
npm run check    # runs the glTF validator on it
npm run poster   # shoots the eight stills and makes the poster
```

`tools/shot.cjs` takes still pictures of any motion from any side. `tools/extremes.cjs` builds the mech at the ends of its sliders to see that nothing breaks.

## Where it stands

A prototype. It was made outside the ArchiveVS game and is not wired into it. The design is original.

The first readme of that project, written on 26 April 2026, asked for this in one line: "Bulky modular mech silhouette with active thruster plumes."
