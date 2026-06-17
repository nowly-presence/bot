import { MaybePromise } from "@/types/promise";
import { ClientEvents } from "discord.js";

export type EventExecute<K extends keyof ClientEvents> = (...args: ClientEvents[K]) => MaybePromise<void>;

export interface Event<K extends keyof ClientEvents> {
  name: K;
  once?: boolean;
  execute: EventExecute<K>;
}