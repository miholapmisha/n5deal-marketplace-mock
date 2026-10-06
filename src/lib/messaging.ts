export const MESSAGES_PATH = "/messages";

export const MESSAGE_MAX_LENGTH = 2000;

export function conversationPath(conversationId: string): string {
  return `${MESSAGES_PATH}/${conversationId}`;
}

export function newConversationPath(assetSlug: string): string {
  return `${MESSAGES_PATH}/new?asset=${encodeURIComponent(assetSlug)}`;
}

export interface ThreadMessage {
  id: string;
  body: string;
  createdAt: Date;
  mine: boolean;
  pending?: boolean;
}

export interface MessageActionResult {
  error?: string;
}

export function initials(name: string): string {
  const words = name.split(/\s+/).filter((word) => /^[\p{L}\p{N}]/u.test(word));
  const letters = words.length > 1 ? words[0][0] + words[1][0] : (words[0] ?? "?").slice(0, 2);
  return letters.toUpperCase();
}
