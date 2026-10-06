const isProduction = process.env.NODE_ENV === "production";

export const SESSION_COOKIE = isProduction ? "__Host-n5deal_session" : "n5deal_session";

export const SUSPENDED_NOTICE_COOKIE = "n5deal_suspended";

export const SECURE_COOKIES = isProduction;
