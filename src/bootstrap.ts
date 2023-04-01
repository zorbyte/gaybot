import d from "debug";
import { Client, Events, GatewayIntentBits } from "discord.js";
import { Container } from "typedi";

import { initDB } from "./init_db.js";

const debug = d("gaybot");

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

Container.set(Client, client);

client.on(Events.ClientReady, () => {
  debug("this is hell");
  console.log("This is hell.");
});

export async function bootstrap() {
  await initDB();
  await client.login(process.env.TOKEN);
}
