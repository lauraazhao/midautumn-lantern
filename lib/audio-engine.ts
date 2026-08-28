/**
 * Audio for the lantern sky, routed through the Web Audio API.
 *
 * The ambient bed comes from `/public/assets/background-music.mp3`; the warm
 * bell when a lantern opens and airy lift when one is released are synthesised
 * at runtime. Browsers block audio until a user gesture, so nothing is created
 * until `enable()` is called from a click.
 */

// A pentatonic set — any combination of these sounds consonant, which keeps
// the random ambient tones from ever clashing with a lantern's chime.
const PENTATONIC = [220, 246.94, 277.18, 329.63, 369.99, 440, 493.88, 554.37]

const MASTER_LEVEL = 0.62

let ctx: AudioContext | null = null
let master: GainNode | null = null
let ambient: AmbientBed | null = null
let enabled = false

type AmbientBed = {
  stop: () => void
}

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null
  if (ctx) return ctx

  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return null

  ctx = new Ctor()
  master = ctx.createGain()
  master.gain.value = 0
  master.connect(ctx.destination)
  return ctx
}

/** Fades the master bus so toggling sound never clicks or pops. */
function rampMaster(target: number, seconds: number) {
  const audio = getContext()
  if (!audio || !master) return
  const now = audio.currentTime
  master.gain.cancelScheduledValues(now)
  master.gain.setValueAtTime(master.gain.value, now)
  master.gain.linearRampToValueAtTime(target, now + seconds)
}

/** Loops the supplied background track through the shared master bus. */
function startAmbient(): AmbientBed {
  const audio = getContext()
  if (!audio || !master) return { stop: () => {} }

  const now = audio.currentTime
  const track = new Audio("/assets/background-music.mp3")
  track.loop = true
  track.preload = "auto"

  const source = audio.createMediaElementSource(track)
  const bed = audio.createGain()
  bed.gain.setValueAtTime(0, now)
  bed.gain.linearRampToValueAtTime(0.5, now + 2.5)
  source.connect(bed).connect(master)

  void track.play().catch(() => {
    // The sound button normally provides the required user gesture. If a
    // browser still rejects playback, leave the interaction effects available.
  })

  return {
    stop: () => {
      const at = audio.currentTime
      bed.gain.cancelScheduledValues(at)
      bed.gain.setValueAtTime(bed.gain.value, at)
      bed.gain.linearRampToValueAtTime(0, at + 0.6)
      window.setTimeout(() => {
        track.pause()
        track.currentTime = 0
        source.disconnect()
        bed.disconnect()
      }, 650)
    },
  }
}

/**
 * One struck-bell voice: a few inharmonic partials with a fast attack and a
 * long exponential tail, which is what reads as "warm" rather than "beep".
 */
function voice(
  root: number,
  options: { level: number; decay: number; brightness: number; target?: AudioNode },
) {
  const audio = getContext()
  if (!audio || !master) return

  const { level, decay, brightness, target = master } = options
  const now = audio.currentTime

  const bus = audio.createGain()
  bus.gain.value = level

  const tone = audio.createBiquadFilter()
  tone.type = "lowpass"
  tone.frequency.value = brightness
  tone.connect(bus).connect(target)

  // Slightly stretched partials — real bells are not perfect harmonics.
  const partials = [
    { ratio: 1, gain: 1, decay: 1 },
    { ratio: 2.01, gain: 0.42, decay: 0.7 },
    { ratio: 3.03, gain: 0.16, decay: 0.45 },
    { ratio: 4.16, gain: 0.07, decay: 0.3 },
  ]

  for (const partial of partials) {
    const osc = audio.createOscillator()
    osc.type = "sine"
    osc.frequency.value = root * partial.ratio

    const env = audio.createGain()
    const peak = partial.gain
    const length = decay * partial.decay

    env.gain.setValueAtTime(0, now)
    env.gain.linearRampToValueAtTime(peak, now + 0.014)
    env.gain.exponentialRampToValueAtTime(0.0001, now + length)

    osc.connect(env).connect(tone)
    osc.start(now)
    osc.stop(now + length + 0.05)
  }
}

/** Shared noise source for breath-like textures. */
function noiseBuffer(audio: AudioContext, seconds: number) {
  const frames = Math.floor(audio.sampleRate * seconds)
  const buffer = audio.createBuffer(1, frames, audio.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < frames; i += 1) {
    data[i] = Math.random() * 2 - 1
  }
  return buffer
}

/** True once the user has turned sound on. */
export function isEnabled() {
  return enabled
}

export function enable() {
  const audio = getContext()
  if (!audio) return false

  // Contexts often start suspended even after a gesture.
  if (audio.state === "suspended") void audio.resume()

  enabled = true
  rampMaster(MASTER_LEVEL, 1.6)
  if (!ambient) ambient = startAmbient()
  return true
}

export function disable() {
  enabled = false
  rampMaster(0, 0.6)
  if (ambient) {
    ambient.stop()
    ambient = null
  }
}

/**
 * Warm bell for opening a lantern. `seed` picks a scale degree so each
 * lantern keeps its own pitch, and the sky rings differently as you explore.
 */
export function playLanternChime(seed = 0) {
  if (!enabled) return
  const audio = getContext()
  if (!audio) return

  const root = PENTATONIC[Math.abs(seed) % PENTATONIC.length]
  voice(root, { level: 0.3, decay: 2.6, brightness: 2600 })
  // A quiet octave above adds shimmer without raising the volume much.
  voice(root * 2, { level: 0.08, decay: 1.8, brightness: 3200 })
}

/**
 * Release: a rising breath of air with a soft tone lifting through it,
 * timed to sit under the lantern's ascent.
 */
export function playLanternRelease() {
  if (!enabled) return
  const audio = getContext()
  if (!audio || !master) return

  const now = audio.currentTime
  const length = 3.6

  // Airy lift.
  const source = audio.createBufferSource()
  source.buffer = noiseBuffer(audio, length)

  const band = audio.createBiquadFilter()
  band.type = "bandpass"
  band.Q.value = 0.9
  band.frequency.setValueAtTime(240, now)
  band.frequency.linearRampToValueAtTime(1250, now + length * 0.8)

  const air = audio.createGain()
  air.gain.setValueAtTime(0, now)
  air.gain.linearRampToValueAtTime(0.14, now + 0.7)
  air.gain.linearRampToValueAtTime(0, now + length)

  source.connect(band).connect(air).connect(master)
  source.start(now)
  source.stop(now + length)

  // A tone gliding up an octave, following the lantern away.
  const glide = audio.createOscillator()
  glide.type = "triangle"
  glide.frequency.setValueAtTime(196, now)
  glide.frequency.exponentialRampToValueAtTime(392, now + length * 0.85)

  const glideEnv = audio.createGain()
  glideEnv.gain.setValueAtTime(0, now)
  glideEnv.gain.linearRampToValueAtTime(0.1, now + 0.5)
  glideEnv.gain.exponentialRampToValueAtTime(0.0001, now + length)

  const soften = audio.createBiquadFilter()
  soften.type = "lowpass"
  soften.frequency.value = 1400

  glide.connect(glideEnv).connect(soften).connect(master)
  glide.start(now)
  glide.stop(now + length)

  // Small bell at the moment of letting go.
  voice(PENTATONIC[5], { level: 0.16, decay: 2.4, brightness: 3000 })
}
