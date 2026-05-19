# Bitter Rain

CMPM 120 Project 3 platformer level.

## Controls

- A / D: move
- Space: jump
- Double-tap A / D / W / S: dash
- Q: blink
- Mouse swipe up / down: place defensive tree
- H: toggle combat hint
- Enter / F after win or loss: restart

## Required Elements

- Player movement: horizontal movement and jumping.
- Ground and platforms: Tiled collision structures.
- Collectible: health packs restore HP.
- End condition: survive until the boss core reaches zero.
- Level size: roughly three screen widths with horizontal scrolling.
- Camera: player-follow camera with designed zoom and pan behavior.
- Particle juice: running dust plus jump / landing bursts.
- Audio juice: jump, landing, pickup, and warning sounds.
- Tiled object layers: spawn points and ladder zones.
- Game end and restart: visual win / loss states with Enter / F restart.

## Optional Elements Claimed

- Parallax background layers: 1 point.
- Complex camera behavior: 1.5 points.
- Double jump: 1 point.
- Alternate player movement: 1 point.
- Extra juice: 2 points.
- Player harm / HP system: 1 point.
- Enemy: 1 point.
- Dynamic level elements: 1 point.

Optional points requested: 8 / 8.

## Asset Note

I received permission to use my own tile and background assets for this Project 3 build.

## Key Scripts

src/main.js
Sets up the Phaser game configuration, registers the game scenes, and enables Arcade Physics.

src/Scenes/BootScene.js
Preloads the game assets, including images, spritesheets, audio, tilemaps, and JSON configuration files. It also creates the shared animations used by the player, boss, drones, effects, and UI.

src/Scenes/MenuScene.js
Creates the Project 3 title screen. From here, the player can start the main boss-trial level or enter the optional training room.

src/Scenes/BossScene.js
The main gameplay scene. It builds the Tiled arena, creates the player and boss, connects collision systems, starts the camera, manages the boss fight, handles win/loss states, and coordinates the major gameplay systems.

src/Scenes/TrainingScene.js
An optional practice scene where the player can test movement, defensive tree placement, and individual boss attack warnings before entering the main level.

src/Controllers/PlayerController.js
Creates the player avatar and connects movement, dashing, blinking, tree placement, health, animation, hitbox handling, and player feedback.

src/PlayerAbilities/PlayerMovement.js
Handles horizontal movement, jumping, double jumping, ladder movement, landing detection, and small step-up movement for smoother platform traversal.

src/PlayerAbilities/DirectionalDash.js
Implements directional dash movement using double-tap input for A/D/W/S.

src/PlayerAbilities/BlinkAbility.js
Allows the player to blink toward the mouse cursor while checking for safe placement.

src/PlayerAbilities/BlessingTreeAbility.js
Lets the player place temporary defensive trees. These trees can block some attacks and change the combat space.

src/Systems/ArenaBuilder.js
Loads the Tiled map, creates collision bodies, reads object layers for spawn points and ladders, and provides map helper functions used by the player and boss systems.

src/Systems/PlayerParticleJuice.js
Creates the required particle systems for horizontal running movement and vertical jump/landing movement. It also adds particles when defensive trees appear.

src/Systems/PhaseAtmosphereManager.js
Controls the visual atmosphere of the fight, including rain intensity, darkness, cloud cover, player visibility, and phase-based environmental changes.

src/Systems/EnvironmentBroadcastSystem.js
Creates the lower-screen console used for system messages and boss attack warnings. It replaces large floating text so the arena remains readable during combat.

src/Systems/BossPhaseAttacker.js
Controls boss integrity decay, phase thresholds, phase transitions, camera focus during transitions, and boss phase escalation.

src/Systems/BossAttackLoop.js
Schedules boss attacks during active combat and prevents attacks from overlapping during phase transitions or game-over states.

src/BossSkills/*.js
Each file in this folder implements one boss attack pattern, including Ray of Oblivion, Destruction Blast, Annihilation Slash, Holy Clearance, Gravity Field, drone strikes, turret deployment, and Menacing Advance.

src/Managers/AudioCueManager.js
Manages sound effects and audio cues for player actions, boss attacks, warnings, impacts, and collectibles.