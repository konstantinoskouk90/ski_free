/**
 * A basic game entity with a position and image to be displayed in the game, as well as animations.
 */

import { Animation } from "../Core/Animation";
import { Canvas } from "../Core/Canvas";
import { ImageManager } from "../Core/ImageManager";
import { Position, Rect } from "../Core/Utils";
import { IMAGE_NAMES, STATES } from "../Constants";

export abstract class Entity {
    /**
     * Represents the position of the center of the entity.
     */
    position: Position;

    /**
     * Stored reference to the ImageManager
     */
    imageManager: ImageManager;

    /**
     * Stored reference to the Canvas entity is drawn to
     */
    canvas: Canvas;

    /**
     * Stores all of the animations available for the different states of the entity.
     */
    animations: { [key: string]: Animation };

    /**
     * The animation that the entity is currently using. Typically matches the state the rhino is in.
     */
    curAnimation: Animation | null;
    
    /**
     * The current frame of the current animation the rhino is on.
     */
    curAnimationFrame: number;
        
    /**
     * The time in ms of the last frame change. Used to provide a consistent framerate.
     */
    curAnimationFrameTime: number;

    /**
     * What state the entity is currently in.
     */
    abstract state: STATES | null;

    /**
     * The name of the current image being displayed for the entity.
     */
    abstract imageName: IMAGE_NAMES;

    /**
     * Initialize the entities position.
     */
    constructor(x: number, y: number, imageManager: ImageManager, canvas: Canvas) {
        this.position = new Position(x, y);
        this.imageManager = imageManager;
        this.canvas = canvas;
        this.animations = {};
        this.curAnimation = null;
        this.curAnimationFrame = 0;
        this.curAnimationFrameTime = 0;
    }

    /**
     * Return the skier's position
     */
    getPosition(): Position {
        return this.position;
    }

    /**
     * Draw the entity to the canvas centered on the X,Y position.
     */
    draw() {
        const image = this.imageManager.getImage(this.imageName);

        if (!image) {
            return;
        }

        const drawX = this.position.x - image.width / 2;
        const drawY = this.position.y - image.height / 2;

        this.canvas.drawImage(image, drawX, drawY, image.width, image.height);
    }

    /**
     * Return a bounding box in world space coordinates for the entity based upon the current image displayed.
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
            this.position.y
        );
    }

    /**
     * Set the current animation, reset to the beginning of the animation and set the proper image to display.
     */
    setAnimation() {
        this.curAnimation = this.animations[this.state as STATES];
    
        if (!this.curAnimation) {
            return;
        }
        
        this.curAnimationFrame = 0;
        
        const animateImages = this.curAnimation.getImages();

        this.imageName = animateImages[this.curAnimationFrame];
    }
    
    /**
     * Advance to the next frame in the current animation if enough time has elapsed since the previous frame.
     */
    animate(gameTime: number, animationFrameSpeed: number) {
        if (!this.curAnimation) {
            return;
        }
        
        if (gameTime - this.curAnimationFrameTime > animationFrameSpeed) {
            this.nextAnimationFrame(gameTime);
        }
    }

    /**
     * Increase the current animation frame and update the image based upon the sequence of images for the animation.
     * If the animation isn't looping, then finish the animation instead.
     */
    nextAnimationFrame(gameTime: number) {
        if (!this.curAnimation) {
            return;
        }
        
        const animationImages = this.curAnimation.getImages();
        
        this.curAnimationFrameTime = gameTime;
        this.curAnimationFrame++;
    
        if (this.curAnimationFrame >= animationImages.length) {
            if (!this.curAnimation.getLooping()) {
                this.finishAnimation();

                return;
            }
        
            this.curAnimationFrame = 0;
        }
        
        this.imageName = animationImages[this.curAnimationFrame];
    }

    /**
     * The current animation wasn't looping, so finish it by clearing out the current animation and firing the callback.
     */
    finishAnimation() {
        if (!this.curAnimation) {
            return;
        }
        
        const animationCallback = this.curAnimation.getCallback();

        this.curAnimation = null;
        
        if (animationCallback) {
            animationCallback.apply(null);
        }
    }

    /**
     * All entities need to define if they die and what happens when they do
     */
    abstract die(): void;
}