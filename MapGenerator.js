//*******************************************************
// Tile Class:
//*******************************************************

class Tile {
    constructor(row, col, color) {
        this.row = row;
        this.col = col;
        this.color = color;
    }

    isSameLocationAs(row,col) {
        if ((this.row == row) && (this.col == col)) {
            //console.log ("Same as tile at " + row + ", " + col);
            return true;
        } else {
            return false;
        }
    }

    erase() {
        eraseTileByMapCoords(this.row, this.col);
    }
}

//*******************************************************
// Constants:
//*******************************************************
const tileWidth = 20;
const tileHeight = 20;
const mapMargin = 0;
const mapCenterRow = 3;   // in map coords, not screen coords.
const mapCenterCol = 3;    // in map coords, not screen coords.
const mountainsAreLava = true;  // movement not allowed on mountains.

//*******************************************************
// Color code:
//*******************************************************
const red = "#FF0000";
const black = "#000000";
const grass = "#556B2F";    // DarkOliveGreen.
const water = "#1E90FF";    // DodgerBlue.
const mountains = "#A9A9A9";  // DarkGrey.
const playerUnitColor = "#FF4500";  // Peru.

//*******************************************************
// Variables:
//*******************************************************

var turnCounter = 1;
var numPoints = 9;      // number of tiles explored
var turnsOnGrass = 0;
var turnsOnWater = 0;
var turnsOnMountains = 0;
var playerLocation = new Tile();
playerLocation.row = mapCenterRow;
playerLocation.col = mapCenterCol;
var unitLocations = [playerLocation];   // initialize an array of one.
                                        // Later versions of the game may include multiple units.

// Instead of a 2D array, we will store tiles in a 1D array of objects.
// (this probably makes more sense for extremely "sparse" maps;
//  maps where explored tiles occupy only a tiny fraction of the canvas).
// Each object will have 3 elements: a row, a col, and a terrain.
var allTiles = [];
var centerTile = new Tile(mapCenterRow, mapCenterCol, grass);

//*******************************************************
// DOM elements:
//*******************************************************
var canvas = document.getElementById("canvas");
//canvas.height = 800;
var ctx = canvas.getContext("2d");

var radiusSpan = document.getElementById("radiusSpan");
var influenceRadiusSlider = document.getElementById("influenceRadiusSlider");
var grassSlider = document.getElementById("grassSlider");
var waterSlider = document.getElementById("waterSlider");
var mountainSlider = document.getElementById("mountainSlider");
var testButton = document.getElementById("testButton");
var turnCounterLabel = document.getElementById("turnCounterLabel");

var footprintsToggle = document.getElementById("footprintsToggle");

var pointsLabel = document.getElementById("pointsLabel");
var grassLabel = document.getElementById("grassLabel");
var waterLabel = document.getElementById("waterLabel");
var mountainLabel = document.getElementById("mountainLabel");

var northButton = document.getElementById("northButton");
var westButton = document.getElementById("westButton");
var eastButton = document.getElementById("eastButton");
var southButton = document.getElementById("southButton");

function incrementTurnCounter() {
    turnCounter++;
    updateTurnCounterLabel();
}
function incrementPoints() {
    numPoints++;
    updatePointsLabel();
}

function updateTurnCounterLabel() {
    turnCounterLabel.innerHTML = "Turn: " + turnCounter;
}
function updatePointsLabel() {
    pointsLabel.innerHTML = "Number of tiles explored: " + numPoints;
}
function updateGrassLabel() {
    grassLabel.innerHTML = "Number of turns spent on grass: " + turnsOnGrass;
}
function updateWaterLabel() {
    waterLabel.innerHTML = "Number of turns spent on water: " + turnsOnWater;
}
function updateMountainLabel() {
    if (mountainsAreLava) {
        mountainLabel.innerHTML = ""
    } else {
        mountainLabel.innerHTML = "Number of turns spent on mountains: " + turnsOnMountains;
    }
}

influenceRadiusSlider.oninput = function() {
  radiusSpan.innerHTML = influenceRadiusSlider.value;
}

northButton.onclick = moveNorth;
westButton.onclick = moveWest;
eastButton.onclick = moveEast;
southButton.onclick = moveSouth;




//*******************************************************
// Keyboard Controls:
//*******************************************************

document.onkeyup = handleKeyboardEvent;

function printLocation() {
  alert(`Your Location: ${playerLocation.row}, ${playerLocation.col}`);
}

function handleKeyboardEvent(key) {
  if (key.code == "KeyZ") { 
    //printLocation();
    playerLocation.erase();
  }
  // Joystick (aswd keys for 4 directions):
  else if (key.code == "KeyW") { 
    //alert("Thank you for typing UP");
    moveNorth();
  } else if (key.code == "KeyS") {
    //alert("Thank you for typing DOWN");
    moveSouth();
  } else if (key.code == "KeyA") {
    //alert("Thank you for typing LEFT");
    moveWest();
  } else if (key.code == "KeyD") {
    //alert("Thank you for typing RIGHT");
    moveEast();
  }
}


//*******************************************************
// Unit Movement:
//*******************************************************

function drawUnit(unitIndex) {
  var location = unitLocations[unitIndex];
  drawCircleByMapCoords(location.row, location.col);
}

// These 4 functions are abstracted so that they can be called from
// either keyboard clicks or buttons presses:
function moveNorth() {
    moveUnit(0, -1, 0);
}
function moveSouth() {
    moveUnit(0, 1, 0);
    //printLocation();
}
function moveWest() {
    moveUnit(0, 0, -1);
}
function moveEast() {
    moveUnit(0, 0, 1);
}

function moveUnit(unitIndex, deltaRow, deltaCol) {
    var location = unitLocations[unitIndex];
    var oldRow = location.row;
    var oldCol = location.col;
    //var oldTerrain = location.color;
    var newRow = oldRow + deltaRow;
    var newCol = oldCol + deltaCol;

    // Cancellation conditions:
    if (newRow < 0 || newCol < 0) {
    alert("EDGE OF MAP:  You cannot move off the board");
    return;
    }
    if (mapMargin + (newCol+1) * tileWidth >= canvas.width) {
      //alert("You have reached the east end of the map!");
      expandCanvasEast();
    }
    if (mapMargin + (newRow+1) * tileHeight >= canvas.height) {
      //alert("You have reached the south end of the map!");
      expandCanvasSouth();
    }
    var newTile = getTileAt(newRow, newCol);
    var newTerrain = newTile.color;
    if (mountainsAreLava && newTerrain == mountains) {
        alert("Sorry, you cannot cross mountains.")
        return;
    }
  
    location.row = newRow;
    location.col = newCol;
    // Make new tiles as necessary:
    exploreTile(newRow, newCol);

    // Erase the unit from old location, and draw at new:
    eraseUnit(oldRow, oldCol);
    drawUnit(unitIndex);

    // Update turn counter:
    turnCounter++;
    updateTurnCounterLabel();

    if (newTerrain == grass) {
        turnsOnGrass++;
        updateGrassLabel();
    } else if (newTerrain == water) {
        turnsOnWater++;
        updateWaterLabel();
    } else if (newTerrain == mountains) {
        turnsOnMountains++;
        updateMountainLabel();
    }
}





//*******************************************************
// Seed Map - Terrain:
// [ !Map uses (row, col) notation! ]
//*******************************************************

function initializeSeedMap() {
  // Create the map:
    allTiles.push(centerTile);
    // Top row of 3x3 seed map:
    allTiles.push(new Tile(mapCenterRow - 1, mapCenterCol - 1, water));
    allTiles.push(new Tile(mapCenterRow - 1, mapCenterCol, grass));
    allTiles.push(new Tile(mapCenterRow - 1, mapCenterCol + 1, water));
    // Middle row (centerTile has already been created):
    allTiles.push(new Tile(mapCenterRow, mapCenterCol - 1, grass));
    allTiles.push(new Tile(mapCenterRow, mapCenterCol + 1, grass));
    // Bottom row of 3x3 seed map:
    allTiles.push(new Tile(mapCenterRow + 1, mapCenterCol - 1, mountains));
    allTiles.push(new Tile(mapCenterRow + 1, mapCenterCol, grass));
    allTiles.push(new Tile(mapCenterRow + 1, mapCenterCol + 1, mountains));

  // Draw the map:
    canvas.width = 300;
    canvas.height = 180;

    drawAllMapTiles();

    // Draw a 5x5 starting map:
    //for(x = -2; x <= 2; x++) {
    //    for(y = -2; y <= 2; y++) {
    //        makeNewTile(mapCenterRow + x, mapCenterCol + y, influenceRadiusSlider.value);
    //    }
    //}

    // Draw a 7x7 starting map:
    //for(x = -3; x <= 3; x++) {
    //    for(y = -3; y <= 3; y++) {
    //        makeNewTile(mapCenterRow + x, mapCenterCol + y, influenceRadiusSlider.value);
    //    }
    //}

  // Draw the unit(s):
    drawUnit(0);
}


//*******************************************************
// Tile Functions:
//*******************************************************

function getTileAt(row, col) {
    // This function is only necessary because we aren't using a 2D array.
    var targetTile = null;
    function findMatchingTile(tile) {
        if (tile.isSameLocationAs(row,col)) {
            targetTile = tile;
        }
    }
    allTiles.forEach(findMatchingTile);
    return targetTile;
}

//*******************************************************
// Tile Generator:
//*******************************************************

function makeNewTile(row, col, radius) {
    // Cancellation condition: the tile is off the map:
    if (row < 0 || col < 0) {
        return;
    }

  // Skip this function if a tile already exists at this location:
  var alreadyExists = false;
  function dirtyFlagIfExists(tile) {
    if (tile.isSameLocationAs(row,col)) {
      alreadyExists = true;
    }
  }
  allTiles.forEach(dirtyFlagIfExists);
  if (alreadyExists) {
    console.log("tile already exists.");
    return;
  }

  //console.log("Tile does not exist yet: " + row + ", " + col);

  // Choose terrain randomly from tiles within 'radius'.
  var xDistance, yDistance;
  
  // First build an array of all the existing tiles with radius:
  var nearbyTiles = [];

  function addToNearbyTilesIfWithinRadius(tile) {
        xDistance = Math.abs(col-tile.col);
        yDistance = Math.abs(row-tile.row);
        if (xDistance + yDistance <= radius) {
          nearbyTiles.push(tile); 
	  //console.log("Color: " + tile.color);
        }
  }

  // Loop thru all tiles, adding only the ones within radius:
  allTiles.forEach(addToNearbyTilesIfWithinRadius);

    // Also add some fake tiles based on user's desire for "more water" etc:
    for (counter = 0; counter < grassSlider.value; counter++) {
        fakeTile = new Tile(0,0, grass);
        nearbyTiles.push(fakeTile)
    }
    for (counter = 0; counter < waterSlider.value; counter++) {
        fakeTile = new Tile(0,0, water);
        nearbyTiles.push(fakeTile)
    }
    for (counter = 0; counter < mountainSlider.value; counter++) {
        fakeTile = new Tile(0,0, mountains);
        nearbyTiles.push(fakeTile)
    }

  // Unit Test:
  // Draw all the tiles within radius:
  // nearbyTiles.forEach(draw); 

  // Randomly select one tile from those within radius:
  var numNearbyTiles = nearbyTiles.length;
  if (numNearbyTiles == 0) {
    return;
  }
  console.log("Selecting from " + numNearbyTiles + " tiles");

  var randomIndex = Math.floor(numNearbyTiles * Math.random());
    console.log("index: " + randomIndex);
  var randomColor = nearbyTiles[randomIndex].color;
    console.log("color: " + randomColor);
  var newTile = new Tile(row, col, randomColor)
  allTiles.push(newTile);
  draw(newTile);

  incrementPoints();
}

function exploreTile(centerRow, centerCol) {
    // Make sure the nearest 9 tiles (every adjacent and diagonally adjacent tile) exist;
    // call makeNewTile() 9 times.
    for (row = centerRow-1; row <= centerRow+1; row++) {
        for (col = centerCol-1; col <= centerCol+1; col++) {
            makeNewTile(row,col, influenceRadiusSlider.value)
        }
    }
}








//*******************************************************
// Graphics:
//*******************************************************

function drawTileByScreenCoordinatesUL(x, y, color) {
    // UL = Upper Left; provide the coords of the upper left corner.
    ctx.fillStyle = color;
    ctx.fillRect(x, y, tileWidth, tileHeight);
}

function drawTileByMapCoords(row, col, color) {
    // ! The order of row & col are switched !
    // (to match the Excel/VBA style, where row=y, col=x)
    var colPixels = mapMargin + col*tileWidth;
    var rowPixels = mapMargin + row*tileHeight;
    drawTileByScreenCoordinatesUL(colPixels, rowPixels, color);
}

function draw(tile) {
  drawTileByMapCoords(tile.row, tile.col, tile.color);
}

function eraseTileByScreenCoordinatesUL(x, y) {
  // UL = Upper Left; provide the coords of the upper left corner.
  ctx.clearRect(x, y, tileWidth, tileHeight);
}
function eraseTileByMapCoords(row, col) {
  var colPixels = mapMargin + col*tileWidth;
  var rowPixels = mapMargin + row*tileHeight;
  eraseTileByScreenCoordinatesUL(colPixels, rowPixels);
}

function eraseUnit(row, col) {
    // Erase the tile (erases that area of the canvas),
    // and then redraw just the tile (not the unit):
    eraseTileByMapCoords(row,col);
    draw(getTileAt(row,col));
}

function drawCircleByScreenCoordinatesCenter(x, y) {
    var radius = Math.min(tileWidth, tileHeight)/4
    if (footprintsToggle.checked == true) {
        radius *= 1.3;
    }
    ctx.lineWidth = 10;
    ctx.strokeStyle = playerUnitColor;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.stroke(); 
}
function drawCircleByMapCoords(row, col) {
  var colPixels = mapMargin + col*tileWidth + tileWidth/2;
  var rowPixels = mapMargin + row*tileHeight + tileHeight/2;
  drawCircleByScreenCoordinatesCenter(colPixels, rowPixels)
}


function drawAllMapTiles() {
    allTiles.forEach(function (tile) {
        drawTileByMapCoords(tile.row, tile.col, tile.color);
    })
}

function expandCanvasEast() {
    canvas.width *= 2;
    drawAllMapTiles();
}
function expandCanvasSouth() {
    canvas.height *= 2;
    drawAllMapTiles();
}

function toggleFootprints() {
    // Assumes there is only one unit.
    var location = unitLocations[0];

    // Erase and redraw the nearest 9 tiles, plus the unit:
    for (row=location.row-1; row<=location.row+1; row++) {
        for (col=location.col-1; col<=location.col+1; col++) {
            eraseTileByMapCoords(row,col);
            draw(getTileAt(row,col));
        }
    }
    drawUnit(0);
}


//*******************************************************
// Testing:
//*******************************************************
updateTurnCounterLabel();
updatePointsLabel();
//incrementTurnCounter();
//incrementPoints();
function Test_drawTileByScreenCoordinatesUL() {
    drawTileByScreenCoordinatesUL(20,20, red);
    drawTileByScreenCoordinatesUL(120,120, "#FF0000");
}
function  Test_drawTileByMapCoords() {
    //drawTileByMapCoords(1,2, grass);
    //drawTileByMapCoords(2,1, mountains);
    //drawTileByMapCoords(3,3, water);

    //drawTileByMapCoords(centerTile.row, centerTile.col, centerTile.color);
    drawAllMapTiles();
}
//Test_drawTileByScreenCoordinatesUL();
//makeNewTile(mapCenterRow-2, mapCenterCol, 3)


//*************se******************************************
// Initialization:
//*********************************************************

function initialzeUI() {
    updateGrassLabel();
    updateWaterLabel();
    updateMountainLabel();
}

initialzeUI();
initializeSeedMap();
