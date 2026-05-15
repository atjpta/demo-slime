import { BaseClient } from "../BaseClient";

export class PlayerService extends BaseClient {
  async list(): Promise<any[]> {
    const res = await this.http.get<{ data: { items: any[] } }>("/players");
    return this.unwrap<any>(res).items ?? [];
  }

  async create(name: string): Promise<any> {
    const res = await this.http.post<{ data: any }>("/players", { body: { name } });
    return this.unwrap(res);
  }

  async select(id: string): Promise<{ token: string }> {
    const res = await this.http.post<{ data: { token: string } }>(`/players/select-player/${id}`);
    return this.unwrap(res);
  }

  async me(): Promise<any> {
    const res = await this.http.get<{ data: any }>("/players/me");
    return this.unwrap(res);
  }
}
