const token = "MTA2NjcxNDUwNDk1MzU5Mzg4Ng.GNx_k8.zkmACJAUKSaEe67kpAENPmq2GwYH-yW9vpoVcU";
const applicationID = "1066714504953593886";

const { REST, Routes, Embed, EmbedBuilder, channelLink, ReactionUserManager, InteractionCollector, ApplicationCommandOptionType, moveElementInArray } = require('discord.js');

const poker = require("./poker");

const commands = [
  {
    name: "startgame",
    description:"Starts a Game of Poker"
  }
];

//
const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  try {
    console.log('Started refreshing application (/) commands.');

    await rest.put(Routes.applicationCommands(applicationID), { body: commands });

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
})();
const { Client, GatewayIntentBits } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds,GatewayIntentBits.GuildMessages,GatewayIntentBits.MessageContent] });




client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "startgame") {
    var table = poker.gameStart();
    const embed = new EmbedBuilder()
            .setColor('Grey')
            .setTitle("New Game")
            .addFields(
                {
                    name: "The cards on the table are:",
                    value: table.card1+ " "+table.card2+" "+table.card3,
                    inline: true,
                }
            );
            interaction.reply({ embeds: [embed], ephemeral: true});
  }



}) 
client.login(token);