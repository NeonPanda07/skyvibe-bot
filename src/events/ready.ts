import { Client, ActivityType } from "discord.js";

export default {
  name: "clientReady",
  once: true,
  async execute(client: Client) {
    console.log(`✅ SkyVibe is online as ${client.user?.tag}!`);
    client.user?.setPresence({
      activities: [{ name: "SkyVibe | /help", type: ActivityType.Watching }],
      status: "online",
    });
  },
};
