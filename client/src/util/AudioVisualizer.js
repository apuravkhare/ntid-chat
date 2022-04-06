import React, { Component, useEffect, useRef, useState } from "react";

function AudioVisualizer({ audioStream }) {
  const canvasRef = useRef();

  useEffect(() => {
    audioTest();

    return () => {
      if (canvasRef && canvasRef.current) {
        canvasRef.current.getContext('2d').clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
  }, [audioStream])

  const audioTest = async () => {
    try {
      const audioCtx = new AudioContext();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      const audioSrc = audioCtx.createMediaStreamSource(audioStream);
      audioSrc.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);

      const context = canvasRef.current.getContext('2d');

      const draw = (dataParm) => {
        context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        dataParm = [...dataParm];
        context.fillStyle = '#ebebed';  //white background          
        context.lineWidth = 2; //width of candle/bar
        context.strokeStyle = 'rgb(25, 135, 84)'; // '#d5d4d5'; //color of candle/bar
        const space = canvasRef.current.width / dataParm.length;
        dataParm.forEach((value, i) => {
          context.beginPath();
          context.moveTo(space * i, canvasRef.current.height); //x,y
          context.lineTo(space * i, canvasRef.current.height - value); //x,y
          context.stroke();
        });
      };

      const loopingFunction = () => {
        if (canvasRef.current) {
          requestAnimationFrame(loopingFunction);
          analyser.getByteFrequencyData(data);
          draw(data);
        }
      };

        requestAnimationFrame(loopingFunction);

    } catch (err) {
      // error handling
    }
  }

  return (
    <canvas style={{ maxHeight: "100px" }} className="h-100" ref={canvasRef}></canvas>
  );

}

export default AudioVisualizer;