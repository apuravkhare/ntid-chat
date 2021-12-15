class SttAudioProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();

    this._cursor = 0;
    this._bufferSize = 8192 * 4;
    // this._sharedBuffer = new SharedArrayBuffer(this._bufferSize);
    this._buffer = new ArrayBuffer(this._bufferSize);
    this._sharedView = new Float32Array(this._buffer);
    this.port.postMessage({
        eventType: 'buffer',
        buffer: this._buffer
    });
  }

  process(inputs, outputs, parameters) {
    if (inputs && inputs[0] && inputs[0][0]) {
      for (let i = 0; i < inputs[0][0].length; i++) {
        this._sharedView[(i + this._cursor) % this._sharedView.length] = inputs[0][0][i];
      }
  
      // console.log('Cursor: ' + this._cursor);
      // console.log('Inputs: ' + inputs[0][0].length);
      // console.log('Shared View: ' + this._sharedView.length);

      if (((this._cursor + inputs[0][0].length) % (this._sharedView.length / 4)) === 0) {
        this.port.postMessage({
          eventType: 'data',
          start: this._cursor - this._sharedView.length / 4 + inputs[0][0].length,
          end: this._cursor + inputs[0][0].length,
          buffer: this._buffer
        });
      }
    
      this._cursor += inputs[0][0].length;
      this._cursor %= this._sharedView.length;
      // this._cursor = this._cursor || 0;

      return true;
    }
  }
};

registerProcessor("stt-audio-processor", SttAudioProcessor);
