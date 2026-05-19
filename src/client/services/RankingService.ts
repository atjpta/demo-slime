import { BaseClient } from "../BaseClient";

export interface RankProfile {
  _id: string;
  rankMode: "normal" | "balance";
  point: number;
  tier: { code: string; minPoint: number } | null;
  totalMatch: number;
  win: number;
  lose: number;
  draw: number;
  winStreak: number;
  loseStreak: number;
  highestRating: number;
  highestTier: { code: string; minPoint: number } | null;
}

export interface RankTier {
  code: string;
  minPoint: number;
}

export interface RankLadder {
  rankMode: "normal" | "balance";
  name: string;
  ruleSet: { initialPoint: number; winPoint: number; losePoint: number };
}

export interface RankConfig {
  ladders: RankLadder[];
  tiers: RankTier[];
}

export class RankingService extends BaseClient {
  async getMyRankProfile(rankMode: "normal" | "balance" = "normal"): Promise<RankProfile | null> {
    const res = await this.http.get<{ data: RankProfile[] }>("/ranking/me", {
      query: { rankMode },
    });
    const list = this.unwrap<RankProfile[]>(res);
    return list[0] ?? null;
  }

  async getRankConfig(): Promise<RankConfig> {
    const res = await this.http.get<{ data: RankConfig }>("/ranking/config");
    return this.unwrap<RankConfig>(res);
  }

  async getLeaderboard(
    rankMode: "normal" | "balance" = "normal",
    page = 1,
    limit = 100
  ): Promise<{
    items: LeaderboardItem[];
    pagination: { total: number; page: number; limit: number };
  }> {
    const res = await this.http.get<{ data: any }>("/ranking/leaderboard", {
      query: { rankMode, page, limit },
    });
    return this.unwrap(res);
  }

  async getMyPosition(rankMode: "normal" | "balance" = "normal"): Promise<MyRankPosition | null> {
    const res = await this.http.get<{ data: MyRankPosition }>("/ranking/me/position", {
      query: { rankMode },
    });
    return this.unwrap(res);
  }
}

export interface MyRankPosition {
  rank: number;
  profile: {
    point: number;
    tier: { code: string; minPoint: number } | null;
  };
}

export interface LeaderboardItem {
  _id: string;
  point: number;
  player: { _id: string; name: string };
  tier: { code: string; minPoint: number } | null;
}
