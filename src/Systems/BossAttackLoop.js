export default class BossAttackLoop {
  constructor(scene) {
    this.scene = scene;
    this.token = 0;
    this.running = false;
    this.timers = [];
  }

  start() {
    if (
      this.scene.gameOver ||
      this.scene.bossIntegrity <= 0 ||
      this.scene.isPhaseTransitioning ||
      this.scene.__pauseMenuOpen
    ) {
      return;
    }

    this.running = true;

    const token = ++this.token;
    this.scene.attackLoopToken = this.token;

    if (this.scene.bossPhase >= 3) {
      this.startPhaseThreeLoop(token);
    } else if (this.scene.bossPhase >= 2) {
      this.startPhaseTwoLoop(token);
    } else {
      this.startPhaseOneLoop(token);
    }
  }

  startPhaseOneLoop(token) {
    const m = this.getSpeedMultiplier();

    this.castWithBossTransition(() => this.scene.castSkill("destructionBlast"));

    this.after(8200 * m, token, () => {
      this.castWithBossTransition(() => this.scene.castSkill("annihilationSlash"));

      this.after(9000 * m, token, () => {
        this.castWithBossTransition(() => this.scene.castSkill("massEnergyTurrets"));

        this.after(13000 * m, token, () => {
          this.castWithBossTransition(() => this.scene.castSkill("gravityField"));

          this.after(8500 * m, token, () => this.start());
        });
      });
    });
  }

  startPhaseTwoLoop(token) {
    const m = this.getSpeedMultiplier();

    this.castWithBossTransition(() => this.scene.castSkill("destructionBlast"));

    this.after(6500 * m, token, () => {
      this.castWithBossTransition(() => this.scene.castSkill("annihilationSlash"));

      this.after(7200 * m, token, () => {
        this.castWithBossTransition(() => this.scene.castSkill("massEnergyTurrets"));

        this.after(7600 * m, token, () => {
          this.castWithBossTransition(() => this.scene.castSkill("purgeProtocol"));

          this.after(6200 * m, token, () => {
            this.castWithBossTransition(() => this.scene.castGroundSuppression());

            this.after(6400 * m, token, () => {
              this.castWithBossTransition(() => this.scene.castPhaseTwoPressureCombo());

              this.after(6200 * m, token, () => {
                this.castWithBossTransition(() => this.scene.castSkill("gravityField"));

                this.after(7200 * m, token, () => this.start());
              });
            });
          });
        });
      });
    });
  }

  startPhaseThreeLoop(token) {
    const m = this.getSpeedMultiplier();

    this.castWithBossTransition(() => this.scene.castSkill("gravityField"));

    this.after(4200 * m, token, () => {
      this.castWithBossTransition(() => this.scene.castGroundSuppression());

      this.after(5600 * m, token, () => {
        this.castWithBossTransition(() => this.scene.castSkill("destructionBlast"));

        this.after(4700 * m, token, () => {
          this.castWithBossTransition(() => this.scene.castSkill("rayOfOblivion"));

          this.after(4200 * m, token, () => {
            this.castWithBossTransition(() => this.scene.castSkill("annihilationSlash"));

            this.after(4800 * m, token, () => {
              this.castWithBossTransition(() => this.scene.castSkill("holyClearance"));

              this.after(4700 * m, token, () => {
                this.castWithBossTransition(() => this.scene.castSkill("purgeProtocol"));

                
                
                this.after(9000, token, () => {
                  this.castWithBossTransition(() => this.scene.castSkill("gravityField"));

                  this.after(5000 * m, token, () => {
                    this.castWithBossTransition(() => this.scene.castSkill("menacingAdvance"));

                    this.after(4700 * m, token, () => {
                      this.castWithBossTransition(() => this.scene.castSkill("massEnergyTurrets"));

                      this.after(7200 * m, token, () => this.start());
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  }

  after(delay, token, callback) {
    const event = this.scene.time.delayedCall(delay, () => {
      this.timers = this.timers.filter((timer) => timer !== event);
      if (!this.isValid(token)) return;
      callback();
    });

    this.timers.push(event);
    return event;
  }

  clearTimers() {
    for (const event of this.timers) {
      if (event && !event.hasDispatched) {
        event.remove(false);
      }
    }
    this.timers = [];
  }

  cancel() {
    this.running = false;
    this.token++;
    this.scene.attackLoopToken = this.token;
    this.clearTimers();
  }

  isValid(token) {
    return (
      this.running &&
      token === this.token &&
      !this.scene.gameOver &&
      this.scene.bossIntegrity > 0 &&
      !this.scene.isPhaseTransitioning &&
      !this.scene.__pauseMenuOpen
    );
  }

  getSpeedMultiplier() {
    if (this.scene.phaseManager) {
      return this.scene.phaseManager.attackSpeedMultiplier;
    }

    return this.scene.attackSpeedMultiplier ?? 1.0;
  }

  castWithBossTransition(nextAction) {
    if (
      this.scene.bossMovement &&
      this.scene.bossMovement.performTransition
    ) {
      this.scene.bossMovement.performTransition(nextAction);
      return;
    }

    this.scene.bossPerformTransition(nextAction);
  }
}
