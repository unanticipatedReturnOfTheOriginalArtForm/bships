document.addEventListener( "DOMContentLoaded", () => {
const userGrid = document.querySelector('.grid-user')
const computerGrid = document.querySelector('.grid-computer')
const displayGrid = document.querySelector('.grid-display')
const ships = document.querySelectorAll('.ship')
const destroyer = document.querySelector('.destroyer-container')
const submarine = document.querySelector('.submarine-container')
const cruiser = document.querySelector('.cruiser-container')
const battleship = document.querySelector('.battleship-container')
const carrier = document.querySelector('.carrier-container')
const startButton = document.querySelector('#start')
const rotateButton = document.querySelector('#rotate')
const turnDisplay = document.querySelector('#whose-go')
const infoDisplay = document.querySelector('#info')
const singlePlayerButton = document.querySelector('#singlePlayerButton');
const multiPlayerButton = document.querySelector('#multiPlayerButton');
const userSquares = []
const computerSquares = []
let isHorizontal = true;
let isGameOver = false;
let currentPlayer = 'user';

const width = 10;

let gameMode = '';
let playerNum = 0;
let ready = false;
let enemyReady = false;
let allShipsPlaced = false;
let shotFired = -1;

// Select player mode

singlePlayerButton.addEventListener('click', startSinglePlayer);
multiPlayerButton.addEventListener('click', startMultiPlayer);





function startSinglePlayer(){
    gameMode = "singlePlayer";
    generate(shipArray[0]);
    generate(shipArray[1]);
    generate(shipArray[2]);
    generate(shipArray[3]);
    generate(shipArray[4]);
    
    startButton.addEventListener('click', () => {
        if (allShipsPlaced) playGameSingle()
        else infoDisplay.innerHTML = 'Please place all ships!';
    })

}

function startMultiPlayer(){
    gameMode = 'multiPlayer';
    const socket = io();

    socket.on('player-number', num => {
        if (num === -1){
            infoDisplay.innerHTML = 'Sorry, server full, no game for you!';
        } else {
            playerNum = parseInt(num);
            if (playerNum === 1) currentPlayer = 'enemy';
            console.log('Player number is: ' + playerNum);

            // HERE, IT FUCKING GOES HERE:

            socket.emit('check-players');
        }
    })
    
    // Another player conned or disconned
    socket.on('player-connection', num => {
        console.log(`Player number ${num} has conned or disconned`);
        playerConnectedOrDisconnected(num);
    })

    socket.on('enemy-ready', num => {
        enemyReady = true;
        playerReady(num);
        if (ready) playGameMulti(socket);
    })

    // Check player status

    socket.on('check-players', players => {
        players.forEach((plyr,ind) => {
            if(plyr.connected) playerConnectedOrDisconnected(ind);
            if(plyr.ready){
                playerReady(ind);
                if(ind !== playerNum) enemyReady = true;
            }
        })
    })

    // On timeout
    socket.on('timeout', () => {
        infoDisplay.innerHTML = 'You have reached the 5 min lim';
    })


    startButton.addEventListener('click', () => {
        if (allShipsPlaced) playGameMulti(socket)
        else infoDisplay.innerHTML = 'Please place all ships!';
    })

    // eventListener for firing
    computerSquares.forEach(square => { 
        square.addEventListener('click', () => {
            if(currentPlayer === 'user' && ready && enemyReady) {
                shotFired = square.dataset.id;
                socket.emit('fire', shotFired);
            }
        })
    })

    // on fire received
    socket.on('fire', id => {
        console.log('fire received');
        enemyGo(id);
        const square = userSquares[id];
        socket.emit('fire-reply', square.classList);
        playGameMulti(socket); 
    })

    // on fire reply received

    socket.on('fire-reply', classList => {
        revealSquare(classList);
        playGameMulti(socket);
    })







    function playerConnectedOrDisconnected(num){
        let player = `.p${parseInt(num) + 1}`;
        document.querySelector(`${player} .connected span`).classList.toggle('green');
        if(parseInt(num) === playerNum) document.querySelector(player).style.fontWeight = 'bold';
    }
}

function createBoard(grid, squares) {
    for (let i = 0; i < width*width; i++){
        const square = document.createElement('div')
        square.dataset.id = i
        grid.appendChild(square)
        squares.push(square)
    }
}

createBoard(userGrid, userSquares)
createBoard(computerGrid, computerSquares)



const shipArray = [
    {
        name: 'destroyer',
        directions: [
            [0,1],
            [0,width]
        ]
    },
    {
        name: 'submarine',
        directions: [
            [0,1,2],
            [0,width,width*2]
        ]
    },
    {
        name: 'cruiser',
        directions: [
            [0,1,2],
            [0,width,width*2]
        ]
    },
    {
        name: 'battleship',
        directions: [
            [0,1,2,3],
            [0,width,width*2,width*3]
        ]
    },
    {
        name: 'carrier',
        directions: [
            [0,1,2,3,4],
            [0,width,width*2,width*3,width*4]
        ]
    }
]

function generate(ship){
    let randomDirection = Math.floor(Math.random()*ship.directions.length);
    let current = ship.directions[randomDirection];
    if (randomDirection === 0) direction = 1;
    if (randomDirection === 1) direction = 10;
    let randomStart = Math.abs(Math.floor(Math.random()*computerSquares.length - (ship.directions[0].length * direction)));

    const isTaken = current.some(index => computerSquares[randomStart + index].classList.contains('taken'));
    // seriously, that line needs some explanation
    isAtRightEdge = current.some(index => (randomStart + index) % width === width - 1);
    isAtLeftEdge = current.some(index => (randomStart + index) % width === 0);

    if (!isTaken && !isAtRightEdge && !isAtLeftEdge) current.forEach(index => computerSquares[randomStart + index].classList.add('taken', ship.name))
    
    else generate(ship);
    //console.log("Ships generated");
    return;
}


function rotate(){
    if (isHorizontal) {
        destroyer.classList.toggle('destroyer-container-vertical');
        submarine.classList.toggle('submarine-container-vertical');
        cruiser.classList.toggle('cruiser-container-vertical');
        battleship.classList.toggle('battleship-container-vertical');
        carrier.classList.toggle('carrier-container-vertical');
        isHorizontal = false;
        console.log(isHorizontal)
        return;
    }
    if (!isHorizontal) {
        destroyer.classList.toggle('destroyer-container');
        submarine.classList.toggle('submarine-container');
        cruiser.classList.toggle('cruiser-container');
        battleship.classList.toggle('battleship-container');
        carrier.classList.toggle('carrier-container');
        isHorizontal = true;
        console.log(isHorizontal)
        return;
    }
}
rotateButton.addEventListener('click', rotate);

ships.forEach(ship => ship.addEventListener('dragstart', dragStart)); // lower case drag keywords, n.b.
userSquares.forEach(square => square.addEventListener('dragstart', dragStart));
userSquares.forEach(square => square.addEventListener('dragover', dragOver));
userSquares.forEach(square => square.addEventListener('dragenter', dragEnter));
userSquares.forEach(square => square.addEventListener('dragleave', dragLeave));
userSquares.forEach(square => square.addEventListener('drop', dragDrop));
userSquares.forEach(square => square.addEventListener('dragend', dragEnd));

let selectedShipNameWithIndex
let draggedShip
let draggedShipLength

ships.forEach(ship => ship.addEventListener('mousedown', (e) => {
    selectedShipNameWithIndex = e.target.id;
    //console.log(selectedShipNameWithIndex);
}))

//function dragStart(e){
  //  console.log(e.target);
    //console.log(this);
//}

function dragStart(){ // no event passed, just use 'this' 
    // console.log(this);
    draggedShip = this;
    draggedShipLength = draggedShip.childNodes.length; // undefined
    //console.log(draggedShip);
    //console.log(draggedShipLength);
}


function dragOver(e){
    e.preventDefault();
}

function dragEnter(e){
    e.preventDefault();
}

function dragLeave(e){
    e.preventDefault();
    //console.log('Drag Leave');
}

function dragDrop(){
    let shipNameWithLastId = draggedShip.lastChild.id;
    let shipClass = shipNameWithLastId.slice(0,-2);
    //console.log('shipClass: ' + shipClass);
    let lastShipIndex = parseInt(shipNameWithLastId.substr(-1));
    let shipLastId = lastShipIndex + parseInt(this.dataset.id);
    //console.log('shipLastId: ' + shipLastId);
    const notAllowedHorizontal = [
        0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 
        1, 11, 21, 31, 41, 51, 61, 71, 81, 91, 
        2, 12, 22, 32, 42, 52, 62, 72, 82, 92, 
        3, 13, 23, 33, 43, 53, 63, 73, 83, 93,
        100, 101, 102, 103, 104, -1, -2, -3, -4
    ];
    const notAllowedVertical = [
        99, 98, 97, 96, 95, 94, 93, 92, 91, 90,
        89, 88, 87, 86, 85, 84, 83, 82, 81, 80,
        79, 78, 77, 76, 75, 74, 73, 72, 71, 70,
        69, 68, 67, 66, 65, 64, 63, 62, 61, 60
    ];
    
    let newNotAllowedHorizontal = notAllowedHorizontal.splice(0, 10* lastShipIndex);
    let newNotAllowedVertical = notAllowedVertical.splice(0, 10* lastShipIndex);



    selectedShipIndex = parseInt(selectedShipNameWithIndex.substr(-1));
    //console.log('selectedShipIndex: ' + selectedShipIndex);

    shipLastId = shipLastId - selectedShipIndex;
    //console.log('shipLastId (new version): ' + shipLastId);
    if (isHorizontal && !newNotAllowedHorizontal.includes(shipLastId)){
        for (let i = 0; i < draggedShipLength; i++){
            userSquares[parseInt(this.dataset.id) - selectedShipIndex + i].classList.add('taken', shipClass);
        }
    } else if (!isHorizontal && !newNotAllowedVertical.includes(shipLastId)) {
        for (let i = 0; i < draggedShipLength; i++){
            userSquares[parseInt(this.dataset.id) - selectedShipIndex + width*i].classList.add('taken', shipClass);
        }
    } else return;

    displayGrid.removeChild(draggedShip);
    if(!displayGrid.querySelector('.ship')) allShipsPlaced = true;
}

function dragEnd(){

}

// GLFMP

function playGameMulti(socket){
    if(isGameOver) return;
    if(!ready){
        socket.emit('player-ready');
        ready = true;
        playerReady(playerNum);
    }
    
    if(enemyReady){
        if(currentPlayer === 'user'){
            turnDisplay.innerHTML = "Your Go";
        }
        if(currentPlayer === 'enemy'){
            turnDisplay.innerHTML = "Enemy's Go";
        }
    }
}

function playerReady(num){
    let player = `.p${parseInt(num) + 1}`;
    document.querySelector(`${player} .ready span`).classList.toggle('green');
}

// Game Logic for Single Player

function playGameSingle() {
    console.log('PlayGameSingle entered, gameMode is: ');
    console.log(gameMode);
    if (isGameOver) return;
    if (currentPlayer === 'user'){
        console.log(currentPlayer);
        turnDisplay.innerHTML = 'Your Go';
        computerSquares.forEach(square => square.addEventListener('click', function(e){
            shotFired = square.dataset.id;
            revealSquare(square.classList);
        }))
    } 
    if (currentPlayer === 'enemy') {
        console.log('Here we are...');
        turnDisplay.innerHTML = 'Computer\'s Go';
        setTimeout(enemyGo, 10);
    }
}

// startButton.addEventListener('click', playGameSingle);

let destroyerCount = 0;
let submarineCount = 0;
let cruiserCount = 0;
let battleshipCount = 0;
let carrierCount = 0;

function revealSquare(classList) {
    //console.log(gameMode);
    const enemySquare = computerGrid.querySelector(`div[data-id='${shotFired}']`);
    const obj = Object.values(classList);
    if(!enemySquare.classList.contains('boom') && currentPlayer === 'user' && !isGameOver){
        if (obj.includes('destroyer')) destroyerCount++;
        if (obj.includes('submarine')) submarineCount++;
        if (obj.includes('cruiser')) cruiserCount++;
        if (obj.includes('battleship')) battleshipCount++;
        if (obj.includes('carrier')) carrierCount++;
    }
    console.log(gameMode);

    if (obj.includes('taken')) {
        enemySquare.classList.add('boom');
        console.log('boom');
    } else {
        enemySquare.classList.add('miss');
        console.log('miss');
        // WHEN CHANGING VARIABLE NAMES BE VERY THOROUGH
    }
    checkForWins();
    //console.log(gameMode);
    currentPlayer = 'enemy';
    //console.log('revealSquare entered, currentPlayer is: ');
    //console.log(currentPlayer);
    //console.log(gameMode);
    if(gameMode === 'singlePlayer') {
        //console.log('calling playGameSingleFrom rev..');
        playGameSingle();
    }

}

let cpudestroyerCount = 0;
let cpusubmarineCount = 0;
let cpucruiserCount = 0;
let cpubattleshipCount = 0;
let cpucarrierCount = 0;

function enemyGo(square){
    if (gameMode === 'singlePlayer') {
        square = Math.floor(Math.random() * userSquares.length);
    }
    if (!userSquares[square].classList.contains('boom') && !userSquares[square].classList.contains('miss')){
        if(userSquares[square].classList.contains('taken')){
            if (userSquares[square].classList.contains('destroyer')) cpudestroyerCount++;
            if (userSquares[square].classList.contains('submarine')) cpusubmarineCount++;
            if (userSquares[square].classList.contains('cruiser')) cpucruiserCount++;
            if (userSquares[square].classList.contains('battleship')) cpubattleshipCount++;
            if (userSquares[square].classList.contains('carrier')) cpucarrierCount++;
            userSquares[square].classList.add('boom');
            //checkForWins();
        } else userSquares[square].classList.add('miss');
        checkForWins();

    } else if (gameMode === 'singlePlayer') enemyGo();
    currentPlayer = 'user';
    turnDisplay.innerHTML = 'Your Go';
}

function checkForWins() {
    let enemy = 'Computer';
    if(gameMode === 'multiPlayer') enemy = 'Enemy';
    if (destroyerCount === 2){
        infoDisplay.innerHTML = `You sunk the ${enemy}'s destroyer`;
        destroyerCount = 10;
    }
    if (submarineCount === 3){
        infoDisplay.innerHTML = `You sunk the ${enemy}'s submarine`;
        submarineCount = 10;
    }
    if (cruiserCount === 3){
        infoDisplay.innerHTML = `You sunk the ${enemy}'s cruiser`;
        cruiserCount = 10;
    }
    if (battleshipCount === 4){
        infoDisplay.innerHTML = `You sunk the ${enemy}'s battleship`;
        battleshipCount = 10;
    }
    if (carrierCount === 5){
        infoDisplay.innerHTML = `You sunk the ${enemy}'s carrier`;
        carrierCount = 10;
    }
    if (cpudestroyerCount === 2){
        infoDisplay.innerHTML = `${enemy} sunk your destroyer`;
        cpudestroyerCount = 10;
    }
    if (cpusubmarineCount === 3){
        infoDisplay.innerHTML = `${enemy} sunk your submarine`;
        cpusubmarineCount = 10;
    }
    if (cpucruiserCount === 3){
        infoDisplay.innerHTML = `${enemy} sunk your cruiser`;
        cpucruiserCount = 10;
    }
    if (cpubattleshipCount === 4){
        infoDisplay.innerHTML = `${enemy} sunk your battleship`;
        cpubattleshipCount = 10;
    }
    if (cpucarrierCount === 5){
        infoDisplay.innerHTML = `${enemy} sunk your carrier`;
        cpucarrierCount = 10;
    }
    if ((destroyerCount + submarineCount + cruiserCount + battleshipCount + carrierCount) === 50){
        infoDisplay.innerHTML = "YOU WON!";
        gameOver();
    }
    if ((cpudestroyerCount + cpusubmarineCount + cpucruiserCount + cpubattleshipCount + cpucarrierCount) === 50){
        infoDisplay.innerHTML = `${enemy} wins!`;
        gameOver();
    }
    console.log('Your score: ' + parseInt(destroyerCount + submarineCount + cruiserCount + battleshipCount + carrierCount));
    console.log('Enemy score: ' + parseInt(cpudestroyerCount + cpusubmarineCount + cpucruiserCount + cpubattleshipCount + cpucarrierCount));
}

function gameOver(){
    isGameOver = true;
    console.log('Game over')
    startButton.removeEventListener('click', playGameSingle);
}

})
