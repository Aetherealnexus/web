import { EVENTS } from "../core/event-bus.js";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function createNoiseBuffer(audioContext) {
  const length = audioContext.sampleRate * 2;
  const buffer = audioContext.createBuffer(1, length, audioContext.sampleRate);
  const channel = buffer.getChannelData(0);

  for (let i = 0; i < length; i += 1) {
    channel[i] = (Math.random() * 2 - 1) * 0.22;
  }

  return buffer;
}

export function createAmbientAudioEngine({ store, bus, config }) {
  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;

  let audioContext = null;
  let nodes = null;
  let currentSignature = {
    coherence: 0.4,
    turbulence: 0.2,
    anticipation: 0.1,
    gravity: 0.2,
    radiance: 0.2
  };

  const unlockHandlers = [];

  function init() {
    if (!AudioContextCtor) {
      bus.emit(EVENTS.AUDIO_FAILED, {
        reason: "AudioContext unavailable"
      });
      return;
    }

    bus.on(EVENTS.AUDIO_TOGGLED, ({ active }) => {
      if (active) {
        unlockAndApply();
      } else {
        fadeMaster(0, 0.4);
      }
    });

    bus.on(EVENTS.FIELD_SIGNATURE_CHANGED, (signature) => {
      currentSignature = signature;
      updateTargets();
    });

    bus.on(EVENTS.EMOTION_CHANGED, () => {
      updateTargets();
    });

    registerUnlockListeners();
  }

  function destroy() {
    unlockHandlers.forEach(({ type, handler }) => {
      document.removeEventListener(type, handler);
    });

    if (audioContext) {
      audioContext.close().catch(() => {});
    }
  }

  function registerUnlockListeners() {
    const maybeUnlock = () => {
      if (!store.getState().ui.audioActive) return;
      unlockAndApply();
    };

    for (const type of ["pointerdown", "touchstart", "keydown"]) {
      document.addEventListener(type, maybeUnlock, { passive: true });
      unlockHandlers.push({ type, handler: maybeUnlock });
    }
  }

  function ensureAudioGraph() {
    if (!AudioContextCtor) return false;

    if (!audioContext) {
      audioContext = new AudioContextCtor();
      buildGraph();
      bus.emit(EVENTS.AUDIO_READY, {
        sampleRate: audioContext.sampleRate
      });
    }

    return Boolean(audioContext && nodes);
  }

  function buildGraph() {
    const masterGain = audioContext.createGain();
    const lowpass = audioContext.createBiquadFilter();
    const droneAGain = audioContext.createGain();
    const droneBGain = audioContext.createGain();
    const shimmerGain = audioContext.createGain();
    const airGain = audioContext.createGain();
    const airFilter = audioContext.createBiquadFilter();

    const droneA = audioContext.createOscillator();
    const droneB = audioContext.createOscillator();
    const shimmer = audioContext.createOscillator();

    const noiseSource = audioContext.createBufferSource();
    noiseSource.buffer = createNoiseBuffer(audioContext);
    noiseSource.loop = true;

    lowpass.type = "lowpass";
    lowpass.frequency.value = 1900;
    lowpass.Q.value = 0.4;

    airFilter.type = "bandpass";
    airFilter.frequency.value = config.audio.noiseFilterBase;
    airFilter.Q.value = 0.4;

    masterGain.gain.value = 0;
    droneAGain.gain.value = 0;
    droneBGain.gain.value = 0;
    shimmerGain.gain.value = 0;
    airGain.gain.value = 0;

    droneA.type = "sine";
    droneB.type = "triangle";
    shimmer.type = "sine";

    droneA.frequency.value = config.audio.droneBaseA;
    droneB.frequency.value = config.audio.droneBaseB;
    shimmer.frequency.value = config.audio.shimmerBase;

    droneA.connect(droneAGain);
    droneB.connect(droneBGain);
    shimmer.connect(shimmerGain);

    noiseSource.connect(airFilter);
    airFilter.connect(airGain);

    droneAGain.connect(lowpass);
    droneBGain.connect(lowpass);
    shimmerGain.connect(lowpass);
    airGain.connect(lowpass);
    lowpass.connect(masterGain);
    masterGain.connect(audioContext.destination);

    droneA.start();
    droneB.start();
    shimmer.start();
    noiseSource.start();

    nodes = {
      masterGain,
      lowpass,
      droneA,
      droneB,
      shimmer,
      droneAGain,
      droneBGain,
      shimmerGain,
      airGain,
      airFilter,
      noiseSource
    };
  }

  async function unlockAndApply() {
    if (!ensureAudioGraph()) return;

    if (audioContext.state === "suspended") {
      try {
        await audioContext.resume();
      } catch (error) {
        bus.emit(EVENTS.AUDIO_FAILED, {
          reason: error?.message || "resume-failed"
        });
        return;
      }
    }

    updateTargets(true);
  }

  function setParam(param, value, time = config.audio.responseTime) {
    if (!audioContext || !param) return;

    const t = audioContext.currentTime;
    param.cancelScheduledValues(t);
    param.setTargetAtTime(value, t, Math.max(0.001, time));
  }

  function fadeMaster(target, time = 0.35) {
    if (!nodes || !audioContext) return;
    setParam(nodes.masterGain.gain, target, time);
  }

  function updateTargets(force = false) {
    if (!nodes || !audioContext) return;

    const state = store.getState();
    const emotion = state.app.emotionState;
    const active = state.ui.audioActive;

    if (!active && !force) {
      fadeMaster(0, 0.35);
      return;
    }

    let droneAFreq = config.audio.droneBaseA;
    let droneBFreq = config.audio.droneBaseB;
    let shimmerFreq = config.audio.shimmerBase;
    let lowpassFreq = 1600 + currentSignature.radiance * 500;
    let airFreq = config.audio.noiseFilterBase + currentSignature.gravity * 520;

    let droneAGain = 0.024 + currentSignature.coherence * 0.02;
    let droneBGain = 0.012 + currentSignature.gravity * 0.015;
    let shimmerGain = 0.003 + currentSignature.radiance * 0.011;
    let airGain = 0.002 + currentSignature.anticipation * 0.014;

    if (emotion === "attune") {
      droneAFreq *= 0.98;
      droneBFreq *= 0.96;
      shimmerFreq *= 0.94;
      droneAGain += 0.01;
      shimmerGain += 0.004;
    } else if (emotion === "surge") {
      droneAFreq *= 1.08;
      droneBFreq *= 1.11;
      shimmerFreq *= 1.16;
      lowpassFreq += 280;
      airFreq += 240;
      airGain += 0.01;
      shimmerGain += 0.006;
    } else if (emotion === "descent") {
      droneAFreq *= 0.94;
      droneBFreq *= 0.92;
      shimmerFreq *= 0.88;
      lowpassFreq -= 120;
      droneAGain += 0.006;
    } else if (emotion === "converge") {
      shimmerFreq *= 1.04;
      shimmerGain += 0.005;
      droneBGain += 0.004;
    } else if (emotion === "revelation") {
      droneAFreq *= 1.06;
      droneBFreq *= 1.14;
      shimmerFreq *= 1.28;
      lowpassFreq += 420;
      airFreq += 380;
      shimmerGain += 0.012;
      airGain += 0.012;
    } else if (emotion === "command") {
      shimmerFreq *= 1.09;
      lowpassFreq += 160;
    } else if (emotion === "dormant") {
      droneAFreq *= 0.92;
      droneBFreq *= 0.9;
      shimmerFreq *= 0.8;
      lowpassFreq -= 240;
      airGain *= 0.55;
      shimmerGain *= 0.45;
    }

    const masterTarget = clamp(
      config.audio.masterBaseGain +
        currentSignature.radiance * 0.03 +
        (emotion === "revelation" ? 0.014 : 0),
      0,
      0.085
    );

    setParam(nodes.masterGain.gain, active ? masterTarget : 0, 0.35);
    setParam(nodes.lowpass.frequency, lowpassFreq, 0.3);
    setParam(nodes.droneA.frequency, droneAFreq, 0.3);
    setParam(nodes.droneB.frequency, droneBFreq, 0.3);
    setParam(nodes.shimmer.frequency, shimmerFreq, 0.3);
    setParam(nodes.droneAGain.gain, droneAGain, 0.35);
    setParam(nodes.droneBGain.gain, droneBGain, 0.35);
    setParam(nodes.shimmerGain.gain, shimmerGain, 0.35);
    setParam(nodes.airGain.gain, airGain, 0.35);
    setParam(nodes.airFilter.frequency, airFreq, 0.35);
  }

  return Object.freeze({
    init,
    destroy
  });
}