export default class BossPhaseAttacker {
  constructor(scene, config = {}) {
    this.scene = scene;

    this.maxIntegrity = config.maxIntegrity ?? 100;
    this.integrity = config.integrity ?? this.maxIntegrity;
    this.phase = config.phase ?? 1;

    this.decayRate = config.decayRate ?? 0.9;
    this.phase2DecayRate = config.phase2DecayRate ?? 1.25;
    this.phase3DecayRate = config.phase3DecayRate ?? 1.40;

    this.phase2Threshold = config.phase2Threshold ?? 0.7;
    this.phase3Threshold = config.phase3Threshold ?? 0.35;

    this.attackSpeedMultiplier = config.attackSpeedMultiplier ?? 1.0;
    this.phase2AttackSpeedMultiplier = config.phase2AttackSpeedMultiplier ?? 0.7;
    this.phase3AttackSpeedMultiplier = config.phase3AttackSpeedMultiplier ?? 0.4;

    this.transitioning = false;
  }

  syncToScene() {
    const scene = this.scene;

    scene.bossMaxIntegrity = this.maxIntegrity;
    scene.bossIntegrity = this.integrity;
    scene.bossPhase = this.phase;
    scene.bossDecayRate = this.decayRate;
    scene.attackSpeedMultiplier = this.attackSpeedMultiplier;
  }

  update(delta) {
    const scene = this.scene;

    if (
      scene.gameOver ||
      scene.bossIntegrity <= 0 ||
      scene.isPhaseTransitioning ||
      this.transitioning
    ) {
      return;
    }

    const decayPerSecond = scene.bossDecayRate ?? this.decayRate;
    const amount = decayPerSecond * (delta / 1000);

    this.damage(amount);
  }

  damage(amount) {
    const scene = this.scene;

    if (
      scene.gameOver ||
      scene.bossIntegrity <= 0 ||
      scene.isPhaseTransitioning ||
      this.transitioning
    ) {
      return;
    }

    scene.bossIntegrity = Phaser.Math.Clamp(
      scene.bossIntegrity - amount,
      0,
      scene.bossMaxIntegrity
    );

    if (scene.bossIntegrity <= 0) {
      scene.endBossFight();
      return;
    }

    this.checkPhaseChange();
  }

  checkPhaseChange() {
    const scene = this.scene;

    if (
      scene.gameOver ||
      scene.bossIntegrity <= 0 ||
      scene.isPhaseTransitioning ||
      this.transitioning
    ) {
      return;
    }

    const ratio = scene.bossIntegrity / scene.bossMaxIntegrity;

    if (scene.bossPhase === 1 && ratio <= this.phase2Threshold) {
      this.enterPhaseTwo();
      return;
    }

    if (scene.bossPhase === 2 && ratio <= this.phase3Threshold) {
      this.enterPhaseThree();
    }
  }

  enterPhaseTwo() {
    const scene = this.scene;

    scene.bossPhase = 2;
    scene.bossDecayRate = this.phase2DecayRate;
    scene.attackSpeedMultiplier = this.phase2AttackSpeedMultiplier;

    this.phase = 2;
    this.decayRate = this.phase2DecayRate;
    this.attackSpeedMultiplier = this.phase2AttackSpeedMultiplier;

    scene.bgm?.setPhase?.(2);
    scene.atmosphere?.setPhase?.(2);

    this.playTransition(
      "PHASE II",
      "EMERGENCY DEFENSE ESCALATION",
      this.getPhaseTransitionColor(2, 0xffb04a),
      [
        "Containment failure increasing.",
        "Morningstar defense grid escalating response.",
        "All guardian units remain active."
      ]
    );
  }

  enterPhaseThree() {
    const scene = this.scene;

    scene.bossPhase = 3;
    scene.bossDecayRate = this.phase3DecayRate;
    scene.attackSpeedMultiplier = this.phase3AttackSpeedMultiplier;

    this.phase = 3;
    this.decayRate = this.phase3DecayRate;
    this.attackSpeedMultiplier = this.phase3AttackSpeedMultiplier;

    scene.bgm?.setPhase?.(3);
    scene.atmosphere?.setPhase?.(3, { deferRain: true });

    this.playTransition(
      "PHASE III",
      "FINAL EXCLUSION PROTOCOL",
      this.getPhaseTransitionColor(3, 0xff3d3d),
      [
        "Central correction failed.",
        "Final exclusion protocol released.",
        "No exit route remains authorized."
      ]
    );
  }

  getPhaseTransitionColor(phase, fallback) {
    const accessibility = this.scene.registry.get("gameConfig")?.accessibility || {};
    if (!accessibility.colorBlindMode) return fallback;

    const key = phase === 2 ? "phase2" : "phase3";
    const configured = accessibility.colorBlindPalette?.[key]?.fill;
    if (typeof configured === "string") {
      const parsed = Number.parseInt(configured.replace(/^0x/, ""), 16);
      if (Number.isFinite(parsed)) return parsed;
    }

    return phase === 2 ? 0xe6d04a : 0xb56cff;
  }

  playTransition(
    title = "PHASE SHIFT",
    subtitle = "DEFENSE PATTERN CHANGED",
    color = 0x7df9ff,
    dialogueLines = []
  ) {
    const scene = this.scene;

    if (scene.gameOver || this.transitioning) return;

    scene.rayOfOblivionSkill?.cleanup?.({ endCast: false });
    scene.bossMovement?.cleanupRayVisuals?.({ endCast: false });
    scene.cleanupRayHostileObjects?.();

    scene.audioCues?.play?.("bossPhaseTransition", { volume: 0.56, cooldownMs: 1000 });
    scene.audioCues?.play?.("phaseTitle", { volume: 0.42, cooldownMs: 1000 });
    scene.environmentBroadcast?.hide?.(180);
    this.transitioning = true;
    scene.isPhaseTransitioning = true;
    scene.__phaseTransitionStartedAt = scene.time?.now || 0;
    scene.controlsLocked = true;
    scene.setBossCasting?.(true);

    if (scene.attackLoop) {
      scene.attackLoop.cancel();
    } else {
      scene.attackLoopToken++;
    }

    if (scene.stopAllBossActions) {
      scene.stopAllBossActions({
        stopCameraFollow: true,
        freezeBoss: true,
        clearHostiles: true,
        clearTurrets: true,
        keepGravityField: false
      });
    }

    scene.rayOfOblivionSkill?.cleanup?.({ endCast: false });
    scene.bossMovement?.cleanupRayVisuals?.({ endCast: false });
    scene.cleanupRayHostileObjects?.();

    if (scene.player) {
      scene.player.setVelocity(0, 0);
    }

    if (scene.boss) {
      scene.tweens.killTweensOf(scene.boss);
      scene.boss.setVelocity(0, 0);
      scene.boss.body.allowGravity = false;
    }

    const anchor = scene.getPhaseBossAnchor
      ? scene.getPhaseBossAnchor(scene.bossPhase || this.phase)
      : { x: scene.boss?.x || scene.player.x, y: scene.boss?.y || scene.player.y };

    scene.moveBossToPhaseAnchor?.(scene.bossPhase || this.phase, 760);

    scene.cameras.main.stopFollow();

    const focusX = anchor.x;
    const focusY = anchor.y - 120;

    
    
    scene.cameras.main.pan(focusX, focusY, 760, "Sine.easeInOut");

    scene.time.delayedCall(800, () => {
      if (!scene.gameOver && scene.isPhaseTransitioning) {
        scene.cameras.main.pan(focusX, focusY, 260, "Sine.easeOut");
      }
    });

    scene.tweens.add({
      targets: scene.cameras.main,
      zoom: scene.phaseZoom,
      duration: 500,
      ease: "Sine.easeOut"
    });

    if (scene.phaseText) {
      scene.phaseText.setText(title);
      scene.phaseText.setColor("#ffffff");
      scene.phaseText.setStroke("#000000", 12);
      scene.phaseText.setAlpha(0);
    }

    if (scene.phaseSubText) {
      scene.phaseSubText.setText(subtitle);
      scene.phaseSubText.setColor(this.hexToCss(color));
      scene.phaseSubText.setStroke("#000000", 8);
      scene.phaseSubText.setAlpha(0);
    }

    scene.time.delayedCall(350, () => {
      this.createPhaseShockwave(color);

      if (scene.phaseText && scene.phaseSubText) {
        scene.tweens.add({
          targets: [scene.phaseText, scene.phaseSubText],
          alpha: 1,
          duration: 350,
          ease: "Sine.easeOut"
        });
      }

      if (scene.cameras && scene.cameras.main) {
        scene.cameras.main.flash(450, 255, 255, 255);
        scene.cameras.main.shake(650, 0.025);
      }

      if (scene.boss) {
        scene.tweens.add({
          targets: scene.boss,
          scaleX: 2.65,
          scaleY: 2.65,
          duration: 180,
          yoyo: true,
          ease: "Sine.easeOut"
        });

        scene.tweens.addCounter({
          from: 0,
          to: 100,
          duration: 650,
          onUpdate: (tween) => {
            const t = tween.getValue() / 100;
            const base = Phaser.Display.Color.ValueToColor(0xffffff);
            const target = Phaser.Display.Color.ValueToColor(color);

            const r = Phaser.Math.Interpolation.Linear([base.red, target.red], t);
            const g = Phaser.Math.Interpolation.Linear([base.green, target.green], t);
            const b = Phaser.Math.Interpolation.Linear([base.blue, target.blue], t);

            scene.boss.setTint(Phaser.Display.Color.GetColor(r, g, b));
          },
          onComplete: () => {
            if (scene.boss && scene.boss.active) {
              scene.boss.clearTint();
            }
          }
        });
      }
    });

    scene.time.delayedCall(3200, () => {
      if (scene.phaseText && scene.phaseSubText) {
        scene.tweens.add({
          targets: [scene.phaseText, scene.phaseSubText],
          alpha: 0,
          duration: 450,
          ease: "Sine.easeIn"
        });
      }

      scene.tweens.add({
        targets: scene.cameras.main,
        zoom: scene.combatZoom,
        duration: 700,
        ease: "Sine.easeInOut"
      });

      scene.cameras.main.pan(
        scene.player.x,
        scene.player.y - 180,
        700,
        "Sine.easeInOut"
      );

      scene.time.delayedCall(760, () => {
        scene.cameras.main.startFollow(scene.player, true, 0.08, 0.08);
        scene.cameras.main.setFollowOffset(0, scene.cameraFollowOffsetY);

        scene.controlsLocked = false;
        scene.setBossCasting?.(false);
        scene.isPhaseTransitioning = false;
        scene.__phaseTransitionStartedAt = 0;
        this.transitioning = false;

        if (scene.boss && scene.boss.active) {
          scene.boss.body.allowGravity = false;

          if (scene.anims.exists("blue_idle_anim")) {
            scene.boss.play("blue_idle_anim", true);
          }
        }

        scene.atmosphere?.onPhaseTransitionComplete?.();
        scene.environmentBroadcast?.show?.(240);
        scene.environmentBroadcast?.alert?.(`${title} COMPLETE`, subtitle, {
          color: this.hexToCss(color),
          detailColor: "#eef5fb",
          sound: true
        });
        this.playTransitionDialogue(dialogueLines);
        if (scene.healthPacks && !scene.healthPacks.nextSpawnEvent && (scene.healthPacks.packs?.length || 0) < scene.healthPacks.maxActive) {
          scene.healthPacks.scheduleNext?.(6000);
        }

        if (!scene.gameOver && scene.attackLoop) {
          scene.time.delayedCall(600, () => {
            if (!scene.gameOver && !scene.isPhaseTransitioning) {
              scene.attackLoop.start();
            }
          });
        }
      });
    });
  }

  playTransitionDialogue(dialogueLines) {
    const scene = this.scene;

    if (!dialogueLines || dialogueLines.length === 0) return;

    const [firstLine, ...remainingLines] = dialogueLines;

    scene.time.delayedCall(260, () => {
      if (!scene.gameOver && firstLine) {
        scene.bossSpeak?.(firstLine, 2600, {
          anchorToSpeaker: true,
          fontSize: "22px",
          boxWidth: 620,
          boxHeight: 82,
          offsetY: -138,
          depth: 7300
        });
      }
    });

    remainingLines.forEach((line, index) => {
      scene.time.delayedCall(700 + index * 520, () => {
        if (!scene.gameOver) {
          scene.environmentBroadcast?.log?.(`  ${line}`, { color: "#eef5fb" });
        }
      });
    });
  }

  createPhaseShockwave(color = 0x7df9ff) {
    const scene = this.scene;

    if (!scene.boss || !scene.boss.active) return;

    const x = scene.boss.x;
    const y = scene.boss.y;

    const ring = scene.add.circle(x, y, 40, color, 0.12)
      .setDepth(850)
      .setStrokeStyle(5, color, 0.9)
      .setBlendMode(Phaser.BlendModes.ADD);

    scene.tweens.add({
      targets: ring,
      radius: 620,
      alpha: 0,
      duration: 850,
      ease: "Sine.easeOut",
      onComplete: () => {
        ring.destroy();
      }
    });

    const inner = scene.add.circle(x, y, 20, 0xffffff, 0.18)
      .setDepth(849)
      .setBlendMode(Phaser.BlendModes.ADD);

    scene.tweens.add({
      targets: inner,
      radius: 360,
      alpha: 0,
      duration: 600,
      ease: "Quad.easeOut",
      onComplete: () => {
        inner.destroy();
      }
    });
  }

  hexToCss(hex) {
    const color = Phaser.Display.Color.ValueToColor(hex);
    return Phaser.Display.Color.RGBToString(
      color.red,
      color.green,
      color.blue,
      0,
      "#"
    );
  }
}