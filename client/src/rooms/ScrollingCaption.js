import React, { useEffect, useState } from "react";

const ScrollingCaption = ({currentUserId, displayCaptions}) => {
  const senderUserId = currentUserId;
  // const [captions, setCaptions] = useState([{"userId": 1, "message": "This is a test message This is a test message"}, {"userId": 2, "message": "This is a test message 2 This is a test message 2 This is a test message 2 This is a test message 2 This is a test message 2"}]); // [{ string: string }]
  const [captions, setCaptions] = useState([]);
  const [inProgress, setInProgress] = useState({}); // { string: string }

  useEffect(() => {
    // console.log('updating captions: ' + JSON.stringify(displayCaptions));
    
    if (displayCaptions && displayCaptions.results && displayCaptions.results[0]) {
      const message = "Speaker " + displayCaptions.speakerIndex + ": " + displayCaptions.results[0].alternatives.map(alt => alt.transcript).join(" ");
      console.log("Rendering: " + message);
      if (displayCaptions.results[0].isFinal) {
        const captionsCopy = [...captions];
        captionsCopy.push({ "userId": displayCaptions.userId, message: message });

        const inProgressCopy = {};
        Object.assign(inProgressCopy, inProgress);
        delete inProgressCopy[displayCaptions.userId];
        setCaptions(captionsCopy);
        setInProgress(inProgressCopy);
      } else {
        const inProgressCopy = {};
        Object.assign(inProgressCopy, inProgress);
        inProgressCopy[displayCaptions.userId] = message;
        setInProgress(inProgressCopy);
      }
    }
  }, [displayCaptions]);

  function renderCaptionContainer() {
    const containers = [];
    for (let index = 0; index < captions.length; index++) {
      const caption = captions[index];
      if (caption && caption["message"]) {
        containers.push(<div className="w-100" style={{float: caption["userId"] === senderUserId ? "right" : "left"}}>
                          <div key={index} className={caption["userId"] === senderUserId ? "scrolling-caption-container-sender" : "scrolling-caption-container"}>
                            <p style={{opacity: "100%"}}> {caption["message"]} </p>
                          </div>
                        </div>);
        }
    
    }

    if (inProgress) {
      Object.keys(inProgress).forEach((k, i) => {
        if (inProgress[k]) {
          containers.push(<div>
            <div key={captions.length + i} className={k === senderUserId ? "scrolling-caption-container" : "scrolling-caption-container-sender"}>
              <p style={{opacity: "100%"}}> {inProgress[k]} </p>
            </div>
          </div>);
        }
      });
    }

    return containers;
  }

  return (
    // <div style={{height: "100%", width: "100%"}}>
    <div>
      {renderCaptionContainer()}
    </div>
  );
}

export default ScrollingCaption;