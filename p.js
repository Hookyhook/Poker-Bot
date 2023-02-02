var members = [
  {
    id: 100, 
    username: "paul"
  }, {
    id: 100,
    username: "alex"
  }, { 
    id: 120,
    username: "anton"
  }, {
    id: 80,
    username: "Franklin"
  }
]



var game = {
  id: 0,
  members: members
};
    searchValue = 80;
game.members = game.members.filter((obj) => obj.id !== searchValue);
console.log(game.members);
