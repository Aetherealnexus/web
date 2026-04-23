function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function createPostFxController({ dom, store, bus }) {
  let latestSignature = {
    coherence: 0.4,
    turbulence: 0.2,
    anticipation: 0.1,
    gravity: 0.2,
    radiance: 0.2
  };

  function init() {
    bus.on("field-signature:changed", (signature) => {
      latestSignature = signature;
      apply();
    });

    bus.on("emotion:changed", () => {
      apply();
    });

    store.subscribe(() => {
      apply();
    }, { fireImmediately: true });
  }

  function apply() {
    const state = store.getState();
    const emotion = state.app.emotionState;

    let sat =
      1 +
      latestSignature.radiance * 0.12 +
      (emotion === "surge" ? 0.08 : 0) -
      (emotion === "dormant" ? 0.08 : 0);

    let bright =
      1 +
      latestSignature.radiance * 0.06 -
      (emotion === "dormant" ? 0.08 : 0) +
      (emotion === "revelation" ? 0.04 : 0);

    let contrast =
      1 +
      latestSignature.coherence * 0.08 +
      latestSignature.turbulence * 0.05;

    let atmoBlur =
      latestSignature.anticipation * 1.2 +
      (emotion === "dormant" ? 0.6 : 0);

    let atmoSat =
      1 +
      latestSignature.radiance * 0.08 +
      (emotion === "revelation" ? 0.06 : 0);

    let atmoBright =
      1 +
      latestSignature.radiance * 0.05 -
      (emotion === "dormant" ? 0.04 : 0);

    let grainBias =
      latestSignature.turbulence * 0.025 -
      latestSignature.coherence * 0.008;

    let haloBias =
      latestSignature.radiance * 0.18 +
      (emotion === "attune" ? 0.12 : 0) +
      (emotion === "revelation" ? 0.2 : 0) -
      (emotion === "dormant" ? 0.16 : 0);

    let vignetteBias =
      (emotion === "descent" ? 0.12 : 0) +
      (emotion === "dormant" ? 0.04 : 0);

    let coreGlow =
      latestSignature.radiance * 18 +
      latestSignature.coherence * 12 +
      (emotion === "revelation" ? 14 : 0);

    dom.body.style.setProperty("--nx-postfx-sat", sat.toFixed(3));
    dom.body.style.setProperty("--nx-postfx-bright", bright.toFixed(3));
    dom.body.style.setProperty("--nx-postfx-contrast", contrast.toFixed(3));
    dom.body.style.setProperty("--nx-postfx-atmo-blur", `${clamp(atmoBlur, 0, 2.4).toFixed(2)}px`);
    dom.body.style.setProperty("--nx-postfx-atmo-sat", atmoSat.toFixed(3));
    dom.body.style.setProperty("--nx-postfx-atmo-bright", atmoBright.toFixed(3));
    dom.body.style.setProperty("--nx-postfx-grain-bias", grainBias.toFixed(3));
    dom.body.style.setProperty("--nx-postfx-halo-bias", haloBias.toFixed(3));
    dom.body.style.setProperty("--nx-postfx-vignette-bias", vignetteBias.toFixed(3));
    dom.body.style.setProperty("--nx-postfx-core-glow", `${coreGlow.toFixed(2)}px`);
  }

  return Object.freeze({
    init
  });
}