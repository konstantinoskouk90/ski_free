/**
 * The skier is the entity controlled by the player in the game. The skier skis down the hill, can move at different
 * angles, and crashes into obstacles they run into. If caught by the rhino, the skier will get eaten and die.
 */

import { IMAGE_NAMES, DIAGONAL_SPEED_REDUCER, KEYS, STATES } from "../Constants";
import { Entity } from "./Entity";
import { Animation } from "../Core/Animation";
import { Canvas } from "../Core/Canvas";
import { ImageManager } from "../Core/ImageManager";
import { intersectTwoRects, Rect } from "../Core/Utils";
import { ObstacleManager } from "./Obstacles/ObstacleManager";
import { Obstacle } from "./Obstacles/Obstacle";

/**
 * The skier starts running at this speed. Saved in case speed needs to be reset at any point.
 */
export const STARTING_SPEED: number = 5;

/**
 * The different directions the skier can be facing.
 */
const DIRECTION_LEFT: number = 0;
const DIRECTION_LEFT_DOWN: number = 1;
const DIRECTION_DOWN: number = 2;
const DIRECTION_RIGHT_DOWN: number = 3;
const DIRECTION_RIGHT: number = 4;

/**
 * Mapping of the image to display for the skier based upon which direction they're facing.
 */
const DIRECTION_IMAGES: {[key: number]: IMAGE_NAMES} = {
    [DIRECTION_LEFT] : IMAGE_NAMES.SKIER_LEFT,
    [DIRECTION_LEFT_DOWN] : IMAGE_NAMES.SKIER_LEFTDOWN,
    [DIRECTION_DOWN] : IMAGE_NAMES.SKIER_DOWN,
    [DIRECTION_RIGHT_DOWN] : IMAGE_NAMES.SKIER_RIGHTDOWN,
    [DIRECTION_RIGHT] : IMAGE_NAMES.SKIER_RIGHT
};

/**
 * Sequences of images that comprise the animations for the different states of the skier.
 */
const IMAGES_JUMPING: IMAGE_NAMES[] = [
    IMAGE_NAMES.SKIER_JUMP1,
    IMAGE_NAMES.SKIER_JUMP2,
    IMAGE_NAMES.SKIER_JUMP3,
    IMAGE_NAMES.SKIER_JUMP4,
    IMAGE_NAMES.SKIER_JUMP5,
];

export class Skier extends Entity {

    /**
     * The name of the current image being displayed for the skier.
     */
    imageName: IMAGE_NAMES = IMAGE_NAMES.SKIER_DOWN;

    /**
     * What state the skier is currently in.
     */
    state: STATES = STATES.STATE_SKIING;

    /**
     * What direction the skier is currently facing.
     */
    direction: number = DIRECTION_DOWN;

    /**
     * How fast the skier is currently moving in the game world.
     */
    speed: number = STARTING_SPEED;

    /**
     * Stored reference to the ObstacleManager
     */
    obstacleManager: ObstacleManager;

    /**
     * Init the skier.
     */
    constructor(x: number, y: number, imageManager: ImageManager, obstacleManager: ObstacleManager, canvas: Canvas) {
        super(x, y, imageManager, canvas);

        this.setupAnimations();

        this.obstacleManager = obstacleManager;
    }

    /**
     * Create and store the animations.
     */
    setupAnimations() {
        this.animations[STATES.STATE_JUMPING] = new Animation(
            IMAGES_JUMPING,
            false,
            this.continueFromJump.bind(this),
        );
    }

    /**
     * Is the skier currently in the skiing state
     */
    isSkiing(): boolean {
        return this.state === STATES.STATE_SKIING;
    }

    /**
     * Is the skier currently in the jumping state
     */
    isJumping(): boolean {
        return this.state === STATES.STATE_JUMPING;
    }

    /**
     * Is the skier currently in the crashed state
     */
    isCrashed(): boolean {
        return this.state === STATES.STATE_CRASHED;
    }

    /**
     * Is the skier currently in the dead state
     */
    isDead(): boolean {
        return this.state === STATES.STATE_DEAD;
    }

    /**
     * Set the current direction the skier is facing and update the image accordingly
     */
    setDirection(direction: number) {
        this.direction = direction;
        this.setDirectionalImage();
    }

    /**
     * Set the skier's image based upon the direction they're facing.
     */
    setDirectionalImage() {
        this.imageName = DIRECTION_IMAGES[this.direction];
    }

    /**
     * Move the skier and check to see if they've hit an obstacle. The skier only moves in the skiing state.
     */
    update(gameTime: number) {
        if (this.isSkiing() || this.isJumping()) {
            this.move();
            this.checkIfHitObstacle();
        }

        // The higher the starting speed the faster the jumping animation
        this.animate(gameTime, 250 / STARTING_SPEED);
    }

    /**
     * Draw the skier if they aren't dead
     */
    draw() {
        if (this.isDead()) {
            return;
        }

        super.draw();
    }

    /**
     * Move the skier based upon the direction they're currently facing. This handles frame update movement.
     */
    move() {
        switch(this.direction) {
            case DIRECTION_LEFT_DOWN:
                this.moveSkierLeftDown();
                break;
            case DIRECTION_DOWN:
                this.moveSkierDown();
                break;
            case DIRECTION_RIGHT_DOWN:
                this.moveSkierRightDown();
                break;
            case DIRECTION_LEFT:
            case DIRECTION_RIGHT:
                // Specifically calling out that we don't move the skier each frame if they're facing completely horizontal.
                break;
        }
    }

    /**
     * Move the skier left. Since completely horizontal movement isn't frame based, just move incrementally based upon
     * the starting speed.
     */
    moveSkierLeft() {
        this.position.x -= STARTING_SPEED;
    }

    /**
     * Move the skier diagonally left in equal amounts down and to the left. Use the current speed, reduced by the scale
     * of a right triangle hypotenuse to ensure consistent traveling speed at an angle.
     */
    moveSkierLeftDown() {
        this.position.x -= this.speed / DIAGONAL_SPEED_REDUCER;
        this.position.y += this.speed / DIAGONAL_SPEED_REDUCER;
    }

    /**
     * Move the skier down at the speed they're traveling.
     */
    moveSkierDown() {
        this.position.y += this.speed;
    }

    /**
     * Move the skier diagonally right in equal amounts down and to the right. Use the current speed, reduced by the scale
     * of a right triangle hypotenuse to ensure consistent traveling speed at an angle.
     */
    moveSkierRightDown() {
        this.position.x += this.speed / DIAGONAL_SPEED_REDUCER;
        this.position.y += this.speed / DIAGONAL_SPEED_REDUCER;
    }

    /**
     * Move the skier right. Since completely horizontal movement isn't frame based, just move incrementally based upon
     * the starting speed.
     */
    moveSkierRight() {
        this.position.x += STARTING_SPEED;
    }

    /**
     * Move the skier up. Since moving up isn't frame based, just move incrementally based upon
     * the starting speed.
     */
    moveSkierUp() {
        this.position.y -= STARTING_SPEED;
    }

    /**
     * Handle keyboard input. If the skier is dead, don't handle any input.
     */
    handleInput(inputCode: string) {
        if (this.isDead()) {
            return false;
        }

        let handled: boolean = true;
 
        switch(inputCode) {
            case KEYS.LEFT:
                this.turnLeft();
                break;
            case KEYS.RIGHT:
                this.turnRight();
                break;
            case KEYS.UP:
                this.turnUp();
                break;
            case KEYS.DOWN:
                this.turnDown();
                break;
            case KEYS.SPACE:
                this.jump();
                break;
            default:
                handled = false;
        }

        return handled;
    }

    /**
     * Turn the skier left. If they're already completely facing left, move them left. Otherwise, change their direction
     * one step left. If they're in the crashed state, then first recover them from the crash.
     * If the skier is in the jumping state do nothing.
     */
    turnLeft() {
        if (!this.isJumping()) {
            if (this.isCrashed()) {
                this.recoverFromCrash(DIRECTION_LEFT);
            }
    
            if (this.direction === DIRECTION_LEFT) {
                this.moveSkierLeft();
            } else {
                this.setDirection(this.direction - 1);
            }
        }
    }

    /**
     * Turn the skier right. If they're already completely facing right, move them right. Otherwise, change their direction
     * one step right. If they're in the crashed state, then first recover them from the crash.
     * If the skier is in the jumping state do nothing.
     */
    turnRight() {
        if (!this.isJumping()) {
            if (this.isCrashed()) {
                this.recoverFromCrash(DIRECTION_RIGHT);
            }

            if (this.direction === DIRECTION_RIGHT) {
                this.moveSkierRight();
            } else {
                this.setDirection(this.direction + 1);
            }
        }
    }

    /**
     * Turn the skier up which basically means if they're facing left or right, then move them up a bit in the game world.
     * If they're in the crashed state, do nothing as you can't move up if you're crashed.
     * If the skier is in the jumping state do nothing.
     */
    turnUp() {
        if (!this.isJumping()) {
            if (this.isCrashed()) {
                return;
            }

            if (this.direction === DIRECTION_LEFT || this.direction === DIRECTION_RIGHT) {
                this.moveSkierUp();
            }
        }
    }

    /**
     * Turn the skier to face straight down. If they're crashed don't do anything to require them to move left or right
     * to escape an obstacle before skiing down again.
     * If the skier is in the jumping state do nothing.
     */
    turnDown() {
        if (!this.isJumping()) {
            if (this.isCrashed()) {
                return;
            }

            this.setDirection(DIRECTION_DOWN);
        }
    }

    /**
     * Make the skier jump. If they're crashed don't do anything to require them to move left or right
     * to escape an obstacle before skiing down again.
     */
    jump() {
        if (this.isCrashed() || this.isJumping()) {
            return;
        }

        this.state = STATES.STATE_JUMPING;
    
        this.setAnimation();
    }

    /**
     * The skier has a bit different bounds calculating than a normal entity to make the collision with obstacles more
     * natural. We want te skier to end up in the obstacle rather than right above it when crashed, so move the bottom
     * boundary up.
     */
    getBounds(): Rect | null {
        const image = this.imageManager.getImage(this.imageName);

        if (!image) {
            return null;
        }

        return new Rect(
            this.position.x - image.width / 2,
            this.position.y - image.height / 2,
            this.position.x + image.width / 2,
            this.position.y - image.height / 4
        );
    }

    /**
     * Go through all the obstacles in the game and see if the skier collides with any of them. If so, crash the skier.
     */
    checkIfHitObstacle() {
        const skierBounds = this.getBounds();

        if (!skierBounds) {
            return;
        }

        const obstacles = this.obstacleManager.getObstacles();

        const jumpRampCollision = obstacles.find((obstacle: Obstacle): boolean => {
            const obstacleBounds = obstacle.getBounds();

            if (!obstacleBounds) {
                return false;
            }

            const collided = intersectTwoRects(skierBounds, obstacleBounds);

            if (this.isJumpRampCollision(collided, obstacle.imageName)) {
                return true;
            }

            return false;
        });

        if (jumpRampCollision) {
            this.jump();

            return;
        }

        const normalCollision = obstacles.find((obstacle: Obstacle): boolean => {
            const obstacleBounds = obstacle.getBounds();

            if (!obstacleBounds) {
                return false;
            }

            const collided = intersectTwoRects(skierBounds, obstacleBounds);

            /* We do not consider this to be an actual collision - thus we return false */
            if (this.isRockJumpCollision(collided, obstacle.imageName)) {
                return false;
            }

            return collided;
        });

        if (normalCollision) {
            this.crash();
        }
    }

    /**
     * Has collided with rock while jumping, which we do not consider to be an actual collision
     * as rocks can be jumped over
     */
    isRockJumpCollision(collided: boolean, imageName: IMAGE_NAMES) {
        return collided && (imageName === IMAGE_NAMES.ROCK1 || imageName === IMAGE_NAMES.ROCK2) && this.state === STATES.STATE_JUMPING;
    }
    
    /**
     * Has collided with jump ramp, which we do not consider to be an actual collision
     * as jump ramps initiate the jumping state and corresponding animation
     */
    isJumpRampCollision(collided: boolean, imageName: IMAGE_NAMES) {
        return collided && imageName === IMAGE_NAMES.JUMP_RAMP;
    }

    /**
     * Crash the skier. Set the state to crashed, set the speed to zero cause you can't move when crashed and update the
     * image.
     */
    crash() {
        this.state = STATES.STATE_CRASHED;
        this.speed = 0;
        this.imageName = IMAGE_NAMES.SKIER_CRASH;
    }

    /**
     * Change the skier back to the skiing state, get them moving again at the starting speed and set them facing
     * whichever direction they're recovering to.
     */
    recoverFromCrash(newDirection: number) {
        this.state = STATES.STATE_SKIING;
        this.speed = STARTING_SPEED;
        this.setDirection(newDirection);
    }

    /**
     * Change the skier back to the skiing state, get them moving again at the starting speed and set them facing
     * whichever direction they're recovering to.
     */
    continueFromJump() {
        this.state = STATES.STATE_SKIING;
        this.speed = STARTING_SPEED;
        this.setDirection(DIRECTION_DOWN);
    }

    /**
     * Kill the skier by putting them into the "dead" state and stopping their movement.
     */
    die() {
        this.state = STATES.STATE_DEAD;
        this.speed = 0;
    }
}