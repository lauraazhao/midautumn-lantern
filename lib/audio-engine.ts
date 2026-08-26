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

/**
 * A four-chord progression voiced as a slow pad, plus a quiet sub for warmth
 * and sparse bells drifting over the top.
 *
 * The voices sit between roughly 165Hz and 400Hz on purpose. An earlier
 * version droned at 55-110Hz behind a 420Hz lowpass, which measures fine but
 * is below what laptop and phone speakers actually reproduce — it read as
 * silence. This register is audible on anything.
 */
const PROGRESSION = [
  [220.0, 261.63, 329.63], // A minor
  [174.61, 220.0, 261.63], // F major
  [261.63, 329.63, 392.0], // C major
  [196.0, 246.94, 293.66], // G major
]

/** How long the pad rests on each chord. */
const CHORD_SECONDS = 13

function startAmbient(): AmbientBed {
  const audio = getContext()
  if (!audio || !master) return { stop: () => {} }

  const now = audio.currentTime

  const bed = audio.createGain()
  bed.gain.setValueAtTime(0, now)
  bed.gain.linearRampToValueAtTime(0.5, now + 4)
  bed.connect(master)

  // Soft ceiling: warm enough to sit under the effects, open enough to hear.
  const tone = audio.createBiquadFilter()
  tone.type = "lowpass"
  tone.frequency.value = 1500
  tone.Q.value = 0.5
  tone.connect(bed)

  // Slow filter sweep so the pad breathes instead of sitting still.
  const sweep = audio.createOscillator()
  sweep.frequency.value = 0.045
  const sweepDepth = audio.createGain()
  sweepDepth.gain.value = 480
  sweep.connect(sweepDepth).connect(tone.frequency)
  sweep.start()

  // Three chord voices, each a detuned pair so the pad shimmers.
  const voices = PROGRESSION[0].map((freq, i) => {
    const gain = audio.createGain()
    gain.gain.value = 0.16 / (1 + i * 0.3)
    gain.connect(tone)

    const oscs = [-7, 7].map((detune) => {
      const osc = audio.createOscillator()
      osc.type = "triangle"
      osc.frequency.value = freq
      osc.detune.value = detune
      osc.connect(gain)
      osc.start()
      return osc
    })

    // Independent swell per voice, so they drift in and out of each other.
    const lfo = audio.createOscillator()
    lfo.frequency.value = 0.05 + i * 0.021
    const lfoDepth = audio.createGain()
    lfoDepth.gain.value = 0.05
    lfo.connect(lfoDepth).connect(gain.gain)
    lfo.start()

    return { oscs, lfo }
  })

  // Quiet sine an octave below the root — felt more than heard.
  const sub = audio.createOscillator()
  sub.type = "sine"
  sub.frequency.value = PROGRESSION[0][0] / 2
  const subGain = audio.createGain()
  subGain.gain.value = 0.1
  sub.connect(subGain).connect(bed)
  sub.start()

  // Walk the progression, gliding rather than jumping between chords.
  let step = 0
  const chordTimer = setInterval(() => {
    step = (step + 1) % PROGRESSION.length
    const chord = PROGRESSION[step]
    const at = audio.currentTime
    voices.forEach((v, i) => {
      for (const osc of v.oscs) {
        osc.frequency.setTargetAtTime(chord[i], at, 1.8)
      }
    })
    sub.frequency.setTargetAtTime(chord[0] / 2, at, 2.2)
  }, CHORD_SECONDS * 1000)

  // Sparse bell-like tones over the pad.
  let toneTimer: ReturnType<typeof setTimeout> | undefined
  const scheduleTone = () => {
    const delay = 6000 + Math.random() * 11000
    toneTimer = setTimeout(() => {
      const root = PENTATONIC[Math.floor(Math.random() * PENTATONIC.length)]
      voice(root * 2, { level: 0.09, decay: 5.5, brightness: 2400, target: bed })
      scheduleTone()
    }, delay)
  }
  scheduleTone()

  return {
    stop: () => {
      clearInterval(chordTimer)
      if (toneTimer) clearTimeout(toneTimer)
      const at = audio.currentTime
      bed.gain.cancelScheduledValues(at)
      bed.gain.setValueAtTime(bed.gain.value, at)
      bed.gain.linearRampToValueAtTime(0, at + 1.2)
      for (const { oscs, lfo } of voices) {
        for (const osc of oscs) osc.stop(at + 1.4)
        lfo.stop(at + 1.4)
      }
      sub.stop(at + 1.4)
      sweep.stop(at + 1.4)
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
