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
  BaseSelectMenuBuilder,
  InviteGuild,
} = require("discord.js");
const { determineHandRanking } = require("./evaluation");

let registeredUsers = [];

exports.gameStart = (interaction, client) => {
  var game = {};
  game = newGame(interaction, game);
  const collector = interaction.channel.createMessageComponentCollector();
  collector.on("collect", async (i) => {
    switch (i.customId) {
      case "JOIN":
        addPlayer(i, interaction, game);
        break;
      case "LEAVE":
        removePlayer(i, interaction, game, true);
        break;
      case "START":
        if (i.user.id == game.gameid && game.members.length >= 2) {
          newRound(i, interaction, game, client);
        } else if (i.user.id != game.gameid) {
          var embed = new EmbedBuilder()
            .setColor("Red")
            .setTitle("Error")
            .addFields({
              name: "Poker Game",
              value: "Only the creator of a game can start it",
              inline: true,
            });
          i.reply({ embeds: [embed], ephemeral: true });
        } else {
          var embed = new EmbedBuilder()
            .setColor("Red")
            .setTitle("Error")
            .addFields({
              name: "Poker Game",
              value: "You need at least two players to play",
              inline: true,
            });
          i.reply({ embeds: [embed], ephemeral: true });
        }
        break;
      case "FOLD":
        setBet(i, game, 0, "Fold", client, interaction);
        break;
      case "RAISE":
        for (const member of game.members) {
          if (i.user.id == member.memberid) {
            sendHand(i, member, game, true);
          }
        }
        break;
      case "CHECK":
        setBet(i, game, game.highestbet, "Check", client, interaction);

        break;
      case "1":
        setBet(
          i,
          game,
          parseInt(i.customId) + parseInt(game.highestbet),
          "Raised by " + i.customId + "$",
          client,
          interaction
        );
        break;
      case "5":
        setBet(
          i,
          game,
          parseInt(i.customId) + parseInt(game.highestbet),
          "Raised by " + i.customId + "$",
          client,
          interaction
        );

        break;
      case "10":
        setBet(
          i,
          game,
          parseInt(i.customId) + parseInt(game.highestbet),
          "Raised by " + i.customId + "$",
          client,
          interaction
        );
        break;
      case "50":
        setBet(
          i,
          game,
          parseInt(i.customId) + parseInt(game.highestbet),
          "Raised by " + i.customId + "$",
          client,
          interaction
        );
        break;
      case "BACK":
        for (const member of game.members) {
          if (i.user.id == member.memberid) {
            sendHand(i, member, game, false);
          }
        }
        break;
        case "ALLIN":
          setBet(
            i,
            game,
            0,
            "ALLIN",
            client,
            interaction
          );
        break
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
      bet: 0,
      turn: true,
      action: "Waiting",
      evaluation: evaluateHand(hand, table),
      balance: 100,
      lastbalance: 100,
    };
    members.push(member);
    var game = {
      gameid: gameid,
      members: members,
      deck: deck,
      table: table,
      status: 0,
      pot: parseInt(0),
      highestbet: 0,
      startinteraction: 0,
      firsthands: true,
    };
    i = undefined;
    updateStartMessage(i, interaction, game);
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
      bet: 0,
      turn: false,
      action: "Waiting",
      evaluation: evaluateHand(hand, game.table),
      balance: 100,
      lastbalance: 100,
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

function removePlayer(i, interaction, game, pregame) {
  var joined = false;

  var embed;
  for (const member of game.members) {
    if (member.id == i.user.id) {
      joined = true;
    }
  }
  if (game.gameid == i.user.id && pregame) {
    embed = new EmbedBuilder().setColor("Red").setTitle("Error").addFields({
      name: "Poker Game",
      value: "You can't leave a game you created!",
      inline: false,
    });
  } else if (!joined) {
    searchValue = i.user.id;
    game.members = game.members.filter((obj) => obj.memberid !== searchValue);
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
  if(pregame){
  updateStartMessage(i, interaction, game);
  }
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

  if (i != undefined) {
    i.replied = false;
    i.update({
      embeds: [embed],
      ephemeral: false,
      components: [Buttons],
    });
    i.replied = true;
  } else {
    interaction.reply({
      embeds: [embed],
      ephemeral: false,
      components: [Buttons],
    });
  }
}
function newRound(i, interaction, game, client) {
  game.status++;
  if (game.status == 5) {
    endGame(i, interaction, game);
    return;
  }
  if (game.status == 1) {
    game.startinteraction = i;
  }
  game.highestbet = 0;
  for (const member of game.members) {
    member.bet = 0;
    member.action = "waiting";
    member.turn = false;
    member.lastbalance = member.balance;
  }
  game.members[0].turn = true;
  var usernames = "";
  var cards = "";
  for (const member of game.members) {
    if (member.turn) {
      usernames += "**" + member.username + "**" + ": " + member.action + "\n";
    } else {
      usernames += member.username + ": " + member.action + "\n";
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
        inline: false,
      },
      {
        name: "Cards:",
        value: cards,
        inline: false,
      },
      {
        name: "Pot: ",
        value: game.pot + "$",
        inline: false,
      }
    );

  if (game.status == 1) {
    game.startinteraction.update({
      embeds: [embed],
      ephemeral: false,
      components: [],
    });
    for (member of game.members) {
      sendHand(i, member, game, false);
    }
    game.firsthands = false;
  } else {
    game.startinteraction.editReply({
      embeds: [embed],
      ephemeral: false,
      components: [],
    });
  }
}

function sendHand(i, member, game, raiseOptions) {
  const embed = new EmbedBuilder()
    .setColor("White")
    .setTitle("Your hand")
    .addFields(
      {
        name: "Your Hand",
        value: member.hand.card1 + member.hand.card2,
        inline: false,
      },
      {
        name: "Last Action",
        value: member.action,
        inline: false,
      },
      {
        name: "Your Balance",
        value: member.balance + "$",
      }
    );
  let normalButtons = new ActionRowBuilder().addComponents(
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
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("ALLIN")
      .setLabel("All In!")
      .setStyle(ButtonStyle.Primary)
  );
  let raiseButtons = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("BACK")
      .setLabel("Back")
      .setStyle(ButtonStyle.Primary),
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
  var Buttons;
  if (raiseOptions) {
    Buttons = raiseButtons;
  } else {
    Buttons = normalButtons;
  }
  if (game.firsthands) {
    member.interaction.followUp({
      embeds: [embed],
      ephemeral: true,
      components: [Buttons],
    });
  } else {
    i.update({
      embeds: [embed],
      ephemeral: true,
      components: [Buttons],
    });
  }
}

function setBet(i, game, bet, action, client, interaction) {
  var turn = false;
  var allin = false;
  for (const member of game.members) {
    if (i.user.id == member.memberid && member.turn) {
      turn = true;
    }
  }
  if (turn) {
    for (const member of game.members) {
      if (i.user.id == member.memberid) {
        if (bet >= member.lastbalance && action != "ALLIN") {
          const embed = new EmbedBuilder()
            .setColor("Red")
            .setTitle("Money")
            .addFields({
              name: "Poker Game",
              value: "You have not enough money",
              inline: false,
            });
            i.reply({
              embeds: [embed],
              ephemeral: true
            })
            return;
        }
        if(action == "Fold"){
          console.log("works");
          removePlayer(i, interaction, game, false);
          if(game.members.length == 1){
            endGame(i, interaction, game);
          }
          return;
        }
        const index = game.members.indexOf(member);
        game.members[index].turn = false;
        const nextIndex = (index + 1) % game.members.length;
        game.members[nextIndex].turn = true;
        member.action = action;
        if(action == "ALLIN"){
          bet = member.lastbalance;
          allin = true;
        }
        member.balance = member.lastbalance - bet;
        member.bet = bet;
        game.pot = parseInt(bet) + parseInt(game.pot);

        sendHand(i, member, game, false);
      }
      if (bet > game.highestbet) {
        game.highestbet = bet;
      }
      var usernames = "";
      var cards = "";
      for (const member of game.members) {
        if (member.turn) {
          usernames +=
            "**" + member.username + "**" + ": " + member.action + "\n";
        } else {
          usernames += member.username + ": " + member.action + "\n";
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
            inline: false,
          },
          {
            name: "Cards:",
            value: cards,
            inline: false,
          },
          {
            name: "Pot: ",
            value: game.pot + "$",
            inline: false,
          }
        );
      game.startinteraction.editReply({
        embeds: [embed],
        components: [],
      });
      compareBet(i, interaction, game, client, allin);
    }
  } else if (!turn) {
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

function compareBet(i, interaction, game, client, allin) {
  var complete = true;
  
  for (const member of game.members) {
    if (member.bet != game.highestbet || member.action == "waiting") {
      complete = false;
    }
  }
  if (complete) {
    if(allin){
      game.status = 4;
    }
    newRound(i, interaction, game, client);
  }
}

function endGame(i, interaction, game) {
  var highestevaluation = game.members.reduce((prev, current) => {
    if (prev.length === 0) return [current];
    if (prev[0].evaluation > current.evaluation) return prev;
    if (prev[0].evaluation < current.evaluation) return [current];
    return [...prev, current];
  }, []);
  var winners = highestevaluation.map((member) => member.username).join(" ");
  var win = game.pot/highestevaluation.length;
  const embed = new EmbedBuilder()
    .setColor("Green")
    .setTitle("Winner")
    .addFields(
      {
        name: "Poker Game",
        value: `Congrats: ${winners} + ${win}$  won the game!!!`,
        inline: false,
      },
      {
        name: "Table",
        value:
          game.table.card1 +
          game.table.card2 +
          game.table.card3 +
          game.table.card4 +
          game.table.card5,
        inline: false,
      },
      {
        name: "Cards",
        value: game.members
          .map((member) => {
            return {
              username: member.username,
              card1: member.hand.card1,
              card2: member.hand.card2,
            };
          })
          .map((memberData) => {
            return `${memberData.username}:  ${memberData.card1} ${memberData.card2}\n`;
          })
          .join(" "),
        inline: false,
      }
    );
  game.startinteraction.followUp({
    embeds: [embed],
    components: [],
  });
  registeredUsers = [];
  game = {};
}

function evaluateHand(hand, table) {
  let result = determineHandRanking(hand, table);
  result = result.map((number) => {
    return number < 10 ? "0" + number : number;
  });
  result = result.join("");
  return result;
}