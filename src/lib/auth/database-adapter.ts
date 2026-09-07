import { randomUUID } from "node:crypto";
import type { Adapter, AdapterAccount, AdapterUser } from "next-auth/adapters";

export interface AuthSqlClient {
  query(text: string, params: readonly unknown[]): Promise<{ rows: Record<string, unknown>[] }>;
}

function toUser(row: Record<string, unknown>): AdapterUser {
  return {
    id: String(row.id), name: String(row.display_name),
    // LINE does not supply email; never synthesize a provider-scoped address.
    email: typeof row.email === "string" ? row.email : "",
    image: typeof row.image_url === "string" ? row.image_url : null,
    emailVerified: row.email_verified_at ? new Date(String(row.email_verified_at)) : null,
  };
}
const emailValue = (value: string | null | undefined) => value?.trim().toLowerCase() || null;
const displayName = (value: string | null | undefined) => value?.trim().slice(0, 200) || "Player";

/** Minimal OAuth + JWT adapter. Provider tokens are not needed for login and
 * are deliberately not stored. Auth.js retains its no-email-auto-link default. */
export function createDatabaseAuthAdapter(sql: AuthSqlClient): Adapter {
  async function find(text: string, params: readonly unknown[]) {
    const { rows } = await sql.query(text, params);
    return rows[0] ? toUser(rows[0]) : null;
  }
  return {
    async createUser(user) {
      const created = await find(`INSERT INTO app_users (id, display_name, email, image_url, email_verified_at)
        VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [randomUUID(), displayName(user.name), emailValue(user.email), user.image ?? null, user.emailVerified ?? null]);
      if (!created) throw new Error("User creation returned no record");
      return created;
    },
    getUser: (id) => find("SELECT * FROM app_users WHERE id = $1", [id]),
    async getUserByEmail(email) {
      const value = emailValue(email);
      if (!value) return null;
      return find("SELECT * FROM app_users WHERE lower(email) = $1", [value]);
    },
    getUserByAccount: ({ provider, providerAccountId }) => find(`SELECT u.* FROM app_users u
      JOIN auth_accounts a ON a.user_id = u.id WHERE a.provider = $1 AND a.provider_account_id = $2`, [provider, providerAccountId]),
    async updateUser(user) {
      const assignments: string[] = [];
      const values: unknown[] = [user.id];
      function set(column: string, value: unknown) { values.push(value); assignments.push(`${column} = $${values.length}`); }
      if (user.name !== undefined) set("display_name", displayName(user.name));
      if (user.email !== undefined) set("email", emailValue(user.email));
      if (user.image !== undefined) set("image_url", user.image);
      if (user.emailVerified !== undefined) set("email_verified_at", user.emailVerified);
      const updated = await find(assignments.length
        ? `UPDATE app_users SET ${assignments.join(", ")}, updated_at = now() WHERE id = $1 RETURNING *`
        : "SELECT * FROM app_users WHERE id = $1", values);
      if (!updated) throw new Error("User no longer exists");
      return updated;
    },
    async linkAccount(account: AdapterAccount) {
      if (!["google", "line"].includes(account.provider) || !account.providerAccountId) {
        throw new Error("Unsupported OAuth account");
      }
      // Idempotent for the same owner, never moves an account to another user.
      const { rows } = await sql.query(`INSERT INTO auth_accounts (provider, provider_account_id, user_id, type)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (provider, provider_account_id) DO UPDATE SET type = EXCLUDED.type
          WHERE auth_accounts.user_id = EXCLUDED.user_id
        RETURNING user_id`, [account.provider, account.providerAccountId, account.userId, account.type]);
      if (!rows[0]) throw new Error("OAuth account is already linked to another user");
    },
  };
}
