import { PrismaClient } from "@prisma/client";
import { readFile } from "fs/promises";

const db = new PrismaClient();

const accountsJson = JSON.parse(await readFile('accounts.json', "utf-8")) as Record<string, Account>;

const accounts = Object.entries(accountsJson).map(([email, account]) => ({
  email,
  password: account.password,
  key: account.access_key,
}));

await db.asAccount.createMany({
  data: accounts,
})

await db.$disconnect();

console.log(`Imported ${accounts.length} accounts.`);

interface Account {
  password: string;
  access_key: string;
}