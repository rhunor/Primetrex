import { waitUntil } from "@vercel/functions";
import dbConnect from "@/lib/db";
import BotSubscriber from "@/models/BotSubscriber";
import Plan from "@/models/Plan";
import { bot } from "@/bot/index";
import { EMOJI } from "@/bot/constants";
import { generateMultiChannelInvites, sendMultiChannelInviteDM, sleep } from "@/bot/services/invite";

const BATCH_DELAY_MS = 500;

export async function runAddAllUsers(chatId: number, messageId: number) {
  try {
    await dbConnect();

    const plan = await Plan.findOne({ isActive: true });
    if (!plan || !plan.channels?.length) {
      await bot.api.editMessageText(chatId, messageId, `${EMOJI.CANCEL} No channels configured on the active plan.`);
      return;
    }

    const pendingSubs = await BotSubscriber.find({ status: "active", inviteSentAt: null });
    const uniqueUserIds = [...new Set(pendingSubs.map((s) => s.userId))];
    const total = uniqueUserIds.length;

    if (total === 0) {
      await bot.api.editMessageText(
        chatId,
        messageId,
        `${EMOJI.SUCCESS} <b>All done!</b>\n\nAll active subscribers have already received their invite links.`,
        { parse_mode: "HTML" }
      );
      return;
    }

    let sent = 0;
    let failed = 0;

    for (let i = 0; i < uniqueUserIds.length; i++) {
      const userId = uniqueUserIds[i];

      if (i % 10 === 0) {
        try {
          await bot.api.editMessageText(
            chatId,
            messageId,
            `${EMOJI.HOURGLASS} <b>Sending invite links...</b>\n\nProgress: <b>${i}/${total}</b>\nSent: <b>${sent}</b> | Failed: <b>${failed}</b>`,
            { parse_mode: "HTML" }
          );
        } catch { /* non-critical */ }
      }

      try {
        const invites = await generateMultiChannelInvites(plan.channels);
        if (invites.length > 0) {
          const dmSent = await sendMultiChannelInviteDM(userId, invites);
          await BotSubscriber.updateMany(
            { userId, status: "active" },
            { inviteSentAt: new Date() }
          );
          if (dmSent) sent++;
          else failed++;
        }
      } catch (err) {
        console.error(`Failed to send invite to user ${userId}:`, err);
        failed++;
        // inviteSentAt left null — will retry on next run
      }

      await sleep(BATCH_DELAY_MS);
    }

    await bot.api.editMessageText(
      chatId,
      messageId,
      `${EMOJI.SUCCESS} <b>Done!</b>\n\n` +
      `Total processed: <b>${total}</b>\n` +
      `✅ Successfully sent: <b>${sent}</b>\n` +
      `⚠️ Blocked bot / DM failed: <b>${failed}</b>\n\n` +
      (failed > 0
        ? `Run <code>/addallusers</code> again to retry failed users.`
        : `All subscribers have received their invite links.`),
      { parse_mode: "HTML" }
    );
  } catch (err) {
    console.error("addallusers error:", err);
    try {
      await bot.api.sendMessage(
        chatId,
        `${EMOJI.CANCEL} <b>Job failed mid-run.</b>\n\nRun <code>/addallusers</code> again — it will skip users already processed.`,
        { parse_mode: "HTML" }
      );
    } catch { /* silent */ }
  }
}

export function triggerAddAllUsers(chatId: number, messageId: number) {
  waitUntil(runAddAllUsers(chatId, messageId));
}

// ── Legacy group invite job ────────────────────────────────────────────────────

const LEGACY_CHANNEL_ID = "-1003699209692";

const LEGACY_INVITE_MESSAGE = `Hello, this is Primetrex community

We noticed the bot malfunctioned and removed you from the general community

We apologise for this

This is a link to join the community again👇👇`;

async function checkLegacyMembership(userId: string): Promise<"in_group" | "left_voluntarily" | "kicked" | "never_joined"> {
  try {
    const member = await bot.api.getChatMember(Number(LEGACY_CHANNEL_ID), Number(userId));
    if (member.status === "member" || member.status === "administrator" || member.status === "creator") return "in_group";
    if (member.status === "left") return "left_voluntarily";
    if (member.status === "kicked" || member.status === "restricted") return "kicked";
    return "never_joined";
  } catch {
    return "never_joined";
  }
}

export async function runSendLegacyInvites(chatId: number, messageId: number) {
  try {
    await dbConnect();

    const allUserIds = await BotSubscriber.distinct("userId");
    const total = allUserIds.length;

    if (total === 0) {
      await bot.api.editMessageText(chatId, messageId, `${EMOJI.WARNING} No subscribers found in the database.`);
      return;
    }

    await bot.api.editMessageText(
      chatId,
      messageId,
      `${EMOJI.HOURGLASS} <b>Phase 1/2 — Checking legacy group membership...</b>\n\nChecking <b>${total}</b> total subscribers...`,
      { parse_mode: "HTML" }
    );

    const stats = { inGroup: 0, leftVoluntarily: 0, kicked: 0, neverJoined: 0, sent: 0, failed: 0 };
    const notInGroup: string[] = [];

    for (let i = 0; i < allUserIds.length; i++) {
      const userId = allUserIds[i];
      const status = await checkLegacyMembership(userId);

      if (status === "in_group") {
        stats.inGroup++;
      } else {
        notInGroup.push(userId);
        if (status === "left_voluntarily") stats.leftVoluntarily++;
        else if (status === "kicked") stats.kicked++;
        else stats.neverJoined++;
      }

      await sleep(300);

      if ((i + 1) % 5 === 0 || i === allUserIds.length - 1) {
        try {
          await bot.api.editMessageText(
            chatId,
            messageId,
            `${EMOJI.HOURGLASS} <b>Phase 1/2 — Checking membership...</b>\n\n` +
            `Checked: <b>${i + 1}/${total}</b>\n\n` +
            `✅ Still in group: <b>${stats.inGroup}</b>\n` +
            `🚶 Left voluntarily: <b>${stats.leftVoluntarily}</b>\n` +
            `🚫 Removed/kicked: <b>${stats.kicked}</b>\n` +
            `❓ Never joined: <b>${stats.neverJoined}</b>`,
            { parse_mode: "HTML" }
          );
        } catch { /* non-critical */ }
      }
    }

    if (notInGroup.length === 0) {
      await bot.api.editMessageText(
        chatId,
        messageId,
        `${EMOJI.SUCCESS} <b>All ${total} subscribers are in the legacy group.</b>\n\nNo invites needed.`,
        { parse_mode: "HTML" }
      );
      return;
    }

    let legacyLink: string;
    try {
      const invite = await bot.api.createChatInviteLink(Number(LEGACY_CHANNEL_ID), { member_limit: 0 });
      legacyLink = invite.invite_link;
    } catch (err) {
      console.error("[legacy-invites] Failed to generate invite link:", err);
      await bot.api.editMessageText(chatId, messageId, `${EMOJI.CANCEL} Failed to generate invite link. Make sure the bot is an admin in the legacy group.`);
      return;
    }

    await bot.api.editMessageText(
      chatId,
      messageId,
      `${EMOJI.HOURGLASS} <b>Phase 2/2 — Sending invites to ${notInGroup.length} users...</b>\n\nStarting...`,
      { parse_mode: "HTML" }
    );

    for (let i = 0; i < notInGroup.length; i++) {
      const userId = notInGroup[i];

      try {
        await bot.api.sendMessage(Number(userId), `${LEGACY_INVITE_MESSAGE}\n\n${legacyLink}`);
        stats.sent++;
      } catch {
        stats.failed++;
      }

      await sleep(400);

      if ((i + 1) % 5 === 0 || i === notInGroup.length - 1) {
        try {
          await bot.api.editMessageText(
            chatId,
            messageId,
            `${EMOJI.HOURGLASS} <b>Phase 2/2 — Sending invites...</b>\n\n` +
            `Progress: <b>${i + 1}/${notInGroup.length}</b>\n` +
            `✅ Invite sent: <b>${stats.sent}</b>\n` +
            `❌ Could not DM (blocked bot): <b>${stats.failed}</b>\n\n` +
            `<i>If this stops, re-run /sendlegacyinvites to resume.</i>`,
            { parse_mode: "HTML" }
          );
        } catch { /* non-critical */ }
      }
    }

    await bot.api.editMessageText(
      chatId,
      messageId,
      `${EMOJI.SUCCESS} <b>Done!</b>\n\n` +
      `<b>📊 Membership Report (${total} total subscribers)</b>\n` +
      `✅ Already in group: <b>${stats.inGroup}</b>\n` +
      `🚶 Left voluntarily: <b>${stats.leftVoluntarily}</b>\n` +
      `🚫 Removed/kicked: <b>${stats.kicked}</b>\n` +
      `❓ Never joined: <b>${stats.neverJoined}</b>\n\n` +
      `<b>📨 Invites sent (${notInGroup.length} not in group)</b>\n` +
      `✅ DM delivered: <b>${stats.sent}</b>\n` +
      `❌ Could not DM (blocked bot): <b>${stats.failed}</b>`,
      { parse_mode: "HTML" }
    );
  } catch (err) {
    console.error("[legacy-invites] Job crashed:", err);
    try {
      await bot.api.editMessageText(
        chatId,
        messageId,
        `${EMOJI.CANCEL} <b>Job crashed mid-run.</b>\n\nRun <b>/sendlegacyinvites</b> again to resume.`,
        { parse_mode: "HTML" }
      );
    } catch {
      await bot.api.sendMessage(chatId, `${EMOJI.CANCEL} Job crashed. Re-run /sendlegacyinvites.`);
    }
  }
}

export function triggerSendLegacyInvites(chatId: number, messageId: number) {
  waitUntil(runSendLegacyInvites(chatId, messageId));
}

// ── Legacy group membership report ────────────────────────────────────────────

async function runRemovedLast20(chatId: number, messageId: number) {
  try {
    await dbConnect();

    const since = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000);
    const allUserIds = await BotSubscriber.distinct("userId");
    const total = allUserIds.length;

    if (total === 0) {
      await bot.api.editMessageText(chatId, messageId, `${EMOJI.WARNING} No subscribers found.`);
      return;
    }

    const kicked: string[] = [];
    const leftVoluntarily: string[] = [];
    const inGroup: string[] = [];

    for (let i = 0; i < allUserIds.length; i++) {
      const userId = allUserIds[i];
      try {
        const member = await bot.api.getChatMember(Number(LEGACY_CHANNEL_ID), Number(userId));
        if (member.status === "member" || member.status === "administrator" || member.status === "creator") {
          inGroup.push(userId);
        } else if (member.status === "left") {
          leftVoluntarily.push(userId);
        } else if (member.status === "kicked" || member.status === "restricted") {
          kicked.push(userId);
        }
      } catch { /* can't determine */ }

      await sleep(300);

      if ((i + 1) % 10 === 0 || i === allUserIds.length - 1) {
        try {
          await bot.api.editMessageText(
            chatId, messageId,
            `${EMOJI.HOURGLASS} <b>Checking legacy group membership...</b>\n\n` +
            `Checked: <b>${i + 1}/${total}</b>\n` +
            `✅ In group: <b>${inGroup.length}</b>  🚶 Left: <b>${leftVoluntarily.length}</b>  🚫 Kicked: <b>${kicked.length}</b>`,
            { parse_mode: "HTML" }
          );
        } catch { /* non-critical */ }
      }
    }

    const recentExpired = await BotSubscriber.find({
      status: "expired",
      updatedAt: { $gte: since },
      channelId: { $ne: LEGACY_CHANNEL_ID },
    }).lean();
    const recentExpiredIds = [...new Set(recentExpired.map((s) => s.userId))];

    let summary =
      `${EMOJI.PERSON} <b>Legacy Group Report (${total} subscribers)</b>\n\n` +
      `✅ Currently in group: <b>${inGroup.length}</b>\n` +
      `🚶 Left voluntarily: <b>${leftVoluntarily.length}</b>\n` +
      `🚫 Removed/kicked: <b>${kicked.length}</b>\n\n`;

    if (leftVoluntarily.length > 0) {
      summary += `<b>🚶 Left voluntarily:</b>\n` +
        leftVoluntarily.map((id, i) => `${i + 1}. <code>${id}</code>`).join("\n") + "\n\n";
    }
    if (kicked.length > 0) {
      summary += `<b>🚫 Removed/kicked:</b>\n` +
        kicked.map((id, i) => `${i + 1}. <code>${id}</code>`).join("\n") + "\n\n";
    }

    summary += `<b>📋 Subscription expiries last 20 days: ${recentExpiredIds.length}</b>\n`;
    if (recentExpiredIds.length > 0) {
      summary += recentExpiredIds.map((id, i) => `${i + 1}. <code>${id}</code>`).join("\n") + "\n\n";
    }
    summary += `\nRun <b>/sendlegacyinvites</b> to send invites to everyone not in the group.`;

    // Send in chunks if over Telegram's 4096 char limit
    const chunks: string[] = [];
    let current = "";
    for (const line of summary.split("\n")) {
      if ((current + "\n" + line).length > 4000) {
        chunks.push(current);
        current = line;
      } else {
        current += (current ? "\n" : "") + line;
      }
    }
    if (current) chunks.push(current);

    await bot.api.editMessageText(chatId, messageId, chunks[0], { parse_mode: "HTML" });
    for (let c = 1; c < chunks.length; c++) {
      await bot.api.sendMessage(chatId, chunks[c], { parse_mode: "HTML" });
    }
  } catch (err) {
    console.error("[removedlast20] crashed:", err);
    try {
      await bot.api.editMessageText(chatId, messageId, `${EMOJI.CANCEL} Job crashed. Re-run /removedlast20.`);
    } catch { /* silent */ }
  }
}

export function triggerRemovedLast20(chatId: number, messageId: number) {
  waitUntil(runRemovedLast20(chatId, messageId));
}
