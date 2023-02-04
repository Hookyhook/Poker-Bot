//This is the discord token for the bot it is not public so it is empty
const token =
  "";
const applicationID = "1066714504953593886";

//Importing needed parts of the discord api
const {
  REST,
  Routes,
} = require("discord.js");

//Importing the poker game
const poker = require("./poker");

//Defining the game commands
const commands = [
  {
    name: "startgame",
    description: "Starts a Game of Poker",
  },
];

//Needed actions to start up and login as an registered Discord bot
const rest = new REST({ version: "10" }).setToken(token);

(async () => {
  try {
    console.log("Started refreshing application (/) commands.");

    await rest.put(Routes.applicationCommands(applicationID), {
      body: commands,
    });

    console.log("Successfully reloaded application (/) commands.");
  } catch (error) {
    console.error(error);
  }
})();
const { Client, GatewayIntentBits } = require("discord.js");
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "startgame") {
    poker.gameStart(interaction, client);
  }
});
client.login(token);
