import type { Room } from "@colyseus/sdk";
import { Callbacks } from "@colyseus/sdk";
import { TURNS_PER_WAVE } from "@/constants";
import { BaseClient, colyseus } from "@/client/BaseClient";
import {
  BattleTurnLogState,
  BattlePlayerLogState,
  BattlePlayerStatsState,
  EffectBattleState,
} from "@/schemas";
import type { InitPlayerData } from "@/stores/battle.store";

export type RankUpdateData = {
  oldPoint: number;
  newPoint: number;
  point: number;
  result: "win" | "lose" | "draw";
};

export type BattleHandlers = {
  onPhaseChange: (phase: string) => void;
  onWaveChange: (wave: number) => void;
  onTimeLeftChange: (timeLeft: number) => void;
  onWinnerChange: (winner: string) => void;
  onPlayersChange: (ids: string[]) => void;
  onActionsChange: (playerId: string, actions: number[]) => void;
  onPlayerReadyChange: (playerId: string, ready: boolean) => void;
  onInitPlayersChange: (playerId: string, data: InitPlayerData) => void;
  onLogAdd: (logs: BattleTurnLogState[]) => void;
  onLogAddReconnect: (logs: BattleTurnLogState[]) => void;
  onRankUpdate: (data: RankUpdateData) => void;
  onOfferedItemsChange: (playerId: string, items: { code: string; type: string }[]) => void;
  onPlayerItemsChange: (playerId: string, items: { code: string; type: string }[]) => void;
  onLeave: (code: number) => void;
  onError: (code: number, msg: string) => void;
};

function normalizeLog(raw: any): BattleTurnLogState {
  const log = new BattleTurnLogState();
  log.wave = raw.wave ?? 0;
  log.turn = raw.turn ?? 0;
  const entries: [string, any][] =
    raw.players instanceof Map ? [...raw.players.entries()] : Object.entries(raw.players ?? {});
  for (const [pid, p] of entries) {
    const pl = new BattlePlayerLogState();
    pl.action = p.action ?? 0;
    pl.stats.hp = p.stats?.hp ?? 0;
    pl.stats.attack = p.stats?.attack ?? 0;
    pl.stats.magic = p.stats?.magic ?? 0;
    pl.stats.defense = p.stats?.defense ?? 0;
    for (const e of p.damageReceive ?? []) {
      const eff = new EffectBattleState();
      eff.typeEffect = e.typeEffect ?? "";
      eff.value = e.value ?? 0;
      pl.damageReceive.push(eff);
    }
    if (p.itemUsed) (pl as any).itemUsed = p.itemUsed;
    if (p.actionsAffected) (pl as any).actionsAffected = p.actionsAffected;
    log.players.set(pid, pl);
  }
  return log;
}

export class BattleRoom extends BaseClient {
  setup(room: Room, handlers: BattleHandlers): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const callbacks = Callbacks.get(room as any) as any;
    const state = room.state as any;

    callbacks.listen(
      "phase",
      (phase: string) => {
        // console.log(phase);
        handlers.onPhaseChange(phase);
        if (phase === "selecting_item") {
          state.players?.forEach((player: any, pid: string) => {
            const offered = [...(player.offeredItems ?? [])].map((i: any) => ({ code: i.code, type: i.type }));
            if (offered.length > 0) handlers.onOfferedItemsChange(pid, offered);
            const items = [...(player.items ?? [])].map((i: any) => ({ code: i.code, type: i.type }));
            handlers.onPlayerItemsChange(pid, items);
          });
        }
      },
      true
    );

    callbacks.listen("wave", (wave: number) => handlers.onWaveChange(wave), true);
    callbacks.listen("timeLeft", (timeLeft: number) => handlers.onTimeLeftChange(timeLeft), true);
    callbacks.listen("winner", (winner: string) => handlers.onWinnerChange(winner));

    callbacks.onAdd("players", (player: any, pid: string) => {
      handlers.onPlayersChange([...state.players.keys()]);
      callbacks.listen(player, "ready", (ready: boolean) => {
        // console.log("ready", ready);
        handlers.onPlayerReadyChange(pid, ready);
      });
      callbacks.onAdd(player, "actions", () => {
        if (player.actions.length === TURNS_PER_WAVE) {
          handlers.onActionsChange(pid, [...player.actions]);
        }
      });
      // Đọc ngay items hiện có (reconnect)
      if (player.items?.length > 0) {
        const items = [...player.items].map((i: any) => ({ code: i.code, type: i.type }));
        handlers.onPlayerItemsChange(pid, items);
      }
      const syncPlayerItems = () => {
        const items = [...(player.items ?? [])].map((i: any) => ({ code: i.code, type: i.type }));
        handlers.onPlayerItemsChange(pid, items);
      };
      callbacks.onAdd(player, "items", syncPlayerItems);
      callbacks.onChange(player, "items", syncPlayerItems);

      // offeredItems: đọc ngay (reconnect) + lắng nghe thay đổi
      if (player.offeredItems?.length > 0) {
        const offered = [...player.offeredItems].map((i: any) => ({ code: i.code, type: i.type }));
        handlers.onOfferedItemsChange(pid, offered);
      }
      const syncOfferedItems = () => {
        const offered = [...(player.offeredItems ?? [])].map((i: any) => ({ code: i.code, type: i.type }));
        handlers.onOfferedItemsChange(pid, offered);
      };
      callbacks.onAdd(player, "offeredItems", syncOfferedItems);
      callbacks.onChange(player, "offeredItems", syncOfferedItems);
    });

    room.onMessage(
      "battle_init",
      (data: {
        players: Record<string, any>;
        skills: Record<string, any[]>;
        logs: any[];
        rankProfiles?: Record<string, any>;
      }) => {
        for (const [pid, player] of Object.entries(data.players)) {
          const skills = (data.skills[pid] ?? []).map((s: any) => ({ code: s.code, type: s.type }));
          const rawStats = player.stats;
          const stats = rawStats
            ? {
                hp: rawStats.hp,
                attack: rawStats.attack,
                magic: rawStats.magic,
                defense: rawStats.defense,
              }
            : null;
          const tierCode = data.rankProfiles?.[pid]?.tier?.code ?? null;
          handlers.onInitPlayersChange(pid, { name: player.name, stats, skills, tierCode });
        }
        handlers.onLogAddReconnect(data.logs.map((e) => normalizeLog(e)));
      }
    );

    room.onMessage("battle_log", (raws: any[]) => {
      handlers.onLogAdd(raws.map(normalizeLog));
    });

    room.onMessage("rank_update", (data: RankUpdateData) => {
      handlers.onRankUpdate(data);
    });

    room.onLeave((code) => handlers.onLeave(code));
    room.onError((code, msg) => handlers.onError(code, msg ?? ""));
  }

  async create(playerToken: string): Promise<Room> {
    this.setToken(playerToken);
    return colyseus.create("battle");
  }

  onBattleStart(room: Room, callback: () => void): void {
    const callbacks = Callbacks.get(room as any) as any;
    callbacks.listen(
      "phase",
      (phase: string) => {
        if (phase && phase !== "waiting") callback();
      },
      true
    );
  }

  async joinById(roomId: string, playerToken: string): Promise<Room> {
    this.setToken(playerToken);
    return colyseus.joinById(roomId);
  }

  async reconnect(token: string): Promise<Room> {
    return colyseus.reconnect(token);
  }

  async leave(room: Room | null): Promise<void> {
    if (room) await room.leave();
  }
}
