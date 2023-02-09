//Importing required parts of the discord.js
const { EmbedBuilder } = require("discord.js");
//Giving Infos about the bot
exports.info = (interaction) => {
    //Defining the message
    var embed = new EmbedBuilder()
        .setColor("Green")
        .setTitle("Info")
        .addFields({
            name: "Poker Bot",
            value:
                "This bot makes it possible for Discord users to play together. It is developed by Hookyhook",
            inline: true,
        });
    interaction.reply({ embeds: [embed] });
};
exports.tutorial = (interaction) => {
    //Defining the message
    var embed = new EmbedBuilder()
        .setColor("Green")
        .setTitle("Tutorial")
        .addFields(
            {
                name: "Poker Bot",
                value:
                    "You can start the game with the comman /startgame. After this your friends can join your game and when you are all together you can begin the game",
                inline: true,
            },
            {
                name: "Ingame",
                value:
                    "After the start you will get your hand and with some extra information like your currency. Round by round now more cards will be revealed",
                inline: true,
            },
            {
                name: "Betting",
                value:
                    "In the game you are betting with your friends who wins. With CHECK you agree to the current bet. With RAISE you can add to the current bet a certain amount. With ALLIN you can bet all your money and force you friends to do the same. With FOLD you just leave the game",
                inline: true,
            }
        );
    interaction.reply({ embeds: [embed] });
};
