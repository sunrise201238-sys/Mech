// models/heavy_mech_03.js — Heavy mech 03: which frame, which armour line, which backpack and which weapons make it, and
// the order its joints and parts were first made in.
import { heavy } from '../frames/heavy.js';
import { heavySlab } from '../armor/heavy_slab.js';
import { twinThruster } from '../backpacks/twin_thruster.js';
import { cannon } from '../weapons/cannon.js';
import { missilePod } from '../weapons/missile_pod.js';
import { shield } from '../weapons/shield.js';
import { rifle } from '../weapons/rifle.js';

export const HEAVY_MECH_03 = {
  name: 'Heavy mech 03',
  frame: heavy,
  armor: heavySlab,
  backpack: twinThruster,
  weapons: [cannon, missilePod, shield, rifle],

  // This mech was first written as one piece of code, its frame, armour and weapons made joint by joint in one pass. The
  // finishing pass tints each panel in the order it meets it, and the model file is written in that order, so the order is
  // part of the look. It is kept here: the joints in the order they were made, and under each joint the order of what hung
  // there then, one letter for each child, F from the frame, A from the armour, P from the backpack, W from a weapon. With it the layered build
  // comes out the same as the old one in every byte of the model file. A part added since is not in the record: it takes its
  // place after the recorded ones and its tint after theirs, so it changes nothing about them.
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
    skirtB: 'AAA',
    spine: 'FAAFFFFF',
    chest: 'AAAAAAAAAAAAAAAAAAAAFFAAAAAAAAFFAAAAAAAAAFFPFFFF',
    head: 'AFFFAFFAFF',
    ant: 'FF',
    pack: 'PPPPPPPPPWWWWWWP',
    thrL: 'PPPP',
    flameL: 'PP',
    thrR: 'PPPP',
    flameR: 'PP',
    cannon: 'WWWWWWWWWWWW',
    barrel: 'WWWWWWWW',
    flash2: 'WWWWW',
    pod: 'WWWWWWWWWWWWWWWWWWWWWW',
    mast: 'PP',
    padL: 'AAAAAAAAAAAAAAAAAAAAAA',
    armL: 'FFAAAAAAAFF',
    foreL: 'FAAAAAAAFFW',
    handL: 'FAFFFF',
    padR: 'AAAAAAAAAAAAAAAAAAAAAA',
    armR: 'FFAAAAAAAFF',
    foreR: 'FAAAAAAAFF',
    handR: 'FAFFFFW',
    shield: 'WWWWWWWWWWWWW',
    rifle: 'WWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
    flash: 'WWWW',
    thighL: 'FAAAAAAAAAAAAAAAAFFAF',
    shinL: 'FFFFAAAAAAAAAAAAAAAAAAAAAAFF',
    calfL: 'FFF',
    flameCL: 'F',
    footL: 'FFAFFFAFFA',
    thighR: 'FAAAAAAAAAAAAAAAAFFAF',
    shinR: 'FFFFAAAAAAAAAAAAAAAAAAAAAAFF',
    calfR: 'FFF',
    flameCR: 'F',
    footR: 'FFAFFFAFFA',
  },
};
