import { SlashCommandBuilder, ChatInputCommandInteraction, Client, Collection } from "discord.js";

export interface Command {
  data: SlashCommandBuilder | Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

export interface BotClient extends Client {
  commands: Collection<string, Command>;
}

export interface GuildSettings {
  welcomeChannelId?: string;
  welcomeMessage?: string;
  welcomeEnabled?: boolean;
  goodbyeChannelId?: string;
  goodbyeMessage?: string;
  goodbyeEnabled?: boolean;
  verifyChannelId?: string;
  verifyRoleId?: string;
  verifyMessageId?: string;
  verifyEmoji?: string;
  verifyEnabled?: boolean;
  boostChannelId?: string;
  boostMessage?: string;
  boostEnabled?: boolean;
  selfRolesChannelId?: string;
  selfRolesMessageId?: string;
  selfRoles?: SelfRole[];
  reviewChannelId?: string;
  reviewEnabled?: boolean;
  autoreacterChannelId?: string;
  autoreacterEmojis?: string[];
  autoreacterEnabled?: boolean;
  autoRoleId?: string;
  autoRoleEnabled?: boolean;
  antinukeEnabled?: boolean;
  antinukeExtraOwners?: string[];
  antinukeThreshold?: number;
  antispamEnabled?: boolean;
  antispamThreshold?: number;
  antispamInterval?: number;
  antilinkEnabled?: boolean;
  antilinkWhitelist?: string[];
  antilinkIgnoredChannels?: string[];
  giveawayConfig?: GiveawayConfig;
  activeGiveaway?: ActiveGiveaway;
  stickyMessages?: Record<string, StickyMessage>;
  warnings?: Record<string, UserWarning[]>;
  mutedUsers?: Record<string, MutedUser>;
}

export interface SelfRole {
  roleId: string;
  emoji: string;
  label: string;
}

export interface GiveawayConfig {
  emoji: string;
  color: number;
  winnerCount: number;
  prize: string;
  duration: number;
}

export interface ActiveGiveaway {
  channelId: string;
  messageId: string;
  endTime: number;
  hostId: string;
  prize: string;
  winnerCount: number;
  emoji: string;
  color: number;
  entries: string[];
  ended: boolean;
}

export interface StickyMessage {
  content: string;
  lastMessageId?: string;
}

export interface UserWarning {
  reason: string;
  moderatorId: string;
  timestamp: number;
}

export interface MutedUser {
  muteRoleId: string;
  previousRoles: string[];
  unmuteAt?: number;
}
