import { Event } from "@/utils/handler/event/event.type";
import { Events } from "discord.js";

const event: Event<Events.Error> = {
  name: Events.Error,
  execute: (error) => {
    console.error("Discord client error:", error);
  },
};

export default event;