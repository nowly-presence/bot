import { env } from "@/config/env";
import { WelcomeRarity } from "@/data/welcome-cards";
import { isWelcomeRarity } from "@/utils/welcome";
import { mkdirSync } from "fs";
import { DatabaseSync, StatementSync } from "node:sqlite";
import { dirname } from "path";

export type WelcomeSource = "join" | "command";

export type WelcomePull = {
  userId: string;
  cardId: number;
  rarity: WelcomeRarity;
  source: WelcomeSource;
  drawnAt: number;
};

type WelcomePullRow = {
  user_id: string;
  card_id: number;
  rarity: string;
  source: string;
  drawn_at: number;
};

class DatabaseServiceClass {
  private database: DatabaseSync | null = null;

  connect = (): void => {
    if (this.database) {
      return;
    }

    mkdirSync(dirname(env.DISCORD_DB_PATH), { recursive: true });

    this.database = new DatabaseSync(env.DISCORD_DB_PATH);
    this.database.exec("PRAGMA journal_mode = WAL");
    this.database.exec(`
      CREATE TABLE IF NOT EXISTS welcome_pulls (
        user_id TEXT NOT NULL,
        card_id INTEGER NOT NULL,
        rarity TEXT NOT NULL,
        source TEXT NOT NULL,
        drawn_at INTEGER NOT NULL,
        PRIMARY KEY (user_id)
      ) STRICT
    `);
  };

  isConnected = (): boolean => {
    return this.database !== null;
  };

  getWelcomePull = (userId: string): WelcomePull | undefined => {
    const row = this.prepare(
      "SELECT user_id, card_id, rarity, source, drawn_at FROM welcome_pulls WHERE user_id = ?",
    ).get(userId) as WelcomePullRow | undefined;

    if (!row || !isWelcomeRarity(row.rarity)) {
      return undefined;
    }

    return {
      userId: row.user_id,
      cardId: row.card_id,
      rarity: row.rarity,
      source: row.source as WelcomeSource,
      drawnAt: row.drawn_at,
    };
  };

  insertWelcomePull = (pull: WelcomePull): boolean => {
    const result = this.prepare(`
      INSERT INTO welcome_pulls (user_id, card_id, rarity, source, drawn_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT (user_id) DO NOTHING
    `).run(pull.userId, pull.cardId, pull.rarity, pull.source, pull.drawnAt);

    return Number(result.changes) === 1;
  };

  private prepare = (sql: string): StatementSync => {
    if (!this.database) {
      throw new Error("Database is not connected");
    }

    return this.database.prepare(sql);
  };
}

export const DatabaseService = new DatabaseServiceClass();
