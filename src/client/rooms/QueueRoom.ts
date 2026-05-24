import type { Room } from "@colyseus/sdk";
import { BaseClient, colyseus } from "../BaseClient";
export type QueueHandlers = {
  onBattleReady: (room: Room) => void;
  onError: (code: number, msg: string) => void;
  onLeave: (code: number) => void;
};

export class QueueRoom extends BaseClient {
  async join(
    playerToken: string,
    handlers: QueueHandlers,
    rankMode?: "normal" | "unlimit" | "balance",
  ): Promise<Room> {
    this.setToken(playerToken);

    const room = await colyseus.joinOrCreate("queue", { token: playerToken, rankMode });

    room.onMessage("clients", (count: number) => {
      console.log("[queue] players in group:", count);
    });

    room.onMessage("seat", async (reservation: any) => {
      room.send("confirm");
      const battleRoom = await colyseus.consumeSeatReservation(reservation);
      console.log("[queue] joined match", battleRoom.roomId);
      handlers.onBattleReady(battleRoom);
    });

    room.onLeave(handlers.onLeave);
    room.onError((code, msg) => handlers.onError(code, msg ?? ""));

    return room;
  }
}
