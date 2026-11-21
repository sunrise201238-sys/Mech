# Mech

A store of mech models, kept for any future use. That is all this repository is for.

Each model is saved as a glTF binary, together with the code that builds it and a board to look at it on.

## Models

| Model | File | Motions | Live board |
|---|---|---|---|
| Heavy mech 03 | `model/heavy_mech_03.glb` | 8 | https://sunrise201238-sys.github.io/Mech/ |

![Heavy mech 03, its eight motions](model/heavy_mech_03_poster.png)

## Heavy mech 03

A squat, wide machine in slab armour, built entirely from code, with eight motions. The design is original.

### The live board

https://sunrise201238-sys.github.io/Mech/

Turn the mech, play its motions, change its paint and its build, in a browser, with nothing to install. GitHub Pages serves it from this repository's `gh-pages` branch.

### The saved settings

This look was chosen on the board on 20 November 2026 and is the default. The four build sliders read 1.00 at it.

| Setting | Value |
|---|---|
| Bulk | 1.00 |
| Shoulders | 1.00 |
| Legs | 1.00 |
| Head | 1.00 |
| Paint | Olive |
| Edge lines | Off |
| Tour through the motions | Off |

A slider's number is a multiple of the chosen look. In the model's own numbers that look is bulk 1.25, shoulders 0.81, legs 0.85 and head 1.12, which is `BUILD_BASE` in `src/frames/heavy.js`; `BUILD_DEFAULT` in `src/bench.js` is the four ones. Each slider has 1.00 in the middle of its travel and runs from 0.80 to 1.20. The mech holds together in all eight motions at the ends and the corners of that range.

The paint is the first entry of `PALETTES` in `src/bench.js`. The board's sliders still move all four, and its paint buttons still offer slate, desert and night.

### The model

- Rigid parts on a tree of 41 joints. There is no skin: a part never bends, it rides its joint.
- 380 armour plates and parts. Each joint's parts are merged by material, which leaves 154 meshes and 12,288 triangles.
- It faces +Z, its own left is +X, and it stands on y = 0.
- It is built in its own units and stood in the scene at a scale of 1.15. At the saved settings the head tops out near 5.8, the feet span 5.2 from edge to edge, and its tallest point reaches 7.1.
- Shade is baked into the vertex colours: a tint for each panel, a fall of tone down each panel, and darkening where parts crowd each other.
- The stencil marks come from one sheet, 1024 by 512, drawn when the model is built.
- Loadout: a heavy gun in the right hand, a shield on the left forearm, a folding cannon on the right of the back, a seven tube rocket pod over the left shoulder, two main thrusters and one on each calf.

### The layers

The mech is put together from four layers, each in its own file, so that a later mech can keep some and change others.

| Layer | Parts | What it is |
|---|---|---|
| Frame | 93 | The skeleton and what a mech keeps whatever it wears: the joints and their sizes, the dark inner structure, the hinges the skirt plates and shoulder blocks hang from, the thrusters and the aerials. It also says what the four build sliders do |
| Armour | 209 | Every painted plate, with the seams, bolts, hatches, lamps and stencil marks that sit on it. This line is made for the heavy frame alone |
| Weapons | 78 | The cannon, the rocket pod, the shield and the rifle. Each brings the part of a motion that is its own: the cannon how it unfolds and kicks, the rifle its flash |
| Motions | | The eight motions belong to the frame |

Stripped of its armour the frame has no chest and no forearms: on this mech those are armour through and through.

Until 21 November 2026 all of this was one piece of code. The finishing pass tints each panel in the order it meets it, so the order the parts were made in is part of the look. `src/models/heavy_mech_03.js` keeps that order, and the layered build gives the same model file as before, byte for byte.

### The motions

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

Each motion is a function of time that poses the joints. The legs are placed by reaching for where a foot should be. The motions are then sampled 30 times a second into plain keyframe clips, so an engine or a glTF viewer can play them as they are.

The clips keep the mech in place. On the board the ground passes under Walk and Sprint from the mech's front to its back, the model is lifted 2.5 for Jump and the ground slides 3 for Dodge. Those movements belong to the board and are not in the clips.

### What the model file holds, and what it does not

It holds the parts, the joints, the eight clips, the paint as plain materials, the baked shade as vertex colours, and the stencil sheet as one picture.

It does not hold the board's ground, sky or lights, nor the thin edge lines the board can draw. The thruster plumes and muzzle flashes are in it as plain unlit shapes that fade along their length. They are scaled to nothing whenever they are not firing.

The glTF validator reports 0 errors and 0 warnings for the file. It has not been opened in any other program yet.

## What is in this repository

| Path | What it is |
|---|---|
| `model/heavy_mech_03.glb` | The model with its eight motions, at the saved settings |
| `model/heavy_mech_03_poster.png` | A still of each motion |
| `dist/index.html` | The board, built. The live address serves this file. It also opens straight from the folder |
| `src/frames/heavy.js` | The heavy frame: the joints, the inner structure, the armour's hinges, the thrusters and aerials, and what the build sliders do |
| `src/armor/heavy_slab.js` | The slab armour made for that frame |
| `src/weapons/` | The cannon, the rocket pod, the shield and the rifle, a file each |
| `src/motions/heavy.js` | The heavy frame's eight motions |
| `src/models/heavy_mech_03.js` | Heavy mech 03: which frame, armour and weapons make it, and the order its parts were first made in |
| `src/bench.js` | What every layer is made with: the paints, the shapes, the stencil sheet, and the finishing pass |
| `src/mech.js`, `src/anim.js` | Putting a mech together from its layers, and sampling a frame's motions into clips |
| `src/main.js`, `src/page.html` | The board itself |
| `tools/` | Small scripts that write the model file, check it, make the poster and publish the board |
| `CLAUDE.md` | The owner's working rules, which a coding session reads when it starts here |

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

To put a new build on the live address, commit the fresh `dist/` and then publish it.

```
npm run pages    # puts the committed dist/ on the gh-pages branch, which GitHub Pages serves
```

`tools/shot.cjs` takes still pictures of any motion from any side. `tools/extremes.cjs` builds the mech at the ends of its sliders to see that nothing breaks.
