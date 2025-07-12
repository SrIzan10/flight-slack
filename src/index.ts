import { PrismaClient } from "@prisma/client";
import BunCache from "@samocodes/bun-cache";
import { App } from "@slack/bolt";
import ky from "ky";
import { getOpenskyToken } from "./util/openskyToken";

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
});

export const db = new PrismaClient();
export const cache = new BunCache();

const now = Math.floor(Date.now() / 1000);
const flights = await ky.get(`https://opensky-network.org/api/flights/departure?airport=LEMG&begin=${now - 3600}&end=${now}`, {
  headers: {
    'Authorization': `Bearer ${await getOpenskyToken()}`,
  }
}).json();
console.log("Fetched flights:", flights);

await app.start();
console.log("We're up and running :)");
