class SttWorkletNode extends AudioWorkletNode {
  constructor(context) {
    super(context, 'stt-audio-processor');
    console.log('In SttWorkletNode');
  }
}

export default SttWorkletNode;
