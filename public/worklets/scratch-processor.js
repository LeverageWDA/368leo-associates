/*
 * Leo & Associates — scratch processor (AudioWorklet).
 *
 * Normal mode: records the music it is fed into an 8-second ring buffer and
 * outputs silence (the music itself reaches the speakers on a separate path).
 *
 * Frozen mode (while a hand is on the record): stops recording and plays the
 * ring buffer back from the point the hand landed, at the speed and direction
 * given by the a-rate `rate` parameter (1 = normal speed, -1 = backwards,
 * 0 = held still). The read head cannot pass the newest recorded sample or go
 * further back than what was recorded, so this scrubs audio that has already
 * played. A one-pole high-pass removes the DC step when the record is held.
 *
 * Messages:
 *   { type: 'capture', on }   record only while the music is actually playing
 *   { type: 'freeze' }        hand on the record: stop recording, start scrubbing
 *   { type: 'release', rewind } hand off: `rewind` samples are dropped from the
 *                             newest end so the buffer ends where playback
 *                             resumes; -1 clears it (playback resumes past it)
 *   { type: 'reset' }         clear the buffer (seek or track change)
 * Replies: { type: 'frozen', seconds } — how much recorded audio can be scrubbed.
 */
const SECONDS = 8;

class ScratchProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [{ name: 'rate', defaultValue: 0, minValue: -8, maxValue: 8, automationRate: 'a-rate' }];
  }

  constructor() {
    super();
    this.size = Math.ceil(sampleRate * SECONDS);
    this.left = new Float32Array(this.size);
    this.right = new Float32Array(this.size);
    this.write = 0;
    this.filled = 0;
    this.frozen = false;
    this.capturing = false;
    this.offset = 0; // read position relative to the write head, in samples (<= 0)
    this.hpL = { x: 0, y: 0 };
    this.hpR = { x: 0, y: 0 };
    this.hpA = Math.exp((-2 * Math.PI * 25) / sampleRate);
    this.port.onmessage = e => {
      const type = e.data && e.data.type;
      if (type === 'freeze') {
        this.frozen = true;
        this.offset = 0;
        // Tell the main thread how much audio is available to scrub.
        this.port.postMessage({ type: 'frozen', seconds: this.filled / sampleRate });
      } else if (type === 'capture') {
        this.capturing = !!e.data.on;
      } else if (type === 'release') {
        this.frozen = false;
        const rewind = e.data.rewind;
        if (rewind < 0 || rewind >= this.filled) {
          this.filled = 0;
        } else if (rewind > 0) {
          this.write = (this.write - rewind + this.size) % this.size;
          this.filled -= rewind;
        }
        this.offset = 0;
      } else if (type === 'reset') {
        this.filled = 0;
        this.offset = 0;
      }
    };
  }

  read(buf, pos) {
    const i = Math.floor(pos);
    const f = pos - i;
    const a = buf[((i % this.size) + this.size) % this.size];
    const b = buf[(((i + 1) % this.size) + this.size) % this.size];
    return a + (b - a) * f;
  }

  highpass(state, x) {
    const y = this.hpA * (state.y + x - state.x);
    state.x = x;
    state.y = y;
    return y;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];
    const frames = output[0] ? output[0].length : 128;
    const inL = input && input[0];
    const inR = input && (input[1] || input[0]);

    if (!this.frozen) {
      if (inL && this.capturing) {
        for (let n = 0; n < frames; n++) {
          this.left[this.write] = inL[n];
          this.right[this.write] = inR[n];
          this.write = (this.write + 1) % this.size;
        }
        this.filled = Math.min(this.size, this.filled + frames);
      }
      for (const ch of output) ch.fill(0);
      return true;
    }

    const rate = parameters.rate;
    const oldest = -(this.filled - 2);
    for (let n = 0; n < frames; n++) {
      const r = rate.length > 1 ? rate[n] : rate[0];
      this.offset = Math.min(0, Math.max(oldest, this.offset + r));
      const pos = this.write - 1 + this.offset;
      const canPlay = this.filled > 2;
      const l = canPlay ? this.read(this.left, pos) : 0;
      const rr = canPlay ? this.read(this.right, pos) : 0;
      const outL = this.highpass(this.hpL, l);
      const outR = this.highpass(this.hpR, rr);
      if (output[0]) output[0][n] = outL;
      if (output[1]) output[1][n] = outR;
    }
    return true;
  }
}

registerProcessor('scratch-processor', ScratchProcessor);
