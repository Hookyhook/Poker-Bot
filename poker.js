const {
  REST,
  Routes,
  Embed,
  EmbedBuilder,
  channelLink,
  ReactionUserManager,
  InteractionCollector,
  ApplicationCommandOptionType,
  moveElementInArray,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Events,
  Collector,
  Collection,
} = require("discord.js");

var games = [];

exports.gameStart = (interaction) => {
  return newGame(interaction);
};

function newGame(interaction) {
  if (searchGame(interaction) == undefined) {
    var deck = createDeck();
    var table = createTable(deck);
    var gameid = interaction.user.id;
    var members = [];
    var member = {username: interaction.user.username ,memberid: interaction.user.id, hand: dealHand(deck) };
    members.push(member);
    var game = {
      gameid: gameid,
      members: members,
      deck: deck,
      table: table,
    };
    games.push(game);
    const embed = new EmbedBuilder()
      .setColor("Black")
      .setTitle("New Game")
      .addFields(
          {
              name: "WOW a new POKER GAME!",
              value: "@here",
              inline: false,
        },
        {
          name: "Players Joined:",
          value: interaction.user.username,
          inline: false,
        }
      );
    let Buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("JOIN")
        .setLabel("Join!")
        .setStyle(ButtonStyle.Primary)
    );
    interaction.reply({
      embeds: [embed],
      ephemeral: false,
      components: [Buttons],
    });
  } else {
    const embed = new EmbedBuilder()
      .setColor("Red")
      .setTitle("Error")
      .addFields({
        name: "Channel Error",
        value:
          "You already created a game that is still active!!! Finish it before you start a new one!",
        inline: true,
      });
    interaction.reply({ embeds: [embed], ephemeral: false });
    }
    const collector = interaction.channel.createMessageComponentCollector();

    collector.on("collect", async i => {
        
        if (i.user.id !== interaction.user.id) {
            return;
        }
        if (i.message.interaction.id !== interaction.id) {
            return
        }
        if (i.customId === "JOIN") {
            addPlayer(i, interaction);
            collector.stop();
        }
    });
    collector.on('end', collected => console.log(`Collected ${collected.size} items`));
}

function createDeck() {
  var d = [];
  var colors = [":diamonds:", ":clubs:", ":spades:", ":hearts:"];
  var numbers = [
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "J",
    "Q",
    "K",
    "A",
  ];
  for (const color of colors) {
    for (const number of numbers) {
      d.push(color + " " + number);
    }
  }
  for (let index = 0; index < 1000; index++) {
    d.sort((a, b) => 0.5 - Math.random());
  }
  return d;
}

function createTable(d) {
  return {
    card1: d.pop(),
    card2: d.pop(),
    card3: d.pop(),
    card4: d.pop(),
    card5: d.pop(),
  };
}

function dealHand(d) {
  return { card1: d.pop(), card2: d.pop() };
}

function addPlayer(i, interaction) {
    var game = searchGame(interaction);
    game.members.push({ username: i.user.username ,meberid: i.user.id, hand: dealHand(game.deck) });
    var usernames = "";
    for (const member of game.members) {
        usernames += member.username + "\n";
    }
    const embed = new EmbedBuilder()
      .setColor("Black")
      .setTitle("New Game")
      .addFields(
          {
              name: "WOW a new POKER GAME!",
              value: "@here",
              inline: false,
        },
        {
          name: "Players Joined:",
          value: usernames,
          inline: false,
        }
      );
    let Buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("JOIN")
        .setLabel("Join!")
        .setStyle(ButtonStyle.Primary)
    );
    interaction.editReply({
      embeds: [embed],
      ephemeral: false,
      components: [Buttons],
    })
    const collector = interaction.channel.createMessageComponentCollector();
    collector.on("collect", async i => {
        
        if (i.user.id !== interaction.user.id) {
            return;
        }
        if (i.message.interaction.id !== interaction.id) {
            return
        }
        if (i.customId === "JOIN") {
            addPlayer(i, interaction);
            collector.stop();
        }
    });
    collector.on('end', collected => console.log(`Collected ${collected.size} items`));
}

function searchGame(interaction) {
  var searchCriteria = { gameid: interaction.user.id };

  var foundGame = games.find((obj) => {
    return Object.entries(searchCriteria).every(([key, value]) => {
      return obj.hasOwnProperty(key) && obj[key] === value;
    });
  });
  return foundGame;
}
