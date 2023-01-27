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

let registeredUsers = [];

exports.gameStart = (interaction) => {
  var game;

  game = newGame(interaction, game);
  const collector = interaction.channel.createMessageComponentCollector();
  collector.on("collect", async (i) => {
    if (i.customId === "JOIN") {
      addPlayer(i, interaction, game);
      console.log(game);
    }
    if (i.customId === "LEAVE") {
     removePlayer(i, interaction, game);
    }
  });
  collector.on("end", (collected) =>
    console.log(`Collected ${collected.size} items`)
  );
};

function newGame(interaction, game) {
  if (!checkforPlayer(interaction)) {
    var deck = createDeck();
    var table = createTable(deck);
    var gameid = interaction.user.id;
    var members = [];
    var member = {
      username: interaction.user.username,
      memberid: interaction.user.id,
      hand: dealHand(deck),
    };
    members.push(member);
    var game = {
      gameid: gameid,
      members: members,
      deck: deck,
      table: table,
    };
    var embed = new EmbedBuilder()
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
        .setCustomId("START")
        .setLabel("Start!")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("JOIN")
        .setLabel("Join!")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("LEAVE")
        .setLabel("Leave!")
        .setStyle(ButtonStyle.Primary)
    );
    interaction.reply({
      embeds: [embed],
      ephemeral: false,
      components: [Buttons],
    });
    registeredUsers.push(interaction.user.id);
    return game;
  } else {
    var embed = new EmbedBuilder().setColor("Red").setTitle("Error").addFields({
      name: "Channel Error",
      value:
        "You already part of a game that is still active!!! Finish it before you start a new one!",
      inline: true,
    });
    interaction.reply({ embeds: [embed], ephemeral: true });
    return;
  }
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

function addPlayer(i, interaction, game) {
  game.members.push({
    username: i.user.username,
    meberid: i.user.id,
    hand: dealHand(game.deck),
  });
  updateStartMessage(i, interaction, game);
}

function checkforPlayer(interaction) {
  var joined = false;
  for (const player of registeredUsers) {
    if (player == interaction.user.id) {
      joined = true;
    }
  }
  return joined;
}

function removePlayer(i, interaction, game) {
  var joined = false;
  
  var embed;
  for (const member of game.members) {
    if ((member.id == i.user.id)) {
      joined = true;
    }
  }
  if (game.gameid == i.user.id) {
    embed = new EmbedBuilder()
    .setColor("Red")
    .setTitle("Error")
    .addFields(
      {
        name: "Poker Game",
        value: "You can'not leave a game you created!",
        inline: false,
      }
    );
  }
  else if (!joined) {
    searchValue = i.user.id;
    game.members.filter((obj) => obj.memberid !== searchValue);
    embed = new EmbedBuilder()
      .setColor("Red")
      .setTitle("You left the game")
      .addFields(
        {
          name: "Poker Game",
          value: "You left the game!",
          inline: false,
        }
      
      );
  } else {
    embed = new EmbedBuilder()
      .setColor("Red")
      .setTitle("Error")
      .addFields(
        {
          name: "Poker Game",
          value: "You can'not leave a game you did never join!",
          inline: false,
        }
      );
  }
  
  updateStartMessage(i, interaction, game);
    i.followUp({
      embeds: [embed],
      ephemeral: true,
      components: [],
    });
}

function updateStartMessage(i, interaction, game){
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
      .setCustomId("START")
      .setLabel("Start!")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("JOIN")
      .setLabel("Join!")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("LEAVE")
      .setLabel("Leave!")
      .setStyle(ButtonStyle.Primary)
  );
  i.replied = false;
  i.update({
    embeds: [embed],
    ephemeral: false,
    components: [Buttons],
  });
  i.replied = true;
}

