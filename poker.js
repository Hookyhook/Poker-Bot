//Importing all needed parts of the Discord API
const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
//Importing the evaluation system
const { determineHandRanking } = require("./evaluation");
//Importing the pm2 module used to restart the bot as it is running on a server with pm2
const pm2 = require("pm2");
//Global variables
let registeredUsers = [];
var game = {};
//The exported function that is called when the command is issued in Discord
exports.gameStart = (interaction, client) => {
  //Creates a new game
  newGame(interaction);
  //The collector get's all interactions that are used in the discord chat
  const collector = interaction.channel.createMessageComponentCollector();

  collector.on("collect", async (i) => {
    //The switch starts the functions according to Id of the clicked button
    switch (i.customId) {
      case "JOIN":
        addPlayer(i, interaction);
        break;
      case "LEAVE":
        removePlayer(i, interaction, true);
        break;
      case "START":
        /*
         * The new round is only triggered if there are at least two players
         * and the gameid is the id of the user who clicked the button
         * because the gameid is the userid of the user who created the game
         */
        if (i.user.id == game.gameid && game.members.length >= 2) {
          newRound(i, interaction, client);
        } else if (i.user.id != game.gameid) {
          //If the user has not created the game an error message is send privat
          var embed = new EmbedBuilder()
            .setColor("Red")
            .setTitle("Error")
            .addFields({
              name: "Poker Game",
              value: "Only the creator of a game can start it",
              inline: true,
            });
          //empheral: true let only the user that the message is sent to see the message
          i.reply({ embeds: [embed], ephemeral: true });
        } else {
          //If there are not more than one player an error message is send privat
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
      //The following interactions are for the ingame poker calls like FOLD, CHECK etc.
      case "FOLD":
        setBet(i, 0, "Fold", client, interaction);
        break;
      case "RAISE":
        for (const member of game.members) {
          if (i.user.id == member.memberid) {
            sendHand(i, member, true);
          }
        }
        break;
      case "CHECK":
        setBet(i, game.highestbet, "Check", client, interaction);

        break;
      case "1":
        setBet(
          i,
          parseInt(i.customId) + parseInt(game.highestbet),
          "Raised by " + i.customId + "$",
          client,
          interaction
        );
        break;
      case "5":
        setBet(
          i,

          parseInt(i.customId) + parseInt(game.highestbet),
          "Raised by " + i.customId + "$",
          client,
          interaction
        );

        break;
      case "10":
        setBet(
          i,

          parseInt(i.customId) + parseInt(game.highestbet),
          "Raised by " + i.customId + "$",
          client,
          interaction
        );
        break;
      case "50":
        setBet(
          i,

          parseInt(i.customId) + parseInt(game.highestbet),
          "Raised by " + i.customId + "$",
          client,
          interaction
        );
        break;
      case "BACK":
        for (const member of game.members) {
          if (i.user.id == member.memberid) {
            sendHand(i, member, false);
          }
        }
        break;
      case "ALLIN":
        setBet(
          i,

          0,
          "ALLIN",
          client,
          interaction
        );
        break;
    }
  });
};
/*
*This function is called the create a new game! 
*/
function newGame(interaction) {
  //Checks whether the player already joined the game
  if (!checkforPlayer(interaction)) {
    //Creates a whole card deck
    var deck = createDeck();
    //Take out 5 cards
    var table = createTable(deck);
    //Setting the gameid to the userdi
    var gameid = interaction.user.id;
    var members = [];
    //Dealing the hand
    var hand = dealHand(deck);
    //Creating the user with all properties
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
    //Creates the final game with all properties
    game = {
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
    //Sends the first message
    i = undefined;
    updateStartMessage(i, interaction);
    //Push the user to the registered user array that holds all players who play a poker game
    registeredUsers.push(interaction.user.id);
  } else {
    //If there is already a game of the user an error is send
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
//Creates the poker deck
function createDeck() {
  var d = [];
  //All colors
  var colors = [":diamonds:", ":clubs:", ":spades:", ":hearts:"];
  //All numbers
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
  //Pushing to the deck all cards by combining every color with every number
  for (const color of colors) {
    for (const number of numbers) {
      d.push(color + " " + number);
    }
  }
  //Mixing this deck 1000 times over a shuffle algorithm
  for (let index = 0; index < 1000; index++) {
    d.sort(() => 0.5 - Math.random());
  }
  return d;
}
//Taking 5 cards out and return it in an object
function createTable(d) {
  return {
    card1: d.pop(),
    card2: d.pop(),
    card3: d.pop(),
    card4: d.pop(),
    card5: d.pop(),
  };
}
//Taking 2 cards out and return it in an object
function dealHand(d) {
  return { card1: d.pop(), card2: d.pop() };
}
//Add a Player
function addPlayer(i, interaction) {
  var joined = false;
  //Checks whether the player already joined
  for (const member of game.members) {
    if (i.user.id == member.memberid) {
      joined = true;
    }
  }
  var hand = dealHand(game.deck);
  //Creating the user with all attributes
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
    // Updating the start message with the new player
    updateStartMessage(i, interaction);
  } else {
    //Sends an error if the user already joined
    var embed = new EmbedBuilder().setColor("Red").setTitle("Error").addFields({
      name: "Poker Game",
      value: "You already joined that game!",
      inline: false,
    });
    updateStartMessage(i, interaction);
    i.followUp({
      embeds: [embed],
      ephemeral: true,
      components: [],
    });
  }
}

//Checks whether a player is already registered in the registeredUser array
function checkforPlayer(interaction) {
  var joined = false;
  for (const player of registeredUsers) {
    if (player == interaction.user.id) {
      joined = true;
    }
  }
  return joined;
}
//Removes a player from the gam
function removePlayer(i, interaction, pregame) {
  
  var joined = false;
  var embed;
  //Checks whether the player is in the game
  for (const member of game.members) {
    if (member.id == i.user.id) {
      joined = true;
    }
  }
  /**
   * If the player is already in the game an error is send
   */
  if (game.gameid == i.user.id && pregame) {
    embed = new EmbedBuilder().setColor("Red").setTitle("Error").addFields({
      name: "Poker Game",
      value: "You can't leave a game you created!",
      inline: false,
    });
  } else if (!joined) {
    //The array is filtered for every object that is not that player so he is removed
    searchValue = i.user.id;
    game.members = game.members.filter((obj) => obj.memberid !== searchValue);
    //Than a confirmation is send
    embed = new EmbedBuilder()
      .setColor("Red")
      .setTitle("You left the game")
      .addFields({
        name: "Poker Game",
        value: "You left the game!",
        inline: false,
      });
  } else {
    //If the player not even joined the game an error is send
    embed = new EmbedBuilder().setColor("Red").setTitle("Error").addFields({
      name: "Poker Game",
      value: "You can'not leave a game you did never join!",
      inline: false,
    });
  }
  if (pregame) {
    //If the game is still in the pregame the StartMessage is updated
    updateStartMessage(i, interaction);
  }
  //The embed is send
  i.followUp({
    embeds: [embed],
    ephemeral: true,
    components: [],
  });
}
//The start message is updated
function updateStartMessage(i, interaction) {
  //A string username is pushed with all game members and their last move
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
  //This are the buttons of the startmessage
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
/**
 * If i is defined the message answers to it else the message answers to the interaction
 * The difference is that i is an interaction triggered by a button the interaction
 * ist the interaction of the command /startgame
 */
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
//This function starts a new round
function newRound(i, interaction, client) {
  //The round is counted up
  game.status++;
  //If the round is 5 the game is finished and endGame is triggered
  if (game.status == 5) {
    endGame(i, interaction);
    return;
  }
  //If game.status is 1 the current interaction is saved because it is user later
  if (game.status == 1) {
    game.startinteraction = i;
  }
  //All values of the rounds before are resetted
  game.highestbet = 0;
  for (const member of game.members) {
    member.bet = 0;
    member.action = "waiting";
    member.turn = false;
    member.lastbalance = member.balance;
  }
  game.members[0].turn = true;
  //The cards string and username string are filled with the users and the cards on the table
  var usernames = "";
  var cards = "";
  for (const member of game.members) {
    if (member.turn) {
      usernames += "**" + member.username + "**" + ": " + member.action + "\n";
    } else {
      usernames += member.username + ": " + member.action + "\n";
    }
  }
  //According to the round the number of card is shown the rest is filled up with white squares
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
  //The game message is prepared
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
//In the first round the origin start message is updated after this the game messages is edited
  if (game.status == 1) {
    game.startinteraction.update({
      embeds: [embed],
      ephemeral: false,
      components: [],
    });
    for (member of game.members) {
      sendHand(i, member, false);
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

//This sends the hand
function sendHand(i, member, raiseOptions) {
  //The embed with the cards and the balance is prepared
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
  //If the user clicked on raise a new sets of buttons is prepared with the raise Options (1$ etc)
  var Buttons;
  if (raiseOptions) {
    Buttons = raiseButtons;
  } else {
    Buttons = normalButtons;
  }
  //If it is the first time the hand is send it is send as a Follow Up after this it is updated
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
//The bet is set
function setBet(i, bet, action, client, interaction) {
  var turn = false;
  var allin = false;
  //This checks whether the user how clicked the buttons is on the turn
  for (const member of game.members) {
    if (i.user.id == member.memberid && member.turn) {
      turn = true;
    }
  }
  if (turn) {
    for (const member of game.members) {
      if (i.user.id == member.memberid) {
        /**
         * If the bet is higher than the money before the round and
         * the user is not ALL IN an error is send
         */
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
            ephemeral: true,
          });
          return;
        }
        /*If the player folds he is removed from the game and the
        *function returns
        */
        if (action == "Fold") {
          removePlayer(i, interaction, false);
          if (game.members.length == 1) {
            endGame(i, interaction);
          }
          return;
        }
        //The turn attribut of the next member is set to true
        const index = game.members.indexOf(member);
        game.members[index].turn = false;
        const nextIndex = (index + 1) % game.members.length;
        game.members[nextIndex].turn = true;
        
        member.action = action;
        //If somebody goes allin the bet is set to the ballance
        if (action == "ALLIN") {
          bet = member.lastbalance;
          allin = true;
        }
        //The bet is removed from the balance and the pot is updated
        member.balance = member.lastbalance - bet;
        member.bet = bet;
        game.pot = parseInt(bet) + parseInt(game.pot);
        //The hand with then updated balance is send
        sendHand(i, member, false);
      }
      //If the bet is a raise the new Highest Bet is send
      if (bet > game.highestbet) {
        game.highestbet = bet;
      }
      //The game message is updated
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
      //The compare bet method is triggered
      compareBet(i, interaction, client, allin);
    }
  } else if (!turn) {
    //If it is not the user's turn an error is send
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
//If all players have the same bet so agree the next round is triggered
function compareBet(i, interaction, client, allin) {
  var complete = true;

  for (const member of game.members) {
    if (member.bet != game.highestbet || member.action == "waiting") {
      complete = false;
    }
  }
  if (complete) {
    if (allin) {
      game.status = 4;
    }
    newRound(i, interaction, client);
  }
}
//This function ends the game
async function endGame(i, interaction) {
  //The players who have the highest evaluation are determined
  var highestevaluation = game.members.reduce((prev, current) => {
    if (prev.length === 0) return [current];
    if (prev[0].evaluation > current.evaluation) return prev;
    if (prev[0].evaluation < current.evaluation) return [current];
    return [...prev, current];
  }, []);
  //The winners are set to a String together
  var winners = highestevaluation.map((member) => member.username).join(" ");
  var win = game.pot / highestevaluation.length;
  //The end message is send
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
  await game.startinteraction.followUp({
    embeds: [embed],
    components: [],
  });
  //The bot is completely restarted via the pm2 api to reset all vars
  pm2.restart("pokerbot", (err) => {
    if (err) throw err;

    console.log("Bot restarted successfully");
  });
}

//The evaluation is prepared to be used in game and to be compared
function evaluateHand(hand, table) {
  let result = determineHandRanking(hand, table);
  result = result.map((number) => {
    return number < 10 ? "0" + number : number;
  });
  result = result.join("");
  return result;
}
