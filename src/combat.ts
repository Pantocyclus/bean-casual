import {
  print,
  setProperty,
  getProperty,
  getLocationMonsters,
  myLocation,
  toMonster,
  myMp,
  haveSkill,
  useSkill,
  myFamiliar,
  haveEffect,
  runaway,
  abort,
  handlingChoice,
  lastChoice,
  count,
  availableChoiceOptions,
  runChoice,
  adv1,
  choiceFollowsFight,
  inMultiFight,
  runCombat,
  visitUrl,
  removeProperty,
} from 'kolmafia';
import { $skill, $familiar, $effect, Macro as LibramMacro, set, get } from 'libram';
import { getPropertyInt, myFamiliarWeight, setPropertyInt } from './lib';

// multiFight() stolen from Aenimus: https://github.com/Aenimus/aen_cocoabo_farm/blob/master/scripts/aen_combat.ash.
// Thanks! Licensed under MIT license.
function multiFight() {
  while (inMultiFight()) runCombat();
  if (choiceFollowsFight()) visitUrl('choice.php');
}

export class Macro extends LibramMacro {
  submit() {
    print(`Submitting macro: ${this.toString()}`);
    return super.submit();
  }

  kill() {
    return this.skill($skill`Stuffed Mortar Shell`)
      .skill($skill`Saucestorm`)
      .skill($skill`Saucegeyser`)
      .repeat()
      .skill($skill`Saucestorm`)
      .repeat();
  }

  static kill() {
    return new Macro().kill();
  }

  runaway() {
    return this.step('runaway');
  }

  static runaway() {
    return new Macro().runaway();
  }
}

export const MODE_NULL = '';
export const MODE_MACRO = 'macro';
export const MODE_FIND_MONSTER_THEN = 'findthen';
export const MODE_RUN_UNLESS_FREE = 'rununlessfree';

export function setMode(mode: string, arg1: string | null = null, arg2: string | null = null) {
  setProperty('bcas_combatMode', mode);
  if (arg1 !== null) setProperty('bcas_combatArg1', arg1);
  if (arg2 !== null) setProperty('bcas_combatArg2', arg2);
}

export function getMode() {
  return getProperty('bcas_combatMode');
}

export function getArg1() {
  return getProperty('bcas_combatArg1');
}

export function getArg2() {
  return getProperty('bcas_combatArg2');
}

function banishedMonsters() {
  const banishedstring = getProperty('banishedMonsters');
  const banishedComponents = banishedstring.split(':');
  const result: { [index: string]: Monster } = {};
  if (banishedComponents.length < 3) return result;
  for (let idx = 0; idx < banishedComponents.length / 3 - 1; idx++) {
    const foe = Monster.get(banishedComponents[idx * 3]);
    const banisher = banishedComponents[idx * 3 + 1];
    print(`Banished ${foe.name} using ${banisher}`);
    result[banisher] = foe;
  }
  return result;
}

function usedBanisherInZone(banished: { [index: string]: Monster }, banisher: string, loc: Location) {
  print(`Checking to see if we've used ${banisher} in ${loc}.`);
  if (banished[banisher] === undefined) return false;
  print(`Used it to banish ${banished[banisher].name}`);
  return getLocationMonsters(loc)[banished[banisher].name] === undefined;
}

export function main(initialRound: number, foe: Monster) {
  const mode = getMode();
  const loc = myLocation();
  if (mode === MODE_MACRO) {
    Macro.load().submit();
  } else if (mode === MODE_FIND_MONSTER_THEN) {
    const monsterId = parseInt(getArg1(), 10);
    const desired = toMonster(monsterId);
    const banished = banishedMonsters();
    if (foe === desired) {
      Macro.load().submit();
    } else if (
      myMp() >= 50 &&
      haveSkill($skill`Snokebomb`) &&
      getPropertyInt('_snokebombUsed') < 3 &&
      !usedBanisherInZone(banished, 'snokebomb', loc)
    ) {
      useSkill(1, $skill`Snokebomb`);
    } else if (
      haveSkill($skill`Reflex Hammer`) &&
      getPropertyInt('ReflexHammerUsed') < 3 &&
      !usedBanisherInZone(banished, 'Reflex Hammer', loc)
    ) {
      useSkill(1, $skill`Reflex Hammer`);
    } else if (haveSkill($skill`Macrometeorite`) && getPropertyInt('_macrometeoriteUses') < 10) {
      useSkill(1, $skill`Macrometeorite`);
    } else if (haveSkill($skill`CHEAT CODE: Replace Enemy`) && getPropertyInt('_powerfulGloveBatteryPowerUsed') <= 80) {
      const originalBattery = getPropertyInt('_powerfulGloveBatteryPowerUsed');
      useSkill(1, $skill`CHEAT CODE: Replace Enemy`);
      const newBattery = getPropertyInt('_powerfulGloveBatteryPowerUsed');
      if (newBattery === originalBattery) {
        print('WARNING: Mafia is not updating PG battery charge.');
        setProperty('_powerfulGloveBatteryPowerUsed', '' + (newBattery + 10));
      }
      // At this point it comes back to the consult script.
    }
  } else if (mode === MODE_RUN_UNLESS_FREE) {
    if (foe.attributes.includes('FREE')) {
      Macro.load().submit();
    } else if (
      myFamiliar() === $familiar`Frumious Bandersnatch` &&
      haveEffect($effect`Ode to Booze`) > 0 &&
      getPropertyInt('_banderRunaways') < myFamiliarWeight() / 5
    ) {
      const banderRunaways = getPropertyInt('_banderRunaways');
      runaway();
      if (getPropertyInt('_banderRunaways') === banderRunaways) {
        print('WARNING: Mafia is not tracking bander runaways correctly.');
        setPropertyInt('_banderRunaways', banderRunaways + 1);
      }
    } else if (haveSkill($skill`Reflex Hammer`) && getPropertyInt('_reflexHammerUsed') < 3) {
      useSkill(1, $skill`Reflex Hammer`);
    } else if (myMp() >= 50 && haveSkill($skill`Snokebomb`) && getPropertyInt('_snokebombUsed') < 3) {
      useSkill(1, $skill`Snokebomb`);
    } else {
      // non-free, whatever
      runaway();
    }
  } else {
    abort('Unrecognized mode.');
  }
}

export function saberYr() {
  if (!handlingChoice()) abort('No choice?');
  if (lastChoice() === 1387 && count(availableChoiceOptions()) > 0) {
    runChoice(3);
  }
}

export function adventureMode(loc: Location, mode: string, arg1: string | null = null, arg2: string | null = null) {
  setMode(mode, arg1, arg2);
  try {
    adv1(loc, -1, '');
    multiFight();
  } finally {
    setMode(MODE_NULL, '', '');
  }
}

export function adventureMacro(loc: Location, macro: Macro) {
  macro.save();
  try {
    adventureMode(loc, MODE_MACRO);
  } finally {
    Macro.clearSaved();
  }
}

function findMonsterThen(loc: Location, foe: Monster, macro: Macro) {
  macro.save();
  setMode(MODE_FIND_MONSTER_THEN, foe.id.toString());
  try {
    set('bcas_combatFound', false);
    while (!get<boolean>('bcas_combatFound')) {
      adv1(loc, -1, '');
    }
  } finally {
    removeProperty('bcas_combatFound');
    setMode(MODE_NULL, '');
    Macro.clearSaved();
  }
}

export function findMonsterSaberYr(loc: Location, foe: Monster) {
  setProperty('choiceAdventure1387', '3');
  findMonsterThen(loc, foe, Macro.skill($skill`Use the Force`));
}

export function adventureCopy(loc: Location, foe: Monster) {
  adventureMacro(
    loc,
    Macro.if_(`!monstername ${foe.name}`, 'abort')
      .trySkill($skill`Lecture on Relativity`)
      .kill()
  );
}

export function adventureRunUnlessFree(loc: Location) {
  setMode(MODE_RUN_UNLESS_FREE);
  adv1(loc, -1, '');
  setMode(MODE_NULL);
}
