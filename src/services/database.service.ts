import { env } from "@/config/env";
import { WelcomePacketName, WelcomeRarity } from "@/data/welcome-cards";
import { isWelcomeRarity } from "@/utils/welcome";
import { mkdirSync } from "fs";
import { DatabaseSync, StatementSync } from "node:sqlite";
import { dirname } from "path";

export type WelcomeSource = "join" | "command" | "rejoin";

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

type WelcomePacketRow = {
  card_ids: string;
};

const toWelcomePull = (row: WelcomePullRow | undefined): WelcomePull | undefined => {
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

class DatabaseServiceClass {
  private database: DatabaseSync | null = null;

  connect = (): void => {
    if (this.database) {
      console.log(`SQLite already open at ${env.DISCORD_DB_PATH}`);
      return;
    }

    this.database = this.open();
  };

  isConnected = (): boolean => {
    return this.database !== null;
  };

  getWelcomePull = (userId: string): WelcomePull | undefined => {
    const row = this.prepare(
      "SELECT user_id, card_id, rarity, source, drawn_at FROM welcome_pulls WHERE user_id = ?",
    ).get(userId) as WelcomePullRow | undefined;

    return toWelcomePull(row);
  };

  // A vacated pull is the card a member held before leaving. It is kept aside so
  // a rejoin can hand the same card back, as long as nobody else drew it.
  getVacatedWelcomePull = (userId: string): WelcomePull | undefined => {
    const row = this.prepare(`
      SELECT user_id, card_id, rarity, source, drawn_at
      FROM welcome_vacated_pulls
      WHERE user_id = ?
    `).get(userId) as WelcomePullRow | undefined;

    return toWelcomePull(row);
  };

  vacateWelcomePull = (userId: string): WelcomePull | undefined => {
    const pull = this.getWelcomePull(userId);

    if (!pull) {
      return undefined;
    }

    // Inserted before the delete, so a failure leaves the pull active rather
    // than losing it.
    this.prepare(`
      INSERT INTO welcome_vacated_pulls (user_id, card_id, rarity, source, drawn_at, vacated_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT (user_id) DO UPDATE SET
        card_id = excluded.card_id,
        rarity = excluded.rarity,
        source = excluded.source,
        drawn_at = excluded.drawn_at,
        vacated_at = excluded.vacated_at
    `).run(pull.userId, pull.cardId, pull.rarity, pull.source, pull.drawnAt, Date.now());

    this.prepare("DELETE FROM welcome_pulls WHERE user_id = ?").run(userId);

    return pull;
  };

  deleteVacatedWelcomePull = (userId: string): void => {
    this.prepare("DELETE FROM welcome_vacated_pulls WHERE user_id = ?").run(userId);
  };

  // How many cards of each rarity the server has drawn, to show how rare a
  // member's card actually is.
  getWelcomeRarityCounts = (): Record<WelcomeRarity, number> => {
    const counts = {
      common: 0,
      rare: 0,
      epic: 0,
      legendary: 0,
      mythic: 0,
      celestial: 0,
    };

    const rows = this.prepare(
      "SELECT rarity, COUNT(*) AS total FROM welcome_pulls GROUP BY rarity",
    ).all() as { rarity: string; total: number }[];

    for (const row of rows) {
      if (isWelcomeRarity(row.rarity)) {
        counts[row.rarity] = Number(row.total);
      }
    }

    return counts;
  };

  insertWelcomePull = (pull: WelcomePull): boolean => {
    const result = this.prepare(`
      INSERT INTO welcome_pulls (user_id, card_id, rarity, source, drawn_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT (user_id) DO NOTHING
    `).run(pull.userId, pull.cardId, pull.rarity, pull.source, pull.drawnAt);

    return Number(result.changes) === 1;
  };

  getWelcomePacket = (name: WelcomePacketName): number[] => {
    const row = this.prepare(
      "SELECT card_ids FROM welcome_packets WHERE name = ?",
    ).get(name) as WelcomePacketRow | undefined;

    if (!row) {
      return [];
    }

    try {
      const cardIds: unknown = JSON.parse(row.card_ids);

      if (!Array.isArray(cardIds)) {
        throw new Error("expected an array of card ids");
      }

      return cardIds.filter((cardId): cardId is number => Number.isInteger(cardId));
    } catch (error) {
      console.warn(
        `Stored welcome packet "${name}" is unreadable, it will be reshuffled:`,
        error instanceof Error ? error.message : error,
      );

      return [];
    }
  };

  saveWelcomePacket = (name: WelcomePacketName, cardIds: number[]): void => {
    this.prepare(`
      INSERT INTO welcome_packets (name, card_ids, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT (name) DO UPDATE SET
        card_ids = excluded.card_ids,
        updated_at = excluded.updated_at
    `).run(name, JSON.stringify(cardIds), Date.now());
  };

  private prepare = (sql: string): StatementSync => {
    if (!this.database) {
      throw new Error("Database is not connected");
    }

    return this.database.prepare(sql);
  };

  private open = (): DatabaseSync => {
    let database: DatabaseSync | null = null;

    try {
      mkdirSync(dirname(env.DISCORD_DB_PATH), { recursive: true });

      database = new DatabaseSync(env.DISCORD_DB_PATH);
      database.exec("PRAGMA journal_mode = WAL");
      database.exec(`
        CREATE TABLE IF NOT EXISTS welcome_pulls (
          user_id TEXT NOT NULL,
          card_id INTEGER NOT NULL,
          rarity TEXT NOT NULL,
          source TEXT NOT NULL,
          drawn_at INTEGER NOT NULL,
          PRIMARY KEY (user_id)
        ) STRICT
      `);
      database.exec(`
        CREATE TABLE IF NOT EXISTS welcome_packets (
          name TEXT NOT NULL,
          card_ids TEXT NOT NULL,
          updated_at INTEGER NOT NULL,
          PRIMARY KEY (name)
        ) STRICT
      `);
      database.exec(`
        CREATE TABLE IF NOT EXISTS welcome_vacated_pulls (
          user_id TEXT NOT NULL,
          card_id INTEGER NOT NULL,
          rarity TEXT NOT NULL,
          source TEXT NOT NULL,
          drawn_at INTEGER NOT NULL,
          vacated_at INTEGER NOT NULL,
          PRIMARY KEY (user_id)
        ) STRICT
      `);

      const integrity = database.prepare("PRAGMA quick_check").get() as
        | { quick_check: string }
        | undefined;

      if (integrity?.quick_check !== "ok") {
        throw new Error(`integrity check returned "${integrity?.quick_check ?? "no result"}"`);
      }

      const { total } = database
        .prepare("SELECT COUNT(*) AS total FROM welcome_pulls")
        .get() as { total: number };

      console.log(
        `SQLite connected at ${env.DISCORD_DB_PATH} (integrity ok, ${total} welcome pull(s) stored)`,
      );

      return database;
    } catch (error) {
      database?.close();

      throw new Error(
        `Cannot open the SQLite database at ${env.DISCORD_DB_PATH}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  };
}

export const DatabaseService = new DatabaseServiceClass();
