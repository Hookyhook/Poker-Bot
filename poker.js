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
  ThreadMemberFlagsBitField,
} = require("discord.js");
const { determineHandRanking } = require("./evaluation");

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
        setBet(i, game, 0, "Fold", client, interaction);
        break;
      case "RAISE":
        raiseOptions(i, interaction, game, client, interaction);

        break;
      case "CHECK":
        setBet(i, game, game.highestbet, "Check", client, interaction);

        break;
      case "1":
        setBet(i, game, (i.customId+game.highestbet), "Raised by " + i.customId+"$", client, interaction);
        break;
      case "5":
        setBet(i, game, (i.customId+game.highestbet), "Raised by " + i.customId+"$", client, interaction);

        break;
      case "10":
        setBet(i, game, (i.customId+game.highestbet), "Raised by " + i.customId+"$", client, interaction);
        break;
      case "50":
        setBet(i, game, (i.customId+game.highestbet), "Raised by " + i.customId+"$", client, interaction);
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
    var hand = dealHand(deck); 
    var member = {
      username: interaction.user.username,
      memberid: interaction.user.id,
      hand: hand,
      interaction: interaction,
      bet: -1,
      turn: true,
      action: "Waiting",
      evaluation: determineHandRanking(hand, table).join('')
    };
    members.push(member);
    var game = {
      gameid: gameid,
      members: members,
      deck: deck,
      table: table,
      status: 0,
      pot: 0,
      highestbet: 0,
      startinteraction: 0,
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
  var hand = dealHand(game.deck);
  if (!joined) {
    game.members.push({
      username: i.user.username,
      memberid: i.user.id,
      hand: hand,
      interaction: i,
      bet: -1,
      turn: false,
      action: "Waiting",
      evaluation: determineHandRanking(hand, game.table).join('') 
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
  console.log(game);
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
    usernames += member.username + ": " + member.action + "\n";
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
  game.status++;
  if (game.status == 1) {
    game.startinteraction = i;
  }
  game.highestbet = 0;
  for (const member of game.members) {
    member.bet = -1;
    member.action = "waiting";
  }
  var usernames = "";
  var cards = "";
  for (const member of game.members) {
    if (member.turn) {
      usernames += "**"+member.username+"**" + ": "+member.action+"\n";
    }else{
      usernames += member.username +  ": "+member.action+"\n";
    }
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
        name: "Round:",
        value: game.status + " ",
        inline: false
      },
      {
        name: "Cards:",
        value: cards,
        inline: false,
      },
      {
        name: "Pot: ",
        value: game.pot +"$",
        inline: false
      }
    );

  if (game.status == 1) {
    game.startinteraction.update({
      embeds: [embed],
      ephemeral: false,
      components: [],
    });
    sendHand(i, interaction, game, client);
  } else {
    game.startinteraction.editReply({
      embeds: [embed],
      ephemeral: false,
      components: [],
    });
  }
}

function sendHand(i, interaction, game, client) {
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
      .setLabel("1$")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("5")
      .setLabel("5$")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("10")
      .setLabel("10$")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("50")
      .setLabel("50$")
      .setStyle(ButtonStyle.Primary)
  );
  i.reply({
    embeds: [embed],
    components: [Buttons],
    ephemeral: true,
  });
}

function setBet(i, game, bet, action, client, interaction) {
  var turn = false;
  for (const member of game.members) {
    if (i.user.id == member.memberid && member.turn) {
      turn = true;
    }
  }
  if (turn) {
    for (const member of game.members) {
      if (i.user.id == member.memberid) {
        const index = game.members.indexOf(member);
        game.members[index].turn = false;
        const nextIndex = (index + 1) % game.members.length;
        game.members[nextIndex].turn = true;
        member.action = action;
        member.bet = bet;
        game.pot = (parseInt(bet)+parseInt(game.pot))/10;
      }
      if (bet > game.highestbet) {
        game.highestbet = bet;
      }
      var usernames = "";
      var cards = "";
      for (const member of game.members) {
        if (member.turn) {
          usernames += "**"+member.username+"**" + ": "+member.action+"\n";
        }else{
          usernames += member.username +  ": "+member.action+"\n";
        }
      }
      if (game.status == 1) {
        for (let index = 0; index < 5; index++) {
          cards += ":white_large_square:" + " ";
        }
      } else {
        cards =
          game.table.card1 +
          " " +
          game.table.card2 +
          " " +
          game.table.card3 +
          " ";
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
      var embed = new EmbedBuilder()
        .setColor("Black")
        .setTitle("Game Started")
        .addFields(
          {
            name: "Players:",
            value: usernames,
            inline: false,
          },
          {
            name: "Round:",
            value: game.status + " ",
            inline: false
          },
          {
            name: "Cards:",
            value: cards,
            inline: false,
          },
          {
            name: "Pot: ",
            value: game.pot +"$",
            inline: false
          }
      );
      game.startinteraction.editReply({
        embeds: [embed],
        components: [],
      });
      compareBet(i, interaction, game, client);
    }
  } else if(!turn){
    const embed = new EmbedBuilder()
      .setColor("Red")
      .setTitle("Error")
      .addFields({
        name: "Poker Game",
        value: "It is not you turn!!! please wait",
        inline: false,
      });
    i.reply({
      embeds: [embed],
      ephemeral: true,
      components: [],
    });
  }
}

function compareBet(i, interaction, game, client) {
  var complete = true;
  for (const member of game.members) {
    if (member.bet != game.highestbet) {
      complete = false;
    }
  }
  if (complete) {
    newRound(i, interaction, game, client);
  }
}

