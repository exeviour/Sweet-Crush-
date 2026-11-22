Summary of the Match-3 Game
This project is a Candy Crush-style Match-3 puzzle game developed through iterative prototypes and a mobile-inspired web app version.
 * Core Gameplay Loop: Players swap adjacent pieces or candies on a grid to form matches of three or more of the same type, clearing them to score points and trigger gravity, top refills, and chained cascade combos.
 * Progression, Obstacles & Special Pieces: Levels feature move limits, score targets, candy collection goals, and level progression (including endless level scaling with rotating board cutouts and frosting tiles in the web app version). Larger matches create special pieces such as line blasters and 3×3 bombs, and the web app includes a bottom booster dock with smash/hammer, shuffle, and 3×3 blast power-ups.
 * Versions & UI Evolution: It began as a Python + Pygame prototype using geometric shapes and a simple HUD, then evolved into a portrait mobile-style web app (index.html, game.js, and README.md) featuring glossy candies, a moves counter, a star progress meter, a goal badge, and a booster dock.
Would you like to expand any specific part of this game—such as adding local high-score saving or sound effects?


Sweet Crush — Infinite Match-3 App Source Folder

This folder contains the source files for the portrait mobile-style Match-3 web app with infinite level progression, rotating board shapes, frosting tiles, special candies, and booster dock controls.


Folder Structure


index.html — Mobile app frame, top HUD (moves, star progress meter, level badge, candy goal, next-level button), playfield container, and bottom booster dock.

game.js — Match-3 board generator, match/special detection, gravity and cascade loop, booster actions, and infinite level scaling.

README.md — Run and customization instructions.


How to Run


Extract or open the sweet-crush-game folder.

Open index.html in any web browser (or serve the folder with a local static server).

