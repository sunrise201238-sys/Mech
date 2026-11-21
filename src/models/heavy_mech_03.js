// models/heavy_mech_03.js — Heavy mech 03: which frame, which armour line and which weapons make it, and the order its
// joints and parts were first made in.
import { heavy } from '../frames/heavy.js';
import { heavySlab } from '../armor/heavy_slab.js';
import { cannon } from '../weapons/cannon.js';
import { rocketPod } from '../weapons/rocket_pod.js';
import { shield } from '../weapons/shield.js';
import { rifle } from '../weapons/rifle.js';

export const HEAVY_MECH_03 = {
  name: 'Heavy mech 03',
  frame: heavy,
  armor: heavySlab,
  weapons: [cannon, rocketPod, shield, rifle],

  // This mech was first written as one piece of code, its frame, armour and weapons made joint by joint in one pass. The
  // finishing pass tints each panel in the order it meets it, and the model file is written in that order, so the order is
  // part of the look. It is kept here: the joints in the order they were made, and under each joint that needs it the order
  // of what hangs there, one letter for each child, F from the frame, A from the armour, W from a weapon. With it the
  // layered build comes out the same as the old one in every byte of the model file. A part added later takes its place
  // after these, in the order the layers are built.
  joints: `
    hips skirtFL skirtSL skirtFR skirtSR skirtB spine chest head ant pack thrL flameL thrR flameR cannon barrel flash2 pod
    mast padL armL foreL handL padR armR foreR handR shield rifle flash thighL shinL calfL flameCL footL thighR shinR calfR
    flameCR footR`.split(/\s+/).filter(Boolean),
  order: {
    hips: 'FAFAAAAAFFFFFFFFFFF',
    skirtFL: 'AFA',
    skirtSL: 'AAAAAAAF',
    skirtFR: 'AFA',
    skirtSR: 'AAAAAAAF',
    spine: 'FAAFFFFF',
    chest: 'AAAAAAAAAAAAAAAAAAAAFFAAAAAAAAFFAAAAAAAAAFFFFFFF',
    head: 'AFFFAFFAFF',
    pack: 'FAFFFFFFFWWWWWWF',
    armL: 'FFAAAAAAAFF',
    foreL: 'FAAAAAAAFFW',
    handL: 'FAFFFF',
    armR: 'FFAAAAAAAFF',
    foreR: 'FAAAAAAAFF',
    handR: 'FAFFFFW',
    thighL: 'FAAAAAAAAAAAAAAAAFFAF',
    shinL: 'FFFFAAAAAAAAAAAAAAAAAAAAAAFF',
    footL: 'FFAFFFAFFA',
    thighR: 'FAAAAAAAAAAAAAAAAFFAF',
    shinR: 'FFFFAAAAAAAAAAAAAAAAAAAAAAFF',
    footR: 'FFAFFFAFFA',
  },
};
