export default class HolyClearance {
  constructor(scene) {
    this.scene = scene;
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

    scene.bossSpeakRandom("holyClearance", 2200);

    scene.setBossCasting?.(true) ?? (scene.isBossCasting = true);
    scene.boss.setVelocity(0, 0);
    scene.boss.setFlipX(scene.player.x < scene.boss.x);

    const volleyCount = scene.bossPhase >= 3 ? 3 : 2;
    const delayBetween = scene.bossPhase >= 3 ? 420 : 560;

    if (scene.anims.exists("boss_attack_anim")) {
      scene.boss.play("boss_attack_anim", true);
    }

    this.showClearanceWarning();
    scene.audioCues?.play?.("uiWarning", { volume: 0.28, cooldownMs: 300 });

    for (let i = 0; i < volleyCount; i++) {
      scene.time.delayedCall(i * delayBetween, () => {
        if (
          !scene.boss ||
          !scene.boss.active ||
          scene.gameOver ||
          scene.isPhaseTransitioning
        ) {
          return;
        }

        const spreadCount = scene.bossPhase >= 3 ? i + 1 : 1;
        this.fireVolley(spreadCount);
      });
    }

    scene.time.delayedCall(volleyCount * delayBetween + 500, () => {
      if (scene.gameOver || scene.isPhaseTransitioning) return;

      scene.setBossCasting?.(false) ?? (scene.isBossCasting = false);

      if (scene.boss && scene.boss.active) {
        scene.boss.play("blue_idle_anim", true);
      }
    });
  }

  showClearanceWarning() {
    const scene = this.scene;
    scene.environmentBroadcast?.alert?.(
      "HOLY CLEARANCE",
      scene.bossPhase >= 3 ? "Suppression volleys intensifying." : "Suppressive volley incoming.",
      { color: "#ff7a7a", detailColor: "#eef5fb" }
    );
  }

  fireVolley(count = 1) {
    const scene = this.scene;

    scene.audioCues?.play?.("bulletVolley", { volume: 0.32, cooldownMs: 180 });

    if (
      !scene.boss ||
      !scene.boss.active ||
      scene.gameOver ||
      scene.isPhaseTransitioning
    ) {
      return;
    }

    const startX = scene.boss.x;
    const startY = scene.boss.y - 20;

    const baseAngle = Phaser.Math.Angle.Between(
      startX,
      startY,
      scene.player.x,
      scene.player.y - 20
    );

    const bulletKey = Phaser.Utils.Array.GetRandom(scene.bossBulletKeys);
    const spread = Phaser.Math.DegToRad(10);

    scene.playBossEnergyEffect(
      scene.bossPhase >= 3 ? 0xff3333 : 0x7df9ff,
      1.35,
      75
    );

    for (let i = 0; i < count; i++) {
      const offsetIndex = i - (count - 1) / 2;
      const angle = baseAngle + offsetIndex * spread;

      const bullet = scene.physics.add.sprite(startX, startY, bulletKey);
      scene.trackHostileObject?.(bullet);

      
      
      
      bullet.setScale(scene.bossPhase >= 3 ? 1.05 : 0.9);
      bullet.setDepth(50);
      bullet.body.allowGravity = false;
      bullet.rotation = angle;

      bullet.__lastX = startX;
      bullet.__lastY = startY;

      if (bullet.body) {
        
        
        bullet.body.setSize(8, 8, true);
        if (bullet.body.setCircle) {
          bullet.body.setCircle(4, (bullet.width - 8) * 0.5, (bullet.height - 8) * 0.5);
        }
      }

      const speed = scene.bossPhase >= 3 ? 500 : 390;

      bullet.setVelocity(
        Math.cos(angle) * speed,
        Math.sin(angle) * speed
      );

      
      
      

      scene.physics.add.overlap(bullet, scene.player, () => {
        if (!bullet || !bullet.active || scene.gameOver) return;

        bullet.destroy();
        scene.damagePlayer(1);
      });

      scene.time.delayedCall(9000, () => {
        if (bullet && bullet.active) {
          bullet.destroy();
        }
      });
    }
  }
}