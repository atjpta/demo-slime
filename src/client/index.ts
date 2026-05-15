import { AuthService } from "./services/AuthService";
import { PlayerService } from "./services/PlayerService";
import { QueueRoom } from "./rooms/QueueRoom";
import { BattleRoom } from "./rooms/BattleRoom";

export { colyseus } from "./BaseClient";
export type { QueueHandlers } from "./rooms/QueueRoom";
export type { BattleHandlers } from "./rooms/BattleRoom";
export type { AuthService } from "./services/AuthService";
export type { PlayerService } from "./services/PlayerService";
export type { QueueRoom } from "./rooms/QueueRoom";
export type { BattleRoom } from "./rooms/BattleRoom";

export const authService = new AuthService();
export const playerService = new PlayerService();
export const queueRoom = new QueueRoom();
export const battleRoom = new BattleRoom();
