import { BaseClient } from "../BaseClient";

export class AuthService extends BaseClient {
  async login(email: string, password: string): Promise<{ token: string }> {
    const res = await this.http.post<{ data: { token: string } }>("/auth/login", {
      body: { email, password },
    });
    return this.unwrap(res);
  }
}
