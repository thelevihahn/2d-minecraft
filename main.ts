namespace SpriteKind {
    export const UI = SpriteKind.create()
}
sprites.onCreated(SpriteKind.Enemy, function (sprite) {
    entities.push(sprite)
})
function GetLocationFromPosition (x: number, y: number) {
    col = Math.floor(x / tileSize)
    row = Math.floor(y / tileSize)
    return tiles.getTileLocation(col, row)
}
// Modified smooth interpolation for pixel-based movement
function smoothLerp (startValue: number, endValue: number, lerpFactor: number, minSpeed: number) {
    difference = endValue - startValue
    // Ensure there's always some minimal movement to avoid choppiness
    if (Math.abs(difference) < minSpeed) {
        // Snap to target when difference is small
        return endValue
    }
    return startValue + difference * lerpFactor
}
function GroundEdgeCheck () {
    checkX = (Steve.x + Steve.width / 3 * SteveFacingX) / 16
    checkY = Math.ceil(Steve.bottom + 8) / 16
    return tiles.tileAtLocationIsWall(tiles.getTileLocation(checkX, checkY))
}
sprites.onCreated(SpriteKind.Player, function (sprite) {
    entities.push(sprite)
})
let camYraw = 0
let camXraw = 0
let CameraTargetX = 0
let currentFrame = 0
let frameInterval = 0
let animTime = 0
let timerAButton = 0
let selectedTile: tiles.Location = null
let steveYSelection = 0
let steveXSelection = 0
let inputX = 0
let timerInputUpHeld = 0
let SteveFacingY = 0
let breakPercent = 0
let SteveCrouchToggle = false
let timerInputDownHeld = 0
let SteveCrouching = false
let steveIdleTimer = 0
let touchingGround = false
let CameraTargetY = 0
let inputY = 0
let steveCenterY2 = 0
let checkY = 0
let SteveFacingX = 0
let checkX = 0
let difference = 0
let Steve: Sprite = null
let tileSize = 0
let steveCenterY = 0
let speedX = 0
let entities: Sprite[] = []
let col2 = 0
let row2 = 0
let col = 0
let row = 0
function SelectBlock(thisTile: tiles.Location) {
    // Place the selector
    BlockSelector.setFlag(SpriteFlag.Invisible, false)
    tiles.placeOnTile(BlockSelector, thisTile)
    for (let entity of entities) {
        if (BlockSelector.overlapsWith(entity)) {
            BlockSelector.setFlag(SpriteFlag.Invisible, true);
            return false;
        }
    }
    return true;
}
let lastSelectedTile: tiles.Location = new tiles.Location(0,0,game.currentScene().tileMap);
let selectorAnim = assets.animation`BlockBreakAnim`
function CompareLocation(loc1: tiles.Location, loc2: tiles.Location){
    if (loc1.col == loc2.col){
        if (loc1.row == loc2.row){
            return true;
        }
    }
    return false;
}
tileSize = 16
scene.setBackgroundColor(9)
Steve = sprites.create(assets.image`SteveStandForward`, SpriteKind.Player)
Steve.ay = 300
tiles.setCurrentTilemap(tilemap`level2`)
let BlockSelector = sprites.create(assets.image`BlockSelectionIndicator`, SpriteKind.UI)
BlockSelector.setFlag(SpriteFlag.Invisible, false)
game.onUpdate(function () {
    steveCenterY2 = Steve.y - 8
    inputY = Math.constrain(controller.dy(), -1, 1)
    CameraTargetY = Steve.y - 10
    touchingGround = Steve.isHittingTile(CollisionDirection.Bottom)
    if (controller.anyButton.isPressed()) {
        steveIdleTimer = 0
    } else {
        steveIdleTimer += 1
        if (steveIdleTimer >= 200) {
            // Transition to idle
            SteveFacingX = 0
        }
    }
    // DOWN INPUT
    // SteveCrouching = false;
    if (inputY > 0) {
        if (touchingGround) {
            SteveCrouching = true
        }
        timerInputDownHeld += 1
    } else {
        SteveCrouching = false
        if (timerInputDownHeld > 0) {
            if (timerInputDownHeld < 10) {
                steveIdleTimer += 200
            }
            if (timerInputDownHeld > 30) {
                if (touchingGround) {
                    SteveCrouchToggle = true
                }
            } else {
                // SteveCrouching = false;
                SteveCrouchToggle = false
            }
        }
        if (breakPercent > 0) {
        	
        }
        if (SteveCrouchToggle) {
            SteveCrouching = SteveCrouchToggle
        }
        timerInputDownHeld = 0
    }
    if (SteveCrouching) {
        SteveFacingY = -1
        CameraTargetY = steveCenterY2
        if (timerInputDownHeld >= 30) {
            SteveFacingY = -2
            CameraTargetY = Steve.y + 30
        }
    } else {
        if (touchingGround) {
            SteveFacingY = 0
        } else {
            SteveFacingY = -2
        }
    }
    // UP INPUT
    if (inputY < 0) {
        timerInputUpHeld += 1
        if (touchingGround) {
            if (timerInputUpHeld > 20) {
                CameraTargetY = Steve.y - 40
                SteveFacingY = 1
            }
        }
    } else {
        if (timerInputUpHeld > 0 && timerInputUpHeld < 20) {
            if (touchingGround) {
                Steve.vy += -120
                SteveCrouching = false
            }
        }
        timerInputUpHeld = 0
    }
    inputX = Math.constrain(controller.dx(), -1, 1)
    speedX = 100
    if (inputX != 0) {
        SteveFacingX = inputX
        if (SteveCrouching) {
            if (!(GroundEdgeCheck())) {
                speedX *= 0;
            } else {
                speedX *= 0.5;
            }
        } else {
            speedX *= 1;
        }
    }
    Steve.vx = inputX * speedX
    // BLOCK INTERACTIONS
    steveXSelection = Steve.x + (tileSize + 7) * SteveFacingX
    steveYSelection = steveCenterY2 - tileSize * SteveFacingY
    selectedTile = GetLocationFromPosition(steveXSelection, steveYSelection)
    if (SelectBlock(selectedTile)) {
        if (controller.A.isPressed()) {
            if (timerAButton < 1 && !(selectedTile.isWall())) {
                tiles.setTileAt(selectedTile, sprites.castle.tilePath2)
                tiles.setWallAt(selectedTile, true)
            } else if (selectedTile.isWall() && CompareLocation(selectedTile, lastSelectedTile)) {
                // increase breakPercent
                breakPercent += 1
                // update selectorAnim
                // breakPercent of anim equals animLenth/frameLength*frameinterval
                animTime = 100
                frameInterval = animTime / (selectorAnim.length - 1)
                currentFrame = breakPercent / frameInterval
                BlockSelector.setImage(selectorAnim[currentFrame])
                if (breakPercent >= animTime + frameInterval) {
                    tiles.setTileAt(selectedTile, assets.tile`transparency16`)
                    tiles.setWallAt(selectedTile, false)
                    BlockSelector.setImage(selectorAnim[0])
                }
            }
            timerAButton += 1
        } else {
            timerAButton = 0
            breakPercent = 0
        }
        if (!(CompareLocation(selectedTile, lastSelectedTile))) {
            // same tile
            lastSelectedTile = selectedTile
            breakPercent = 0
            BlockSelector.setImage(selectorAnim[0])
        }
    }
    // Calculate CameraTargetY based on movement state
    // animations
    if (SteveFacingX < 0) {
        if (SteveCrouching) {
            if (SteveFacingY == -2) {
                Steve.setImage(assets.image`SteveCrouchLeftLookDown0`)
            } else {
                Steve.setImage(assets.image`SteveCrouchLeft`)
            }
        } else {
            if (SteveFacingY == 1) {
                Steve.setImage(assets.image`SteveStandLeftLookUp`)
            } else {
                Steve.setImage(assets.image`SteveStandLeft`)
            }
        }
    } else if (SteveFacingX > 0) {
        if (SteveCrouching) {
            if (SteveFacingY == -2) {
                Steve.setImage(assets.image`SteveCrouchRightLookDown0`)
            } else {
                Steve.setImage(assets.image`SteveCrouchRight`)
            }
        } else {
            if (SteveFacingY == 1) {
                Steve.setImage(assets.image`SteveStandRightLookUp`)
            } else {
                Steve.setImage(assets.image`SteveStandRight`)
            }
        }
    } else {
        if (SteveCrouching) {
            if (SteveFacingY == -2) {
                Steve.setImage(assets.image`SteveCrouchForwardLookDown`)
            } else {
                Steve.setImage(assets.image`SteveCrouchForward`)
            }
        } else {
            if (SteveFacingY == 1) {
                Steve.setImage(assets.image`SteveStandForwardLookUp`)
            } else {
                Steve.setImage(assets.image`SteveStandForward`)
            }
        }
    }
    CameraTargetX = Steve.x + 32 * SteveFacingX
    // Use a factor that depends on how close you are to the target
    // directionX = CameraTargetX - camXraw;
    // directionY = CameraTargetY - camYraw;
    // lerpFactorX2 = Math.max(0.1, Math.abs(directionX / 300));
    // lerpFactorY2 = Math.min(0.1, Math.abs(directionY / 300));
    // Minimal movement of 1 pixel to reduce choppiness
    camXraw = smoothLerp(camXraw, CameraTargetX, 0.1, 1)
    camYraw = smoothLerp(camYraw, CameraTargetY, 0.15, 1)
    scene.centerCameraAt(Math.round(camXraw), Math.round(camYraw))
    // Log for debugging
    if (false) {
        console.log("Steve.x " + Steve.x + " CameraTargetX: " + CameraTargetX + " CameraX: " + scene.cameraProperty(CameraProperty.X) + " camXraw: " + camXraw)
    }
})
