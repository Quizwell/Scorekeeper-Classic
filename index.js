var currentRoundState = {

    question: 1,
    team1: {
        score: 0,
        fouls: 0,
        errors: 0,
        uniqueJumps: 0,
        overturnedChallenges: 0,
    },
    team2: {
        score: 0,
        fouls: 0,
        errors: 0,
        uniqueJumps: 0,
        overturnedChallenges: 0,
    }

};
var previousRoundState = null;
var challengeAction = null;

var selectMode = null;

function getNumbersFromID(quizzerID) {

    if (quizzerID <= 5) {

        return {

            teamNumber: 1,
            quizzerNumber: quizzerID,
            teamPropertyName: "team" + 1,
            quizzerPropertyName: "quizzer" + quizzerID

        };

    } else {

        return {

            teamNumber: 2,
            quizzerNumber: quizzerID - 5,
            teamPropertyName: "team" + 2,
            quizzerPropertyName: "quizzer" + (quizzerID - 5)

        };

    }

}

function hideWelcomeScreen() {
    
    document.querySelector(".welcomeContainer").classList.add("hidden");
    if ((window.navigator.userAgent.match(/iP(ad|hone)/i)) && !(window.navigator.userAgent.match(/CriOS/i)) && !window.navigator.standalone) {
        
        document.querySelector(".webClipPromptContainer").classList.remove("hidden");
        
    } else {
        
        document.querySelector(".setupContainer").classList.remove("hidden");
        
    }
    
    
}

function hideWebClipPromptScreen() {
    
    document.querySelector(".webClipPromptContainer").classList.add("hidden");
    document.querySelector(".setupContainer").classList.remove("hidden");
    
}

function showSelectionScreen(mode, teamNumber) {

    selectMode = mode;

    if (mode === "jump") {
        
        document.querySelector(".team" + teamNumber + "SelectionScreen .miscellaneousCard p.cardLabel").textContent = "No Jump";
        document.querySelector(".team" + teamNumber + "SelectionScreen p.screenTitle").textContent = "Jump";
        
    } else if (mode === "foul") {
        
        document.querySelector(".team" + teamNumber + "SelectionScreen .miscellaneousCard p.cardLabel").textContent = "Team Foul";
        document.querySelector(".team" + teamNumber + "SelectionScreen p.screenTitle").textContent = "Foul";
        
    } else {
        return;
    }

    document.querySelector(".overviewContainer").classList.add("hidden");
    document.querySelector(".team" + teamNumber + "SelectionScreen").classList.remove("hidden");

}

function hideSelectionScreen(teamNumber) {

    selectMode = null;

    document.querySelector(".overviewContainer").classList.remove("hidden");
    document.querySelector(".team" + teamNumber + "SelectionScreen").classList.add("hidden");

}

function showConfirmationDialog(mode, teamNumber, quizzerID, dontRefreshButtonsForBonus) {

    var subtitle,
        title,
        button1Text,
        button2Text,
        button1Function,
        button2Function;

    var numbers = getNumbersFromID(quizzerID);
    
    document.querySelector(".confirmationDialog > p").textContent = "";
    document.querySelector(".confirmationDialog .closeButton").classList.remove("hidden");

    switch (mode) {

        case "jump":
            var quizzerName = currentRoundState[numbers.teamPropertyName][numbers.quizzerPropertyName].name

            subtitle = "Jump - Team " + teamNumber;
            title = quizzerName;
            button1Text = "Correct";
            button2Text = "Error";
            button1Function = function () {
                hideConfirmationDialog();
                correct(quizzerID);
            };
            button2Function = function () {
                incorrect(quizzerID);
            };
            break;
        case "bonus":
            var quizzerName = currentRoundState[numbers.teamPropertyName][numbers.quizzerPropertyName].name

            subtitle = "Bonus - Team " + teamNumber;
            title = quizzerName;
            button1Text = "Correct";
            button2Text = "Error";
            button1Function = function () {
                hideConfirmationDialog();
                bonus(quizzerID, dontRefreshButtonsForBonus);
            };
            button2Function = function () {
                hideConfirmationDialog();
                refreshChallengeAndAppealButtons("enable");
                incrementQuestion();
                redrawScoreboard();
            };
            document.querySelector(".confirmationDialog .closeButton").classList.add("hidden");
            break;
        case "challenge":
            subtitle = "Team " + teamNumber
            title = "Challenge";
            button1Text = "Overruled";
            button2Text = "Accepted";
            button1Function = function () {
                hideConfirmationDialog();
                var overturnedChallenges = ++currentRoundState["team" + teamNumber].overturnedChallenges;
                if (overturnedChallenges >= 2) {
                    currentRoundState["team" + teamNumber].score -= 10;
                }
                redrawScoreboard();
            };
            button2Function = function () {
                challenge();
            };
            break;
        case "appeal":
            subtitle = "Team " + teamNumber
            title = "Appeal";
            button1Text = "Overruled";
            button2Text = "Accepted";
            button1Function = function () {
                hideConfirmationDialog();
            };
            button2Function = function () {
                hideConfirmationDialog();
                appeal(teamNumber);
            };
            break;
        case "noJump":
            subtitle = "Question " + currentRoundState.question;
            title = "No Jump";
            button1Text = "Cancel";
            button2Text = "Next Question";
            button1Function = function () {
                hideConfirmationDialog();
            };
            button2Function = function () {
                hideConfirmationDialog();
                savePreviousRoundState();
                incrementQuestion();
                redrawScoreboard();
                refreshChallengeAndAppealButtons("enable");
            };
            break;
        case "scoreAdjustment":
            subtitle = "Score Adjustment";
            title = "Team " + teamNumber;
            button1Text = "Remove 10 Points";
            button2Text = "Add 10 Points";
            button1Function = function () {
                currentRoundState["team" + teamNumber].score -= 10;
                refreshChallengeAndAppealButtons("disable");
                redrawScoreboard();
                hideConfirmationDialog();
            };
            button2Function = function () {
                currentRoundState["team" + teamNumber].score += 10;
                refreshChallengeAndAppealButtons("disable");
                redrawScoreboard();
                hideConfirmationDialog();
            };
            break;
        case "endRound":
            subtitle = "End Round"
            title = "Are you sure?";
            document.querySelector(".confirmationDialog > p").textContent = "If you leave the " + (window.navigator.standalone ? "app" : "page") + " without ending the round, the current state of the round will be remembered.";
            button1Text = "Cancel";
            button2Text = "End Round";
            button1Function = function () {
                hideConfirmationDialog();
            };
            button2Function = function () {
                hideConfirmationDialog();

                setTimeout(function () {
                    localStorage.clear();
                    window.location.reload();
                }, 300);
            };
            break;

    }

    // Set up the elements
    document.querySelector(".confirmationDialog h2").textContent = subtitle;
    document.querySelector(".confirmationDialog h1").textContent = title;
    document.querySelector(".confirmationDialog button").textContent = button1Text;
    document.querySelector(".confirmationDialog button:nth-of-type(2)").textContent = button2Text;
    document.querySelector(".confirmationDialog button").onclick = button1Function;
    document.querySelector(".confirmationDialog button:nth-of-type(2)").onclick = button2Function;

    // Show the confirmation dialog element and the overlay
    document.querySelector(".confirmationDialog").style.transform = "translate(0, 0)";
    document.querySelector(".overlay").style.display = "block";
    requestAnimationFrame(function () {
        document.querySelector(".overlay").style.opacity = 0.25;
    });

}

function hideConfirmationDialog() {

    // Hide the confirmation dialog element and the overlay
    document.querySelector(".confirmationDialog").style.transform = "translate(0, 125%)";
    document.querySelector(".overlay").style.opacity = 0;
    setTimeout(function () {
        document.querySelector(".overlay").style.display = "none";
    }, 200);

}

function finishSetup() {

    var nameInputs = document.querySelectorAll(".quizzerNameInput");
    for (var i = 0; i < nameInputs.length; i++) {

        var currentInput = nameInputs[i];

        var quizzerID = Number(currentInput.name.slice(7));
        var quizzerTeam, quizzerNumber;

        if (quizzerID > 5) {
            quizzerTeam = 2;
            quizzerNumber = quizzerID - 5;
        } else {
            quizzerTeam = 1;
            quizzerNumber = quizzerID;
        }

        // If the box is empty, use a disabled placeholder
        if (!currentInput.value) {
            currentRoundState["team" + quizzerTeam]["quizzer" + quizzerNumber] = {
                name: null,
                enabled: false,
                score: 0,
                correct: 0,
                incorrect: 0,
                fouls: 0
            };
            continue;
        }

        currentRoundState["team" + quizzerTeam]["quizzer" + quizzerNumber] = {
            name: currentInput.value,
            enabled: true,
            score: 0,
            correct: 0,
            incorrect: 0,
            fouls: 0
        };

        document.querySelector(".quizzer" + quizzerID + "Card").classList.remove("hidden");
        document.querySelector(".quizzer" + quizzerID + "Card .cardLabel").textContent = currentInput.value;

    }

    // Initial draw of the scoreboard
    redrawScoreboard();

    document.querySelector(".setupContainer").classList.add("hidden");
    document.querySelector(".mainContainer").classList.remove("hidden");

}

function redrawScoreboard() {
    
    // Clear the team status containers
    var team1StatusContainer = document.querySelector(".overviewContainer .team1 .teamStatusContainer");
    while (team1StatusContainer.firstChild) {
        team1StatusContainer.removeChild(team1StatusContainer.firstChild);
    }
    var team2StatusContainer = document.querySelector(".overviewContainer .team2 .teamStatusContainer");
    while (team2StatusContainer.firstChild) {
        team2StatusContainer.removeChild(team2StatusContainer.firstChild);
    }


    for (var i = 0; i < 10; i++) {

        var quizzerID = i + 1;
        
        if (quizzerID == 6) {
            console.log("test");
        }

        var numbers = getNumbersFromID(quizzerID);

        var currentQuizzer = currentRoundState[numbers.teamPropertyName][numbers.quizzerPropertyName];

        var quizzerSelectionElement = document.querySelector(".quizzer" + quizzerID + "Card");
        var quizzerSelectionElementLabel = document.querySelector(".quizzer" + quizzerID + "Card p.cardLabel");

        // If this quizzer doesn't exist, don't update him on the scoreboard
        if (currentQuizzer.name === null) {
            continue;
        }

        // Update quizzer scores on overview screen
        var overviewScreenTeamStatusContainer = document.querySelector(".overviewContainer ." + numbers.teamPropertyName + " .teamStatusContainer");

        var quizzerStatusString = currentQuizzer.name + ": " + currentQuizzer.correct + "/" + currentQuizzer.incorrect;
        var quizzerStatusStringElement = document.createElement("span");
        quizzerStatusStringElement.textContent = quizzerStatusString;
        // If this quizzer is not enabled anymore, disable the card and gray out the status string
        if (!currentQuizzer.enabled) {

            if (!quizzerSelectionElement.classList.contains("disabled")) {
                
                quizzerSelectionElement.classList.add("disabled");
                quizzerSelectionElement.onclick = null;

                var disabledReason;
                if (currentQuizzer.correct == 4) {
                    disabledReason = "Quizzed Out";
                } else if (currentQuizzer.incorrect == 3) {
                    disabledReason = "Errored Out";
                } else if (currentQuizzer.fouls == 3) {
                    disabledReason = "Fouled Out";
                }

                quizzerSelectionElementLabel.textContent += " - " + disabledReason;

            }
            
            quizzerStatusStringElement.style.opacity = 0.5;

        } else if (currentQuizzer.enabled && quizzerSelectionElement.classList.contains("disabled")) {
            
            quizzerSelectionElement.classList.remove("disabled");
            quizzerSelectionElement.onclick = function () {
                selectedQuizzer(quizzerID);   
            };

            quizzerSelectionElementLabel.textContent = currentQuizzer.name;

            quizzerStatusStringElement.style.opacity = 1;
            
        }

        overviewScreenTeamStatusContainer.appendChild(quizzerStatusStringElement);
        overviewScreenTeamStatusContainer.appendChild(document.createElement("br"));


    }

    document.querySelector(".overviewContainer .team1 .teamScore").textContent = currentRoundState.team1.score;
    document.querySelector(".overviewContainer .team2 .teamScore").textContent = currentRoundState.team2.score;

    if (currentRoundState.question <= 20) {
        
        document.querySelector(".overviewContainer .questionNumber").textContent = "Question " + currentRoundState.question;
        
    } else if (currentRoundState.question > 20) {
        
        if (currentRoundState.team1.score === currentRoundState.team2.score) {
            
            // Keep going - the round continues with tiebreaker questions until the score is no longer tied.
            
            document.querySelector(".overviewContainer .questionNumber").textContent = "Question " + currentRoundState.question;
            
            // If there are no eligible quizzers, allow any quizzer to jump.
            var anyEligibleQuizzer = false;
            for (var i = 0; i < 10; i++) {
                var numbers = getNumbersFromID(i + 1);
                if (currentRoundState[numbers.teamPropertyName][numbers.quizzerPropertyName].enabled) {
                    anyEligibleQuizzer = true;
                }
            }
            
            if (!anyEligibleQuizzer) {
                
                // If there are no eligible quizzers, enable all of the quizzers
                for (var i = 0; i < 10; i++) {
                    var numbers = getNumbersFromID(i + 1);
                    if (!currentRoundState[numbers.teamPropertyName][numbers.quizzerPropertyName].enabled) {
                        currentRoundState[numbers.teamPropertyName][numbers.quizzerPropertyName].enabled = true;
                    }
                }
                redrawScoreboard();
                return;
                
            }
            
        } else {
            
            var team1Buttons = document.querySelectorAll(".overviewContainer .team1 .actionsContainer div");
            var team2Buttons = document.querySelectorAll(".overviewContainer .team2 .actionsContainer div");
            for (var i = 0; i < 4; i++) {
                team1Buttons[i].classList.add("disabled");
                team1Buttons[i].onclick = null;
                team2Buttons[i].classList.add("disabled");
                team2Buttons[i].onclick = null;
            }
            
            document.querySelector(".overviewContainer .screenTitle").textContent = "End of Round";
            document.querySelector(".overviewContainer .screenTitle").onclick = null;
            
        }
        
    }

    // Save current state to localStorage
    localStorage.setItem("currentRoundState", JSON.stringify(currentRoundState));

}

function selectedQuizzer(quizzerID) {
    
    if (quizzerID === "team1" || quizzerID === "team2") {

        if (selectMode === "jump") {
            showConfirmationDialog("noJump");
        } else if (selectMode === "foul") {
            teamFoul(quizzerID);
        }
        
    } else {
        
        if (selectMode === "jump") {
            showConfirmationDialog("jump", (quizzerID <= 5) ? 1 : 2, quizzerID);
        } else if (selectMode === "foul") {
            foul(quizzerID);
        }
        
    }
    
    switch (quizzerID) {
        case "team1":
            quizzerID = 1;
            break;
        case "team2":
            quizzerID = 2;
            break;
        default:
            quizzerID = (quizzerID <= 5) ? 1 : 2;
    }
    
    hideSelectionScreen(quizzerID);

}

function savePreviousRoundState() {
    
    previousRoundState = JSON.parse(JSON.stringify(currentRoundState));
    
}

function incrementQuestion() {
    
    currentRoundState.question++;
    
}

function showScoreAdjustment(teamNumber) {
    
    showConfirmationDialog("scoreAdjustment", teamNumber);
    
}

function showNoJumpPrompt() {
    
    showConfirmationDialog("noJump")
    
}

function correct(quizzerID) {
    
    savePreviousRoundState();
    challengeAction = function () {
        incorrect(quizzerID, true);
    };

    var numbers = getNumbersFromID(quizzerID);

    function get(property) {

        return currentRoundState[numbers.teamPropertyName][numbers.quizzerPropertyName][property];

    }

    function set(property, value) {

        currentRoundState[numbers.teamPropertyName][numbers.quizzerPropertyName][property] = value;

    }

    function add(property, addValue) {

        currentRoundState[numbers.teamPropertyName][numbers.quizzerPropertyName][property] += addValue;

    }

    function subtract(property, subtractValue) {

        currentRoundState[numbers.teamPropertyName][numbers.quizzerPropertyName][property] -= subtractValue;

    }

    add("correct", 1);
    add("score", 20);

    currentRoundState[numbers.teamPropertyName].score += 20;

    // If this is the quizzer's first correct answer, add 1 to the team's uniqueJumps property
    if (get("correct") == 1) {

        currentRoundState[numbers.teamPropertyName].uniqueJumps++;

        // Then, if there are three or more jumps, add a n-person bonus
        if (currentRoundState[numbers.teamPropertyName].uniqueJumps >= 3) {

            currentRoundState[numbers.teamPropertyName].score += 10;

        }

    }

    // Add 10 points to the individual and team scores if the quizzer quizzed out without error
    if ((get("correct") == 4) && (get("incorrect") == 0)) {

        add("score", 10);
        currentRoundState[numbers.teamPropertyName].score += 10;

    }

    // Disable the quizzer if they quizzed out
    if (get("correct") == 4) {

        set("enabled", false);

    }

    incrementQuestion();
    refreshChallengeAndAppealButtons("enable");
    redrawScoreboard();

}

function incorrect(quizzerID, dontRefreshButtons) {
    
    savePreviousRoundState();
    challengeAction = function () {
        correct(quizzerID);
        hideConfirmationDialog();
    };
    
    var numbers = getNumbersFromID(quizzerID);

    function get(property) {

        return currentRoundState[numbers.teamPropertyName][numbers.quizzerPropertyName][property];

    }

    function set(property, value) {

        currentRoundState[numbers.teamPropertyName][numbers.quizzerPropertyName][property] = value;

    }

    function add(property, addValue) {

        currentRoundState[numbers.teamPropertyName][numbers.quizzerPropertyName][property] += addValue;

    }

    function subtract(property, subtractValue) {

        currentRoundState[numbers.teamPropertyName][numbers.quizzerPropertyName][property] -= subtractValue;

    }

    add("incorrect", 1);
    currentRoundState[numbers.teamPropertyName].errors++;

    // If this is this quizzer's third error, disable him
    if (get("incorrect") == 3) {

        set("enabled", false);

    }

    // Remove ten points if...
    if (get("incorrect") == 3) {

        // The quizzer has errored out
        subtract("score", 10);
        set("enabled", false);
        currentRoundState[numbers.teamPropertyName].score -= 10;

    } else if (currentRoundState[numbers.teamPropertyName].errors >= 5) {

        // Or if this is the fifth or more team error
        currentRoundState[numbers.teamPropertyName].score -= 10;

    } else if (currentRoundState.question >= 16) {

        // Or if error deductions are in effect
        currentRoundState[numbers.teamPropertyName].score -= 10;

    }

    redrawScoreboard();
    
    // Check to see if the bonus quizzer is enabled. If so, give him the bonus
    var bonusQuizzerID = (quizzerID <= 5) ? (quizzerID + 5) : (quizzerID - 5); 
    var bonusQuizzerNumbers = getNumbersFromID(bonusQuizzerID);
    if (currentRoundState[bonusQuizzerNumbers.teamPropertyName][bonusQuizzerNumbers.quizzerPropertyName].enabled) { 
        showConfirmationDialog("bonus", bonusQuizzerNumbers.teamNumber, bonusQuizzerID, dontRefreshButtons);
    } else {
        hideConfirmationDialog();
        incrementQuestion();
        refreshChallengeAndAppealButtons("enabled");
        redrawScoreboard();
    }

}

function bonus(quizzerID, dontRefreshButtons) {
    
    var numbers = getNumbersFromID(quizzerID);
    
    currentRoundState[numbers.teamPropertyName].score += 10;
    
    incrementQuestion();
    if (!dontRefreshButtons) {
        refreshChallengeAndAppealButtons("enable");
    }
    redrawScoreboard();
    
}

function foul(quizzerID) {
    
    var numbers = getNumbersFromID(quizzerID);

    function get(property) {

        return currentRoundState[numbers.teamPropertyName][numbers.quizzerPropertyName][property];

    }

    function set(property, value) {

        currentRoundState[numbers.teamPropertyName][numbers.quizzerPropertyName][property] = value;

    }

    function add(property, addValue) {

        currentRoundState[numbers.teamPropertyName][numbers.quizzerPropertyName][property] += addValue;

    }

    function subtract(property, subtractValue) {

        currentRoundState[numbers.teamPropertyName][numbers.quizzerPropertyName][property] -= subtractValue;

    }

    add("fouls", 1);

    currentRoundState[numbers.teamPropertyName].fouls += 1;

    // If this is the team's second foul or more, deduct ten points from the team score
    if (currentRoundState[numbers.teamPropertyName].fouls >= 2) {

        currentRoundState[numbers.teamPropertyName].score -= 10;

    }

    // Disable the quizzer if they fouled out (this code will literally never be used because no quizzer has ever fouled out in tht history of quizzing)
    if (get("fouls") == 3) {

        set("enabled", false);

    }

    redrawScoreboard();

}

function teamFoul(team) {
    
    currentRoundState[team].fouls += 1;
    
    // If this is the team's second foul or more, deduct ten points from the team score
    if (currentRoundState[team].fouls >= 2) {

        currentRoundState[team].score -= 10;

    }
    
    redrawScoreboard();
    
}

function challenge() {
    
    appeal();
    challengeAction();
    refreshChallengeAndAppealButtons("disable");
    redrawScoreboard();
    
}

function appeal(teamNumber) {
    
    currentRoundState = previousRoundState;
    previousRoundState = null;
    
    refreshChallengeAndAppealButtons("disable");
    
    redrawScoreboard();
    
}

function refreshChallengeAndAppealButtons(toggleTo) {
    
    function enableButtons() {
        var team1Challenge = document.querySelector(".overviewContainer .team1 div.actionsContainer div:nth-child(3)");
        var team1Appeal = document.querySelector(".overviewContainer .team1 div.actionsContainer div:nth-child(4)");
        var team2Challenge = document.querySelector(".overviewContainer .team2 div.actionsContainer div:nth-child(3)");
        var team2Appeal = document.querySelector(".overviewContainer .team2 div.actionsContainer div:nth-child(4)");

        team1Challenge.classList.remove("disabled");
        team1Appeal.classList.remove("disabled");
        team2Challenge.classList.remove("disabled");
        team2Appeal.classList.remove("disabled");

        team1Challenge.onclick = function () {
            showConfirmationDialog("challenge", 1);
        };
        team1Appeal.onclick = function () {
            showConfirmationDialog("appeal", 1);
        };
        team2Challenge.onclick = function () {
            showConfirmationDialog("challenge", 2);
        };
        team2Appeal.onclick = function () {
            showConfirmationDialog("appeal", 2);
        };
    }
    
    function disableButtons() {
        var team1Challenge = document.querySelector(".overviewContainer .team1 div.actionsContainer div:nth-child(3)");
        var team1Appeal = document.querySelector(".overviewContainer .team1 div.actionsContainer div:nth-child(4)");
        var team2Challenge = document.querySelector(".overviewContainer .team2 div.actionsContainer div:nth-child(3)");
        var team2Appeal = document.querySelector(".overviewContainer .team2 div.actionsContainer div:nth-child(4)");

        team1Challenge.classList.add("disabled");
        team1Appeal.classList.add("disabled");
        team2Challenge.classList.add("disabled");
        team2Appeal.classList.add("disabled");

        team1Challenge.onclick = null;
        team1Appeal.onclick = null;
        team2Challenge.onclick = null;
        team2Appeal.onclick = null;
    }
    
    if (toggleTo === "enable") {
        enableButtons();
    } else if (toggleTo === "disable") {
        disableButtons();
    } else if (document.querySelector(".overviewContainer .team1 div.actionsContainer div:nth-child(3)").classList.contains("disabled")) {
        enableButtons();
    }
    
}

// Populate all the quizzer cards
for (var i = 0; i < 10; i++) {

    var card = document.createElement("div");
    card.classList.add("quizzerCard");
    card.classList.add("quizzer" + (i + 1) + "Card");
    card.classList.add("hidden");
    // Using IIFE to prevent variables being passed by reference in a closure
    (function (quizzerID) {
        card.onclick = function () {

            selectedQuizzer(quizzerID);

        };
    })(i + 1)

    var cardLabel = document.createElement("p");
    cardLabel.classList.add("cardLabel");

    card.appendChild(cardLabel);

    if (i < 5) {

        document.querySelector(".team1SelectionScreen").appendChild(card);

    } else {

        document.querySelector(".team2SelectionScreen").appendChild(card);

    }

}

window.addEventListener("load", function () {

    var recalledRoundState = localStorage.getItem("currentRoundState");

    if (recalledRoundState) {

        recalledRoundState = JSON.parse(recalledRoundState);

        currentRoundState = recalledRoundState;

        for (var i = 1; i <= 10; i++) {

            var numbers = getNumbersFromID(i);
            var currentQuizzer = currentRoundState[numbers.teamPropertyName][numbers.quizzerPropertyName]
            
            if (currentQuizzer.name !== null) {
                document.querySelector(".quizzer" + i + "Card").classList.remove("hidden");
                document.querySelector(".quizzer" + i + "Card .cardLabel").textContent = currentQuizzer.name;
            }

        }

        // Initial draw of the scoreboard
        redrawScoreboard();

        document.querySelector(".welcomeContainer").classList.add("hidden");
        document.querySelector(".mainContainer").classList.remove("hidden");

    }
    
    // Enable :active CSS on mobile Safari
    document.addEventListener("touchstart", function () {}, true);

});
