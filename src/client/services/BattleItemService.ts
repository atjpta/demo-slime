import { BaseClient } from "../BaseClient";

export type BattleItemData = {
  code: string;
  type: string;
  note: string;
  status: string;
};

export class BattleItemService extends BaseClient {
  async getAll(): Promise<BattleItemData[]> {
    const res = await this.http.get<{ data: BattleItemData[] }>("/battle-items");
    return this.unwrap(res);
  }
}
