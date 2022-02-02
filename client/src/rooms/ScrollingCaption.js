import React, { Component, useEffect, useState } from "react";


const ScrollingCaption = ({captionCount, displayCaptions}) => {
  const count = captionCount;
  const [captions, setCaptions] = useState(new Array(count));
  const [displayIndex, setDisplayIndex] = useState(0);

  useEffect(() => {
    // console.log('updating captions: ' + JSON.stringify(displayCaptions));
    
    if (displayCaptions && displayCaptions.results && displayCaptions.results[0]) {
      captions[displayIndex] = "Speaker " + displayCaptions.speakerId + ": " + displayCaptions.results[0].alternatives.map(alt => alt.transcript).join(" ");

      if (displayCaptions.results[0].isFinal && displayIndex === count - 1) {
        const captionsCopy = new Array(count);
        
        for (let index = 1; index < captions.length; index++) {
          captionsCopy[index - 1] = captions[index];
        }

        setCaptions(captionsCopy);
      } else {
        setCaptions(captions);
      }

      if (displayCaptions.results[0].isFinal && displayIndex < count - 1) {
        setDisplayIndex(displayIndex + 1);
      }
      
    }
  }, [displayCaptions]);

  function renderCaptionContainer() {
    const containers = new Array(count);
    const heightCalc = Math.floor(100/count).toString() + "%";
    for (let i = 0; i < count; i++) {
      containers.push(
      <div key={i} style={{height: heightCalc}} className="scrolling-caption-container">
        <p style={{opacity: "100%"}}>
          {captions && captions[i] ? captions[i] : ""}
        </p>
      </div>)
    }

    return containers;
  }

  return (
    <div style={{height: "100%", width: "100%"}}>
      {renderCaptionContainer()}
    </div>
  );
}

export default ScrollingCaption;