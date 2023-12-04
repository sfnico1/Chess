


// setting variables
let phantomBoard = Array.from({length: 64}, () => '');
let turn = 0; // 0 for white's turn, 1 for black
const turnTexts = ["White's Turn", "Black's Turn"]; // text box on screen
const castlePiecesId = ['WK', 'WR1', 'WR2', 'BK', 'BR1', 'BR2']; // order in which to check piece ID if it moved
let castlePieces = [false, false, false, false, false, false]; // holding if the piece from the line above moved, true for it has
let castling = [false, false, false, false]; // can we currently castle
let selectedSquare = null; // variable to keep track of the first square pressed
let allMoves = []; // keep track of legal moves
let currentBGC = '#deb887'; // keep track of which background was most recently changed
let possibleEP = false;
let pawnEP = ""; // keep track of which pawn just moved 2 spaces
let whiteKingLoc = 4; // keep track of where the kings are
let blackKingLoc = 74;
let whiteKingSquareColor = "#986b41"; // keep track of their background color (they turn red when they check)
let blackKingSquareColor = "#deb887";
let check = false; // keeping track if a king is in check
let phantomCheck = false; // check if a king is in check during a phantom move (find if a move is legal or no (example is a pin))
let bot = 0; // do we have bots


// this is the initial board set up, some boards below are for testing certain positions
// set it up this way so I can visually design a board and have it make it on the screen
let customBoard = [ ['BR1','BN','BB','BQ','BK','BB','BN','BR2'],
                    ['BP1','BP2','BP3','BP4','BP5','BP6','BP7','BP8'],
                    ['','','','','','','',''],
                    ['','','','','','','',''],
                    ['','','','','','','',''],
                    ['','','','','','','',''],
                    ['WP1','WP2','WP3','WP4','WP5','WP6','WP7','WP8'],
                    ['WR1','WN','WB','WQ','WK','WB','WN','WR2']]; 


/*['BR1','BN','BB','BQ','','BB','BN','BR2'],
                    ['WP1','WP2','WP3','WP4','WP5','WP6','WP7','WP8'],
                    ['','','','','BK','','',''],
                    ['','','','','','','',''],
                    ['','','','','','','',''],
                    ['','','','','WK','','',''],
                    ['BP1','BP2','BP3','BP4','BP5','BP6','BP7','BP8'],
                    ['WR1','WN','WB','WQ','','WB','WN','WR2']];*/

/*[ ['','','','','','','',''],
                    ['','','BP','','','','',''],
                    ['','','','BP','','','',''],
                    ['WK','WP','','','','','','BR'],
                    ['','WR','','','','','BP','BK'],
                    ['','','','','','','',''],
                    ['','','','','','','',''],
                    ['','','','','','','','']];*/

// creating the board on the screen and phantomBoard
for (let i = 7; i > -1; i--){
    for (let j = 0; j < 8; j++){
        if (customBoard[7-i][j] != ''){
            let squareW = document.getElementById(i*10+j);
            squareW.innerHTML = `<img class = "piece" id = "${customBoard[7-i][j]}" src = "images/${customBoard[7-i][j].slice(0,2)}.png">`
            if (customBoard[7-i][j] == "WK"){
                whiteKingLoc = i*10+j;
            } else if (customBoard[7-i][j] == "BK"){
                blackKingLoc = i*10+j;
            }
        }
        phantomBoard[(7-i)*8 + j] = customBoard[i][j];
    }
}

// adding a handle for if a square has been clicked
const squares = document.querySelectorAll('.square');
squares.forEach(square => {square.addEventListener('click', handleSquareClick);});

// handles if a square was clicked
function handleSquareClick(event) {
    // get the target
    const clickedElement = event.target;
    let clickedSquare = clickedElement;

    // get the square
    if (clickedElement.tagName.toLowerCase() === 'img') {
        clickedSquare = clickedElement.parentNode;
    }

    // we selected it, so record its color (change to green or red later)
    if (clickedSquare.style.backgroundColor != 'green' && clickedSquare.style.backgroundColor != 'red'){
        currentBGC = clickedSquare.style.backgroundColor;
    }

    // remove all previous possible move dots 
    for (let i = 0; i < allMoves.length; i++){
        let allowedSquare = document.getElementById(allMoves[i]);
        if (allowedSquare.querySelector('.dot')){
            allowedSquare.removeChild(allowedSquare.querySelector('.dot'));
        }
    }

    // if a piece has been selected and we want to move it
    if (selectedSquare && allMoves.includes(Number(clickedSquare.id))){
        const selectedPiece = selectedSquare.querySelector('.piece');

        // removing the red background for the king
        if (check == true){
            if (turn == 0){
                document.getElementById(whiteKingLoc).style.background = whiteKingSquareColor;
            } else {
                document.getElementById(blackKingLoc).style.background = blackKingSquareColor;
            }
        }
        check = false;

        // update phantomBoard
        phantomBoard[Math.floor(Number(clickedSquare.id)/10)*8 + Number(clickedSquare.id) % 10] = selectedSquare.childNodes[0].id;
        phantomBoard[Math.floor(Number(selectedSquare.id)/10)*8 + Number(selectedSquare.id) % 10] = '';
        
        // clear the new square
        clickedSquare.innerHTML = '';
        // add our new piece
        clickedSquare.appendChild(selectedPiece.cloneNode(true));

        // change the background back
        selectedSquare.style.backgroundColor = currentBGC;
        
        // did we move a castleable piece?
        for (let i = 0; i < 6; i++){
            if (clickedSquare.childNodes[0].id == castlePiecesId[i]){
                castlePieces[i] = true;
            }
        }

        // are we castling, promoting or en passenting?
        if (selectedSquare.childNodes[0].id.slice(1,2) == "P"){
            if (possibleEP == true){
                // if we are en passenting we need to removed the enemy pawn (doesn't happen naturally)
                if (Number(clickedSquare.id) == Number(selectedSquare.id) + 11 && document.getElementById(Number(selectedSquare.id)+1).childNodes[0] != null && 
                document.getElementById(Number(selectedSquare.id)+1).childNodes[0].id == pawnEP){
                    document.getElementById(Number(selectedSquare.id)+1).innerHTML = '';
                    phantomBoard[Math.floor((Number(selectedSquare.id)+1)/10)*8 + (Number(selectedSquare.id) + 1) % 10] = '';
                } else if (Number(clickedSquare.id) == Number(selectedSquare.id) + 9 && document.getElementById(Number(selectedSquare.id)-1).childNodes[0] != null && 
                document.getElementById(Number(selectedSquare.id)-1).childNodes[0].id == pawnEP){
                    document.getElementById(Number(selectedSquare.id)-1).innerHTML = '';
                    phantomBoard[Math.floor((Number(selectedSquare.id)-1)/10)*8 + (Number(selectedSquare.id) - 1) % 10] = '';
                } else if (Number(clickedSquare.id) == Number(selectedSquare.id) - 11 && document.getElementById(Number(selectedSquare.id)-1).childNodes[0] != null && 
                document.getElementById(Number(selectedSquare.id)-1).childNodes[0].id == pawnEP){
                    document.getElementById(Number(selectedSquare.id)-1).innerHTML = '';
                    phantomBoard[Math.floor((Number(selectedSquare.id)-1)/10)*8 + (Number(selectedSquare.id) - 1) % 10] = '';
                } else if (Number(clickedSquare.id) == Number(selectedSquare.id) - 9 && document.getElementById(Number(selectedSquare.id)+1).childNodes[0] != null && 
                document.getElementById(Number(selectedSquare.id)+1).childNodes[0].id == pawnEP){
                    document.getElementById(Number(selectedSquare.id)+1).innerHTML = '';
                    phantomBoard[Math.floor((Number(selectedSquare.id)+1)/10)*8 + (Number(selectedSquare.id) + 1) % 10] = '';
                }
                possibleEP = false; 
                pawnEP = "";
            }
            // check if we are moving 2 squares as a pawn
            if ((selectedSquare.id < 18 && clickedSquare.id > 28) || (selectedSquare.id > 58 && clickedSquare.id < 48)){
                possibleEP = true;
                pawnEP = clickedSquare.childNodes[0].id;
            } else {
                // reset en passant
                possibleEP = false; 
                pawnEP = "";
            }
            // promoting
            if (clickedSquare.id > 69 || clickedSquare.id < 8){
                clickedSquare.innerHTML = '';
                let promotedPieceImages = ['images/WQ.png','images/WR.png','images/WB.png','images/WN.png'];
                if (clickedSquare.id < 8){
                    promotedPieceImages = ['images/BQ.png','images/BR.png','images/BB.png','images/BN.png'];
                }
                
                // bots don't click the image, rather they randomly get a piece
                if ((bot == 1 && turn == 1) || bot > 1){
                    let choice = promotedPieceImages[Math.floor(Math.random()*4)];
                    choice = choice.replace('images/', ''); 
                    choice = choice.replace('.png', '');
                    clickedSquare.innerHTML = `<img class = "piece" id = "${choice}" src = "images/${choice}.png">`
                    phantomBoard[Math.floor(Number(clickedSquare.id)/10)*8 + Number(clickedSquare.id) % 10] = choice;

                    // set up the choices by making 4 small squares with images
                } else for (let i = 0; i < 4; i++){
                    const subSquare = document.createElement('div');
                    subSquare.className = 'subSquare';
                    switch (i){
                        case 0: 
                            subSquare.style.top = '0';
                            subSquare.style.left = '0';
                            break;
                        case 1: 
                            subSquare.style.top = '0';
                            subSquare.style.left = '50%';
                            break;
                        case 2: 
                            subSquare.style.top = '50%';
                            subSquare.style.left = '50%';
                            break;
                        case 3: 
                            subSquare.style.top = '50%';
                            subSquare.style.left = '0';
                            break;
                    }
                    clickedSquare.appendChild(subSquare);
                    // add square and images
                    const image = document.createElement('img');
                    image.src = promotedPieceImages[i];
                    image.className = 'smallPiece';
                    subSquare.appendChild(image);
                    turn = -1; // stop the game, wait for the user to click an image
                    image.addEventListener('click', function(){
                        image.alt = promotedPieceImages[i].replace('images/', ''); 
                        image.alt = image.alt.replace('.png', '');
                        clickedSquare.innerHTML = `<img class = "piece" id = "${image.alt}" src = "images/${image.alt}.png">`
                        phantomBoard[Math.floor(Number(clickedSquare.id)/10)*8 + Number(clickedSquare.id) % 10] = image.alt;
                        // resume the game when an image has been clicked
                        turn = 1;
                        if (clickedSquare.id > 69){
                            turn = 0;
                        }
                        prepareForNextMove()
                    });
                }
            }
        }
        // if we are moving a king
        if (selectedSquare.childNodes[0].id.slice(1,2) == "K"){
            // update position
            if (turn == 0){
                whiteKingLoc = Number(clickedSquare.id);
            } else {
                blackKingLoc = Number(clickedSquare.id);
            }
            // are we castling
            if (castling[0] == true && selectedSquare.childNodes[0].id == "WK" && Number(clickedSquare.id) == 6){
                // move the rook
                document.getElementById(7).innerHTML = '';
                document.getElementById(5).innerHTML = `<img class = "piece" id = "WR2" src = "images/WR.png">`;
                phantomBoard[7] = '';
                phantomBoard[5] = 'WR';
            } else if (castling[1] == true && selectedSquare.childNodes[0].id == "WK" && Number(clickedSquare.id) == 2){
                document.getElementById(0).innerHTML = '';
                document.getElementById(3).innerHTML = `<img class = "piece" id = "WR1" src = "images/WR.png">`;
                phantomBoard[0] = '';
                phantomBoard[3] = 'WR';
            } else if (castling[2] == true && selectedSquare.childNodes[0].id == "BK" && Number(clickedSquare.id) == 76){
                document.getElementById(77).innerHTML = '';
                document.getElementById(75).innerHTML = `<img class = "piece" id = "BR2" src = "images/BR.png">`;
                phantomBoard[63] = '';
                phantomBoard[61] = 'BR';
            } else if (castling[3] == true && selectedSquare.childNodes[0].id == "BK" && Number(clickedSquare.id) == 72){
                document.getElementById(70).innerHTML = '';
                document.getElementById(73).innerHTML = `<img class = "piece" id = "BR1" src = "images/BR.png">`;
                phantomBoard[56] = '';
                phantomBoard[59] = 'BR'
            }
        }
        // clear the old square and moves
        allMoves = [];
        selectedSquare.innerHTML = '';
        selectedSquare = null;
        
        prepareForNextMove();

        // deselecting a piece
    } else if (selectedSquare && !allMoves.includes(Number(clickedSquare.id))){
        allMoves = [];
        if (selectedSquare.style.backgroundColor != 'red'){
            selectedSquare.style.backgroundColor = currentBGC;
        }
        selectedSquare = null;
    }  

    // selecting a piece
    if (clickedSquare.innerHTML !== ''){
        // check if it is a legal piece to select
        if ((clickedSquare.childNodes[0].id.slice(0,1) == 'W' && turn == 0) || 
        (clickedSquare.childNodes[0].id.slice(0,1) == 'B' && turn == 1)){
            // reset castling
            castling = [false, false, false, false];
            // which piece did we click and get their legal moves
            switch (clickedSquare.childNodes[0].id.slice(1,2)){
                case "P":
                    allMoves = getPawnMoves(clickedSquare.id, clickedSquare.childNodes[0].id, true);
                    break;
                case "N":
                    allMoves = getSingleMoves(clickedSquare.id, [19, 21, 12, 8, -19, -21, -12, -8], clickedSquare.childNodes[0].id.slice(0,1), "N", true);
                    break;
                case "B":
                    allMoves = getLongMoves(clickedSquare.id, [9, 11, -9, -11], clickedSquare.childNodes[0].id.slice(0,1), "B", true);
                    break;
                case "R":
                    allMoves = getLongMoves(clickedSquare.id, [10, 1, -10, -1], clickedSquare.childNodes[0].id.slice(0,1), "R", true);
                    break;
                case "Q":
                    allMoves = getLongMoves(clickedSquare.id, [9, 11, -9, -11, 10, 1, -10, -1], clickedSquare.childNodes[0].id.slice(0,1), "Q", true);
                    break;
                case "K":
                    allMoves = getSingleMoves(clickedSquare.id, [9, 10, 11, 1, -11, -10, -9, -1], clickedSquare.childNodes[0].id.slice(0,1), "K", true);
                    allMoves = checkCastle(allMoves, clickedSquare.id, clickedSquare.childNodes[0].id.slice(0,1), true);
                    break;
            }
            // add the dots to highlight legal moves
            for (let i = 0; i < allMoves.length; i++){
                let allowedSquare = document.getElementById(allMoves[i]);
                const image = document.createElement('img');
                image.src = 'images/greenDot.png';
                image.className = 'dot';
                allowedSquare.appendChild(image);
            }
            // change backgrounds
            selectedSquare = clickedSquare;
            if (selectedSquare.style.backgroundColor != 'red'){
                selectedSquare.style.backgroundColor = 'green';
            }
        }
    }
}

function prepareForNextMove(){
    // change turn
    if (turn != -1){
        turn = (turn + 1) % 2;
        const changeText = document.getElementById('turn');
        changeText.textContent = turnTexts[turn];
    }
    if (turn == 0){
        checkKingSafety(whiteKingLoc, "W", false);
    } else {
        checkKingSafety(blackKingLoc, "B", false);
    }
    //check for checks
    if (check == true){
        let checkMate = findLegalMoves();
        if (checkMate == true){
            const changeText = document.getElementById('turn');
            changeText.textContent = 'Checkmate!';
            const overlay = document.getElementById('overlay');
            const resultText = document.getElementById('result-text');
            if (turn == 0){
                resultText.textContent = 'Black won!';
            } else {
                resultText.textContent = 'White won!';
            }
            overlay.classList.remove('hidden');
            turn = -1;
        }
    }
    // if there is a bot make it move
    if (bot == 1 && turn == 1){
        makeComputerMove();
    }
}


// get long repeating moves
const getLongMoves = (position, directions, color, piece, phantom) => {
    let checkSquare;
    let allPositions = []; // allowed moves
    let indices = Array.from({length: directions.length}, () => Number(position)); // possible moves
    let stop = Array.from({length: directions.length}, () => false);
    // at most 7 possible moves in the same directions
    for (let i = 0; i < 7; i++){
        // for each direction
        for (let j = 0; j < directions.length; j++){
            // have we hit a piece or the board wall?
            if (stop[j] == false){
                indices[j] += directions[j];
                // check if we hit a wall
                if ((indices[j] % 10) == 8 || (indices[j] % 10) == 9 || indices[j] < 0 || indices[j] > 78){
                    stop[j] = true;
                } else {
                    checkSquare = phantomBoard[Math.floor(Number(indices[j])/10)*8 + Number(indices[j]) % 10];
                }
                if (stop[j] == false){
                    // check if the square is empty
                    if (checkSquare == ''){
                        phantomCheck = false;
                        // check if this move checks your own king
                        if (phantom == true){
                            checkYourself(position, indices[j], color, piece);
                        }
                        // if so, don't add this as a legal move
                        if (phantomCheck == false){
                            allPositions.push(indices[j]);
                        }
                    } else {
                        stop[j] = true;
                        // what color piece did we hit
                        if (checkSquare.slice(0,1) != color){
                            phantomCheck = false;
                            if (phantom == true){
                                checkYourself(position, indices[j], color, piece);
                            }
                            if (phantomCheck == false){
                                allPositions.push(indices[j]);
                            }
                        }
                    }
                }
            }
        }
    }
    return allPositions;
}

// get single moves, same set up as before
const getSingleMoves = (position, directions, color, piece, phantom) => {
    let checkSquare;
    let allPositions = [];
    let indices = Array.from({length: directions.length}, () => Number(position));
    for (let i = 0; i < directions.length; i++){
        indices[i] += directions[i];
        // check if we hit a wall
        if ((indices[i] % 10) == 8 || (indices[i] % 10) == 9 || indices[i] < 0 || indices[i] > 78){
        } else {
            checkSquare = phantomBoard[Math.floor(Number(indices[i])/10)*8 + Number(indices[i]) % 10];
            // empty square
            if (checkSquare === ''){
                phantomCheck = false;
                if (phantom == true){
                    checkYourself(position, indices[i], color, piece);
                }
                if (phantomCheck == false){
                    allPositions.push(indices[i]);
                }
            } else {
                // what color piece did we hit
                if (checkSquare.slice(0,1) != color){
                    phantomCheck = false;
                    if (phantom == true){
                        checkYourself(position, indices[i], color, piece);
                    }
                    if (phantomCheck == false){
                        allPositions.push(indices[i]);
                    }
                }
            }
        }
    }
    return allPositions;
}

// pawns need their own special function
const getPawnMoves = (position, pawnID, phantom) => {
    let pos = Number(position);
    let checkSquare;
    let allPositions = [];
    let multiplier = 1; // pawns move in one direction, this is used to repeat code for up vs down moving pawns
    if (pawnID.slice(0,1) == "B"){
        multiplier = -1;
    }
    // check if we hit the top or bottom board wall
    if ((pos + 10 < 79 && pawnID.slice(0,1) == "W") || (pawnID.slice(0,1) == "B" && pos - 10 > -1)){
        checkSquare = document.getElementById(pos + 10*multiplier);
        if (checkSquare.innerHTML === ''){
            phantomCheck = false;
                    if (phantom == true){
                        checkYourself(position, pos + 10*multiplier, pawnID.slice(0,1), pawnID.slice(1,3));
                    }
                    if (phantomCheck == false){
                        allPositions.push(pos + 10*multiplier);
                    }
            // if we haven't moved, let's maybe move 2
            if ((pos + 20 < 39 && pawnID.slice(0,1) == "W") || (pawnID.slice(0,1) == "B" && pos - 20 > 39)){
                checkSquare = document.getElementById(pos + 20*multiplier);
                if (checkSquare.innerHTML === ''){
                    phantomCheck = false;
                    if (phantom == true){
                        checkYourself(position, pos + 20*multiplier, pawnID.slice(0,1), pawnID.slice(1,3));
                    }
                    if (phantomCheck == false){
                        allPositions.push(pos + 20*multiplier);
                    }
                }
            }
        }
    }
    // can we kill anything?
    const leftRight = [9, 11];
    for (let i = 0; i < 2; i++){
        // check if we hit a wall or can we kill anything
        if ((pawnID.slice(0,1) == "W" && pos + leftRight[i] < 79 && (pos + leftRight[i]) % 10 != 9 && (pos + leftRight[i]) % 10 != 8) || 
        (pawnID.slice(0,1) == "B" && pos - leftRight[i] > -1 && (pos - leftRight[i]) % 10 != 9 && (pos - leftRight[i]) % 10 != 8)){
            checkSquare = document.getElementById(pos + leftRight[i]*multiplier);
            if (checkSquare.innerHTML !== '' && ((checkSquare.childNodes[0].id.slice(0,1) == 'B' && pawnID.slice(0,1) == "W") || 
            (checkSquare.childNodes[0].id.slice(0,1) == 'W' && pawnID.slice(0,1) == "B"))){
                phantomCheck = false;
                if (phantom == true){
                    checkYourself(position, pos + leftRight[i]*multiplier, pawnID.slice(0,1), pawnID.slice(1,3));
                }
                if (phantomCheck == false){
                    allPositions.push(pos + leftRight[i]*multiplier);
                }
            }
        }
    }
    // checking for en passant
    if (possibleEP == true){
        if (pawnID.slice(0,1) == "W"){
            // check right
            if ((pos + 1) % 10 != 8){
                if (document.getElementById(pos + 1).childNodes[0] != null && document.getElementById(pos + 1).childNodes[0].id == pawnEP){
                    phantomCheck = false;
                    if (phantom == true){
                        phantomBoard[Math.floor((pos + 1)/10)*8 + (pos + 1) % 10] = '';
                        checkYourself(position, pos + 11, pawnID.slice(0,1), pawnID.slice(1,3));
                        phantomBoard[Math.floor((pos + 1)/10)*8 + (pos + 1) % 10] = pawnEP;
                    }
                    if (phantomCheck == false){
                        allPositions.push(pos + 11);
                    }
                }
            } // check left
            if ((pos - 1) % 10 != 9){
                if (document.getElementById(pos - 1).childNodes[0] != null && document.getElementById(pos - 1).childNodes[0].id == pawnEP){
                    phantomCheck = false;
                    if (phantom == true){
                        phantomBoard[Math.floor((pos - 1)/10)*8 + (pos - 1) % 10] = '';
                        checkYourself(position, pos + 9, pawnID.slice(0,1), pawnID.slice(1,3));
                        phantomBoard[Math.floor((pos - 1)/10)*8 + (pos - 1) % 10] = pawnEP;
                    }
                    if (phantomCheck == false){
                        allPositions.push(pos + 9);
                    }
                }
            }
        } else { // now black
            if ((pos + 1) % 10 != 8){
                if (document.getElementById(pos + 1).childNodes[0] != null && document.getElementById(pos + 1).childNodes[0].id == pawnEP){
                    phantomCheck = false;
                    if (phantom == true){
                        phantomBoard[Math.floor((pos - 1)/10)*8 + (pos - 1) % 10] = '';
                        checkYourself(position, pos - 9, pawnID.slice(0,1), pawnID.slice(1,3));
                        phantomBoard[Math.floor((pos - 1)/10)*8 + (pos - 1) % 10] = pawnEP;
                    }
                    if (phantomCheck == false){
                        allPositions.push(pos - 9);
                    }
                }
            } 
            if ((pos - 1) % 10 != 9){
                if (document.getElementById(pos - 1).childNodes[0] != null && document.getElementById(pos - 1).childNodes[0].id == pawnEP){
                    phantomCheck = false;
                    if (phantom == true){
                        phantomBoard[Math.floor((pos + 1)/10)*8 + (pos + 1) % 10] = '';
                        checkYourself(position, pos - 11, pawnID.slice(0,1), pawnID.slice(1,3));
                        phantomBoard[Math.floor((pos + 1)/10)*8 + (pos + 1) % 10] = pawnEP;
                    }
                    if (phantomCheck == false){
                        allPositions.push(pos - 11);
                    }
                }
            }
        }
    }
    return allPositions;
}

// check if we can castle
const checkCastle = (allMoves, position, color, phantom) => {
    // if white
    if (color == "W"){
        // check if the right rook or king has moved and if the squares in between are open
        if (castlePieces[0] == false && castlePieces[2] == false && document.getElementById(5).innerHTML === '' && 
        document.getElementById(6).innerHTML === '' && document.getElementById(7).childNodes[0] != null && document.getElementById(7).childNodes[0].id == "WR2"){
            phantomCheck = false;
            if (phantom == true){
                checkYourself(position, 6, color, "K");
            }
            if (phantomCheck == false){
                checkYourself(position, 5, color, "K");
            }
            if (phantomCheck == false){
                allMoves.push(6);
            }
            castling[0] = true
        } 
        // left side
        if (castlePieces[0] == false && castlePieces[1] == false && document.getElementById(1).innerHTML === '' && 
        document.getElementById(2).innerHTML === '' && document.getElementById(3).innerHTML === '' && document.getElementById(0).childNodes[0] != null && document.getElementById(0).childNodes[0].id == "WR1"){
            phantomCheck = false;
            if (phantom == true){
                checkYourself(position, 2, color, "K");
            }
            if (phantomCheck == false){
                checkYourself(position, 3, color, "K");
            }
            if (phantomCheck == false){
                allMoves.push(2);
            }
            castling[1] = true
        }
    } else { // black king
        if (castlePieces[3] == false && castlePieces[5] == false && document.getElementById(75).innerHTML === '' && 
        document.getElementById(76).innerHTML === '' && document.getElementById(77).childNodes[0] != null && document.getElementById(77).childNodes[0].id == "BR2"){
            phantomCheck = false;
            if (phantom == true){
                checkYourself(position, 76, color, "K");
            }
            if (phantomCheck == false){
                checkYourself(position, 75, color, "K");
            }
            if (phantomCheck == false){
                allMoves.push(76);
            }
            castling[2] = true
        }
        if (castlePieces[3] == false && castlePieces[4] == false && document.getElementById(71).innerHTML === '' && 
        document.getElementById(72).innerHTML === '' && document.getElementById(73).innerHTML === '' && document.getElementById(70).childNodes[0] != null && document.getElementById(70).childNodes[0].id == "BR1"){
            phantomCheck = false;
            if (phantom == true){
                checkYourself(position, 72, color, "K");
            }
            if (phantomCheck == false){
                checkYourself(position, 73, color, "K");
            }
            if (phantomCheck == false){
                allMoves.push(72);
            }
            castling[3] = true
        }
    }
    return allMoves;
}

// check if the enemy moved a piece and now your king is in check
const checkKingSafety = (position, color, phantom) => {
    
    let index = 0;
    // get king vision (i.e. every location that can possibly attack the king)
    let visionLongDiag = getLongMoves(position, [9, 11, -9, -11], color, "B", false);
    let visionLongStraight = getLongMoves(position, [10, 1, -10, -1], color, "R", false)
    let visionSingleKnight = getSingleMoves(position, [19, 21, 12, 8, -19, -21, -12, -8], color, "N", false);
    let visionSingleKing = getSingleMoves(position, [9, 10, 11, 1, -11, -10, -9, -1], color, "K", false);
    // for every location, check to see if an enemy piece can see the king
    while (index < visionLongDiag.length || index < visionLongStraight.length || index < visionSingleKnight.length || index < visionSingleKing.length){
        // queens, bishops and pawns
        if (index < visionLongDiag.length){
            let currentString = phantomBoard[Math.floor(Number(visionLongDiag[index])/10)*8 + Number(visionLongDiag[index]) % 10];
            if (currentString != ''){
                if (currentString.slice(0,1) != color){
                    // make sure that the king is safe by checking what the king can see
                    if (currentString.slice(1,2) == "B" || currentString.slice(1,2) == "Q"){
                        phantomCheck = true;
                        if (phantom == false){
                            changeKingBackground(position, color);
                        }
                    } else if (currentString.slice(1,2) == "P"){
                        if (color == "W"){
                            if (visionLongDiag[index] == position + 9){
                                phantomCheck = true;
                                if (phantom == false){
                                    changeKingBackground(position, color);
                                }
                            } else if (visionLongDiag[index] == position + 11){
                                phantomCheck = true;
                                if (phantom == false){
                                    changeKingBackground(position, color);
                                }
                            }
                        } else {
                            if (visionLongDiag[index] == position - 9){
                                phantomCheck = true;
                                if (phantom == false){
                                    changeKingBackground(position, color);
                                }
                            } else if (visionLongDiag[index] == position - 11){
                                phantomCheck = true;
                                if (phantom == false){
                                    changeKingBackground(position, color);
                                }
                            }
                        }
                    }
                } 
            }
        }
        // queens and rooks
        if (index < visionLongStraight.length){
            let currentString = phantomBoard[Math.floor(Number(visionLongStraight[index])/10)*8 + Number(visionLongStraight[index]) % 10];
            if (currentString != ''){
                if (currentString.slice(0,1) != color){
                    if (currentString.slice(1,2) == "R" || currentString.slice(1,2) == "Q"){
                        phantomCheck = true;
                        if (phantom == false){
                            changeKingBackground(position, color);
                        }
                    } 
                } 
            }
        }
        // knights
        if (index < visionSingleKnight.length){
            let currentString = phantomBoard[Math.floor(Number(visionSingleKnight[index])/10)*8 + Number(visionSingleKnight[index]) % 10];
            if (currentString != ''){
                if (currentString.slice(0,1) != color){
                    if (currentString.slice(1,2) == "N"){
                        phantomCheck = true;
                        if (phantom == false){
                            changeKingBackground(position, color);
                        }
                    } 
                } 
            }
        }
        // kings
        if (index < visionSingleKing.length){
            let currentString = phantomBoard[Math.floor(Number(visionSingleKing[index])/10)*8 + Number(visionSingleKing[index]) % 10];
            if (currentString != ''){
                if (currentString.slice(0,1) != color){
                    if (currentString.slice(1,2) == "K"){
                        phantomCheck = true;
                        if (phantom == false){
                            changeKingBackground(position, color);
                        }
                    } 
                } 
            }
        }
        index++;
    }
}

// change the background to red
function changeKingBackground(position, color){
    check = true;
    if (color == "W"){
        whiteKingSquareColor = document.getElementById(position).style.backgroundColor;
    } else {
        blackKingSquareColor = document.getElementById(position).style.backgroundColor;
    }
    document.getElementById(position).style.backgroundColor = 'red';
}

// this function is used to see if a move results in checking yourself - play out the move on the phantom board and check if you are in check
function checkYourself(phantomLocOld, phantomLocNew, color, piece){
    let killedPiece = phantomBoard[Math.floor(Number(phantomLocNew)/10)*8 + Number(phantomLocNew) % 10];
    phantomBoard[Math.floor(Number(phantomLocNew)/10)*8 + Number(phantomLocNew) % 10] = color + piece;
    phantomBoard[Math.floor(Number(phantomLocOld)/10)*8 + Number(phantomLocOld) % 10] = '';
    if (piece == "K"){
        checkKingSafety(phantomLocNew, color, true)
    } else if (color == "W"){
        checkKingSafety(whiteKingLoc, color, true)
    } else {
        checkKingSafety(blackKingLoc, color, true)
    }
    phantomBoard[Math.floor(Number(phantomLocNew)/10)*8 + Number(phantomLocNew) % 10] = killedPiece;
    phantomBoard[Math.floor(Number(phantomLocOld)/10)*8 + Number(phantomLocOld) % 10] = color + piece;
}

// if the king is in check, check to see if we are in checkmate. This is a loop that loops over every piece in the position. 
// if one piece has a legal move, it's not checkmate
function findLegalMoves(){
    let testMoves = [];
    let checkMate = true;
    let color = "W";
    let index = 0;
    // check every square
    while (checkMate == true && index < 64){
        if (turn == 1){
            color = "B";
        }
        // find legal moves for that piece
        if (phantomBoard[index] != '' && phantomBoard[index].slice(0,1) == color){
            switch (phantomBoard[index].slice(1,2)){
                case "P":
                    testMoves = getPawnMoves(Math.floor(index/8)*10 + index % 8, phantomBoard[index], true);
                    break;
                case "N":
                    testMoves = getSingleMoves(Math.floor(index/8)*10 + index % 8, [19, 21, 12, 8, -19, -21, -12, -8], color, "N", true);
                    break;
                case "B":
                    testMoves = getLongMoves(Math.floor(index/8)*10 + index % 8, [9, 11, -9, -11], color, "B", true);
                    break;
                case "R":
                    testMoves = getLongMoves(Math.floor(index/8)*10 + index % 8, [10, 1, -10, -1], color, "R", true);
                    break;
                case "Q":
                    testMoves = getLongMoves(Math.floor(index/8)*10 + index % 8, [9, 11, -9, -11, 10, 1, -10, -1], color, "Q", true);
                    break;
                case "K":
                    testMoves = getSingleMoves(Math.floor(index/8)*10 + index % 8, [9, 10, 11, 1, -11, -10, -9, -1], color, "K", true);
                    break;
            }
        }
        // if yes moves, quit the loop
        if (testMoves.length > 0){
            checkMate = false;
        }
        testMoves = [];
        index++;
    }
    return checkMate;
}

// everytime the button is clicked increment a counter
function addBot(){
    bot++;
    if (bot < 2){
        document.getElementById('bot').textContent = 'Add a Bot: ' + bot;
    } else {
        if (bot == 2){
            document.getElementById('bot').textContent = 'Add a Bot: ' + 2;
        }
        makeComputerMove();
    }
}

// this is where the computer makes a move (makes a random move)
function makeComputerMove(){
    // it will 'click' a square
    const clickEvent = new MouseEvent('click', {bubbles: true, cancelable: true, view: window});
    setTimeout(function() { // used because otherwise its too fast
        if (turn != -1){
            let possiblePieces = [];
            // find all the available pieces and their possible moves
            for (let i = 0; i < 64; i++){
                if (document.getElementById(Math.floor(i/8)*10 + i % 8).childNodes[0] != null){
                    if (turn == 1 && document.getElementById(Math.floor(i/8)*10 + i % 8).childNodes[0].id.slice(0,1) == "B"){
                        document.getElementById(Math.floor(i/8)*10 + i % 8).dispatchEvent(clickEvent);
                        if (allMoves.length > 0){
                            possiblePieces.push(Math.floor(i/8)*10 + i % 8);
                        }
                    } else if (turn == 0 && document.getElementById(Math.floor(i/8)*10 + i % 8).childNodes[0].id.slice(0,1) == "W"){
                        document.getElementById(Math.floor(i/8)*10 + i % 8).dispatchEvent(clickEvent);
                        if (allMoves.length > 0){
                            possiblePieces.push(Math.floor(i/8)*10 + i % 8);
                        }
                    }
                }
            }
            // pick a piece at random
            let pieceChoice = Math.floor(Math.random()*possiblePieces.length);
            selectedPiece = document.getElementById(possiblePieces[pieceChoice])
            selectedPiece.dispatchEvent(clickEvent)
            // pick a move at random
            let moveChoice = Math.floor(Math.random()*allMoves.length);
            const move = document.getElementById(allMoves[moveChoice]);
            move.dispatchEvent(clickEvent);
            // if there are two bots call itself and just keep the game going
            if (bot > 1){
                makeComputerMove();
            }
        }
      }, 10); // X number of millisecond wait time
  }
