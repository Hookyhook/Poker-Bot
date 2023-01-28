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

exports.gameStart = (interaction, client) => {
  var game;

  game = newGame(interaction, game);
  const collector = interaction.channel.createMessageComponentCollector();
  collector.on("collect", async (i) => {
    switch (i.customId) {
      case "JOIN":
        addPlayer(i, interaction, game);
        break;
      case "LEAVE":
        removePlayer(i, interaction, game);
        break;
      case "START":
        newRound(i, interaction, game, client);
        break;
      case "FOLD":
        fold(i, interaction, game);
        break;
      case "CHECK":
        check(i, interaction, game);
        break;
      case "RAISE":
        raiseOptions(i, interaction, game);
        break;
      case "CALL":
        call(i, interaction, game);
        break;
      case "1":
        raise(i, interaction, game, 1);
        break;
      case "5":
        raise(i, interaction, game, 5);
        break;
      case "10":
        raise(i, interaction, game, 10);
        break;
      case "50":
        raise(i, interaction, game, 50);
        break;
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
      interaction: interaction,
      bet: 0,
      turn: false
    };
    members.push(member);
    var game = {
      gameid: gameid,
      members: members,
      deck: deck,
      table: table,
      status: 0,
      pot: 0,
      highestbet: 0
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
  var joined = false;
  for (const member of game.members) {
    if (i.user.id == member.memberid) {
      joined = true;
    }
  }
  if (!joined) {
    game.members.push({
      username: i.user.username,
      meberid: i.user.id,
      hand: dealHand(game.deck),
      interaction: i,
      bet: 0,
      turn: false
    });
    updateStartMessage(i, interaction, game);
  } else {
    var embed = new EmbedBuilder().setColor("Red").setTitle("Error").addFields({
      name: "Poker Game",
      value: "You already joined that game!",
      inline: false,
    });
    updateStartMessage(i, interaction, game);
    i.followUp({
      embeds: [embed],
      ephemeral: true,
      components: [],
    });
  }
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
    if (member.id == i.user.id) {
      joined = true;
    }
  }
  if (game.gameid == i.user.id) {
    embed = new EmbedBuilder().setColor("Red").setTitle("Error").addFields({
      name: "Poker Game",
      value: "You can't leave a game you created!",
      inline: false,
    });
  } else if (!joined) {
    searchValue = i.user.id;
    game.members.filter((obj) => obj.memberid !== searchValue);
    embed = new EmbedBuilder()
      .setColor("Red")
      .setTitle("You left the game")
      .addFields({
        name: "Poker Game",
        value: "You left the game!",
        inline: false,
      });
  } else {
    embed = new EmbedBuilder().setColor("Red").setTitle("Error").addFields({
      name: "Poker Game",
      value: "You can'not leave a game you did never join!",
      inline: false,
    });
  }

  updateStartMessage(i, interaction, game);
  i.followUp({
    embeds: [embed],
    ephemeral: true,
    components: [],
  });
}

function updateStartMessage(i, interaction, game) {
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
function newRound(i, interaction, game, client) {
  game.status = 1;
  game.highestbet = 0;
  var usernames = "";
  var cards = "";
  for (const member of game.members) {
    usernames += member.username + "\n";
  }
  if (game.status == 1) {
    for (let index = 0; index < 5; index++) {
      cards += ":white_large_square:" + " ";
    }
  } else {
    cards =
      game.table.card1 + " " + game.table.card2 + " " + game.table.card3 + " ";
    if (game.status >= 3) {
      cards += game.table.card4 + " ";
      if (game.status == 4) {
        cards += game.table.card5 + " ";
      } else {
        cards += ":white_large_square:" + " ";
      }
    } else {
      cards += ":white_large_square: :white_large_square:" + " ";
    }
  }
  const embed = new EmbedBuilder()
    .setColor("Black")
    .setTitle("Game Started")
    .addFields(
      {
        name: "Players:",
        value: usernames,
        inline: false,
      },
      {
        name: "Cards:",
        value: cards,
        inline: false,
      }
    );
  i.replied = false;
  i.update({
    embeds: [embed],
    ephemeral: false,
    components: [],
  });
  i.replied = true;
  sendHand(i, interaction, game, client);
}

function sendHand(i, interaction, game, client) {
  const channel = client.channels.cache.get(interaction.channelId);
  for (const member of game.members) {
    const embed = new EmbedBuilder()
      .setColor("White")
      .setTitle("Your hand")
      .addFields({
        name: "Your Hand",
        value: member.hand.card1 + member.hand.card2,
        inline: false,
      });
    let Buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("FOLD")
        .setLabel("Fold!")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("CHECK")
        .setLabel("Check!")
        .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
        .setCustomId("CALL")
        .setLabel("Call!")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("RAISE")
        .setLabel("Raise!")
        .setStyle(ButtonStyle.Primary)
    );
    member.interaction.followUp({
      embeds: [embed],
      ephemeral: true,
      components: [Buttons],
      allowedMentions: {
        users: [member.memberid],
      },
    });
  }
}
function fold(i, interaction, game) {
  searchValue = i.user.id;
  game.members.filter((obj) => obj.memberid !== searchValue);
  const embed = new EmbedBuilder()
    .setColor("Red")
    .setTitle("Fold!")
    .addFields({
      name: "Poker Game",
      value: "<@" + i.user.id + "> folded!",
      inline: false,
    });
  i.reply({
    embeds: [embed],
    components: [],
  });
  compareBet(i, game)
}
function raiseOptions(i, interaction, game) {
  const embed = new EmbedBuilder()
    .setColor("Grey")
    .setTitle("Raise!")
    .addFields({
      name: "Poker Game",
      value: "How much do you want to raise?",
      inline: false,
    });
  let Buttons = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("1")
      .setLabel("1")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("5")
      .setLabel("5")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("10")
      .setLabel("10")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("50")
      .setLabel("50")
      .setStyle(ButtonStyle.Primary)
  );
  i.reply({
    embeds: [embed],
    ephemeral: true,
    components: [Buttons],
  });
}
function raise(i, interaction, game, value) { 
  const embed = new EmbedBuilder()
    .setColor("Grey")
    .setTitle("Raise!")
    .addFields({
      name: "Poker Game",
      value: "<@" + i.user.id + "> raised by: "+value,
      inline: false,
    });
  i.reply({
    embeds: [embed],
    components: [],
  });
  setBet(i, game, value);
  compareBet(i, game)
}
function check(i, interaction, game) {
  const embed = new EmbedBuilder()
    .setColor("Grey")
    .setTitle("Call!")
    .addFields({
      name: "Poker Game",
      value: "<@" + i.user.id + "> checked!",
      inline: false,
    });
  i.reply({
    embeds: [embed],
    components: [],
  });
  setBet(i, game, 0);
  compareBet(i, game)
}
function call(i, interaction, game) {
  const embed = new EmbedBuilder()
  .setColor("Grey")
  .setTitle("Call!")
  .addFields({
    name: "Poker Game",
    value: "<@" + i.user.id + "> called!",
    inline: false,
  });
i.reply({
  embeds: [embed],
  components: [],
});
  setBet(i, game, game.highestbet);
  compareBet(i, game)
}

function setBet(i,game, bet) {
  for (const member of game.members) {
    if (i.user.id == member.memberid) {
      member.bet = bet;
    }
  }
}

function compareBet(i, game) {
  var complete = true;
  for (const member of game.members) {
    if (member.bet != game.highestbet) {
      complete = false;
    }
  }
  if (complete) {
    newRound();
  }
}