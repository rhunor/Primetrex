import { bot } from "@/bot/index";

export async function generateInviteLink(channelId: string): Promise<string> {
  const invite = await bot.api.createChatInviteLink(Number(channelId), {
    member_limit: 1,
    expire_date: Math.floor(Date.now() / 1000) + 86400, // 24 hours
  });

  return invite.invite_link;
}

export async function removeUserFromChannel(
  channelId: string,
  userId: string
): Promise<void> {
  try {
    await bot.api.banChatMember(Number(channelId), Number(userId));
    await bot.api.unbanChatMember(Number(channelId), Number(userId));
  } catch (error) {
    console.error(
      `Failed to remove user ${userId} from channel ${channelId}:`,
      error
    );
  }
}

export async function sendInviteDM(
  userId: string,
  channelName: string,
  inviteLink: string
): Promise<boolean> {
  try {
    await bot.api.sendMessage(
      Number(userId),
      `${"\u2705"} You've been granted access to <b>${channelName}</b>!\n\n` +
        `${"\u{1F517}"} Join here: ${inviteLink}\n\n` +
        `This link expires in 24 hours and can only be used once.`,
      { parse_mode: "HTML" }
    );
    return true;
  } catch (error) {
    console.error(`Could not DM user ${userId}:`, error);
    return false;
  }
}
