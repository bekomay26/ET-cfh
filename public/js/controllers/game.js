/* eslint prefer-arrow-callback: 0, func-names: 0, no-undef: 0, no-var: 0, object-shorthand: 0 */
angular.module('mean.system')
  .controller('GameController', ['$scope', '$http', 'game', '$timeout', '$location', 'MakeAWishFactsService', '$dialog', ($scope, $http, game, $timeout, $location, MakeAWishFactsService) => {
    $scope.hasPickedCards = false;
    $scope.winningCardPicked = false;
    $scope.showTable = false;
    $scope.hasServerError = false;
    $scope.searchKey = '';
    $scope.disableInviteButton = false;
    $scope.selectedUser = {};
    $scope.showNotFound = false;
    $scope.foundUsers = [];
    $scope.invitedUsers = [];
    $scope.searchHelper = 'At least 3 letters are needed for this search';
    $scope.modalShown = false;
    $scope.game = game;
    $scope.pickedCards = [];
    let makeAWishFacts = MakeAWishFactsService.getMakeAWishFacts();
    $scope.makeAWishFact = makeAWishFacts.pop();

    $scope.openLessModal = () => {
      $('#less-modal').modal('open');
    };

    $scope.openReuseModal = () => {
      const refusableModel = $('#reuse-modal');
      refusableModel.find('.modal-body').text('I am coming from the other side');
      $('#reuse-modal').modal('open');
    };

    $scope.closeReuseModal = () => {
      $('#reuse-modal').modal('close');    
    }
    $scope.closeLessModal = () => {
      $('#less-modal').modal('close');
    };

    $scope.openMoreModal = () => {
      $('#more-players-modal').modal('open');
    };

    $scope.closeMoreModal = () => {
      $('#more-players-modal').modal('close');
    };

    $scope.findUsers = () => {
      $scope.hasServerError = false;
      $http.get(`/users/findUsers/${$scope.searchKey}`)
        .then((response) => {
          $scope.foundUsers = response.data.users;
          $scope.showNotFound = $scope.foundUsers.length === 0;
        }, (error) => {
          $scope.searchHelper = error.data;
          $scope.hasServerError = true;
        });
    };

    $scope.sendInvitation = (x) => {
      $scope.selectedUser = x;
      $scope.disableInviteButton = true;
      const { href } = window.location;

      const formData = {
        user: x,
        link: href,
      };

      $http.post('/users/invite', formData).then((response) => {
        $scope.invitedUsers.push(response.data.user.email);
        $scope.disableInviteButton = false;
        $scope.selectedUser = {};
      });
    };

    $scope.pickCard = (card) => {
      if (!$scope.hasPickedCards) {
        if ($scope.pickedCards.indexOf(card.id) < 0) {
          $scope.pickedCards.push(card.id);
          if (game.curQuestion.numAnswers === 1) {
            $scope.sendPickedCards();
            $scope.hasPickedCards = true;
          } else if (game.curQuestion.numAnswers === 2
            && $scope.pickedCards.length === 2) {
            // delay and send
            $scope.hasPickedCards = true;
            $timeout($scope.sendPickedCards, 300);
          }
        } else {
          $scope.pickedCards.pop();
        }
      }
    };

    $scope.pointerCursorStyle = () => {
      if ($scope.isCzar() && $scope.game.state === 'waiting for czar to decide') {
        return { cursor: 'pointer' };
      }
      return {};
    };

    $scope.sendPickedCards = () => {
      game.pickCards($scope.pickedCards);
      $scope.showTable = true;
    };

    $scope.cardIsFirstSelected = (card) => {
      if (game.curQuestion.numAnswers > 1) {
        return card === $scope.pickedCards[0];
      }
      return false;
    };

    $scope.cardIsSecondSelected = (card) => {
      if (game.curQuestion.numAnswers > 1) {
        return card === $scope.pickedCards[1];
      }
      return false;
    };

    $scope.firstAnswer = ($index) => {
      if ($index % 2 === 0 && game.curQuestion.numAnswers > 1) {
        return true;
      }
      return false;
    };

    $scope.secondAnswer = ($index) => {
      if ($index % 2 === 1 && game.curQuestion.numAnswers > 1) {
        return true;
      }
      return false;
    };

    $scope.showFirst = card => game.curQuestion.numAnswers > 1 && $scope.pickedCards[0] === card.id;

    $scope.showSecond = card => game.curQuestion.numAnswers > 1
      && $scope.pickedCards[1] === card.id;

    $scope.isCzar = () => game.czar === game.playerIndex;

    $scope.isPlayer = $index => $index === game.playerIndex;

    $scope.isCustomGame = () => !(/^\d+$/).test(game.gameID) && game.state === 'awaiting players';

    $scope.isPremium = $index => game.players[$index].premium;

    $scope.currentCzar = $index => $index === game.czar;

    $scope.winningColor = ($index) => {
      if (game.winningCardPlayer !== -1 && $index === game.winningCard) {
        return $scope.colors[game.players[game.winningCardPlayer].color];
      }
      return '#f9f9f9';
    };

    $scope.pickWinning = (winningSet) => {
      if ($scope.isCzar()) {
        game.pickWinning(winningSet.card[0]);
        $scope.winningCardPicked = true;
      }
    };

    $scope.winnerPicked = () => game.winningCard !== -1;

    $scope.startGame = function () {
      const gameId = game.gameID;
      const players = game.players.map(player => player.userId);
      game.createPlayers(gameId, players);
      game.startGame();
    };

    $scope.abandonGame = () => {
      game.leaveGame();
      $location.path('/');
    };
    // Catches changes to round to update when no players pick card
    // (because game.state remains the same)
    $scope.$watch('game.round', () => {
      $scope.hasPickedCards = false;
      $scope.showTable = false;
      $scope.winningCardPicked = false;
      $scope.makeAWishFact = makeAWishFacts.pop();
      if (!makeAWishFacts.length) {
        makeAWishFacts = MakeAWishFactsService.getMakeAWishFacts();
      }
      $scope.pickedCards = [];
    });

    // In case player doesn't pick a card in time, show the table
    $scope.$watch('game.state', () => {
      if (game.state === 'waiting for czar to decide' && $scope.showTable === false) {
        $scope.showTable = true;
        console.log(players);
      }
    });

    $scope.$watch('game.gameID', () => {
      if (game.gameID && game.state === 'awaiting players') {
        if (!$scope.isCustomGame() && $location.search().game) {
          // If the player didn't successfully enter the request room,
          // reset the URL so they don't think they're in the requested room.
          $location.search({});
        } else if ($scope.isCustomGame() && !$location.search().game) {
          // Once the game ID is set, update the URL if this is a game with friends,
          // where the link is meant to be shared.
          $location.search({ game: game.gameID });
          if (!$scope.modalShown) {
            setTimeout(() => {
              const link = document.URL;
              const txt = 'You can send the link below to your friends to join the game. Your friends do not have to be signed in to join.';
              $('#lobby-how-to-play').text(txt);
              $('#oh-el').css({
                'text-align': 'center', 'font-size': '22px', background: 'white', color: 'black'
              }).text(link);
            }, 200);
            $scope.modalShown = true;
          }
        }
      }
    });

    if ($location.search().game && !(/^\d+$/).test($location.search().game)) {
      game.joinGame('joinGame', $location.search().game);
    } else if ($location.search().custom) {
      game.joinGame('joinGame', null, true);
    } else {
      game.joinGame();
    }
  }]);
