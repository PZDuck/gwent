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
    this.CurrentRound = 1;
    this.RoundScore = {
        1: {Player1: 0, Player2: 0},
        2: {Player1: 0, Player2: 0},
        3: {Player1: 0, Player2: 0},
        Player1Wins: 0,
        Player2Wins: 0
    };
    this.endRound = function() {
        this.RoundScore[this.CurrentRound].Player1 = this.Players[0].Score.Total();
        this.RoundScore[this.CurrentRound].Player2 = this.Players[1].Score.Total();
        if(this.Players[0].Score.Total() > this.Players[1].Score.Total()) {
            this.RoundScore.Player1Wins++;
        } else {
            this.RoundScore.Player2Wins++;
        }
        this.Weather = [];
        this.Players.forEach(function(player) { player.discardBoard(); });
        this.CurrentRound++;
    };
    this.drawHands = function() {
        this.Players.forEach(function(player) { player.drawHand(); });
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
        this.Players.forEach(function(player) { player.updateScore(self.Weather); });
    };
}

function GwentPlayer(deck) {
    this.Deck = deck;
    this.Hand = [];
    this.Discard = [];
    this.Board = {
        CloseCombat: {CommandHorn: {Active: false, Card: null}, Cards: []},
        RangedCombat: {CommandHorn: {Active: false, Card: null}, Cards: []},
        SiegeCombat: {CommandHorn: {Active: false, Card: null}, Cards: []}};
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
        if(gwent_card.type == 'Horn') {
            this.Board[gwent_card.row].CommandHorn.Active = true;
            this.Board[gwent_card.row].CommandHorn.Card = gwent_card;
        } else {
            this.Board[gwent_card.row].Cards.push(gwent_card);
        }
    };
    this.updateScore = function(active_weather_cards) {
        this.Score.CloseCombat = calculateRowScore(this.Score.CloseCombat, this.Board.CloseCombat, active_weather_cards);
        this.Score.RangedCombat = calculateRowScore(this.Score.RangedCombat, this.Board.RangedCombat, active_weather_cards);
        this.Score.SiegeCombat = calculateRowScore(this.Score.SiegeCombat, this.Board.SiegeCombat, active_weather_cards);
    };
    this.discardBoard = function() {
        this.Discard = clearBoardRow(this.Discard, this.Board.CloseCombat);
        this.Discard = clearBoardRow(this.Discard, this.Board.CloseCombat);
        this.Discard = clearBoardRow(this.Discard, this.Board.CloseCombat);

        this.updateScore([]);
    };

    function clearBoardRow(discard_pile, row_board) {
        discard_pile = discard_pile.concat(row_board.Cards);
        row_board.Cards = [];
        row_board.CommandHorn = false;
        return discard_pile;
    }
    function calculateRowScore(row_score, row_board, active_weather_cards) {
        row_score = 0;
        row_board.Cards.forEach(function(card) {
            var horn = row_board.CommandHorn.Active;
            var weather = calculateWeather(active_weather_cards, card);
            row_score += p(card, horn, weather);
        });
        return row_score;
    }
    function calculateWeather(active_weather_cards, gwent_card) {
        var w = false;
        active_weather_cards.forEach(function(weather) {
            if(weather.row == gwent_card.row) { w = true; }
        });
        return w;
    }
    function p(card, horn, weather) {
        var power = card.base_power;
        if(card.hero) { return power; }
        if(weather) { power = 1; }
        if(horn) { power *= 2; }
        card.display_power = power;
        return power;
    }
}

function makeCardFromJSON(json_card) {
    return new GwentCard(json_card.type, json_card.name, json_card.row, json_card.power, json_card.hero, json_card.image);
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

myApp.controller('MyCtrl',['$scope', '$filter', '$http', function($scope, $filter, $http) {
    $scope.neutral_cards = [];
    $scope.monster_cards = [];
    $scope.GwentGame = null;

    $scope.loadDecks = function() {
        $http.get('decks/neutral.json').success(function (data){
            data.cards.forEach(function(json_card) {
                $scope.neutral_cards.push(makeCardFromJSON(json_card));
            });
        });
        $http.get('decks/monster.json').success(function (data){
            data.cards.forEach(function(json_card) {
                //$scope.monster_cards.push(makeCardFromJSON(json_card));
            });
        });
    };

    $scope.startGame = function() {
        var Player1 = new GwentPlayer($scope.neutral_cards.concat($scope.monster_cards));
        var Player2 = new GwentPlayer(all_cards);
        $scope.GwentGame = new GwentGame(Player1, Player2);
        $scope.Player1 = $scope.GwentGame.GwentBoard.Players[0];
        $scope.Player2 = $scope.GwentGame.GwentBoard.Players[1];
        $scope.GwentGame.startGame();
    };

    $scope.endCurrentRound = function() {
        $scope.GwentGame.GwentBoard.endRound();
    };

    $scope.consolePlayers = function() {
        console.log($scope.GwentGame.GwentBoard);
    };

    $scope.isWeatherActive = function(weather_row) {
        if($scope.GwentGame) {
            return ($filter('filter')($scope.GwentGame.GwentBoard.Weather, function (x) {
                    return x.row == weather_row;
                })).length > 0;
        } else {
            return false;
        }
    };
}]);




