const values = [2, 3, 4, 5, 6, 9, 11];

let isStraight = false;

for (let i = 0; i <= values.length - 5; i++) {
    const fiveCards = values.slice(i, i + 5);
    const max = Math.max(...fiveCards);
    const min = Math.min(...fiveCards);
    if (max - min === 4 && new Set(fiveCards).size === 5) {
      isStraight = true;
      break;
    }
}
console.log(isStraight);
