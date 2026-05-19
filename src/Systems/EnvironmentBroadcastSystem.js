export default class EnvironmentBroadcastSystem {
  constructor(scene) {
    this.scene = scene;
    this.timer = null;
    this.started = false;
    this.layer = null;
    this.panel = null;
    this.box = null;
    this.header = null;
    this.subHeader = null;
    this.divider = null;
    this.lineTexts = [];
    this.messages = [];
    this.maxMessages = 8;
    this.lastLine = null;
    this.hidden = true;
    this.fadeTimer = null;

    this.lines = [
      "C-17 manifest incomplete.",
      "Emergency lane obstruction archived.",
      "Public reassurance cache repeating.",
      "Passenger bridge registry damaged.",
      "Fuel valve override accepted.",
      "Transport platform repair failed.",
      "Missing personnel registry incomplete.",
      "Guardian route preservation active.",
      "Rain acidity above safe threshold.",
      "Help is on the way. You will be safe."
    ];
  }

  create() {
    const scene = this.scene;

    this.layer = scene.createScreenSpaceLayer
      ? scene.createScreenSpaceLayer(8800)
      : scene.add.container(0, 0).setDepth(8800);

    this.panel = scene.add.container(0, 0).setAlpha(0).setVisible(false);

    this.box = scene.add.rectangle(0, 0, 420, 150, 0x02070b, 0.22)
      .setOrigin(0, 0)
      .setStrokeStyle(1, 0x86b8c8, 0.28);

    this.header = scene.add.text(14, 10, "PORT CONSOLE", {
      fontFamily: "monospace",
      fontSize: "14px",
      color: "#effbff",
      fontStyle: "bold",
      stroke: "#001018",
      strokeThickness: 3
    }).setOrigin(0, 0);

    this.subHeader = scene.add.text(14, 28, "ALERT / SYSTEM FEED", {
      fontFamily: "monospace",
      fontSize: "10px",
      color: "#b7d2dd",
      fontStyle: "bold",
      stroke: "#001018",
      strokeThickness: 3
    }).setOrigin(0, 0);

    this.divider = scene.add.rectangle(14, 48, 390, 1, 0x4f7a8c, 0.32)
      .setOrigin(0, 0.5);

    this.panel.add([this.box, this.header, this.subHeader, this.divider]);
    this.layer.add(this.panel);
    this.ensureLineTextPool(12);
    this.updatePosition();

    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.destroy());
    scene.events.once(Phaser.Scenes.Events.DESTROY, () => this.destroy());
    return this;
  }

  start(initialDelay = 6000) {
    if (this.started) return;
    this.started = true;
    this.show(320);
    this.schedule(initialDelay);
  }

  stop() {
    this.started = false;
    if (this.timer) {
      this.timer.remove(false);
      this.timer = null;
    }
  }

  schedule(delay = Phaser.Math.Between(14000, 22000)) {
    if (!this.started || !this.scene?.time) return;
    if (this.timer) this.timer.remove(false);
    this.timer = this.scene.time.delayedCall(delay, () => {
      this.timer = null;
      this.broadcastRandom();
      this.schedule(Phaser.Math.Between(16000, 26000));
    });
  }

  update() {
    if (!this.layer || !this.panel) return;
    this.updatePosition();
  }

  updatePosition() {
    if (!this.layer || !this.panel || !this.scene?.scale) return;

    if (this.scene.layoutScreenSpaceLayer && this.layer.__screenSpaceLayer) {
      this.scene.layoutScreenSpaceLayer(this.layer);
    }

    const width = this.scene.scale.width || this.scene.cameras?.main?.width || 1280;
    const height = this.scene.scale.height || this.scene.cameras?.main?.height || 720;

    
    const boxWidth = Phaser.Math.Clamp(Math.round(width * 0.28), 360, 500);
    const boxHeight = Phaser.Math.Clamp(Math.round(height * 0.18), 132, 190);
    const marginX = Math.max(20, Math.round(width * 0.016));
    const marginY = Math.max(92, Math.round(height * 0.13));

    this.box.setSize(boxWidth, boxHeight).setFillStyle(0x02070b, 0.22);
    this.divider.setPosition(14, 48).setSize(boxWidth - 28, 1);

    const x = width - boxWidth - marginX;
    const y = height - boxHeight - marginY;
    this.panel.setPosition(x, y);

    const contentTop = 58;
    const contentBottomPadding = 10;
    const lineHeight = 18;
    this.maxMessages = Phaser.Math.Clamp(
      Math.floor((boxHeight - contentTop - contentBottomPadding) / lineHeight),
      3,
      5
    );

    this.ensureLineTextPool(this.maxMessages);
    this.lineTexts.forEach((text, index) => {
      text.setPosition(14, contentTop + index * lineHeight);
      text.setFontSize(width < 1400 ? 13 : 14);
      text.setStroke("#001018", 3);
    });

    this.renderMessages();
  }

  ensureLineTextPool(size) {
    if (!this.panel) return;

    while (this.lineTexts.length < size) {
      const text = this.scene.add.text(14, 58, "", {
        fontFamily: "monospace",
        fontSize: "14px",
        color: "#d9e7ef",
        stroke: "#001018",
        strokeThickness: 3
      }).setOrigin(0, 0);

      this.lineTexts.push(text);
      this.panel.add(text);
    }
  }

  broadcastRandom() {
    let line = Phaser.Utils.Array.GetRandom(this.lines);
    if (line === this.lastLine && this.lines.length > 1) {
      line = Phaser.Utils.Array.GetRandom(this.lines.filter((entry) => entry !== this.lastLine));
    }
    this.broadcast(line);
  }

  broadcast(line, options = {}) {
    this.addMessage(line, {
      color: options.color || "#d9e7ef",
      sound: options.sound
    });
  }

  log(line, options = {}) {
    this.addMessage(line, {
      color: options.color || "#d9e7ef",
      sound: false,
      ...options
    });
  }

  alert(title, detail = null, options = {}) {
    if (!title) return;

    this.addMessage(title, {
      color: options.color || "#ff5c5c",
      sound: options.sound !== false
    });

    if (detail) {
      this.addMessage(`  ${detail}`, {
        color: options.detailColor || "#f3f7fb",
        sound: false
      });
    }
  }

  addMessage(line, options = {}) {
    if (!line || !this.panel || this.scene.gameOver) return;

    const cleanLine = String(line)
      .replace(/\s+/g, " ")
      .replace(/^\.+|\.+$/g, "")
      .trim();

    if (!cleanLine) return;

    this.lastLine = cleanLine;

    this.messages.push({
      text: this.truncate(cleanLine, 48),
      color: options.color || "#d9e7ef"
    });

    while (this.messages.length > Math.max(this.maxMessages, 1) * 2) {
      this.messages.shift();
    }

    this.renderMessages();

    if (options.sound !== false) {
      this.scene.audioCues?.play?.("oldBroadcastGlitch", { volume: 0.09, cooldownMs: 2200 });
    }
  }

  truncate(text, maxLen = 48) {
    if (text.length <= maxLen) return text;
    return `${text.slice(0, maxLen - 3)}...`;
  }

  renderMessages() {
    if (!this.lineTexts.length) return;

    const visible = this.messages.slice(-this.maxMessages);

    this.lineTexts.forEach((textObj, index) => {
      const entry = visible[index];
      if (!entry) {
        textObj.setText("").setVisible(false);
        return;
      }

      textObj
        .setVisible(true)
        .setText(`> ${entry.text}`)
        .setColor(entry.color);
    });

    if (this.hidden) return;

    this.panel?.setVisible(true);
    this.scene.tweens?.killTweensOf?.(this.panel);
    this.panel?.setAlpha(0.62);
    this.scene.tweens?.add?.({
      targets: this.panel,
      alpha: 0.5,
      duration: 700,
      ease: "Sine.easeOut"
    });

    if (this.fadeTimer) this.fadeTimer.remove(false);
    this.fadeTimer = this.scene.time?.delayedCall?.(3600, () => {
      this.fadeTimer = null;
      if (!this.hidden && this.panel?.visible) {
        this.scene.tweens?.add?.({
          targets: this.panel,
          alpha: 0.24,
          duration: 900,
          ease: "Sine.easeInOut"
        });
      }
    });
  }

  hide(duration = 180) {
    this.hidden = true;
    if (!this.panel) return;
    this.scene.tweens?.killTweensOf?.(this.panel);
    this.scene.tweens?.add?.({
      targets: this.panel,
      alpha: 0,
      duration,
      ease: "Sine.easeIn",
      onComplete: () => {
        if (this.hidden) this.panel?.setVisible(false);
      }
    });
  }

  show(duration = 220) {
    this.hidden = false;
    if (!this.panel) return;
    this.panel.setVisible(true);
    this.scene.tweens?.killTweensOf?.(this.panel);
    this.scene.tweens?.add?.({
      targets: this.panel,
      alpha: 0.5,
      duration,
      ease: "Sine.easeOut"
    });
  }

  destroy() {
    if (this.timer) {
      this.timer.remove(false);
      this.timer = null;
    }
    if (this.fadeTimer) {
      this.fadeTimer.remove(false);
      this.fadeTimer = null;
    }
    this.layer?.destroy?.();
    this.layer = null;
    this.panel = null;
    this.box = null;
    this.header = null;
    this.subHeader = null;
    this.divider = null;
    this.lineTexts = [];
  }
}
