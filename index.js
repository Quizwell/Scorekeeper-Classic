const SCOREKEEPER_VERSION = 1.1;

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
        seatOrder: [1, 2, 3, 4, 5]
    },
    team2: {
        name: null,
        color: null,
        score: 0,
        fouls: 0,
        errors: 0,
        uniqueJumps: 0,
        overturnedChallenges: 0,
        seatOrder: [1, 2, 3, 4, 5]
    },
    useTeamColors: true,
    allowFiveSeatedQuizzers: false,
    challengeAndAppealEnabled: false,
    enableQuestionTypeTracking: false,

};
var previousRoundState = null;
var challengeAction = null;
var scoresheetData = {
    questions: []
};
var questionTypeData = {
    
    order: [],
    G: {
        name: "General",
        used: 0,
        max: 11
    },
    A: {
        name: "According To",
        used: 0,
        max: 4
    },
    V: {
        name: "Verse",
        used: 0,
        max: 1
    },
    R: {
        name: "Reference",
        used: 0,
        max: 1
    },
    Q: {
        name: "Quote",
        used: 0,
        max: 1
    },
    X: {
        name: "Context",
        used: 0,
        max: 1
    },
    S: {
        name: "Situation/Book and Chapter",
        used: 0,
        max: 1
    },
    
}

var selectMode = null;

var selectedQuestionType = null;
var selectTeam = null;
var desktopSelectedQuizzer = null;

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

function showQuestionTypeSelectionScreen() {

    document.querySelector(".questionTypeSelectionScreen").classList.remove("hidden");

    document.querySelector(".selectionScreenOverlay").classList.remove("hidden");
    requestAnimationFrame(function () {
        document.querySelector(".selectionScreenOverlay").classList.remove("transparent");
    });

}

function hideQuestionTypeSelectionScreen(teamNumber) {

    document.querySelector(".questionTypeSelectionScreen").classList.add("hidden");

    document.querySelector(".selectionScreenOverlay").classList.add("transparent");
    setTimeout(function () {
        document.querySelector(".selectionScreenOverlay").classList.add("hidden");
    }, 300);

}

function showQuestionTypeOverviewScreen() {

    document.querySelector(".questionTypeOverviewScreen").classList.remove("hidden");

    document.querySelector(".selectionScreenOverlay").classList.remove("hidden");
    requestAnimationFrame(function () {
        document.querySelector(".selectionScreenOverlay").classList.remove("transparent");
    });

}

function hideQuestionTypeOverviewScreen(teamNumber) {

    document.querySelector(".questionTypeOverviewScreen").classList.add("hidden");

    document.querySelector(".selectionScreenOverlay").classList.add("transparent");
    setTimeout(function () {
        document.querySelector(".selectionScreenOverlay").classList.add("hidden");
    }, 300);

}

function showSelectionScreen(mode, teamNumber) {

    selectMode = mode;

    var otherButton = document.querySelector(".team" + teamNumber + "SelectionScreen .miscellaneousCard");
    var otherButtonLabel = document.querySelector(".team" + teamNumber + "SelectionScreen .miscellaneousCard p.cardLabel");

    var subbedOutQuizzerCard = document.querySelector(".team" + teamNumber + "SelectionScreen .quizzerCard:last-child");

    otherButton.classList.remove("inactive");

    if (!currentRoundState.allowFiveSeatedQuizzers) {
        subbedOutQuizzerCard.classList.add("hidden");
    }

    if (mode === "jump") {

        otherButtonLabel.textContent = "No Jump";
        document.querySelector(".team" + teamNumber + "SelectionScreen p.screenTitle").textContent = "Jump";

    } else if (mode === "foul") {

        otherButtonLabel.textContent = "Team Foul";
        document.querySelector(".team" + teamNumber + "SelectionScreen p.screenTitle").textContent = "Foul";

        // Show subbed out quizzer
        if (currentRoundState["team" + teamNumber].quizzer5.name) {
            subbedOutQuizzerCard.classList.remove("hidden");
        }

    } else if (mode === "substitution") {

        var subbedOutQuizzerNumber = currentRoundState["team" + teamNumber].seatOrder[4];

        otherButtonLabel.textContent = currentRoundState["team" + teamNumber]["quizzer" + subbedOutQuizzerNumber].name + " (Subbed out)";
        otherButton.classList.add("inactive");

        document.querySelector(".team" + teamNumber + "SelectionScreen p.screenTitle").textContent = "Substitution";

    } else {
        return;
    }

    document.querySelector(".team" + teamNumber + "SelectionScreen").classList.remove("hidden");

    document.querySelector(".selectionScreenOverlay").classList.remove("hidden");
    requestAnimationFrame(function () {
        document.querySelector(".selectionScreenOverlay").classList.remove("transparent");
    });

}

function hideSelectionScreen(teamNumber) {

    document.querySelector(".team" + teamNumber + "SelectionScreen").classList.add("hidden");

    if (!currentRoundState.enableQuestionTypeTracking || (selectMode !== "jump")) {
        document.querySelector(".selectionScreenOverlay").classList.add("transparent");
        setTimeout(function () {
            document.querySelector(".selectionScreenOverlay").classList.add("hidden");
        }, 300);
    }
    
    selectMode = null;

}

function hideChangelogScreen() {
    
    document.querySelector(".changelogScreen").classList.add("hidden");
    
}

function jumpButton(teamNumber) {
    
    if (currentRoundState.enableQuestionTypeTracking && (currentRoundState.question <= 20)) {
        selectTeam = teamNumber;
        showQuestionTypeSelectionScreen();
    } else {
        showSelectionScreen("jump", teamNumber);
    }
    
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

                scoresheetData.questions[currentRoundState.question - 1].bonusQuizzerID = quizzerID;
                scoresheetData.questions[currentRoundState.question - 1].bonusEvent = "incorrect";

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

                if (currentRoundState.question <= 20) {
                    scoresheetData.questions[currentRoundState.question - 1] = {
                        event: "noJump"
                    }
                }
                
                if (currentRoundState.enableQuestionTypeTracking && (currentRoundState.question <= 20)) {
                    
                    logQuestionType(selectedQuestionType);
                    
                }

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
                    localStorage.removeItem("scoresheetData");
                    localStorage.removeItem("questionTypeData");
                    window.location.reload();
                }, 300);
            };
            break;
        case "bugReport":
            subtitle = "Report a problem"
            title = "Bug Report";
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
    document.querySelector(".confirmationDialog").style.transform = "translate(-50%, 0)";
    document.querySelector(".overlay").style.display = "block";
    requestAnimationFrame(function () {
        document.querySelector(".overlay").style.opacity = 0.25;
    });

}

function hideConfirmationDialog() {

    // Hide the confirmation dialog element and the overlay
    document.querySelector(".confirmationDialog").style.transform = "translate(-50%, 125%)";
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
        !teamInputs[1].value
    ) {
        bannerNotificationManager.showMessage("Can't Start Round", "Each team must have a name");
        return;
    }

    if (
        !team1QuizzerInputsHaveValue ||
        !team2QuizzerInputsHaveValue
    ) {
        bannerNotificationManager.showMessage("Can't Start Round", "Each team must have quizzers");
        return;
    }

    currentRoundState.team1.name = teamInputs[0].value;
    currentRoundState.team2.name = teamInputs[1].value;

    currentRoundState.team1.color = teamColorInputs[0].value;
    currentRoundState.team2.color = teamColorInputs[1].value;

    currentRoundState.useTeamColors = document.querySelector(".setupContainer .useTeamColorsCheckbox").classList.contains("checked");
    currentRoundState.allowFiveSeatedQuizzers = document.querySelector(".setupContainer .allowFivePersonQuizzingCheckbox").classList.contains("checked");
    currentRoundState.enableQuestionTypeTracking = document.querySelector(".setupContainer .questionTypeTrackingCheckbox").classList.contains("checked");

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

        document.querySelector(".selectionScreen .quizzer" + quizzerID + "Card").classList.remove("hidden");
        document.querySelector(".selectionScreen .quizzer" + quizzerID + "Card .cardLabel").textContent = currentInput.value;

        document.querySelector(".quizzerCardsContainer .quizzer" + quizzerID + "Card").classList.remove("hidden");
        document.querySelector(".quizzerCardsContainer .quizzer" + quizzerID + "Card .cardLabel").textContent = currentInput.value;

    }
    
    if (currentRoundState.enableQuestionTypeTracking) {

        document.querySelector(".overviewContainer .headerButtonsContainer .questionTypeTrackingButton").classList.remove("hidden");

    }

    // Initial draw of the scoreboard
    redrawScoreboard();

    if (window.matchMedia("only screen and (min-width:900px)").matches) {

        document.querySelector(".welcomeScreensContainer").style.opacity = 0;
        document.querySelector(".welcomeScreensOverlay").style.opacity = 0;

        setTimeout(function () {

            document.querySelector(".welcomeScreensContainer").classList.add("hidden");
            document.querySelector(".welcomeScreensOverlay").classList.add("hidden");

        }, 200);

    } else {

        document.querySelector(".setupContainer").classList.add("hidden");

    }

    // Remember that the user has used the app before
    localStorage.setItem("userHasUsedAppPreviously", "true");

}

function redrawScoreboard() {
    
    for (var i = 0; i < 5; i++) {
        
        var team1Quizzer = document.querySelector(".overviewContainer .team1 .quizzerCardsContainer .quizzer" + (i + 1) + "Card");
        var team2Quizzer = document.querySelector(".overviewContainer .team2 .quizzerCardsContainer .quizzer" + (i + 6) + "Card");
        
        if (
            team1Quizzer.classList.contains("hidden") &&
            !team2Quizzer.classList.contains("hidden")
        ) {
            
            team1Quizzer.classList.remove("hidden");
            team1Quizzer.classList.add("invisible");
            
        } else if (
            !team1Quizzer.classList.contains("hidden") &&
            team2Quizzer.classList.contains("hidden")
        ) {
            
            team2Quizzer.classList.remove("hidden");
            team2Quizzer.classList.add("invisible");
            
        } else if (
            team1Quizzer.classList.contains("hidden") && 
            team2Quizzer.classList.contains("hidden")
        ) {
            
            var futureQuizzersAvailable = false;
            for (var ii = 0; ii < (5 - i); ii++) {
                
                var team1NextQuizzer = document.querySelector(".overviewContainer .team1 .quizzerCardsContainer .quizzer" + (i + ii + 1) + "Card");
                var team2NextQuizzer = document.querySelector(".overviewContainer .team2 .quizzerCardsContainer .quizzer" + (i + ii + 6) + "Card");
                
                if (
                    !team1NextQuizzer.classList.contains("hidden") ||
                    !team2NextQuizzer.classList.contains("hidden")
                ) {
                    futureQuizzersAvailable = true;
                }
                
            }
            
            if (futureQuizzersAvailable) {
                
                team1Quizzer.classList.remove("hidden");
                team1Quizzer.classList.add("invisible");
                team2Quizzer.classList.remove("hidden");
                team2Quizzer.classList.add("invisible");
                
            }
            
        }
        
    }

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

        document.querySelector(".overviewContainer .team1").style.background = currentRoundState.team1.color;
        document.querySelector(".overviewContainer .team2").style.background = currentRoundState.team2.color;

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

        var quizzerSelectionElement = document.querySelector(".selectionScreen .quizzer" + quizzerID + "Card");
        var quizzerSelectionElementLabel = document.querySelector(".selectionScreen .quizzer" + quizzerID + "Card p.cardLabel");

        var quizzerSelectionElementDesktop = document.querySelector(".quizzerCardsContainer .quizzer" + quizzerID + "Card");
        var quizzerSelectionElementLabelDesktop = document.querySelector(".quizzerCardsContainer .quizzer" + quizzerID + "Card p.cardLabel");
        var quizzerSelectionElementScoreDesktop = document.querySelector(".quizzerCardsContainer .quizzer" + quizzerID + "Card p.cardScore");

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

                quizzerSelectionElementDesktop.classList.add("disabled");
                quizzerSelectionElementDesktop.onclick = null;

                var disabledReason;
                if (currentQuizzer.correct == 4) {
                    disabledReason = "Quizzed Out";
                } else if (currentQuizzer.incorrect == 3) {
                    disabledReason = "Errored Out";
                } else if (currentQuizzer.fouls == 3) {
                    disabledReason = "Fouled Out";
                }

                quizzerSelectionElementLabel.textContent += " - " + disabledReason;
                quizzerSelectionElementLabelDesktop.textContent += " - " + disabledReason;

            }

            quizzerStatusStringElement.style.opacity = 0.5;

        } else if (currentQuizzer.enabled && quizzerSelectionElement.classList.contains("disabled")) {

            quizzerSelectionElement.classList.remove("disabled");
            (function (quizzerID) {
                quizzerSelectionElement.onclick = function () {
                    selectedQuizzer(quizzerID);
                };
            })(quizzerID)

            quizzerSelectionElementDesktop.classList.remove("disabled");
            (function (quizzerID) {
                
                if (currentRoundState.enableQuestionTypeTracking && (currentRoundState.question <= 20)) {
                    selectTeam = (quizzerID <= 5) ? 1 : 2;
                    desktopSelectedQuizzer = quizzerID;
                    showQuestionTypeSelectionScreen();
                } else {
                    showConfirmationDialog("jump", (quizzerID <= 5) ? 1 : 2, quizzerID);
                }
                
            })(quizzerID)

            quizzerSelectionElementLabel.textContent = currentQuizzer.name;
            quizzerSelectionElementLabelDesktop.textContent = currentQuizzer.name;

            quizzerStatusStringElement.style.opacity = 1;

        }

        overviewScreenTeamStatusContainer.appendChild(quizzerStatusStringElement);
        overviewScreenTeamStatusContainer.appendChild(document.createElement("br"));

        var quizzerStatusStringDesktop = currentQuizzer.correct + "/" + currentQuizzer.incorrect;
        quizzerSelectionElementScoreDesktop.textContent = quizzerStatusStringDesktop;

    }

    document.querySelector(".overviewContainer .team1 .teamScore").textContent = currentRoundState.team1.score;
    document.querySelector(".overviewContainer .team2 .teamScore").textContent = currentRoundState.team2.score;

    if (currentRoundState.question <= 20) {

        document.querySelector(".overviewContainer .questionNumber").textContent = "Question " + currentRoundState.question;

    } else if (currentRoundState.question > 20) {

        if (
            (currentRoundState.team1.score == currentRoundState.team2.score) &&
            !currentRoundState.team1.hasWonTiebreaker && !currentRoundState.team2.hasWonTiebreaker
        ) {

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

        } else if (currentRoundState.team1.hasWonTiebreaker || currentRoundState.team2.hasWonTiebreaker) {

            // One team won the tiebreaker
            var winningTeamNumber = currentRoundState.team1.hasWonTiebreaker ? 1 : 2;

            var team1Buttons = document.querySelectorAll(".overviewContainer .team1 .actionsContainer div");
            var team2Buttons = document.querySelectorAll(".overviewContainer .team2 .actionsContainer div");
            for (var i = 0; i < team1Buttons.length; i++) {
                team1Buttons[i].classList.add("disabled");
                team1Buttons[i].onclick = null;
                team2Buttons[i].classList.add("disabled");
                team2Buttons[i].onclick = null;
            }

            document.querySelector(".overviewContainer .team1 .quizzerCardsContainer").style.pointerEvents = "none";
            document.querySelector(".overviewContainer .team2 .quizzerCardsContainer").style.pointerEvents = "none";

            document.querySelector(".overviewContainer .screenTitle").textContent = "End of Round";
            document.querySelector(".overviewContainer .screenTitle").onclick = null;

            bannerNotificationManager.showMessage("End of Round", "Team " + winningTeamNumber + " wins");

        } else {

            // One team won without a tiebreaker
            var winningTeamNumber = (currentRoundState.team1.score > currentRoundState.team2.score) ? 1 : 2;

            var team1Buttons = document.querySelectorAll(".overviewContainer .team1 .actionsContainer div");
            var team2Buttons = document.querySelectorAll(".overviewContainer .team2 .actionsContainer div");
            for (var i = 0; i < 4; i++) {
                team1Buttons[i].classList.add("disabled");
                team1Buttons[i].onclick = null;
                team2Buttons[i].classList.add("disabled");
                team2Buttons[i].onclick = null;
            }

            document.querySelector(".overviewContainer .team1 .quizzerCardsContainer").style.pointerEvents = "none";
            document.querySelector(".overviewContainer .team2 .quizzerCardsContainer").style.pointerEvents = "none";

            document.querySelector(".overviewContainer .screenTitle").textContent = "End of Round";
            document.querySelector(".overviewContainer .screenTitle").onclick = null;

            bannerNotificationManager.showMessage("End of Round", "Team " + winningTeamNumber + " wins");

        }

    }

    if (currentRoundState.allowFiveSeatedQuizzers) {

        document.querySelector(".optionsMenu div:nth-of-type(1)").classList.add("hidden");

    }

    scoresheet.redraw();
    redrawSeatOrder();

    // Save states and challenge action to localStorage
    localStorage.setItem("currentRoundState", JSON.stringify(currentRoundState));
    localStorage.setItem("previousRoundState", JSON.stringify(previousRoundState));
    localStorage.setItem("challengeAction", JSON.stringify(challengeAction));
    localStorage.setItem("scoresheetData", JSON.stringify(scoresheetData));

}

function redrawSeatOrder() {

    // Redraw selection screen cards

    var team1QuizzerSelectionCards = document.querySelectorAll(".team1SelectionScreen .quizzerCard");
    var team1QuizzerSelectionCardSeatLabels = document.querySelectorAll(".team1SelectionScreen .quizzerCard .cardSeatNumberLabel");
    var team1QuizzerSelectionCardLabels = document.querySelectorAll(".team1SelectionScreen .quizzerCard .cardLabel");

    for (var i = 0; i < 5; i++) {

        var currentQuizzerNumber = currentRoundState.team1.seatOrder[i];

        //team1QuizzerSelectionCardSeatLabels[i].textContent = currentQuizzerNumber;
        team1QuizzerSelectionCardLabels[i + 1].textContent = currentRoundState.team1["quizzer" + currentQuizzerNumber].name;
        (function (currentQuizzerNumber) {
            team1QuizzerSelectionCards[i + 1].onclick = function () {
                selectedQuizzer(currentQuizzerNumber);
            }
        })(currentQuizzerNumber)

    }

    var team2QuizzerSelectionCards = document.querySelectorAll(".team2SelectionScreen .quizzerCard");
    var team2QuizzerSelectionCardSeatLabels = document.querySelectorAll(".team2SelectionScreen .quizzerCard .cardSeatNumberLabel");
    var team2QuizzerSelectionCardLabels = document.querySelectorAll(".team2SelectionScreen .quizzerCard .cardLabel");

    for (var i = 0; i < 5; i++) {

        var currentQuizzerNumber = currentRoundState.team2.seatOrder[i];

        //team2QuizzerSelectionCardSeatLabels[i].textContent = currentQuizzerNumber;
        team2QuizzerSelectionCardLabels[i + 1].textContent = currentRoundState.team2["quizzer" + currentQuizzerNumber].name;
        (function (currentQuizzerNumber) {
            team2QuizzerSelectionCards[i + 1].onclick = function () {
                selectedQuizzer(currentQuizzerNumber + 5);
            }
        })(currentQuizzerNumber)

    }

    // Redraw scoreboard quizzer cards (for desktop)

    var team1OverviewQuizzerCards = document.querySelectorAll(".overviewContainer .team1 .quizzerCardsContainer .quizzerCard");
    var team1OverviewQuizzerCardSeatLabels = document.querySelectorAll(".overviewContainer .team1 .quizzerCardsContainer .quizzerCard .cardSeatNumberLabel");
    var team1OverviewQuizzerCardLabels = document.querySelectorAll(".overviewContainer .team1 .quizzerCardsContainer .quizzerCard .cardLabel");
    var team1OverviewQuizzerCardScores = document.querySelectorAll(".overviewContainer .team1 .quizzerCardsContainer .quizzerCard .cardScore");
    for (var i = 0; i < 5; i++) {

        var currentQuizzerNumber = currentRoundState.team1.seatOrder[i];
        var currentQuizzerScore = currentRoundState.team1["quizzer" + currentQuizzerNumber].correct + "/" + currentRoundState.team1["quizzer" + currentQuizzerNumber].incorrect;

        //team1OverviewQuizzerCardSeatLabels[i].textContent = currentQuizzerNumber;
        team1OverviewQuizzerCardLabels[i].textContent = currentRoundState.team1["quizzer" + currentQuizzerNumber].name;
        team1OverviewQuizzerCardScores[i].textContent = currentQuizzerScore;
        (function (currentQuizzerNumber) {
            team1OverviewQuizzerCards[i].onclick = function () {
                
                if (currentRoundState.enableQuestionTypeTracking) {
                    selectTeam = 1;
                    desktopSelectedQuizzer = currentQuizzerNumber;
                    showQuestionTypeSelectionScreen();
                } else {
                    showConfirmationDialog("jump", 1, currentQuizzerNumber);
                }
                
            }
        })(currentQuizzerNumber)

    }
    // Disable seat 5
    if (!currentRoundState.allowFiveSeatedQuizzers) {
        team1OverviewQuizzerCards[4].classList.add("disabled");
        team1OverviewQuizzerCards[4].style.pointerEvents = "none";
    }

    var team2OverviewQuizzerCards = document.querySelectorAll(".overviewContainer .team2 .quizzerCardsContainer .quizzerCard");
    var team2OverviewQuizzerCardSeatLabels = document.querySelectorAll(".overviewContainer .team2 .quizzerCardsContainer .quizzerCard .cardSeatNumberLabel");
    var team2OverviewQuizzerCardLabels = document.querySelectorAll(".overviewContainer .team2 .quizzerCardsContainer .quizzerCard .cardLabel");
    var team2OverviewQuizzerCardScores = document.querySelectorAll(".overviewContainer .team2 .quizzerCardsContainer .quizzerCard .cardScore");
    for (var i = 0; i < 5; i++) {

        var currentQuizzerNumber = currentRoundState.team2.seatOrder[i];
        var currentQuizzerScore = currentRoundState.team2["quizzer" + currentQuizzerNumber].correct + "/" + currentRoundState.team2["quizzer" + currentQuizzerNumber].incorrect;

        //team2OverviewQuizzerCardSeatLabels[i].textContent = currentQuizzerNumber;
        team2OverviewQuizzerCardLabels[i].textContent = currentRoundState.team2["quizzer" + currentQuizzerNumber].name;
        team2OverviewQuizzerCardScores[i].textContent = currentQuizzerScore;
        (function (currentQuizzerNumber) {
            team2OverviewQuizzerCards[i].onclick = function () {
                
                if (currentRoundState.enableQuestionTypeTracking && (currentRoundState.question <= 20)) {
                    selectTeam = 2;
                    desktopSelectedQuizzer = currentQuizzerNumber + 5;
                    showQuestionTypeSelectionScreen();
                } else {
                    showConfirmationDialog("jump", 2, currentQuizzerNumber + 5);
                }
                
            }
        })(currentQuizzerNumber)

    }
    // Disable seat 5
    if (!currentRoundState.allowFiveSeatedQuizzers) {
        team2OverviewQuizzerCards[4].classList.add("disabled");
        team2OverviewQuizzerCards[4].style.pointerEvents = "none";
    }

}

function redrawQuestionTypeUI() {
    
    localStorage.setItem("questionTypeData", JSON.stringify(questionTypeData));
    
    var types = ["G", "A", "V", "R", "Q", "X", "S"];
    
    // Update the "used" values on the question type selection screen
    for (var i = 0; i < types.length; i++) {
        
        var currentTypeObject = questionTypeData[types[i]];
        var currentTypeCard = document.querySelector(".questionTypeSelectionScreen .questionTypeCardsContainer ." + types[i]);
        var currentTypeCardUsedText = document.querySelector(".questionTypeSelectionScreen .questionTypeCardsContainer ." + types[i] + " p.used");
        
        currentTypeCardUsedText.textContent = "Used: " + currentTypeObject.used + "/" + currentTypeObject.max;
        
        if (currentTypeObject.used >= currentTypeObject.max) {
            currentTypeCard.classList.add("disabled");
        }
        
    }
    
    // Update the question type overview screen
    for (var i = 0; i < types.length; i++) {
        
        var currentTypeObject = questionTypeData[types[i]];
        var currentTypeCard = document.querySelector(".questionTypeOverviewScreen .questionTypeCardsContainer ." + types[i]);
        var currentTypeCardUsedText = document.querySelector(".questionTypeOverviewScreen .questionTypeCardsContainer ." + types[i] + " p.used");
        var currentTypeCardRemainingText = document.querySelector(".questionTypeOverviewScreen .questionTypeCardsContainer ." + types[i] + " p.remaining");
        
        currentTypeCardUsedText.textContent = "Used: " + currentTypeObject.used + "/" + currentTypeObject.max;
        currentTypeCardRemainingText.textContent = (currentTypeObject.max - currentTypeObject.used) + " Remaining";
        
        if (currentTypeObject.used >= currentTypeObject.max) {
            currentTypeCard.classList.add("disabled");
            currentTypeCardRemainingText.textContent = "All questions used"
        }
        
    }
    
}

var scoresheet = {

    tableTitle: document.querySelector(".scoresheetContainer h1"),

    team1NameCell: document.querySelector(".scoresheet .team1Header .teamName"),
    team2NameCell: document.querySelector(".scoresheet .team2Header .teamName"),

    team1FoulsCell: document.querySelector(".scoresheet .team1RunningTotal td"),
    team2FoulsCell: document.querySelector(".scoresheet .team2RunningTotal td"),

    team1QuizzerRows: [
        document.querySelector(".scoresheet .quizzer1").children,
        document.querySelector(".scoresheet .quizzer2").children,
        document.querySelector(".scoresheet .quizzer3").children,
        document.querySelector(".scoresheet .quizzer4").children,
        document.querySelector(".scoresheet .quizzer5").children,
    ],
    team2QuizzerRows: [
        document.querySelector(".scoresheet .quizzer6").children,
        document.querySelector(".scoresheet .quizzer7").children,
        document.querySelector(".scoresheet .quizzer8").children,
        document.querySelector(".scoresheet .quizzer9").children,
        document.querySelector(".scoresheet .quizzer10").children,
    ],

    team1TotalsCells: [
        document.querySelector(".scoresheet .quizzer1 td:last-child"),
        document.querySelector(".scoresheet .quizzer2 td:last-child"),
        document.querySelector(".scoresheet .quizzer3 td:last-child"),
        document.querySelector(".scoresheet .quizzer4 td:last-child"),
        document.querySelector(".scoresheet .quizzer5 td:last-child"),
        document.querySelector(".scoresheet .team1RunningTotal td:last-child")
    ],
    team2TotalsCells: [
        document.querySelector(".scoresheet .quizzer6 td:last-child"),
        document.querySelector(".scoresheet .quizzer7 td:last-child"),
        document.querySelector(".scoresheet .quizzer8 td:last-child"),
        document.querySelector(".scoresheet .quizzer9 td:last-child"),
        document.querySelector(".scoresheet .quizzer10 td:last-child"),
        document.querySelector(".scoresheet .team2RunningTotal td:last-child")
    ],

    team1RunningTotalRow: document.querySelectorAll(".scoresheet .team1RunningTotal td"),
    team2RunningTotalRow: document.querySelectorAll(".scoresheet .team2RunningTotal td"),

    getQuizzerRow: function (id) {

        var teamNumber = (id <= 5) ? 1 : 2;
        var quizzerNumber = (id <= 5) ? id : (id - 5);
        var quizzerIndex = quizzerNumber - 1;

        return this["team" + teamNumber + "QuizzerRows"][quizzerIndex];

    },

    redraw: function () {

        this.clear();

        // Set the table title
        this.tableTitle.textContent = currentRoundState.team1.name + " vs. " + currentRoundState.team2.name;

        // Set the team names
        this.team1NameCell.textContent = currentRoundState.team1.name;
        this.team2NameCell.textContent = currentRoundState.team2.name;

        // Set the quizzer names
        for (var i = 0; i < this.team1QuizzerRows.length; i++) {
            this.team1QuizzerRows[i][0].textContent = currentRoundState.team1["quizzer" + (i + 1)].name;
        }
        for (var i = 0; i < this.team2QuizzerRows.length; i++) {
            this.team2QuizzerRows[i][0].textContent = currentRoundState.team2["quizzer" + (i + 1)].name;
        }

        // Set the foul values
        this.team1FoulsCell.textContent = "Fouls: " + currentRoundState.team1.fouls;
        this.team2FoulsCell.textContent = "Fouls: " + currentRoundState.team2.fouls;

        // Fill in each question
        for (var i = 0; i < scoresheetData.questions.length; i++) {

            var currentQuestion = scoresheetData.questions[i];

            if ((i + 1) <= 20) {
                this.team1RunningTotalRow[i + 1].textContent = currentQuestion.team1Score;
                this.team2RunningTotalRow[i + 1].textContent = currentQuestion.team2Score;
            } else {
                this.team1RunningTotalRow[i + 1].textContent = this.team1RunningTotalRow[i].textContent;
                this.team2RunningTotalRow[i + 1].textContent = this.team2RunningTotalRow[i].textContent;
            }

            if (currentQuestion.event == "noJump") {
                continue;
            }

            var quizzerRow = this.getQuizzerRow(currentQuestion.quizzerID);

            var text;
            switch (currentQuestion.event) {
                case "correct":
                    text = "20";
                    break;
                case "incorrect":
                case "tiebreakerIncorrect":
                    text = "E";
                    break;
                case "tiebreakerCorrect":
                    text = "C";
                    break;
            }

            quizzerRow[i + 1].textContent = text;

            if (currentQuestion.bonusEvent) {

                var bonusQuizzerRow = this.getQuizzerRow(currentQuestion.bonusQuizzerID);
                var bonusText;
                switch (currentQuestion.bonusEvent) {
                    case "correct":
                        bonusText = "B";
                        break;
                    case "incorrect":
                        bonusText = "-";
                        break;
                }

                bonusQuizzerRow[i + 1].textContent = bonusText;

            }

        }

        // Set final scores for each team
        this.team1RunningTotalRow[this.team1RunningTotalRow.length - 1].textContent = currentRoundState.team1.score;
        this.team2RunningTotalRow[this.team2RunningTotalRow.length - 1].textContent = currentRoundState.team2.score;

        // Set final scores for each quizzer
        for (var i = 0; i < this.team1QuizzerRows.length; i++) {
            this.team1QuizzerRows[i][this.team1RunningTotalRow.length - 1].textContent = currentRoundState.team1["quizzer" + (i + 1)].score;
        }
        for (var i = 0; i < this.team2QuizzerRows.length; i++) {
            this.team2QuizzerRows[i][this.team2RunningTotalRow.length - 1].textContent = currentRoundState.team2["quizzer" + (i + 1)].score;
        }

    },

    clear: function () {

        this.tableTitle.textContent = "";

        this.team1NameCell.textContent = "";
        this.team2NameCell.textContent = "";

        for (var i = 0; i < this.team1QuizzerRows.length; i++) {

            for (var ii = 0; ii < this.team1QuizzerRows[i].length; ii++) {

                this.team1QuizzerRows[i][ii].textContent = "";

            }

        }

        for (var i = 0; i < this.team2QuizzerRows.length; i++) {

            for (var ii = 0; ii < this.team2QuizzerRows[i].length; ii++) {

                this.team2QuizzerRows[i][ii].textContent = "";

            }

        }

        for (var i = 0; i < this.team1TotalsCells.length; i++) {

            this.team1TotalsCells[i].textContent = "";

        }
        for (var i = 0; i < this.team2TotalsCells.length; i++) {

            this.team2TotalsCells[i].textContent = "";

        }

        for (var i = 0; i < this.team1RunningTotalRow.length; i++) {

            this.team1RunningTotalRow[i].textContent = "";

        }
        for (var i = 0; i < this.team2RunningTotalRow.length; i++) {

            this.team2RunningTotalRow[i].textContent = "";

        }

    }

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
        } else if (selectMode === "substitution") {
            substitution(quizzerID);
        }

    }

    hideQuestionTypeSelectionScreen();
    
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

function selectQuestionType(questionType) {
    
    selectedQuestionType = questionType;
    if (desktopSelectedQuizzer == "noJump") {
        
        hideQuestionTypeSelectionScreen();
        showConfirmationDialog("noJump");
        
    } else if (desktopSelectedQuizzer) {
        
        hideQuestionTypeSelectionScreen();
        showConfirmationDialog("jump", selectTeam, desktopSelectedQuizzer);
        
    } else {
        
        showSelectionScreen("jump", selectTeam);
        
    }
    
}

function savePreviousRoundState() {

    previousRoundState = JSON.parse(JSON.stringify(currentRoundState));

}

function incrementQuestion() {

    if (currentRoundState.question <= 20) {
        scoresheetData.questions[currentRoundState.question - 1].team1Score = currentRoundState.team1.score;
        scoresheetData.questions[currentRoundState.question - 1].team2Score = currentRoundState.team2.score;
    }
    currentRoundState.question++;

}

function showScoreAdjustment(teamNumber) {

    showConfirmationDialog("scoreAdjustment", teamNumber);

}

function showNoJumpPrompt() {

    if (currentRoundState.enableQuestionTypeTracking && (currentRoundState.question <= 20)) {
        
        desktopSelectedQuizzer = "noJump";
        showQuestionTypeSelectionScreen();
        
    } else {
        
        showConfirmationDialog("noJump");
        
    }

}

function correct(quizzerID) {

    savePreviousRoundState();
    challengeAction = {
        functionName: "incorrect",
        arguments: [quizzerID, true],
    };
    
    if (currentRoundState.enableQuestionTypeTracking && (currentRoundState.question <= 20)) {
        logQuestionType(selectedQuestionType);
    }

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

    if (currentRoundState.question <= 20) {

        add("score", 20);

        currentRoundState[numbers.teamPropertyName].score += 20;

        // If this is the quizzer's first correct answer, add 1 to the team's uniqueJumps property
        if (get("correct") == 1) {

            currentRoundState[numbers.teamPropertyName].uniqueJumps++;

            // Then, if there are three or more jumps, add a n-person bonus
            if (currentRoundState[numbers.teamPropertyName].uniqueJumps >= 3) {

                currentRoundState[numbers.teamPropertyName].score += 10;

                var numberText;
                switch (currentRoundState[numbers.teamPropertyName].uniqueJumps) {
                    case 3:
                        numberText = "3rd";
                        break;
                    case 4:
                        numberText = "4th";
                        break;
                    case 5:
                        numberText = "5th";
                        break;
                }

                bannerNotificationManager.showMessage(numberText + " Person Bonus", "+10 Points");

            }

        }

        // Disable the quizzer if they quizzed out
        if (get("correct") == 4) {

            set("enabled", false);

            if (get("incorrect") == 0) {

                // Add 10 points to the individual and team scores if the quizzer quizzed out without error
                add("score", 10);
                currentRoundState[numbers.teamPropertyName].score += 10;

                bannerNotificationManager.showMessage("Quiz Out without Error", "+10 Points");

            } else {

                bannerNotificationManager.showMessage("Quiz Out", "4 Correct");

            }

        }

    }

    if (currentRoundState.question <= 20) {
        scoresheetData.questions[currentRoundState.question - 1] = {
            quizzerID: quizzerID,
            event: "correct",
        }
    } else {
        scoresheetData.questions[20] = {
            quizzerID: quizzerID,
            event: "tiebreakerCorrect",
        }
        currentRoundState[numbers.teamPropertyName].hasWonTiebreaker = true;
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
    
    if (currentRoundState.enableQuestionTypeTracking && (currentRoundState.question <= 20)) {
        logQuestionType(selectedQuestionType);
    }

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

    if (currentRoundState.question <= 20) {

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

            bannerNotificationManager.showMessage("Error Out", "-10 Points");

        } else if (currentRoundState[numbers.teamPropertyName].errors >= 5) {

            // Or if this is the fifth or more team error
            currentRoundState[numbers.teamPropertyName].score -= 10;

            bannerNotificationManager.showMessage("5+ Team Errors", "-10 Points");

        } else if (currentRoundState.question >= 16) {

            // Or if error deductions are in effect
            currentRoundState[numbers.teamPropertyName].score -= 10;

            bannerNotificationManager.showMessage("Error Deduction", "-10 Points");

        }

        scoresheetData.questions[currentRoundState.question - 1] = {
            quizzerID: quizzerID,
            event: "incorrect",
        }

    } else {

        scoresheetData.questions[20] = {
            quizzerID: quizzerID,
            event: "tiebreakerIncorrect",
        }
        currentRoundState[(numbers.teamNumber == 1) ? "team2" : "team1"].hasWonTiebreaker = true;

    }

    // Check to see if the bonus quizzer is enabled. If so, give him the bonus
    var bonusQuizzerID = getBonusQuizzer(quizzerID);
    var bonusQuizzerNumbers = getNumbersFromID(bonusQuizzerID);
    if (
        currentRoundState[bonusQuizzerNumbers.teamPropertyName][bonusQuizzerNumbers.quizzerPropertyName].enabled &&
        (currentRoundState.question <= 20)
    ) {

        redrawScoreboard();
        showConfirmationDialog("bonus", bonusQuizzerNumbers.teamNumber, bonusQuizzerID, dontRefreshButtons);

    } else {

        hideConfirmationDialog();
        incrementQuestion();
        refreshChallengeAndAppealButtons("enabled");
        redrawScoreboard();

    }

}

function getBonusQuizzer(quizzerID) {

    var numbers = getNumbersFromID(quizzerID);
    var bonusQuizzerSeatIndex = currentRoundState[numbers.teamPropertyName].seatOrder.indexOf(numbers.quizzerNumber);

    var oppositeTeamNumber = (numbers.teamNumber == 1) ? 2 : 1;
    var bonusQuizzerNumber = currentRoundState["team" + oppositeTeamNumber].seatOrder[bonusQuizzerSeatIndex];
    var bonusQuizzerID = (oppositeTeamNumber == 1) ? bonusQuizzerNumber : (bonusQuizzerNumber + 5);
    return bonusQuizzerID;

}

function bonus(quizzerID, dontRefreshButtons) {

    var numbers = getNumbersFromID(quizzerID);

    currentRoundState[numbers.teamPropertyName].score += 10;

    scoresheetData.questions[currentRoundState.question - 1].bonusQuizzerID = quizzerID;
    scoresheetData.questions[currentRoundState.question - 1].bonusEvent = "correct";

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

        bannerNotificationManager.showMessage("Foul Deduction", "-10 Points");

    }

    // Disable the quizzer if they fouled out (this code will literally never be used because no quizzer has ever fouled out in tht history of quizzing)
    if (get("fouls") == 3) {

        set("enabled", false);

        bannerNotificationManager.showMessage("Foul Out", "3 Fouls");

    }

    redrawScoreboard();

}

function teamFoul(team) {

    currentRoundState[team].fouls += 1;

    // If this is the team's second foul or more, deduct ten points from the team score
    if (currentRoundState[team].fouls >= 2) {

        currentRoundState[team].score -= 10;

        bannerNotificationManager.showMessage("Foul Deduction", "-10 Points");

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
        bannerNotificationManager.showMessage("Erroneous Challenge", "-10 Points");

    }

    // If the rebuttal contained erroneous information, deduct ten points from the opposite team's score.
    if (rebuttalErroneousInformation) {

        currentRoundState["team" + ((teamNumber == 1) ? 2 : 1)].score -= 10;
        bannerNotificationManager.showMessage("Erroneous Rebuttal", "-10 Points");

    }

    refreshChallengeAndAppealButtons("disable");
    redrawScoreboard();

}

function appeal(teamNumber) {

    currentRoundState = previousRoundState;
    previousRoundState = null;

    scoresheetData.questions.pop();
    
    removeLastQuestionTypeLog();

    // Re-enable UI buttons that may have been disabled if the round had ended
    var team1Buttons = document.querySelectorAll(".overviewContainer .team1 .actionsContainer div");
    var team2Buttons = document.querySelectorAll(".overviewContainer .team2 .actionsContainer div");
    for (var i = 0; i < team1Buttons.length; i++) {
        team1Buttons[i].classList.remove("disabled");
        team2Buttons[i].classList.remove("disabled");
    }

    team1Buttons[0].onclick = function () {
        showSelectionScreen("jump", 1);
    }
    team1Buttons[1].onclick = showNoJumpPrompt;
    team1Buttons[2].onclick = function () {
        showSelectionScreen("foul", 1);
    }

    team2Buttons[0].onclick = function () {
        showSelectionScreen("jump", 2);
    }
    team2Buttons[1].onclick = showNoJumpPrompt;
    team2Buttons[2].onclick = function () {
        showSelectionScreen("foul", 2);
    }

    document.querySelector(".overviewContainer .team1 .quizzerCardsContainer").style.pointerEvents = "auto";
    document.querySelector(".overviewContainer .team2 .quizzerCardsContainer").style.pointerEvents = "auto";

    document.querySelector(".overviewContainer .screenTitle").onclick = showNoJumpPrompt;

    refreshChallengeAndAppealButtons("disable");

    redrawScoreboard();

}

function substitution(quizzerID) {

    var numbers = getNumbersFromID(quizzerID);
    var teamObject = currentRoundState[numbers.teamPropertyName];

    var selectedQuizzerIndex = teamObject.seatOrder.indexOf(numbers.quizzerNumber);
    var temp = teamObject.seatOrder[selectedQuizzerIndex];
    teamObject.seatOrder[selectedQuizzerIndex] = teamObject.seatOrder[4];
    teamObject.seatOrder[4] = temp;

    redrawSeatOrder();
    localStorage.setItem("currentRoundState", JSON.stringify(currentRoundState));

}

function refreshChallengeAndAppealButtons(toggleTo) {

    function enableButtons() {
        currentRoundState.challengeAndAppealEnabled = true;
    }

    function disableButtons() {
        currentRoundState.challengeAndAppealEnabled = false;
    }

    if (toggleTo === "enable") {
        enableButtons();
    } else if (toggleTo === "disable") {
        disableButtons();
    } else if (document.querySelector(".overviewContainer .team1 div.actionsContainer div:nth-child(4)").classList.contains("disabled")) {
        enableButtons();
    }

}

function showTeamOptionsMenu(teamNumber) {
    
    if (currentRoundState["team" + teamNumber].quizzer5.name) {
        document.querySelector(".optionsMenu div:nth-child(2)").classList.remove("hidden");
    } else {
        document.querySelector(".optionsMenu div:nth-child(2)").classList.add("hidden");
    }

    var optionsMenu = document.querySelector(".optionsMenu");

    optionsMenu.children[1].onclick = function () {
        hideTeamOptionsMenu();
        showSelectionScreen("substitution", teamNumber);
    };

    if (currentRoundState.challengeAndAppealEnabled) {
        optionsMenu.children[2].onclick = function () {
            hideTeamOptionsMenu(true);
            showConfirmationDialog("challenge", teamNumber);
        };
        optionsMenu.children[3].onclick = function () {
            hideTeamOptionsMenu(true);
            showConfirmationDialog("appeal", teamNumber);
        };
        optionsMenu.children[2].classList.remove("disabled");
        optionsMenu.children[3].classList.remove("disabled");
    } else {
        optionsMenu.children[2].onclick = null;
        optionsMenu.children[3].onclick = null;
        optionsMenu.children[2].classList.add("disabled");
        optionsMenu.children[3].classList.add("disabled");
    }

    optionsMenu.classList.remove("hidden");
    document.querySelector(".overlay").style.display = "block";
    requestAnimationFrame(function () {
        document.querySelector(".overlay").style.opacity = 0.25;
    });

}

function hideTeamOptionsMenu(preserveOverlay) {

    document.querySelector(".optionsMenu").classList.add("hidden");

    if (!preserveOverlay) {
        document.querySelector(".overlay").style.opacity = 0;
        setTimeout(function () {
            document.querySelector(".overlay").style.display = "none";
        }, 200);
    }

}

function showExportMenu(teamNumber) {

    var exportMenu = document.querySelector(".exportMenu");

    exportMenu.children[1].onclick = function () {
        hideExportMenu(true);
        exportScoresheet("PNG");
    };

    exportMenu.children[2].onclick = function () {
        hideExportMenu(true);
        exportScoresheet("JPEG");
    };
    
    exportMenu.children[3].onclick = function () {
        hideExportMenu();
        exportScoresheet("CSV");
    };

    exportMenu.classList.remove("hidden");
    document.querySelector(".overlay").style.display = "block";
    requestAnimationFrame(function () {
        document.querySelector(".overlay").style.opacity = 0.25;
    });

}

function hideExportMenu(skipAnimation) {

    if (!skipAnimation) {
        document.querySelector(".exportMenu").classList.add("hidden");
        document.querySelector(".overlay").style.opacity = 0;
        setTimeout(function () {
            document.querySelector(".overlay").style.display = "none";
        }, 200);
    } else {
        document.querySelector(".overlay").style.display = "none";
        document.querySelector(".overlay").style.opacity = 0;
        document.querySelector(".exportMenu").classList.add("hidden");
    }

}

function getScoresheetCSV() {
    
    var CSVString = (currentRoundState.team1.name + " vs " + currentRoundState.team2.name + "\n");
    var scoresheetTable = document.querySelector(".scoresheetContainer .scoresheetWrapper table tbody");
    
    // Loop through each row of the scoresheet table
    for (var r = 0; r < scoresheetTable.children.length; r++) {
        
        // Loop through each cell of each table row
        for (var c = 0; c < scoresheetTable.children[r].children.length; c++) {
            
            var currentTableCell = scoresheetTable.children[r].children[c];
            CSVString += currentTableCell.textContent.replace(/[\n\r]+|[\s]{2,}/g, ' ').trim();
            if (c !== (scoresheetTable.children[r].children.length - 1)) {
                CSVString += ",";
            }
            
        }
        CSVString += "\n";
        
    }
    
    CSVString += "Scoresheet generated by Scorekeeper (cadehunter.github.io/Scorekeeper)";
    
    return "data:text/csv;charset=utf-8," + encodeURI(CSVString);
    
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
    var r = parseInt(hexCode.substr(0, 2), 16);
    var g = parseInt(hexCode.substr(2, 2), 16);
    var b = parseInt(hexCode.substr(4, 2), 16);

    // Get YIQ ratio
    var yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;

    // Check contrast
    return (yiq >= 128) ? '#000000' : '#ffffff';

}

const bannerNotificationManager = {

    queue: [],
    isRendering: false,

    timer: function (ms) {
        return new Promise(res => setTimeout(res, ms));
    },

    notificationElement: document.querySelector(".bannerNotification"),
    titleElement: document.querySelector(".bannerNotification .title"),
    subtitleElement: document.querySelector(".bannerNotification .subtitle"),

    showMessage: function (title, subtitle) {

        this.queue.push({
            title: title,
            subtitle: subtitle
        });
        if (!this.isRendering) {
            this.render();
        }

    },

    render: async function () {

        this.isRendering = true;

        while (this.queue[0]) {

            var currentItem = this.queue[0];

            this.titleElement.textContent = currentItem.title;
            this.subtitleElement.textContent = currentItem.subtitle;

            this.notificationElement.classList.remove("hidden");

            this.queue.shift();

            await this.timer(2000);

        }

        this.notificationElement.classList.add("hidden");
        this.isRendering = false;

    }

}

function logQuestionType(questionType) {
    
    questionTypeData.order.push(questionType);
    questionTypeData[questionType].used++;
    redrawQuestionTypeUI();

}

function removeLastQuestionTypeLog() {
    
    var removedItem = questionTypeData.order.pop();
    questionTypeData[removedItem].used--;
    redrawQuestionTypeUI();

}

function exportScoresheet(exportType) {
    
    switch (exportType) {
            
        case "PNG":
            document.querySelector(".scoresheetContainer").classList.remove("hidden");

            var scoresheetBoundingBox = document.querySelector(".scoresheetContainer .scoresheetWrapper").getBoundingClientRect();

            html2canvas(document.querySelector(".scoresheetContainer .scoresheetWrapper"), {
                width: scoresheetBoundingBox.width,
                height: scoresheetBoundingBox.height
            }).then(canvas => {
                var img = canvas.toDataURL("image/png");

                var link = document.createElement('a');
                link.href = img.replace("image/png", "image/octet-stream");
                link.download = "Scorekeeper Scoresheet - " + (currentRoundState.team1.name + " vs " + currentRoundState.team2.name) + ".png";
                link.click();

                document.querySelector(".scoresheetContainer").classList.add("hidden");

            });
            break;
            
        case "JPEG":
            document.querySelector(".scoresheetContainer").classList.remove("hidden");

            var scoresheetBoundingBox = document.querySelector(".scoresheetContainer .scoresheetWrapper").getBoundingClientRect();

            html2canvas(document.querySelector(".scoresheetContainer .scoresheetWrapper"), {
                width: scoresheetBoundingBox.width,
                height: scoresheetBoundingBox.height
            }).then(canvas => {
                var img = canvas.toDataURL("image/jpeg");

                var link = document.createElement('a');
                link.href = img.replace("image/png", "image/octet-stream");
                link.download = "Scorekeeper Scoresheet - " + (currentRoundState.team1.name + " vs " + currentRoundState.team2.name) + ".jpg";
                link.click();

                document.querySelector(".scoresheetContainer").classList.add("hidden");

            });
            break;
            
        case "CSV":
            var link = document.createElement('a');
            link.href = getScoresheetCSV();
            link.download = "Scorekeeper Scoresheet - " + (currentRoundState.team1.name + " vs " + currentRoundState.team2.name) + ".csv";
            link.click();
            break;
    }
    

}

function prepareScoresheetForPrint() {

    var scoresheetWrapper = document.querySelector(".scoresheetContainer .scoresheetWrapper");

    if (window.innerWidth < window.innerHeight) {

        scoresheetWrapper.style.transform = "translate(-50%, -50%) rotate(90deg) scale(0.7)";

    } else {

        scoresheetWrapper.style.transform = "translate(-50%, -50%)";

    }

}

window.addEventListener("beforeprint", prepareScoresheetForPrint);

// Populate all the quizzer cards on the selection screen
for (var i = 0; i < 10; i++) {

    var quizzerID = i + 1;

    var card = document.createElement("div");
    card.classList.add("quizzerCard");
    card.classList.add("quizzer" + quizzerID + "Card");
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

// Populate all the quizzer cards on the team overview containers (for desktop)
for (var i = 0; i < 10; i++) {

    var quizzerID = i + 1;

    var card = document.createElement("div");
    card.classList.add("quizzerCard");
    card.classList.add("quizzer" + quizzerID + "Card");
    card.classList.add("hidden");
    // Using IIFE to prevent variables being passed by reference in a closure
    (function (quizzerID) {
        card.onclick = function () {

            if (currentRoundState.enableQuestionTypeTracking && (currentRoundState.question <= 20)) {
                selectTeam = (quizzerID <= 5) ? 1 : 2;
                desktopSelectedQuizzer = quizzerID;
                showQuestionTypeSelectionScreen();
            } else {
                showConfirmationDialog("jump", (quizzerID <= 5) ? 1 : 2, quizzerID);
            }

        };
    })(quizzerID)

    var cardSeatNumberLabel = document.createElement("p");
    cardSeatNumberLabel.textContent = (quizzerID <= 5) ? quizzerID : (quizzerID - 5);
    cardSeatNumberLabel.classList.add("cardSeatNumberLabel");

    var cardLabel = document.createElement("p");
    cardLabel.classList.add("cardLabel");

    var cardScore = document.createElement("p");
    cardScore.classList.add("cardScore");

    var jumpLabel = document.createElement("p");
    jumpLabel.textContent = "Click to Jump";
    jumpLabel.classList.add("jumpLabel");

    card.appendChild(cardSeatNumberLabel);
    card.appendChild(cardLabel);
    card.appendChild(jumpLabel);
    card.appendChild(cardScore);

    if (i < 5) {

        document.querySelector(".overviewContainer .team1 .quizzerCardsContainer").appendChild(card);

    } else {

        document.querySelector(".overviewContainer .team2 .quizzerCardsContainer").appendChild(card);

    }

}

if (localStorage.getItem("userHasUsedAppPreviously") === "true") {

    var header = document.querySelector(".welcomeContainer h1");
    var text = document.querySelector(".welcomeContainer p");
    var button = document.querySelector(".welcomeContainer button");

    text.textContent = "Tap Next to start scorekeeping a round.";

}

// When the window is being resized, don't let other screens transition and remain in view when they're not supposed to be.
var resizeTimer;
window.addEventListener("resize", () => {
    document.body.classList.add("no-transition");
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        document.body.classList.remove("no-transition");
    }, 200);
});

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
    var recalledScoresheetData = localStorage.getItem("scoresheetData");
    var recalledQuestionTypeData = localStorage.getItem("questionTypeData");

    if (
        (recalledPreviousRoundState ||
            recalledChallengeAction) &&
        ((recalledPreviousRoundState !== "null") &&
            (recalledChallengeAction !== "null"))
    ) {
        previousRoundState = JSON.parse(recalledPreviousRoundState);
        challengeAction = JSON.parse(recalledChallengeAction);
        refreshChallengeAndAppealButtons("enable");
    }

    if (recalledScoresheetData) {

        scoresheetData = JSON.parse(recalledScoresheetData);

    }
    
    if (recalledQuestionTypeData) {
        
        questionTypeData = JSON.parse(recalledQuestionTypeData);
        redrawQuestionTypeUI();
        
    }

    if (recalledRoundState) {

        recalledRoundState = JSON.parse(recalledRoundState);

        currentRoundState = recalledRoundState;

        for (var i = 1; i <= 10; i++) {

            var numbers = getNumbersFromID(i);
            var currentQuizzer = currentRoundState[numbers.teamPropertyName][numbers.quizzerPropertyName]

            if (currentQuizzer.name !== null) {
                document.querySelector(".selectionScreen .quizzer" + i + "Card").classList.remove("hidden");
                document.querySelector(".selectionScreen .quizzer" + i + "Card .cardLabel").textContent = currentQuizzer.name;

                document.querySelector(".quizzerCardsContainer .quizzer" + i + "Card").classList.remove("hidden");
                document.querySelector(".quizzerCardsContainer .quizzer" + i + "Card .cardLabel").textContent = currentQuizzer.name;
            }

        }
        
        if (currentRoundState.enableQuestionTypeTracking) {
            
            document.querySelector(".overviewContainer .headerButtonsContainer .questionTypeTrackingButton").classList.remove("hidden");
            
        }

        // Initial draw of the scoreboard
        redrawScoreboard();

        if (window.matchMedia("only screen and (min-width:900px)").matches) {

            document.querySelector(".welcomeScreensContainer").classList.add("hidden");
            document.querySelector(".welcomeScreensOverlay").classList.add("hidden");

        } else {

            document.querySelector(".welcomeScreensContainer").classList.add("hidden");
            document.querySelector(".welcomeScreensOverlay").classList.add("hidden");
            document.querySelector(".welcomeContainer").classList.add("hidden");
            document.querySelector(".mainContainer").classList.remove("hidden");

        }

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

    // Set up setup screen checkbox event listeners
    var useTeamColorsCheckbox = document.querySelector(".setupContainer .useTeamColorsCheckbox");
    useTeamColorsCheckbox.addEventListener("click", function () {
        useTeamColorsCheckbox.classList.toggle("checked");
    });

    var allowFivePersonQuizzingCheckbox = document.querySelector(".setupContainer .allowFivePersonQuizzingCheckbox");
    allowFivePersonQuizzingCheckbox.addEventListener("click", function () {
        allowFivePersonQuizzingCheckbox.classList.toggle("checked");
    });
    
    var questionTypeTrackingCheckbox = document.querySelector(".setupContainer .questionTypeTrackingCheckbox");
    questionTypeTrackingCheckbox.addEventListener("click", function () {
        questionTypeTrackingCheckbox.classList.toggle("checked");
    });
    
    
    // Set up modal toggles
    var modalToggles = document.querySelectorAll(".modalToggle");
    
    for (var i = 0; i < modalToggles.length; i++) {
        
        var currentToggle = modalToggles[i];
        
        (function (currentToggle) {
            currentToggle.addEventListener("click", function () {
                currentToggle.classList.toggle("active");
            });
        })(currentToggle)
        
    }
    
    // Set up question type overview screen modal toggle
    var cardShowModeModalToggle = document.querySelector(".questionTypeOverviewScreen .cardShowModeModalToggle");
    cardShowModeModalToggle.addEventListener("click", function () {
        
        document.querySelector(".questionTypeOverviewScreen .questionTypeCardsContainer").classList.toggle("showAll");
        
    });
    

    // Enable :active CSS on mobile Safari
    document.addEventListener("touchstart", function () {}, true);

    // Activate CSS transitions again
    document.body.classList.remove("preload");
    
    // If the user has updated from a previous version of Scorekeeper, show the changelog screen
    var hasUsedScorekeeper = localStorage.getItem("userHasUsedAppPreviously");
    var lastScorekeeperVersion = localStorage.getItem("SCOREKEEPER_VERSION");
    if (
        hasUsedScorekeeper &&
        lastScorekeeperVersion &&
        (lastScorekeeperVersion < SCOREKEEPER_VERSION)
    ) {
        
        document.querySelector(".changelogScreen").classList.remove("hidden");
        
    }
    
    // Set the current Scorekeeper version in localStorage
    localStorage.setItem("SCOREKEEPER_VERSION", SCOREKEEPER_VERSION);

});

// Register Service Worker
/*if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('serviceWorker.js')
        .then(function (registration) {
            console.log('Registration successful, scope is:', registration.scope);
        })
        .catch(function (error) {
            console.log('Service worker registration failed, error:', error);
        });
}*/