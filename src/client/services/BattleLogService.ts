import { BaseClient } from "../BaseClient";

export type BattleLogPlayer = {
  player: { _id: string; name: string };
  stats: { hp: number; attack: number; magic: number; defense: number };
  skills: { code: string; type: string }[];
};

export type BattleLogTurnPlayer = {
  action: number;
  damageReceive: { typeEffect: string; value: number }[];
  stats: { hp: number; attack: number; magic: number; defense: number };
};

export type BattleLogTurn = {
  wave: number;
  turn: number;
  players: Record<string, BattleLogTurnPlayer>;
};

export type BattleLogItem = {
  _id: string;
  players: BattleLogPlayer[];
  winner: { _id: string; name: string } | null;
  endReason: string;
  createdAt: string;
};

export type BattleLogDetail = BattleLogItem & {
  logs: BattleLogTurn[];
};

export type BattleLogPagination = {
  items: BattleLogItem[];
  pagination: { total: number; page: number; limit: number };
};

export class BattleLogService extends BaseClient {
  async getList(params: { playerId?: string; page?: number; limit?: number } = {}): Promise<BattleLogPagination> {
    const query = new URLSearchParams();
    if (params.playerId) query.set("playerId", params.playerId);
    if (params.page) query.set("page", String(params.page));
    if (params.limit) query.set("limit", String(params.limit));
    const qs = query.toString();
    const res = await this.http.get<{ data: BattleLogPagination }>(`/battle-logs${qs ? `?${qs}` : ""}`);
    return this.unwrap(res);
  }

  async getById(id: string): Promise<BattleLogDetail> {
    const res = await this.http.get<{ data: BattleLogDetail }>(`/battle-logs/${id}`);
    return this.unwrap(res);
  }
}
