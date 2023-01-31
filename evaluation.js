
exports.determineHandRanking = (hand, communityCards) => {
  //Prepares the hand from an object two an array
  hand = [hand.card1, hand.card2];
  communityCards = [communityCards.card1, communityCards.card2, communityCards.card3, communityCards.card4, communityCards.card5];
  
  //Combines own hand and the cards on the table called community cards
  const allCards = [...hand, ...communityCards];
  //Splits the format for the discord emojis :suits:values down to two objects
  const values = allCards.map((card) => card.split(":")[2]);
  const suits = allCards.map((card) => card.split(":")[1]);
  //Converts non numeric values in the cards to numbers according to their value
  const cardValues = values.map((value) => {
    if (value === "J") return 11;
    if (value === "Q") return 12;
    if (value === "K") return 13;
    if (value === "A") return 14;
    return parseInt(value);
  });
  //Fills a new Array with 14 0
  const count = new Array(14).fill(0);
  //Every card value is counted
  for (const value of cardValues) {
    count[value - 2]++;
  }
  //Counts the number of same colors up
  const suitCounts = {};
  suits.forEach((suit) => {
    if (suitCounts[suit]) {
      suitCounts[suit]++;
    } else {
      suitCounts[suit] = 1;
    }
  });
  //If this number is 5 or higher it is a Flush
  let isFlush = false;
  for (const count of Object.values(suitCounts)) {
    if (count >= 5) {
      isFlush = true;
      break;
    }
  }

  //This determines whether the hand contains 5 consecutive values
  let isStraight = false;
  /*This iterates through the whole array and checks in all possible 5 card combinations 
  whether the difference between the highest and the lowest card is 4 and It looks whether there
  are now duplicates with the new Set(fiveCards).size === 5
  */
  for (let i = 0; i <= values.length - 5; i++) {
      const fiveCards = values.slice(i, i + 5);
      const max = Math.max(...fiveCards);
      const min = Math.min(...fiveCards);
      if (max - min === 4 && new Set(fiveCards).size === 5) {
        isStraight = true;
        break;
      }
  }
  //This looks for pairs as it looks through the count array if it includes 4,3,2 of a kind
  const hasFourOfAKind = count.includes(4);
  const hasThreeOfAKind = count.includes(3);
  const hasPair = count.includes(2);
  /*This looks whether there are two pairs in the hand by filtering the count array for values with two
  and looks whether there are two of them
  */
  const hasTwoPairs = count.filter((c) => c === 2).length === 2;
  //If there is one ThreeOfAKind and one normal pair we have a full House
  const hasFullHouse = hasThreeOfAKind && hasPair;
  //We have a royal flush if we have a consecutive flush with the highest number beeing a Ace as 14
  const hasRoyalFlush = isFlush && cardValues.includes(14) && isStraight;
  //If we have a flush and a straight it is a straight flush
  const hasStraightFlush = isFlush && isStraight;
  const hasStraight = isStraight;
  //We return now numeric values according of the value of the hand
  if (hasRoyalFlush) return [10];
  /*We include also the card values from the highest to the lowest to include
  the so called kicker system which is used to compare cards
  */
  if (hasStraightFlush) return [9, Math.max(...cardValues)];
  /*In this case we also look for the value of the four of a kind
  by looking in the count array for the value of the cards with four of a kind
  */
  if (hasFourOfAKind) {
    const fourOfAKindValue = cardValues.find((value) => count[value - 2] === 4);
    return [
      8,
      fourOfAKindValue,
      cardValues.filter((value) => value !== fourOfAKindValue),
    ];
  }
  //Here is the same 
  if (hasFullHouse) {
    const threeOfAKindValue = cardValues.find(
      (value) => count[value - 2] === 3
    );
    return [
      7,
      threeOfAKindValue,
      cardValues.filter((value) => value !== threeOfAKindValue).pop(),
    ];
  }
  //Returns with the flush rank also all card values in descending order
  if (isFlush) return [6, ...cardValues.sort((a, b) => b - a)];
  //In the case of a straight we only include the highest number
  if (hasStraight) return [5, Math.max(...cardValues)];
  //Determines the value of the Three Of A Kind and the rest of the cards without the cards included in the four of a kind
  if (hasThreeOfAKind) {
    const threeOfAKindValue = cardValues.find(
      (value) => count[value - 2] === 3
    );
    return [
      4,
      threeOfAKindValue,
      ...cardValues
        .filter((value) => value !== threeOfAKindValue)
        .sort((a, b) => b - a),
    ];
  }
  //Here the same but with two pairs
  if (hasTwoPairs) {
    const pairValues = cardValues.filter((value) => count[value - 2] === 2);
    return [
      3,
      ...pairValues.sort((a, b) => b - a),
      cardValues.filter((value) => !pairValues.includes(value)).pop(),
    ];
  }
  //Again with one pair
  if (hasPair) {
    const pairValue = cardValues.find((value) => count[value - 2] === 2);
    return [
      2,
      pairValue,
      ...cardValues
        .filter((value) => value !== pairValue)
        .sort((a, b) => b - a),
    ];
  }
  //If with have nothing we just return the highest values
  return [1, ...cardValues.sort((a, b) => b - a)];
};
