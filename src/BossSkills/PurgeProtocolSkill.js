export default class PurgeProtocolSkill {
  constructor(scene) {
    this.scene = scene;

    this.activeDrones = [];
    this.activeBombs = [];
    this.activeMarkers = [];
    this.activeExplosions = [];

    this.headWarningText = null;
    this.headWarningBg = null;
    this.headWarningFollowEvent = null;
  }

  cast() {
    const scene = this.scene;

    if (
      !scene.boss ||
      !scene.boss.active ||
      scene.gameOver ||
      scene.isPhaseTransitioning
    ) {
      return;
    }

    scene.bossSpeakRandom("purgeProtocol", 2600);
    scene.audioCues?.play?.("droneSweepWarning", { volume: scene.bossPhase >= 3 ? 0.62 : 0.52, cooldownMs: 900 });

    scene.setBossCasting?.(true) ?? (scene.isBossCasting = true);
    scene.boss.setVelocity(0, 0);

    if (scene.anims.exists("blue_idle_anim")) {
      scene.boss.play("blue_idle_anim", true);
    }

    const config = this.getPhaseConfig();

    this.showHeadWarning(
      config.extendedBarrage ? "Extended drone barrage incoming." : "Drone sweep incoming.",
      config.extendedBarrage
        ? Math.min(2600, config.warningDuration + config.strikeInterval * 3)
        : config.warningDuration + 420
    );

    for (let i = 0; i < config.strikeCount; i++) {
      scene.time.delayedCall(i * config.strikeInterval, () => {
        try {
          if (
            scene.gameOver ||
            scene.isPhaseTransitioning ||
            !scene.player ||
            !scene.player.active
          ) {
            return;
          }

          const targetX = Phaser.Math.Clamp(
            scene.player.x + Phaser.Math.Between(-config.spreadX, config.spreadX),
            120,
            (scene.map?.widthInPixels || 3840) - 120
          );

          const targetY = this.findGroundY(targetX, scene.player.y);

          this.createStrikeMarker(targetX, targetY, config, i);
        } catch (error) {
          console.error("[PurgeProtocolSkill] failed to create strike", error);
        }
      });
    }

    const totalDuration =
      (config.strikeCount - 1) * config.strikeInterval +
      config.warningDuration +
      config.bombFallTime +
      620;

    scene.time.delayedCall(totalDuration, () => {
      this.endCast();
    });

    
    
    scene.time.delayedCall(totalDuration + 900, () => {
      if (scene.isBossCasting && !scene.gameOver) {
        this.endCast();
      }
    });
  }

  getPhaseConfig() {
    const scene = this.scene;

    if (scene.bossPhase >= 3) {
      return {
        
        
        strikeCount: 12,
        strikeInterval: 480,
        warningDuration: 760,
        bombFallTime: 460,
        spreadX: 285,
        markerRadius: 58,
        explosionRadius: 98,
        damage: 1,
        tileWidth: 190,
        tileHeight: 145,
        droneScale: 2.0,
        bombScale: 1.9,
        blastScale: 2.25,
        bigBlastScale: 2.1,
        lightweightMarkers: true,
        extendedBarrage: true
      };
    }

    if (scene.bossPhase >= 2) {
      return {
        strikeCount: 5,
        strikeInterval: 340,
        warningDuration: 1020,
        bombFallTime: 500,
        spreadX: 235,
        markerRadius: 60,
        explosionRadius: 94,
        damage: 1,
        tileWidth: 190,
        tileHeight: 150,
        droneScale: 2.05,
        bombScale: 1.95,
        blastScale: 2.35,
        bigBlastScale: 2.2
      };
    }

    return {
      strikeCount: 4,
      strikeInterval: 430,
      warningDuration: 1180,
      bombFallTime: 560,
      spreadX: 195,
      markerRadius: 54,
      explosionRadius: 84,
      damage: 1,
      tileWidth: 175,
      tileHeight: 135,
      droneScale: 1.9,
      bombScale: 1.8,
      blastScale: 2.15,
      bigBlastScale: 2.0
    };
  }

  showHeadWarning(text, duration = 1400) {
    const scene = this.scene;

    this.clearHeadWarning();
    scene.environmentBroadcast?.alert?.(
      text || "AIR RAID ALERT",
      "Drone sweep incoming.",
      { color: "#ff4f4f", detailColor: "#eef5fb" }
    );
  }

  clearHeadWarning() {
    if (this.headWarningFollowEvent) {
      this.headWarningFollowEvent.remove(false);
      this.headWarningFollowEvent = null;
    }

    if (this.headWarningText && this.headWarningText.active) {
      this.headWarningText.destroy();
    }

    if (this.headWarningBg && this.headWarningBg.active) {
      this.headWarningBg.destroy();
    }

    this.headWarningText = null;
    this.headWarningBg = null;
  }

  createStrikeMarker(targetX, targetY, config, index = 0) {
    const scene = this.scene;

    if (scene.gameOver || scene.isPhaseTransitioning) return;

    const outer = scene.add.circle(
      targetX,
      targetY,
      config.markerRadius,
      0xff2233,
      0.2
    ).setDepth(70);

    outer.setStrokeStyle(8, 0xff3344, 1);

    const inner = scene.add.circle(
      targetX,
      targetY,
      config.markerRadius * 0.52,
      0xff8899,
      0.3
    ).setDepth(71);

    const hotCore = scene.add.circle(
      targetX,
      targetY,
      config.markerRadius * 0.22,
      0xffffff,
      0.42
    ).setDepth(73);

    const pillar = scene.add.rectangle(
      targetX,
      targetY - 118,
      18,
      190,
      0xff3344,
      0.28
    ).setDepth(69);

    const crossH = scene.add.rectangle(
      targetX,
      targetY,
      config.markerRadius * 2.35,
      8,
      0xffffff,
      0.78
    ).setDepth(72);

    const crossV = scene.add.rectangle(
      targetX,
      targetY,
      8,
      config.markerRadius * 2.35,
      0xffffff,
      0.78
    ).setDepth(72);

    const markerPack = config.lightweightMarkers
      ? [outer, hotCore, pillar]
      : [outer, inner, hotCore, pillar, crossH, crossV];

    if (config.lightweightMarkers) {
      inner.destroy();
      crossH.destroy();
      crossV.destroy();
    }

    this.activeMarkers.push(...markerPack);

    scene.tweens.add({
      targets: outer,
      alpha: 1,
      scale: 1.22,
      duration: 80,
      yoyo: true,
      repeat: Math.ceil(config.warningDuration / 160),
      ease: "Sine.easeInOut"
    });

    if (!config.lightweightMarkers) {
      scene.tweens.add({
        targets: inner,
        alpha: 0.92,
        scale: 1.35,
        duration: 65,
        yoyo: true,
        repeat: Math.ceil(config.warningDuration / 130),
        ease: "Sine.easeInOut"
      });

      scene.tweens.add({
        targets: [crossH, crossV, pillar],
        alpha: 0.2,
        duration: 55,
        yoyo: true,
        repeat: Math.ceil(config.warningDuration / 110),
        ease: "Sine.easeInOut"
      });
    }

    scene.tweens.add({
      targets: hotCore,
      alpha: 0.12,
      scale: config.lightweightMarkers ? 1.35 : 1.6,
      duration: config.lightweightMarkers ? 90 : 55,
      yoyo: true,
      repeat: Math.ceil(config.warningDuration / (config.lightweightMarkers ? 180 : 110)),
      ease: "Sine.easeInOut"
    });

    scene.time.delayedCall(config.warningDuration, () => {
      markerPack.forEach((obj) => {
        if (obj && obj.active) obj.destroy();
      });

      this.activeMarkers = this.activeMarkers.filter(
        (obj) => obj && obj.active
      );

      this.spawnDroneAndBomb(targetX, targetY, config, index);
    });
  }

  spawnDroneAndBomb(targetX, targetY, config, index = 0) {
    const scene = this.scene;

    if (scene.gameOver || scene.isPhaseTransitioning) return;

    const startFromLeft = index % 2 === 0;
    const droneStartX = startFromLeft ? targetX - 360 : targetX + 360;
    const droneEndX = targetX;
    const droneY = targetY - 245;

    scene.audioCues?.play?.("droneLocking", { volume: config.extendedBarrage ? 0.24 : 0.30, cooldownMs: config.extendedBarrage ? 135 : 240 });

    const drone = scene.add.sprite(
      droneStartX,
      droneY,
      "purge_drone_walk_scan"
    );

    drone.setDepth(96);
    drone.setScale(config.droneScale);
    drone.setFlipX(!startFromLeft);
    if (scene.anims.exists("purge_drone_walk_scan_anim")) {
      drone.play("purge_drone_walk_scan_anim", true);
    }

    this.activeDrones.push(drone);

    scene.tweens.add({
      targets: drone,
      x: droneEndX,
      duration: 360,
      ease: "Sine.easeOut",
      onComplete: () => {
        if (!drone || !drone.active) return;

        if (scene.anims.exists("purge_drone_scan_anim")) {
          drone.play("purge_drone_scan_anim", true);
        }

        scene.time.delayedCall(180, () => {
          if (!drone || !drone.active) return;

          if (scene.anims.exists("purge_drone_drop_anim")) {
            drone.play("purge_drone_drop_anim", true);
          }
          this.dropBomb(drone, targetX, targetY, config);
        });
      }
    });
  }

  dropBomb(drone, targetX, targetY, config) {
    const scene = this.scene;

    if (scene.gameOver || scene.isPhaseTransitioning) {
      if (drone && drone.active) drone.destroy();
      return;
    }

    scene.audioCues?.play?.("droneBombFall", { volume: config.extendedBarrage ? 0.22 : 0.28, cooldownMs: config.extendedBarrage ? 115 : 90 });

    const bomb = scene.add.sprite(
      targetX,
      drone.y + 32,
      "purge_bomb"
    );

    bomb.setDepth(98);
    bomb.setScale(config.bombScale);
    if (scene.anims.exists("purge_bomb_spin_anim")) {
      bomb.play("purge_bomb_spin_anim", true);
    }

    this.activeBombs.push(bomb);

    scene.tweens.add({
      targets: bomb,
      y: targetY,
      scaleX: config.bombScale * 1.22,
      scaleY: config.bombScale * 1.22,
      duration: config.bombFallTime,
      ease: "Quad.easeIn",
      onComplete: () => {
        if (bomb && bomb.active) {
          bomb.destroy();
        }

        this.activeBombs = this.activeBombs.filter(
          (obj) => obj && obj.active
        );

        this.createExplosion(targetX, targetY, config);

        if (drone && drone.active) {
          if (scene.anims.exists("purge_drone_death_anim")) {
            drone.play("purge_drone_death_anim", true);
          }

          drone.once("animationcomplete", () => {
            if (drone && drone.active) drone.destroy();
          });

          scene.time.delayedCall(650, () => {
            if (drone && drone.active) {
              drone.destroy();
            }
          });
        }
      }
    });
  }

  createExplosion(x, y, config) {
    const scene = this.scene;

    scene.audioCues?.play?.("droneBombExplode", { volume: config.extendedBarrage ? 0.38 : 0.48, cooldownMs: config.extendedBarrage ? 140 : 110 });
    scene.cameras.main.shake(config.extendedBarrage ? 150 : 280, config.extendedBarrage ? 0.008 : 0.018);
    scene.cameras.main.flash(140, 255, 120, 120);

    const smallBlast = scene.add.sprite(x, y, "purge_blast");
    smallBlast.setDepth(112);
    smallBlast.setScale(config.blastScale);
    smallBlast.setBlendMode(Phaser.BlendModes.ADD);
    if (scene.anims.exists("purge_blast_anim")) {
      smallBlast.play("purge_blast_anim");
    }

    this.activeExplosions.push(smallBlast);

    smallBlast.once("animationcomplete", () => {
      if (smallBlast && smallBlast.active) smallBlast.destroy();
    });

    if (!config.lightweightMarkers) {
      const bigBlast = scene.add.sprite(x, y - 18, "purge_big_blast");
      bigBlast.setDepth(111);
      bigBlast.setScale(config.bigBlastScale);
      bigBlast.setBlendMode(Phaser.BlendModes.ADD);
      if (scene.anims.exists("purge_big_blast_anim")) {
        bigBlast.play("purge_big_blast_anim");
      }

      this.activeExplosions.push(bigBlast);

      bigBlast.once("animationcomplete", () => {
        if (bigBlast && bigBlast.active) bigBlast.destroy();
      });
    }

    const damageRing = scene.add.circle(
      x,
      y,
      config.explosionRadius * 0.45,
      0xff3344,
      0.22
    ).setDepth(109);

    damageRing.setStrokeStyle(7, 0xffffff, 0.72);

    scene.tweens.add({
      targets: damageRing,
      radius: config.explosionRadius,
      alpha: 0,
      duration: 280,
      ease: "Sine.easeOut",
      onComplete: () => {
        if (damageRing && damageRing.active) damageRing.destroy();
      }
    });

    if (scene.player && scene.player.active) {
      const dist = Phaser.Math.Distance.Between(
        scene.player.x,
        scene.player.y,
        x,
        y
      );

      if (dist <= config.explosionRadius) {
        scene.damagePlayer(config.damage);
      }
    }

    this.damageTreesInRadius(x, y, config.explosionRadius);
  }

  damageTreesInRadius(x, y, radius) {
    const scene = this.scene;

    if (!scene.playerTrees) return;

    const trees = scene.playerTrees.getChildren();

    for (const tree of trees) {
      if (!tree || !tree.active || !tree.blessingTree) continue;

      const dist = Phaser.Math.Distance.Between(x, y, tree.x, tree.y);

      if (dist > radius) continue;

      if (scene.damagePlayerTree) {
        scene.damagePlayerTree(tree, 1);
      } else if (scene.damageTreeFromHostile) {
        scene.damageTreeFromHostile(tree, 1);
      } else {
        tree.destroy();
      }
    }
  }

  findGroundY(worldX, fallbackY) {
    const scene = this.scene;
    const mapHeightPx = scene.map?.heightInPixels || 2048;

    if (scene.arena?.findSurfaceYAtX) {
      return scene.arena.findSurfaceYAtX(worldX, fallbackY, {
        searchTop: Math.max(0, fallbackY - 420),
        searchBottom: mapHeightPx
      });
    }

    const tileWidth = scene.map?.tileWidth || 32;
    const tileHeight = scene.map?.tileHeight || 32;
    const mapWidth = scene.map?.width || Math.ceil((scene.map?.widthInPixels || 3840) / tileWidth);
    const mapHeight = scene.map?.height || Math.ceil(mapHeightPx / tileHeight);

    if (!scene.groundLayer || typeof scene.groundLayer.getTileAt !== "function") {
      return Phaser.Math.Clamp(fallbackY + 30, 80, mapHeightPx - 80);
    }

    const worldToTileX = scene.map?.worldToTileX || ((x) => Math.floor(x / tileWidth));
    const worldToTileY = scene.map?.worldToTileY || ((y) => Math.floor(y / tileHeight));

    const tileX = Phaser.Math.Clamp(worldToTileX(worldX), 0, mapWidth - 1);
    let startTileY = worldToTileY(fallbackY - 80);
    startTileY = Phaser.Math.Clamp(startTileY, 0, mapHeight - 1);

    for (let ty = startTileY; ty < mapHeight; ty++) {
      const tile = scene.groundLayer.getTileAt(tileX, ty);

      if (tile && tile.index !== -1) {
        return ty * tileHeight;
      }
    }

    return Phaser.Math.Clamp(fallbackY + 40, 80, mapHeightPx - 80);
  }

  endCast() {
    const scene = this.scene;

    this.clearHeadWarning();

    scene.setBossCasting?.(false) ?? (scene.isBossCasting = false);

    if (
      scene.boss &&
      scene.boss.active &&
      !scene.gameOver &&
      !scene.isPhaseTransitioning
    ) {
      if (scene.anims.exists("blue_idle_anim")) {
        scene.boss.play("blue_idle_anim", true);
      }
    }
  }

  cleanup() {
    this.clearHeadWarning();

    const allObjects = [
      ...this.activeDrones,
      ...this.activeBombs,
      ...this.activeMarkers,
      ...this.activeExplosions
    ];

    allObjects.forEach((obj) => {
      if (obj && obj.active) {
        obj.destroy();
      }
    });

    this.activeDrones = [];
    this.activeBombs = [];
    this.activeMarkers = [];
    this.activeExplosions = [];
  }
}