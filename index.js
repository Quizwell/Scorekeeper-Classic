var currentRoundState = {

    question: 1,
    team1: {
        name: null,
        color: null,
        score: 0,
        fouls: 0,
        errors: 0,
        uniqueJumps: 0,
        overturnedChallenges: 0,
    },
    team2: {
        name: null,
        color: null,
        score: 0,
        fouls: 0,
        errors: 0,
        uniqueJumps: 0,
        overturnedChallenges: 0,
    },
    useTeamColors: true,

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

    if ((window.navigator.userAgent.match(/iP(ad|hone)/i)) && !(window.navigator.userAgent.match(/CriOS/i)) && !window.navigator.standalone) {

        document.querySelector(".webClipPromptContainer").classList.remove("hidden");
        setTimeout(function () {
            document.querySelector(".webClipPromptContainer button.fullWidthButton").classList.remove("hidden");
        }, 600);

    } else {

        document.querySelector(".setupContainer").classList.remove("hiddenRight");
        setTimeout(function () {
            document.querySelector(".setupContainer button.fullWidthButton").classList.remove("hidden");
        }, 600);

    }
    
    setTimeout(function () {

        document.querySelector(".welcomeContainer").classList.add("hidden");

    }, 600);

}

function hideWebClipPromptScreen() {
    document.querySelector(".setupContainer").classList.remove("hiddenRight");
    
    setTimeout(function () {
        
        document.querySelector(".webClipPromptContainer").classList.add("hidden");
        document.querySelector(".setupContainer button.fullWidthButton").classList.remove("hidden");
        
    }, 600);

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

    document.querySelector(".team" + teamNumber + "SelectionScreen").classList.remove("hidden");

}

function hideSelectionScreen(teamNumber) {

    selectMode = null;

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

    var challengeErroneousInformationCheckbox = document.querySelector(".confirmationDialog .erroneousInformationCheckbox.challenge");
    var rebuttalErroneousInformationCheckbox = document.querySelector(".confirmationDialog .erroneousInformationCheckbox.rebuttal");
    challengeErroneousInformationCheckbox.classList.remove("checked");
    challengeErroneousInformationCheckbox.classList.add("hidden");
    rebuttalErroneousInformationCheckbox.classList.remove("checked");
    rebuttalErroneousInformationCheckbox.classList.add("hidden");

    switch (mode) {

        case "jump":
            var quizzerName = currentRoundState[numbers.teamPropertyName][numbers.quizzerPropertyName].name

            subtitle = "Jump - " + currentRoundState[numbers.teamPropertyName].name;
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

            subtitle = "Bonus - " + currentRoundState[numbers.teamPropertyName].name;
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
            subtitle = currentRoundState["team" + teamNumber].name;
            title = "Challenge";
            button1Text = "Overruled";
            button2Text = "Accepted";
            button1Function = function () {
                hideConfirmationDialog();

                // If applicable, grant a 10-point deduction for second or more overturned challenge
                var overturnedChallenges = ++currentRoundState["team" + teamNumber].overturnedChallenges;
                if (overturnedChallenges >= 2) {
                    currentRoundState["team" + teamNumber].score -= 10;
                }

                redrawScoreboard();
            };
            button2Function = function () {
                challenge(teamNumber);
            };
            challengeErroneousInformationCheckbox.classList.remove("hidden");
            rebuttalErroneousInformationCheckbox.classList.remove("hidden");
            break;
        case "appeal":
            subtitle = currentRoundState["team" + teamNumber].name;
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
            title = currentRoundState[numbers.teamPropertyName].name;
            button1Text = "Remove 10 Points";
            button2Text = "Add 10 Points";
            button1Function = function () {
                currentRoundState["team" + teamNumber].score -= 10;
                redrawScoreboard();
                hideConfirmationDialog();
            };
            button2Function = function () {
                currentRoundState["team" + teamNumber].score += 10;
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
                    localStorage.removeItem("currentRoundState");
                    localStorage.removeItem("previousRoundState");
                    localStorage.removeItem("challengeAction");
                    window.location.reload();
                }, 300);
            };
            break;
        case "bugReport":
            subtitle = "Bug Report"
            title = "Report a problem";
            document.querySelector(".confirmationDialog > p").textContent = "Found a bug? Is there a feature missing? Send us a bug report.";
            button1Text = "Cancel";
            button2Text = "Send Bug Report";
            button1Function = function () {
                hideConfirmationDialog();
            };
            button2Function = function () {
                hideConfirmationDialog();

                setTimeout(function () {
                    window.location.href = "mailto:wf426bxd5d@privaterelay.appleid.com?subject=Scorekeeper%3A%20Bug%20Report&body=Enter%20any%20details%20relating%20to%20your%20bug%20or%20feature%20request%20here%3A%0D%0A%0D%0A%0D%0A%0D%0A%0D%0A%0D%0A%0D%0A%0D%0A%2D%2D%2DPlease%20do%20not%20write%20below%20this%20line%2D%2D%2D%0D%0A%0D%0AcurrentRoundState%3A%20" + JSON.stringify(currentRoundState) + "%0D%0A%0D%0ApreviousRoundState%3A%20" + JSON.stringify(previousRoundState) + "%0D%0A%0D%0AchallengeAction%3A%20" + JSON.stringify(challengeAction);
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

    var teamInputs = document.querySelectorAll(".teamNameInput");
    var teamColorInputs = document.querySelectorAll(".teamColorInput");
    var quizzerInputs = document.querySelectorAll(".quizzerNameInput");

    var team1QuizzerInputsHaveValue = false;
    var team2QuizzerInputsHaveValue = false;
    for (var i = 0; i < quizzerInputs.length; i++) {
        if (quizzerInputs[i].value) {
            if (i < 5) {
                team1QuizzerInputsHaveValue = true;
            } else if (i >= 5) {
                team2QuizzerInputsHaveValue = true;
            }
        }
    }

    // If the user hasn't entered enough information, don't let them continue.
    if (
        !teamInputs[0].value ||
        !teamInputs[1].value ||
        !team1QuizzerInputsHaveValue ||
        !team2QuizzerInputsHaveValue
    ) {
        return;
    }

    currentRoundState.team1.name = teamInputs[0].value;
    currentRoundState.team2.name = teamInputs[1].value;

    currentRoundState.team1.color = teamColorInputs[0].value;
    currentRoundState.team2.color = teamColorInputs[1].value;
    
    currentRoundState.useTeamColors = document.querySelector(".setupContainer .useTeamColorsCheckbox").classList.contains("checked");

    for (var i = 0; i < quizzerInputs.length; i++) {

        var currentInput = quizzerInputs[i];

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
    
    // Remember that the user has used the app before
    localStorage.setItem("userHasUsedAppPreviously", "true");

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

    document.querySelector(".overviewContainer .team1 .teamName").textContent = currentRoundState.team1.name;
    document.querySelector(".overviewContainer .team2 .teamName").textContent = currentRoundState.team2.name;
    
    if (currentRoundState.useTeamColors) {
        
        document.querySelector(".overviewContainer .team1").style.backgroundColor = currentRoundState.team1.color;
        document.querySelector(".overviewContainer .team2").style.backgroundColor = currentRoundState.team2.color;

        // Get the constasting color for the team background
        var team1TextColor = getContrastingColor(currentRoundState.team1.color);
        var team2TextColor = getContrastingColor(currentRoundState.team2.color);

        document.querySelector(".overviewContainer .team1").style.color = team1TextColor;
        document.querySelector(".overviewContainer .team2").style.color = team2TextColor;
        
    }

    for (var i = 0; i < 10; i++) {

        var quizzerID = i + 1;

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

    // Save states and challenge action to localStorage
    localStorage.setItem("currentRoundState", JSON.stringify(currentRoundState));
    localStorage.setItem("previousRoundState", JSON.stringify(previousRoundState));
    localStorage.setItem("challengeAction", JSON.stringify(challengeAction));

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
    challengeAction = {
        functionName: "incorrect",
        arguments: [quizzerID, true],
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
    challengeAction = {
        functionName: "correct",
        arguments: [quizzerID]
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

function challenge(teamNumber) {

    appeal();

    var challengeErroneousInformation = document.querySelector(".confirmationDialog .erroneousInformationCheckbox.challenge").classList.contains("checked");
    var rebuttalErroneousInformation = document.querySelector(".confirmationDialog .erroneousInformationCheckbox.rebuttal").classList.contains("checked");

    // Execute challenge action
    window[challengeAction.functionName](...challengeAction.arguments);

    // If the challenge contained erroneous information, deduct ten points
    if (challengeErroneousInformation) {

        currentRoundState["team" + teamNumber].score -= 10;

    }

    // If the rebuttal contained erroneous information, deduct ten points from the opposite team's score.
    if (rebuttalErroneousInformation) {

        currentRoundState["team" + ((teamNumber == 1) ? 2 : 1)].score -= 10;

    }

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

function getContrastingColor(hexCode) {
    
    // If a leading # is provided, remove it
	if (hexCode.slice(0, 1) === '#') {
		hexCode = hexCode.slice(1);
	}

	// If a three-character hexcode, make six-character
	if (hexCode.length === 3) {
		hexCode = hexCode.split('').map(function (hex) {
			return hex + hex;
		}).join('');
	}

	// Convert to RGB value
	var r = parseInt(hexCode.substr(0,2),16);
	var g = parseInt(hexCode.substr(2,2),16);
	var b = parseInt(hexCode.substr(4,2),16);

	// Get YIQ ratio
	var yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;

	// Check contrast
	return (yiq >= 128) ? '#000000' : '#ffffff';
    
}

// Populate all the quizzer cards
for (var i = 0; i < 10; i++) {

    var quizzerID = i + 1;
    
    var card = document.createElement("div");
    card.classList.add("quizzerCard");
    card.classList.add("quizzer" + (i + 1) + "Card");
    card.classList.add("hidden");
    // Using IIFE to prevent variables being passed by reference in a closure
    (function (quizzerID) {
        card.onclick = function () {

            selectedQuizzer(quizzerID);

        };
    })(quizzerID)

    var cardSeatNumberLabel = document.createElement("p");
    cardSeatNumberLabel.textContent = (quizzerID <= 5) ? quizzerID : (quizzerID - 5);
    cardSeatNumberLabel.classList.add("cardSeatNumberLabel");
    
    var cardLabel = document.createElement("p");
    cardLabel.classList.add("cardLabel");

    card.appendChild(cardSeatNumberLabel);
    card.appendChild(cardLabel);

    if (i < 5) {

        document.querySelector(".team1SelectionScreen").appendChild(card);

    } else {

        document.querySelector(".team2SelectionScreen").appendChild(card);

    }

}

if (localStorage.getItem("userHasUsedAppPreviously") === "true") {
    
    var header = document.querySelector(".welcomeContainer h1");
    var text = document.querySelector(".welcomeContainer p");
    var button = document.querySelector(".welcomeContainer button");
    
    text.textContent = "Tap Next to start scorekeeping a round.";
    
}

// If the user holds down Shift, Option, and Control, autofill the setup screen with default values. (This is a feature to make it easier to debug and test the app)
window.addEventListener("keydown", function (e) {
    if (e.shiftKey &&
        e.altKey &&
        e.ctrlKey &&
        e.code == "KeyP"
    ) {

        var teamNameInputs = document.querySelectorAll(".teamNameInput");
        var quizzerNameInputs = document.querySelectorAll(".quizzerNameInput");

        teamNameInputs[0].value = "Team A";
        quizzerNameInputs[0].value = "A1";
        quizzerNameInputs[1].value = "A2";
        quizzerNameInputs[2].value = "A3";
        quizzerNameInputs[3].value = "A4";
        quizzerNameInputs[4].value = "A5";
        teamNameInputs[1].value = "Team B";
        quizzerNameInputs[5].value = "B1";
        quizzerNameInputs[6].value = "B2";
        quizzerNameInputs[7].value = "B3";
        quizzerNameInputs[8].value = "B4";

    }
});

window.addEventListener("load", function () {

    var recalledRoundState = localStorage.getItem("currentRoundState");
    var recalledPreviousRoundState = localStorage.getItem("previousRoundState");
    var recalledChallengeAction = localStorage.getItem("challengeAction");

    if (recalledPreviousRoundState) {
        previousRoundState = JSON.parse(recalledPreviousRoundState);
        challengeAction = JSON.parse(recalledChallengeAction);
        refreshChallengeAndAppealButtons("enable");
    }

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

    // Set up challenge erroneous information checkbox event listeners
    var challengeErroneousInformationCheckbox = document.querySelector(".confirmationDialog .erroneousInformationCheckbox.challenge");
    var rebuttalErroneousInformationCheckbox = document.querySelector(".confirmationDialog .erroneousInformationCheckbox.rebuttal");
    challengeErroneousInformationCheckbox.addEventListener("click", function () {
        challengeErroneousInformationCheckbox.classList.toggle("checked");
    });
    rebuttalErroneousInformationCheckbox.addEventListener("click", function () {
        rebuttalErroneousInformationCheckbox.classList.toggle("checked");
    });
    
    // Set up setup screen checkbox event listener
    var useTeamColorsCheckbox = document.querySelector(".setupContainer .useTeamColorsCheckbox");
    useTeamColorsCheckbox.addEventListener("click", function () {
        useTeamColorsCheckbox.classList.toggle("checked");
    });

    // Enable :active CSS on mobile Safari
    document.addEventListener("touchstart", function () {}, true);
    
    // Activate CSS transitions again
    document.body.classList.remove("preload");

});

// Register Service Worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/serviceWorker.js')
        .then(function (registration) {
            console.log('Registration successful, scope is:', registration.scope);
        })
        .catch(function (error) {
            console.log('Service worker registration failed, error:', error);
        });
}