import { bot } from "@/bot/index";

const RATE_LIMIT_DELAY_MS = 400;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function generateInviteLink(channelId: string): Promise<string> {
  const invite = await bot.api.createChatInviteLink(Number(channelId), {
    member_limit: 1, // expires after 1 use only — no time expiry
  });

  return invite.invite_link;
}

export async function removeUserFromChannel(
  channelId: string,
  userId: string
): Promise<void> {
  await bot.api.banChatMember(Number(channelId), Number(userId));
  await bot.api.unbanChatMember(Number(channelId), Number(userId));
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

/**
 * Generate invite links for multiple channels with rate-limit delay between each,
 * then send a single DM with all links.
 */
async function generateInviteLinkWithRetry(channelId: string, maxRetries = 3): Promise<string> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await generateInviteLink(channelId);
    } catch (err: unknown) {
      const retryAfter =
        err && typeof err === "object" && "parameters" in err
          ? (err as { parameters?: { retry_after?: number } }).parameters?.retry_after
          : undefined;

      if (retryAfter && attempt < maxRetries - 1) {
        await sleep((retryAfter + 1) * 1000);
      } else {
        throw err;
      }
    }
  }
  throw new Error("Max retries exceeded");
}

export async function generateMultiChannelInvites(
  channels: { channelId: string; channelName: string }[]
): Promise<{ channelId: string; channelName: string; link: string }[]> {
  const results: { channelId: string; channelName: string; link: string }[] = [];

  for (const channel of channels) {
    try {
      const link = await generateInviteLinkWithRetry(channel.channelId);
      results.push({ ...channel, link });
    } catch (err) {
      console.error(`Failed to generate invite for channel ${channel.channelId}:`, err);
    }
    await sleep(RATE_LIMIT_DELAY_MS);
  }

  return results;
}

export async function sendMultiChannelInviteDM(
  userId: string,
  invites: { channelName: string; link: string }[]
): Promise<boolean> {
  if (invites.length === 0) return false;

  if (invites.length === 1) {
    return sendInviteDM(userId, invites[0].channelName, invites[0].link);
  }

  const linkLines = invites
    .map((inv, i) => `${i + 1}. <b>${inv.channelName}</b>\n${"\u{1F517}"} ${inv.link}`)
    .join("\n\n");

  try {
    await bot.api.sendMessage(
      Number(userId),
      `${"\u2705"} <b>You've been granted access to ${invites.length} Primetrex channels!</b>\n\n` +
        `${linkLines}\n\n` +
        `${"\u26A0\uFE0F"} Each link expires in 24 hours and can only be used once. Join all channels now!`,
      { parse_mode: "HTML" }
    );
    return true;
  } catch (error) {
    console.error(`Could not DM user ${userId}:`, error);
    return false;
  }
}

export { sleep, RATE_LIMIT_DELAY_MS };
