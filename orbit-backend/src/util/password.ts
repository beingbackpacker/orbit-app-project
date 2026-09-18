import crypto from "crypto";

const WORDS = ["fern", "cedar", "moss", "quartz", "birch", "coral", "amber", "slate", "willow", "clover", "basil", "ember"];

export function generateTempPassword(): string {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghjkmnpqrstuvwxyz";
  const rand = (n: number) => crypto.randomInt(n);
  const prefix = letters[rand(letters.length)] + lower[rand(lower.length)] + String(rand(10));
  const word = WORDS[rand(WORDS.length)];
  const suffix = String(10 + rand(90));
  return `${prefix}-${word}-${suffix}`;
}

export function generateUserId(name: string, domain: string): string {
  const local = name.trim().split(/\s+/)[0].toLowerCase().replace(/[^a-z]/g, "") || "user";
  const workspaceHandle = domain.split(".")[0];
  return `${local}@${workspaceHandle}`;
}
