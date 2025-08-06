import { db } from "..";

export async function isInvited(slackId: string) {
  return process.env.OWNER_ID === slackId || (await db.invite.count({
    where: {
      slackId,
    }
  })) > 0;
}