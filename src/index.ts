/**
 * The entry point for the game. Creates the game, kicks off any loading that's needed and then starts the game running.
 */

import '../css/game.css';
import { KEYS } from './Constants';
import { Game } from './Core/Game';

document.addEventListener("DOMContentLoaded", async () => {
    const skiGame: Game = new Game();
    await skiGame.load();
    skiGame.run();
});

document.addEventListener("keydown", async (event) => {
    // Restart the game when the user presses ESCAPE
    if (event.code === KEYS.ESCAPE) {
        const skiGame: Game = new Game();
        await skiGame.load();
        skiGame.run();
    }
});