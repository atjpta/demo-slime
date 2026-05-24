import { AuthService } from "./services/AuthService";
import { PlayerService } from "./services/PlayerService";
import { BattleLogService } from "./services/BattleLogService";
import { RankingService } from "./services/RankingService";
import { BattleItemService } from "./services/BattleItemService";
import { QueueRoom } from "./rooms/QueueRoom";
import { BattleRoom } from "./rooms/BattleRoom";

export { colyseus } from "./BaseClient";
export type { QueueHandlers } from "./rooms/QueueRoom";
export type { BattleHandlers } from "./rooms/BattleRoom";
export type { AuthService } from "./services/AuthService";
export type { PlayerService } from "./services/PlayerService";
export type { BattleLogService } from "./services/BattleLogService";
export type { RankingService, RankProfile, RankConfig, RankLadder, RankTier, LeaderboardItem, MyRankPosition } from "./services/RankingService";
export type { BattleLogItem, BattleLogDetail, BattleLogTurn, BattleLogPlayer, BattleItemSnapshot, PlayerItemWaveLog, PlayerItemWaveLogDetail } from "./services/BattleLogService";
export type { BattleItemService, BattleItemData } from "./services/BattleItemService";
export type { QueueRoom } from "./rooms/QueueRoom";
export type { BattleRoom, RankUpdateData } from "./rooms/BattleRoom";

export const authService = new AuthService();
export const playerService = new PlayerService();
export const battleLogService = new BattleLogService();
export const rankingService = new RankingService();
export const battleItemService = new BattleItemService();
export const queueRoom = new QueueRoom();
export const battleRoom = new BattleRoom();
