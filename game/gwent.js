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
    this.RowChoices = null;
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
        if(gwent_card.row.constructor === Array) {
            this.RowChoices = {player_id: player_id, card: gwent_card};
        } else {
            this.putCardOnBoard(player_id, gwent_card);
        }
    };
    this.ChooseRow = function(card_row) {
        var gwent_card = this.RowChoices.card;
        var player_id = this.RowChoices.player_id;
        this.RowChoices = null;
        gwent_card.row = card_row;
        this.putCardOnBoard(player_id, gwent_card);
    };
    this.putCardOnBoard = function(player_id, gwent_card) {
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
    this.hand_visible = false;
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
    this.isHandVisible = function() {
        return this.hand_visible;
    };
    this.toggleHand = function() {
        this.hand_visible = !this.hand_visible;
    };
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
        this.Discard = clearBoardRow(this.Discard, this.Board.RangedCombat);
        this.Discard = clearBoardRow(this.Discard, this.Board.SiegeCombat);

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

var myApp = angular.module("myApp", []);

myApp.controller('MyCtrl',['$scope', '$filter', '$http', function($scope, $filter, $http) {
    $scope.neutral_cards = [];
    $scope.monster_cards = [];
    $scope.nilfgaard_cards = [];
    $scope.json_cards = [];
    $scope.all_cards = [];
    $scope.deck1 = [];
    $scope.deck2 = [];
    $scope.deck3 = [];
    $scope.deck4 = [];
    $scope.GwentGame = null;

    $scope.loadDecks = function() {
        $http.get('decks/neutral.json').success(function (data){
            data.cards.forEach(function(json_card) {
                $scope.neutral_cards.push(makeCardFromJSON(json_card));
                $scope.json_cards.push(json_card);
            });
        });
        $http.get('decks/monster.json').success(function (data){
            data.cards.forEach(function(json_card) {
                $scope.monster_cards.push(makeCardFromJSON(json_card));
                $scope.json_cards.push(json_card);
            });
        });
        $http.get('decks/nilfgaard.json').success(function (data){
            data.cards.forEach(function(json_card) {
                $scope.nilfgaard_cards.push(makeCardFromJSON(json_card));
                $scope.json_cards.push(json_card);
            });
        });
        //$scope.deck1 = $scope.neutral_cards.concat($scope.monster_cards);
        //$scope.deck2 = $scope.neutral_cards.concat($scope.nilfgaard_cards);
    };

    $scope.mycards = ['Decoy','Scorch','Vesemir','Dandelion','Puttkammer','Sweers','Vanhemar','Cynthia','Torrential Rain',"Commander's Horn"];
    $scope.hiscards = ['Decoy','Scorch','Vesemir','Dandelion','Puttkammer','Sweers','Vanhemar','Cynthia','Torrential Rain',"Commander's Horn"];

    $scope.buildDeck = function(card_set) {
        var gwent_deck = [];
        var json_deck = $filter('filter')($scope.json_cards, function (x) {
            return ($filter('filter')(card_set, function(y) {return y == x.name;}).length > 0);
        });
        json_deck.forEach(function(json_card) {
            gwent_deck.push(makeCardFromJSON(json_card));
        });
        return gwent_deck;
    };

    $scope.startGame = function() {
        //$scope.json_cards.forEach(function(json_card) { $scope.all_cards.push(makeCardFromJSON(json_card)); });
        //console.log($scope.json_cards);
        //console.log($scope.all_cards);




        $scope.deck3 = $scope.buildDeck($scope.mycards);
        $scope.deck4 = $scope.buildDeck($scope.hiscards);

        console.log($scope.deck3);
        console.log($scope.deck4);

        //$filter('filter')($scope.json_cards, function (x) { if($filter('filter')($scope.hiscards, function(y) {return y == x.name;})) { $scope.deck4.push(makeCardFromJSON(x)); } });
        //$scope.deck4.push( $filter('filter')($scope.all_cards, function (x) { if($filter('filter')($scope.hiscards, function(y) {return y == x.name;})) { return x; } }) );

        var Player1 = new GwentPlayer($scope.deck3);
        var Player2 = new GwentPlayer($scope.deck4);
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




