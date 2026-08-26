/**
 * Procedural audio for the lantern sky, built on the Web Audio API.
 *
 * Everything here is synthesised at runtime rather than loaded from files:
 * an ambient bed that never loops audibly, a warm bell when a lantern opens,
 * and an airy lift when one is released. Browsers block audio until a user
 * gesture, so nothing is created until `enable()` is called from a click.
 */

// A pentatonic set — any combination of these sounds consonant, which keeps
// the random ambient tones from ever clashing with a lantern's chime.
const PENTATONIC = [220, 246.94, 277.18, 329.63, 369.99, 440, 493.88, 554.37]

const MASTER_LEVEL = 0.5

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

/**
 * A slow drone plus occasional distant tones. The drone supplies the warmth
 * and the sparse tones keep it from feeling static, without a loop point.
 */
function startAmbient(): AmbientBed {
  const audio = getContext()
  if (!audio || !master) return { stop: () => {} }

  const bed = audio.createGain()
  bed.gain.value = 0.22
  bed.connect(master)

  // Dark lowpass keeps the drone under the sound effects.
  const shelf = audio.createBiquadFilter()
  shelf.type = "lowpass"
  shelf.frequency.value = 420
  shelf.Q.value = 0.6
  shelf.connect(bed)

  // Root, fifth and octave, each slightly detuned so they beat against one
  // another and drift in and out of phase forever.
  const drones = [55, 82.5, 110.3].map((freq, i) => {
    const osc = audio.createOscillator()
    osc.type = i === 0 ? "sine" : "triangle"
    osc.frequency.value = freq

    const gain = audio.createGain()
    gain.gain.value = 0.34 / (i + 1)

    // Independent slow swell per voice.
    const lfo = audio.createOscillator()
    lfo.frequency.value = 0.03 + i * 0.017
    const lfoDepth = audio.createGain()
    lfoDepth.gain.value = 0.16 / (i + 1)
    lfo.connect(lfoDepth).connect(gain.gain)

    osc.connect(gain).connect(shelf)
    osc.start()
    lfo.start()
    return { osc, lfo }
  })

  // Sparse bell-like tones, far back in the mix.
  let timer: ReturnType<typeof setTimeout> | undefined
  const scheduleTone = () => {
    const delay = 7000 + Math.random() * 12000
    timer = setTimeout(() => {
      const root = PENTATONIC[Math.floor(Math.random() * PENTATONIC.length)]
      voice(root * 2, { level: 0.05, decay: 5.5, brightness: 1800, target: bed })
      scheduleTone()
    }, delay)
  }
  scheduleTone()

  return {
    stop: () => {
      if (timer) clearTimeout(timer)
      const now = audio.currentTime
      bed.gain.cancelScheduledValues(now)
      bed.gain.setValueAtTime(bed.gain.value, now)
      bed.gain.linearRampToValueAtTime(0, now + 1.2)
      for (const { osc, lfo } of drones) {
        osc.stop(now + 1.4)
        lfo.stop(now + 1.4)
      }
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
