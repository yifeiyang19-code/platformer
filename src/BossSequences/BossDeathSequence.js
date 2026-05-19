export default class BossDeathSequence {
  constructor(scene) {
    this.scene = scene;

    this.deathLines = [
      "Command chain failing.",
      "Protection order unstable.",
      "I preserved the sealed zone, not the living.",
      "Morningstar Port... must be opened."
    ];
  }

  endBossFight() {
    const scene = this.scene;

    if (scene.gameOver) return;

    scene.audioCues?.play?.("bossDeathPulse1", { volume: 0.46, cooldownMs: 900 });
    scene.gameOver = true;
    scene.controlsLocked = true;
    scene.setBossCasting?.(true) ?? (scene.isBossCasting = true);
    scene.bossInvincible = true;

    if (scene.attackLoop) {
      scene.attackLoop.cancel();
    } else {
      scene.attackLoopToken++;
    }

    scene.massEnergyTurretsSkill?.cleanupTurrets?.(true);

    if (scene.cleanupHostileObjects) {
      scene.cleanupHostileObjects();
    }

    if (scene.cleanupGravityFieldVisuals) {
      scene.cleanupGravityFieldVisuals();
    }

    scene.physics.world.gravity.y = scene.defaultGravityY;

    if (scene.player) {
      scene.player.setVelocity(0, 0);
    }

    if (!scene.boss || !scene.boss.active) {
      this.showVictoryText();
      return;
    }

    scene.tweens.killTweensOf(scene.boss);

    scene.boss.setVelocity(0, 0);
    scene.boss.body.allowGravity = false;
    scene.boss.clearTint();

    const targetX = Phaser.Math.Clamp(
      scene.map.widthInPixels / 2,
      220,
      scene.map.widthInPixels - 220
    );

    const targetY = Phaser.Math.Clamp(
      scene.player ? scene.player.y - 220 : scene.boss.y - 120,
      180,
      scene.map.heightInPixels - 220
    );

    scene.cameras.main.stopFollow();

    scene.cameras.main.pan(targetX, targetY, 1100, "Sine.easeInOut");

    scene.tweens.add({
      targets: scene.cameras.main,
      zoom: scene.phaseZoom,
      duration: 1100,
      ease: "Sine.easeInOut"
    });

    scene.boss.setFlipX(targetX < scene.boss.x);

    if (scene.anims.exists("blue_fly_up_anim")) {
      scene.boss.play("blue_fly_up_anim", true);
    }

    scene.tweens.add({
      targets: scene.boss,
      x: targetX,
      y: targetY,
      duration: 1500,
      ease: "Sine.easeInOut",
      onComplete: () => {
        scene.boss.setVelocity(0, 0);

        if (scene.anims.exists("blue_idle_anim")) {
          scene.boss.play("blue_idle_anim", true);
        }

        scene.time.delayedCall(300, () => {
          this.runBossDeathPulseSequence();
        });
      }
    });
  }

  runBossDeathPulseSequence() {
    const scene = this.scene;

    const pulseColors = [
      0x7df9ff,
      0xffb04a,
      0xff3d3d,
      0xffffff
    ];

    for (let i = 0; i < 4; i++) {
      scene.time.delayedCall(i * 1900, () => {
        if (!scene.boss || !scene.boss.active) return;

        const line = this.deathLines[i] ?? "System failure.";

        if (scene.bossSpeak) {
          scene.bossSpeak(line, 1900, {
            allowDuringGameOver: true,
            ignoreOnce: true,
            anchorToSpeaker: true,
            fontSize: "30px",
            boxWidth: 900,
            boxHeight: 126,
            offsetY: -160,
            depth: 7600,
            strokeColor: pulseColors[i],
            color: "#ffffff"
          });
        }

        scene.audioCues?.play?.(`bossDeathPulse${i + 1}`, { volume: 0.50 + i * 0.04, cooldownMs: 500 });
        this.createDeathPulse(pulseColors[i], i);

        const darkness = Phaser.Math.Clamp(0.2 + i * 0.18, 0.2, 0.82);
        const tintValue = Phaser.Display.Color.GetColor(
          Math.floor(255 * (1 - darkness)),
          Math.floor(255 * (1 - darkness)),
          Math.floor(255 * (1 - darkness))
        );

        scene.boss.setTint(tintValue);

        scene.tweens.add({
          targets: scene.boss,
          scaleX: 2.55 + i * 0.12,
          scaleY: 2.55 + i * 0.12,
          duration: 220,
          yoyo: true,
          ease: "Sine.easeOut"
        });

        scene.cameras.main.shake(650, 0.015 + i * 0.008);
      });
    }

    scene.time.delayedCall(4 * 1900 + 800, () => {
      this.playFinalTransmission(() => this.finishDeathAnimation());
    });
  }

  createDeathPulse(color, index = 0) {
    const scene = this.scene;

    if (!scene.boss || !scene.boss.active) return;

    const x = scene.boss.x;
    const y = scene.boss.y;

    const ring = scene.add.circle(x, y, 60, color, 0.1)
      .setDepth(2000)
      .setStrokeStyle(7, color, 0.95)
      .setBlendMode(Phaser.BlendModes.ADD);

    scene.tweens.add({
      targets: ring,
      radius: 760 + index * 120,
      alpha: 0,
      duration: 1100,
      ease: "Sine.easeOut",
      onComplete: () => {
        ring.destroy();
      }
    });

    const coreFlash = scene.add.circle(x, y, 32, 0xffffff, 0.32)
      .setDepth(1999)
      .setBlendMode(Phaser.BlendModes.ADD);

    scene.tweens.add({
      targets: coreFlash,
      radius: 260 + index * 90,
      alpha: 0,
      duration: 700,
      ease: "Quad.easeOut",
      onComplete: () => {
        coreFlash.destroy();
      }
    });

    if (scene.anims.exists("phase_lightning_anim")) {
      for (let j = 0; j < 3; j++) {
        scene.time.delayedCall(j * 110, () => {
          const bolt = scene.add.sprite(
            x + Phaser.Math.Between(-120, 120),
            y + Phaser.Math.Between(-120, 120),
            "phase_lightning_1"
          );

          bolt.setDepth(2001);
          bolt.setScale(1.1 + index * 0.15);
          bolt.setAlpha(0.8);
          bolt.setBlendMode(Phaser.BlendModes.ADD);
          bolt.play("phase_lightning_anim");

          bolt.once("animationcomplete", () => {
            bolt.destroy();
          });
        });
      }
    }
  }


  playFinalTransmission(onComplete) {
    const scene = this.scene;
    const lines = [
      { speaker: "BOSS", text: "...protect... the port..." },
      { speaker: "BOSS", text: "...registry... incomplete..." },
      { speaker: "BOSS", text: "...help is on the way..." },
      { speaker: "BOSS", text: "...you will be safe..." },
      { speaker: "HERO", text: "No one was." }
    ];

    const width = Math.min(880, scene.scale.width - 96);
    const box = scene.add.rectangle(scene.scale.width / 2, scene.scale.height * 0.5, width, 150, 0x02070b, 0.82)
      .setScrollFactor(0)
      .setDepth(9400)
      .setAlpha(0)
      .setStrokeStyle(2, 0xffffff, 0.45);
    const text = scene.add.text(scene.scale.width / 2, scene.scale.height * 0.5, "", {
      fontFamily: "'Cinzel', 'Marcellus SC', serif",
      fontSize: "30px",
      color: "#ffffff",
      align: "center",
      stroke: "#000000",
      strokeThickness: 7,
      wordWrap: { width: width - 60 }
    }).setOrigin(0.5).setScrollFactor(0).setDepth(9401).setAlpha(0);

    const showLine = (index) => {
      if (index >= lines.length) {
        scene.tweens.add({
          targets: [box, text],
          alpha: 0,
          duration: 550,
          onComplete: () => {
            box.destroy();
            text.destroy();
            onComplete?.();
          }
        });
        return;
      }

      const item = lines[index];
      scene.audioCues?.play?.("oldBroadcastGlitch", { volume: item.speaker === "HERO" ? 0.18 : 0.34, cooldownMs: 180 });
      text.setText(`${item.speaker}: ${item.text}`);
      text.setColor(item.speaker === "HERO" ? "#dff8ff" : "#ffffff");
      scene.tweens.add({ targets: [box, text], alpha: 1, duration: 280, ease: "Sine.easeOut" });
      scene.time.delayedCall(item.speaker === "HERO" ? 1600 : 900, () => {
        scene.tweens.add({
          targets: text,
          alpha: 0,
          duration: 220,
          onComplete: () => showLine(index + 1)
        });
      });
    };

    showLine(0);
  }

  finishDeathAnimation() {
    const scene = this.scene;

    if (!scene.boss || !scene.boss.active) {
      this.showVictoryText();
      return;
    }

    scene.boss.setVelocity(0, 0);
    scene.boss.body.allowGravity = false;

    if (scene.anims.exists("blue_death_anim")) {
      scene.boss.play("blue_death_anim", true);
    }

    scene.audioCues?.play?.("bossDeathFinal", { volume: 0.70, cooldownMs: 1400 });
    scene.cameras.main.flash(900, 255, 255, 255);
    scene.cameras.main.shake(1400, 0.045);

    scene.tweens.add({
      targets: scene.boss,
      alpha: 0,
      scaleX: 2.85,
      scaleY: 2.85,
      duration: 1700,
      ease: "Sine.easeIn",
      onComplete: () => {
        if (scene.boss && scene.boss.active) {
          scene.boss.destroy();
        }

        this.showVictoryText();
      }
    });
  }

  showVictoryText() {
    const scene = this.scene;

    scene.cameras.main.stopFollow();

    if (scene.blackScreen) {
      scene.blackScreen.setDepth(9000);
      scene.tweens.add({
        targets: scene.blackScreen,
        alpha: 0.72,
        duration: 900,
        ease: "Linear"
      });
    }

    if (scene.gameOverText) {
      scene.gameOverText.setText(
        "SEAL BROKEN\nBITTER RAIN CONTINUES\n\nPRESS ENTER / F TO RESTART"
      );

      scene.gameOverText.setColor("#dff8ff");
      scene.gameOverText.setStroke("#001018", 10);

      scene.tweens.add({
        targets: scene.gameOverText,
        alpha: 1,
        duration: 1000,
        ease: "Linear"
      });
    }

    scene.keyR = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
    scene.keyEnterRetry = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    scene.keyFRetry = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);
  }

  failTrial() {
    const scene = this.scene;

    if (scene.gameOver) return;

    scene.gameOver = true;
    scene.controlsLocked = true;
    scene.setBossCasting?.(true) ?? (scene.isBossCasting = true);

    if (scene.attackLoop) {
      scene.attackLoop.cancel();
    } else {
      scene.attackLoopToken++;
    }

    scene.massEnergyTurretsSkill?.cleanupTurrets?.(true);

    if (scene.cleanupHostileObjects) {
      scene.cleanupHostileObjects();
    }

    if (scene.cleanupGravityFieldVisuals) {
      scene.cleanupGravityFieldVisuals();
    }

    scene.physics.world.gravity.y = scene.defaultGravityY;

    if (scene.player) {
      scene.player.setVelocity(0, 0);
      scene.player.setTint(0xff3333);
    }

    scene.cameras.main.stopFollow();
    scene.cameras.main.shake(900, 0.035);

    if (scene.bossSpeak) {
      scene.bossSpeak(
        "Exclusion enforced. The sealed zone remains closed.",
        3000,
        {
          allowDuringGameOver: true,
          ignoreOnce: true,
          anchorToSpeaker: true,
          fontSize: "30px",
          boxWidth: 900,
          boxHeight: 126,
          offsetY: -150,
          depth: 7600,
          strokeColor: 0xff3333,
          color: "#ffe8e8"
        }
      );
    }

    scene.time.delayedCall(1200, () => {
      if (scene.blackScreen) {
        scene.blackScreen.setDepth(9000);
        scene.tweens.add({
          targets: scene.blackScreen,
          alpha: 0.78,
          duration: 900,
          ease: "Linear"
        });
      }

      if (scene.gameOverText) {
        const survived = Math.max(0, Math.floor(((scene.time?.now || 0) - (scene.combatStartTime || scene.time?.now || 0)) / 1000));
        const integrity = Math.max(0, Math.ceil((scene.bossIntegrity / scene.bossMaxIntegrity) * 100));
        scene.gameOverText.setText(
          `EXCLUSION ENFORCED\nSurvived: ${survived}s · Guardian integrity: ${integrity}%\nTrees blocked: ${scene.treeBlocksThisRun || 0}\n\nPRESS ENTER / F TO REFRESH AND RESTART`
        );

        scene.gameOverText.setColor("#ffe8e8");
        scene.gameOverText.setStroke("#140000", 10);

        scene.tweens.add({
          targets: scene.gameOverText,
          alpha: 1,
          duration: 1000,
          ease: "Linear"
        });
      }

      scene.keyR = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
    scene.keyEnterRetry = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    scene.keyFRetry = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);
    });
  }
}