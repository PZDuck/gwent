function shuffle(inputArr) {
    return inputArr.sort(function() {
        return 0.5 - Math.random();
    });
}

function GwentCard(type, name, row, base_power, hero, image) {
    this.type = type;
    this.name = name;
    this.row = row;
    this.base_power = base_power;
    this.display_power = base_power;
    this.hero = hero;
    this.image = image;

    // top: -23, -442, -861
    // left: -18, -240, -463, -685
}

function GwentGame(player1, player2) {
    this.GwentBoard = new GwentBoard(player1, player2);

    this.startGame = function() {
        this.GwentBoard.drawHands();
    };
}

function GwentBoard(player1, player2) {
    this.Players = [player1, player2];
    this.Weather = [];

    this.drawHands = function() {
        angular.forEach(this.Players, function(player) { player.drawHand(); });
    };
    this.playCard = function(player_id, hand_id) {
        var gwent_card = this.Players[player_id].takeCardFromHand(hand_id);
        if(gwent_card.type == 'Weather') {
            if(gwent_card.row == 'Clear') {
                this.Weather = [];
            } else {
                this.Weather.push(gwent_card);
            }
        } else {
            this.Players[player_id].playCard(gwent_card);
        }
        var self = this;
        angular.forEach(this.Players, function(player) { player.updateScore(self.Weather); });
    };
}

function GwentPlayer(deck) {
    this.Deck = deck;
    this.Hand = [];
    this.Discard = [];
    this.Board = {CloseCombat: {CommandHorn: false, Cards: []}, RangedCombat: {CommandHorn: false, Cards: []}, SiegeCombat: {CommandHorn: false, Cards: []}};
    this.Score = {CloseCombat: 0, RangedCombat: 0, SiegeCombat: 0,
        Total: function() {
            return this.CloseCombat + this.RangedCombat + this.SiegeCombat;
        }
    };
    this.Leader;
    this.drawHand = function() {
        var deck = shuffle(this.Deck);
        for(var i = 0; i < 10; i++) {
            this.Hand.push(deck[i]);
        }
    };
    this.takeCardFromHand = function(hand_id) {
        var gwent_card = this.Hand[hand_id];
        this.Hand.splice(hand_id, 1);
        return gwent_card;
    };
    this.playCard = function(gwent_card) {
        this.Board[gwent_card.row].Cards.push(gwent_card);
    };
    this.updateScore = function(active_weather_cards) {
        var self = this;
        this.Score.CloseCombat = 0;
        angular.forEach(this.Board.CloseCombat.Cards, function(card) { self.Score.CloseCombat += calculateCardPower(card, active_weather_cards); });
        this.Score.RangedCombat = 0;
        angular.forEach(this.Board.RangedCombat.Cards, function(card) { self.Score.RangedCombat += calculateCardPower(card, active_weather_cards); });
        this.Score.SiegeCombat = 0;
        angular.forEach(this.Board.SiegeCombat.Cards, function(card) { self.Score.SiegeCombat += calculateCardPower(card, active_weather_cards); });
    };
    function calculateCardPower(gwent_card, active_weather_cards) {
        var power = gwent_card.base_power;
        angular.forEach(active_weather_cards, function(weather_card) {
            if(weather_card.row == gwent_card.row) {
                power = 1;
            }
        });
        gwent_card.display_power = power;
        return power;
    }
}

var all_cards = [
    new GwentCard('Unit','Villentretenmerth','CloseCombat',7,false,{card_map:'1',row:2,column:4}),
    new GwentCard('Unit','Vesemir','CloseCombat',6,false,{card_map:'1',row:3,column:1}),
    new GwentCard('Unit','Zoltan Chivray','CloseCombat',5,false,{card_map:'1',row:3,column:2}),
    new GwentCard('Unit','Dandelion','CloseCombat',2,false,{card_map:'1',row:3,column:3}),
    new GwentCard('Unit','Earth Elemental','SiegeCombat',6,false,{card_map:'1',row:3,column:4}),
    new GwentCard('Unit','Fiend','CloseCombat',6,false,{card_map:'2',row:1,column:1}),
    new GwentCard('Unit','Fire Elemental','SiegeCombat',6,false,{card_map:'2',row:1,column:2}),
    new GwentCard('Unit','Arachas Behemoth','SiegeCombat',6,false,{card_map:'2',row:1,column:3}),
    new GwentCard('Unit','TestUnitI','SiegeCombat',6,false,{card_map:'1',row:1,column:1}),
    new GwentCard('Unit','TestUnitJ','CloseCombat',15,true,{card_map:'1',row:1,column:1}),
    new GwentCard('Unit','TestUnitK','CloseCombat',10,true,{card_map:'1',row:1,column:1}),
    new GwentCard('Unit','TestUnitL','RangedCombat',7,true,{card_map:'1',row:1,column:1}),
    new GwentCard('Unit','TestUnitM','RangedCombat',10,true,{card_map:'1',row:1,column:1}),
    new GwentCard('Unit','TestUnitN','SiegeCombat',10,true,{card_map:'1',row:1,column:1}),
    new GwentCard('Unit','TestUnitO','SiegeCombat',10,true,{card_map:'1',row:1,column:1}),
    new GwentCard('Weather','Biting Frost','CloseCombat',0,false,{card_map:'1',row:1,column:4}),
    new GwentCard('Weather','Impenetrable Fog','RangedCombat',0,false,{card_map:'1',row:2,column:1}),
    new GwentCard('Weather','Torrential Rain','SiegeCombat',0,false,{card_map:'1',row:2,column:2}),
    new GwentCard('Weather','Clear Weather','Clear',0,false,{card_map:'1',row:2,column:3})
];

var myApp = angular.module("myApp", []);

myApp.controller('MyCtrl', function($scope, $filter) {
    $scope.all_cards = all_cards;
    var Player1 = new GwentPlayer(all_cards);
    var Player2 = new GwentPlayer(all_cards);
    $scope.GwentGame = new GwentGame(Player1, Player2);
    $scope.GwentGame.startGame();

    $scope.isWeatherActive = function(weather_row) {
        return ($filter('filter')($scope.GwentGame.GwentBoard.Weather, function(x) {return x.row == weather_row; })).length > 0;
    };
});




