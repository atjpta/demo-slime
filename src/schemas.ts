import { ArraySchema, MapSchema, Schema, type } from "@colyseus/schema";

export class EffectBattleState extends Schema {
  @type("string") typeEffect: string = "";
  @type("number") value: number = 0;
}

export class BattlePlayerStatsState extends Schema {
  @type("number") hp: number = 0;
  @type("number") attack: number = 0;
  @type("number") magic: number = 0;
  @type("number") defense: number = 0;
}

export class BattlePlayerLogState extends Schema {
  @type({ type: BattlePlayerStatsState }) stats = new BattlePlayerStatsState();
  @type("number") action: number = 0;
  @type([EffectBattleState]) damageReceive = new ArraySchema<EffectBattleState>();
}

export class BattleTurnLogState extends Schema {
  @type("number") wave: number = 0;
  @type("number") turn: number = 0;
  @type({ map: BattlePlayerLogState }) players = new MapSchema<BattlePlayerLogState>();
}

export class BattlePlayerState extends Schema {
  @type("string") playerId: string = "";
  @type("boolean") ready: boolean = false;
  @type(["number"]) actions = new ArraySchema<number>();
}

export class BattleSkillState extends Schema {
  @type("string") code: string = "";
  @type("string") type: string = "";
}

export class BattlePlayerInitState extends Schema {
  @type("string") playerId: string = "";
  @type("string") name: string = "";
  @type([BattleSkillState]) skills = new ArraySchema<BattleSkillState>();
}

export class BattleState extends Schema {
  @type("string") phase: string = "";
  @type("number") wave: number = 0;
  @type("number") timeLeft: number = 0;
  @type({ map: BattlePlayerState }) players = new MapSchema<BattlePlayerState>();
  @type({ map: BattlePlayerInitState }) initPlayers = new MapSchema<BattlePlayerInitState>();
  @type([BattleTurnLogState]) logs = new ArraySchema<BattleTurnLogState>();
  @type("string") winner: string = "";
}
