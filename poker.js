var deck = [];
var table;

exports.gameStart = () =>{  
    createDeck();
    createTable();
    return table;
}



function createDeck(){
    var colors = [":diamonds:", ":clubs:", ":spades:", ":hearts:"];
    var numbers = ["2","3","4","5","6","7","8","9","10","J","Q","K","A"];
    for (const color of colors) {
        for (const number of numbers) {
            deck.push(color+" "+number);
        }
    }
    for (let index = 0; index < 1000; index++) {
        deck.sort((a,b)=> 0.5-Math.random());
    }
}

function createTable(){
    var card1 = deck.pop();
    var card2 = deck.pop();
    var card3 = deck.pop();
    table = {card1, card2, card3};
}

function dealHand(){
    var card1 = deck.pop();
    var card2 = deck.pop();
    return {card1,card2};
}