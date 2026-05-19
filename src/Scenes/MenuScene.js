



export default class MenuScene extends Phaser.Scene {
  constructor() {
    super("MenuScene");
  }

  create() {
    this.w = this.scale.width || 1280;
    this.h = this.scale.height || 720;

    this.cameras.main.setBackgroundColor("#071018");
    this.createBackground();
    this.createTitle();
    this.createButtons();

    this.input.keyboard?.on("keydown-ENTER", () => this.startBoss());
    this.input.keyboard?.on("keydown-B", () => this.startBoss());
    this.input.keyboard?.on("keydown-T", () => this.startTraining());

    this.cameras.main.fadeIn(360, 0, 0, 0);
  }

  createBackground() {
    if (this.textures.exists("dead_port_bg")) {
      const bg = this.add.image(this.w / 2, this.h / 2, "dead_port_bg");
      const scale = Math.max(this.w / bg.width, this.h / bg.height);
      bg.setScale(scale).setAlpha(0.42).setDepth(-10);
    }

    this.add.rectangle(0, 0, this.w, this.h, 0x000000, 0.48)
      .setOrigin(0, 0)
      .setDepth(-9);

    
    for (let i = 0; i < 20; i++) {
      const x = Phaser.Math.Between(0, this.w);
      const y = Phaser.Math.Between(0, this.h);
      const line = this.add.rectangle(x, y, 2, Phaser.Math.Between(42, 96), 0xb9d6df, 0.13)
        .setAngle(-8)
        .setDepth(-8);
      this.tweens.add({
        targets: line,
        y: y + Phaser.Math.Between(90, 190),
        alpha: { from: 0.04, to: 0.22 },
        duration: Phaser.Math.Between(900, 1700),
        repeat: -1,
        yoyo: true,
        delay: Phaser.Math.Between(0, 900)
      });
    }
  }

  createTitle() {
    this.add.text(this.w / 2, 136, "BITTER RAIN", {
      fontFamily: "monospace",
      fontSize: "54px",
      fontStyle: "bold",
      color: "#eaf8ff",
      stroke: "#001018",
      strokeThickness: 8,
      align: "center"
    }).setOrigin(0.5);

    this.add.text(this.w / 2, 188, "Morningstar Port", {
      fontFamily: "monospace",
      fontSize: "20px",
      color: "#9cc6d5",
      stroke: "#001018",
      strokeThickness: 4,
      align: "center"
    }).setOrigin(0.5);

    this.add.text(this.w / 2, 228, "Survive the guardian trial for about 85 seconds.", {
      fontFamily: "monospace",
      fontSize: "18px",
      color: "#d7edf5",
      stroke: "#001018",
      strokeThickness: 4,
      align: "center"
    }).setOrigin(0.5);
  }

  createButtons() {
    const centerX = this.w / 2;
    const startY = 350;
    this.makeButton(centerX, startY, 330, 62, "START", () => this.startBoss());
    this.makeButton(centerX, startY + 86, 330, 62, "TRAINING", () => this.startTraining());
  }

  makeButton(x, y, width, height, label, callback) {
    const rect = this.add.rectangle(x, y, width, height, 0x102735, 0.94)
      .setStrokeStyle(3, 0x9ee7ff, 0.72)
      .setInteractive({ useHandCursor: true });

    const text = this.add.text(x, y, label, {
      fontFamily: "monospace",
      fontSize: "24px",
      fontStyle: "bold",
      color: "#f2fbff",
      stroke: "#001018",
      strokeThickness: 5
    }).setOrigin(0.5);

    rect.on("pointerover", () => {
      rect.setFillStyle(0x1b5068, 0.98);
      text.setColor("#ffffff");
    });
    rect.on("pointerout", () => {
      rect.setFillStyle(0x102735, 0.94);
      text.setColor("#f2fbff");
    });
    rect.on("pointerdown", callback);

    return { rect, text };
  }

  startBoss() {
    this.cameras.main.fadeOut(220, 0, 0, 0);
    this.time.delayedCall(230, () => this.scene.start("BossScene"));
  }

  startTraining() {
    this.cameras.main.fadeOut(220, 0, 0, 0);
    this.time.delayedCall(230, () => this.scene.start("TrainingScene"));
  }
}
