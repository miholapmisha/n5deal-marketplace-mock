// Messaging (SPEC §5 S2) shapes and paths shared by server and client components.

export const MESSAGES_PATH = "/messages";

export const MESSAGE_MAX_LENGTH = 2000;

export function conversationPath(conversationId: string): string {
  return `${MESSAGES_PATH}/${conversationId}`;
}

/** The buyer's first message about an asset (from S4). */
export function newConversationPath(assetSlug: string): string {
  return `${MESSAGES_PATH}/new?asset=${encodeURIComponent(assetSlug)}`;
}

/** One message as the thread shows it. `mine` is decided on the server. */
export interface ThreadMessage {
  id: string;
  body: string;
  createdAt: Date;
  mine: boolean;
  /** Shown optimistically while the server action is still running. */
  pending?: boolean;
}

/** What every messaging action returns; a redirect replaces it on success where noted. */
export interface MessageActionResult {
  error?: string;
}

/** "Baltic Fintech Holdings" → "BF"; one word → its first two letters. */
export function initials(name: string): string {
  const words = name.split(/\s+/).filter((word) => /^[\p{L}\p{N}]/u.test(word));
  const letters = words.length > 1 ? words[0][0] + words[1][0] : (words[0] ?? "?").slice(0, 2);
  return letters.toUpperCase();
}
