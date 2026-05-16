import { BaseClient } from "../BaseClient";

export class AuthService extends BaseClient {
  async register(email: string, password: string): Promise<{ id: string; email: string }> {
    const res = await this.http.post<{ data: { id: string; email: string } }>("/auth/register", {
      body: { email, password },
    });
    return this.unwrap(res);
  }

  async login(email: string, password: string): Promise<{ token: string }> {
    const res = await this.http.post<{ data: { token: string } }>("/auth/login", {
      body: { email, password },
    });
    return this.unwrap(res);
  }
}
