import { App } from "@slack/bolt";

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
});

const db = new Keyv(
  new KeyvSqlite({
    uri: "db.sqlite",
  })
);

await app.start();
console.log("We're up and running :)");
