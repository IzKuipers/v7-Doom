const html = await loadHtml("body.html");
const { __START_DOSBOX__ } = await load("js/jsdos.js");

class proc extends ThirdPartyAppProcess {
  jsdos;
  ci;

  constructor(handler, pid, parentPid, app, workingDirectory, ...args) {
    super(handler, pid, parentPid, app, workingDirectory);
  }

  async render() {
    const body = this.getBody();
    body.innerHTML = html;
    const player = body.querySelector(".player");

    let _paused = false;
    let paused = () => _paused;

    this.handler.renderer.focusedPid.subscribe((v) => {
      if (this._disposed) return;

      if (v !== this.pid) {
        this.ci?.pause();
        _paused = true;
      } else {
        this.ci?.resume();
        _paused = false;
      }
    });

    __START_DOSBOX__(paused);

    this.jsdos = Dos(player, {
      autoStart: true,
      kiosk: true,
      noNetworking: true,
      noCloud: true,
      url: "https://v8.js-dos.com/bundles/doom.jsdos",
      onEvent: (event, ci) => {
        if (this._disposed) return;

        if (event === "emu-ready") {
          const canvas = player.querySelector("canvas");
          player.append(canvas);
          player.querySelector(".window.absolute")?.remove();
          canvas.addEventListener("click", () => {
            if (this._disposed) return;

            this.handler.renderer.focusPid(this.pid);
          });
        } else if (event === "ci-ready") {
          this.ci = ci;
          window.console.log(this.jsdos, ci);
        }
      },
    });
  }

  async onClose() {
    try {
      this.jsdos?.stop();
      return true;
    } catch {
      return true;
    }
  }
  stop = this.onClose;
}

return { proc };
