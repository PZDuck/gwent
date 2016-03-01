function shuffle(inputArr) {
    return inputArr.sort(function() {
        return 0.5 - Math.random();
    });
}

function GwentCard(type, name, row, base_power, hero) {
    this.type = type;
    this.name = name;
    this.row = row;
    this.base_power = base_power;
    this.display_power = base_power;
    this.hero = hero;
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
            //angular.forEach(this.Players, function(player) { player.applyWeather(gwent_card); });
            if(gwent_card.row == 'Clear') {
                this.Weather = [];
            } else {
                this.Weather.push(gwent_card);
            }
        } else {
            this.Players[player_id].playCard(gwent_card);
        }
        this.Players[player_id].updateScore(this.Weather);
    }
}

function GwentPlayer(deck) {
    this.Deck = deck;
    this.Hand = [];
    this.Discard = [];
    this.Board = {CloseCombat: [], RangedCombat: [], SiegeCombat: []};
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
        this.Board[gwent_card.row].push(gwent_card);
    };
    this.updateScore = function(active_weather_cards) {
        var self = this;
        this.Score.CloseCombat = 0;
        angular.forEach(this.Board.CloseCombat, function(card) { self.Score.CloseCombat += calculateCardPower(card, active_weather_cards); });
        this.Score.RangedCombat = 0;
        angular.forEach(this.Board.RangedCombat, function(card) { self.Score.RangedCombat += calculateCardPower(card, active_weather_cards); });
        this.Score.SiegeCombat = 0;
        angular.forEach(this.Board.SiegeCombat, function(card) { self.Score.SiegeCombat += calculateCardPower(card, active_weather_cards); });
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
    new GwentCard('Unit','TestUnitA','CloseCombat',3,false),
    new GwentCard('Unit','TestUnitB','CloseCombat',6,false),
    new GwentCard('Unit','TestUnitC','CloseCombat',1,false),
    new GwentCard('Unit','TestUnitD','RangedCombat',2,false),
    new GwentCard('Unit','TestUnitE','RangedCombat',4,false),
    new GwentCard('Unit','TestUnitF','RangedCombat',5,false),
    new GwentCard('Unit','TestUnitG','SiegeCombat',7,false),
    new GwentCard('Unit','TestUnitH','SiegeCombat',8,false),
    new GwentCard('Unit','TestUnitI','SiegeCombat',6,false),
    new GwentCard('Unit','TestUnitJ','CloseCombat',15,true),
    new GwentCard('Unit','TestUnitK','CloseCombat',10,true),
    new GwentCard('Unit','TestUnitL','RangedCombat',7,true),
    new GwentCard('Unit','TestUnitM','RangedCombat',10,true),
    new GwentCard('Unit','TestUnitN','SiegeCombat',10,true),
    new GwentCard('Unit','TestUnitO','SiegeCombat',10,true),
    new GwentCard('Weather', 'Biting Frost', 'CloseCombat', 0, false),
    new GwentCard('Weather', 'Impenetrable Fog', 'RangedCombat', 0, false),
    new GwentCard('Weather', 'Torrential Rain', 'SiegeCombat', 0, false),
    new GwentCard('Weather', 'Clear Day', 'Clear', 0, false)
];

var myApp = angular.module("myApp", []);

myApp.controller('MyCtrl', function($scope, $filter) {
    $scope.all_cards = all_cards;
    var Player1 = new GwentPlayer(all_cards);
    var Player2 = new GwentPlayer(all_cards);
    $scope.GwentGame = new GwentGame(Player1, Player2);
    $scope.GwentGame.startGame();

    $scope.applyWeather = function(weather_row) {
        var weather_card = new GwentCard('Weather', 'WeatherCard', weather_row, 0, false);
        $scope.GwentGame.applyCard('Player1', weather_card);
    }
});




