import { Client } from "@colyseus/sdk";
import { WS_URL } from "../constants";

export const colyseus = new Client(WS_URL);

export abstract class BaseClient {
  protected readonly http = colyseus.http;

  setToken(token: string) {
    colyseus.http.authToken = token;
  }

  protected unwrap<T>(res: any): T {
    return res.data.data;
  }
}
