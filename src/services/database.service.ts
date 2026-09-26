import { env } from "@/config/env";
import {
  isWelcomePackName,
  WelcomePackName,
  WelcomeRarity,
} from "@/data/welcome-cards";
import { isWelcomeRarity } from "@/utils/welcome";
import { mkdirSync } from "fs";
import { DatabaseSync, StatementSync } from "node:sqlite";
import { dirname } from "path";

export type WelcomeSource = "join" | "command" | "rejoin";

export type WelcomePull = {
  userId: string;
  cardId: number;
  rarity: WelcomeRarity;
  pack: WelcomePackName;
  source: WelcomeSource;
  drawnAt: number;
};

type WelcomePullRow = {
  user_id: string;
  card_id: number;
  rarity: string;
  pack: string;
  source: string;
  drawn_at: number;
};

type WelcomePacketRow = {
  card_ids: string;
};

const toWelcomePull = (row: WelcomePullRow | undefined): WelcomePull | undefined => {
  if (!row || !isWelcomeRarity(row.rarity) || !isWelcomePackName(row.pack)) {
    return undefined;
  }

  return {
    userId: row.user_id,
    cardId: row.card_id,
    rarity: row.rarity,
    pack: row.pack,
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
      "SELECT user_id, card_id, rarity, pack, source, drawn_at FROM welcome_pulls WHERE user_id = ?",
    ).get(userId) as WelcomePullRow | undefined;

    return toWelcomePull(row);
  };

  // A vacated pull is the card a member held before leaving. It is kept aside so
  // a rejoin can hand the same card back, as long as nobody else drew it.
  getVacatedWelcomePull = (userId: string): WelcomePull | undefined => {
    const row = this.prepare(`
      SELECT user_id, card_id, rarity, pack, source, drawn_at
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
      INSERT INTO welcome_vacated_pulls (user_id, card_id, rarity, pack, source, drawn_at, vacated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT (user_id) DO UPDATE SET
        card_id = excluded.card_id,
        rarity = excluded.rarity,
        pack = excluded.pack,
        source = excluded.source,
        drawn_at = excluded.drawn_at,
        vacated_at = excluded.vacated_at
    `).run(
      pull.userId,
      pull.cardId,
      pull.rarity,
      pull.pack,
      pull.source,
      pull.drawnAt,
      Date.now(),
    );

    this.prepare("DELETE FROM welcome_pulls WHERE user_id = ?").run(userId);

    return pull;
  };

  deleteVacatedWelcomePull = (userId: string): void => {
    this.prepare("DELETE FROM welcome_vacated_pulls WHERE user_id = ?").run(userId);
  };

  insertWelcomePull = (pull: WelcomePull): boolean => {
    const result = this.prepare(`
      INSERT INTO welcome_pulls (user_id, card_id, rarity, pack, source, drawn_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT (user_id) DO NOTHING
    `).run(pull.userId, pull.cardId, pull.rarity, pull.pack, pull.source, pull.drawnAt);

    return Number(result.changes) === 1;
  };

  getWelcomePacket = (name: WelcomePackName): number[] => {
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

  saveWelcomePacket = (name: WelcomePackName, cardIds: number[]): void => {
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

  // Tables created before the packs existed have no pack column. The default
  // backfills every pull ever handed out as a Genesis card, which is what they
  // are: the first pack is the only one that has been in play so far.
  private addMissingPackColumns = (database: DatabaseSync): void => {
    for (const table of ["welcome_pulls", "welcome_vacated_pulls"]) {
      const columns = database.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];

      if (columns.some((column) => column.name === "pack")) {
        continue;
      }

      database.exec(`ALTER TABLE ${table} ADD COLUMN pack TEXT NOT NULL DEFAULT 'genesis'`);

      const { total } = database
        .prepare(`SELECT COUNT(*) AS total FROM ${table}`)
        .get() as { total: number };

      console.log(`Backfilled ${total} Genesis pack value(s) in ${table}`);
    }
  };

  // Packs replaced the main and celestial packets, which were both part of
  // Genesis and are now a single pack. Merging them keeps every card that was
  // not drawn yet, so the cards already handed out are never dealt twice.
  private mergeLegacyPackets = (database: DatabaseSync): void => {
    const legacy = database
      .prepare("SELECT name, card_ids FROM welcome_packets WHERE name IN ('main', 'celestial')")
      .all() as { name: string; card_ids: string }[];

    if (legacy.length === 0) {
      return;
    }

    const readIds = (row: { card_ids: string }): number[] => {
      try {
        const parsed: unknown = JSON.parse(row.card_ids);

        return Array.isArray(parsed)
          ? parsed.filter((id): id is number => Number.isInteger(id))
          : [];
      } catch {
        return [];
      }
    };

    const merged = [...new Set(legacy.flatMap(readIds))];

    database
      .prepare(`
        INSERT INTO welcome_packets (name, card_ids, updated_at)
        VALUES ('genesis', ?, ?)
        ON CONFLICT (name) DO UPDATE SET
          card_ids = excluded.card_ids,
          updated_at = excluded.updated_at
      `)
      .run(JSON.stringify(merged), Date.now());

    database.prepare("DELETE FROM welcome_packets WHERE name IN ('main', 'celestial')").run();

    console.log(`Merged the legacy main and celestial packets into the genesis pack (${merged.length} card(s) left)`);
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
          pack TEXT NOT NULL DEFAULT 'genesis',
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
          pack TEXT NOT NULL DEFAULT 'genesis',
          source TEXT NOT NULL,
          drawn_at INTEGER NOT NULL,
          vacated_at INTEGER NOT NULL,
          PRIMARY KEY (user_id)
        ) STRICT
      `);

      this.addMissingPackColumns(database);
      this.mergeLegacyPackets(database);

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
