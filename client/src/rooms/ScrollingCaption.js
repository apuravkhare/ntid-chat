import React, { createRef, useEffect, useRef, useState } from "react";
import SpeechBubble from "./SpeechBubble";


const ScrollingCaption = ({currentUserId, displayCaptions, identifySpeakers, onSend}) => {
  const senderUserId = currentUserId;
  // const [captions, setCaptions] = useState([{"userId": 1, "message": "This is a test message This is a test message"}, {"userId": 2, "message": "This is a test message 2 This is a test message 2 This is a test message 2 This is a test message 2 This is a test message 2"}]); // [{ string: string }]
  const [captions, setCaptions] = useState([]);
  const [inProgress, setInProgress] = useState({}); // { string: string }
  let messagesContainer = createRef();

  useEffect(() => {
    // console.log('updating captions: ' + JSON.stringify(displayCaptions));
    if (displayCaptions && displayCaptions.results && displayCaptions.results[0]) {
      const message = displayCaptions.results[0].alternatives.map(alt => alt.transcript).join(" ");
      console.log("Rendering: " + message);
      if (displayCaptions.results[0].isFinal) {
        const captionsCopy = [...captions];
        captionsCopy.push({ "userId": displayCaptions.userId, message: message, speakerDisplayName: "Speaker " + displayCaptions.speakerIndex });

        const inProgressCopy = {};
        Object.assign(inProgressCopy, inProgress);
        delete inProgressCopy[displayCaptions.userId];
        setCaptions(captionsCopy);
        setInProgress(inProgressCopy);
        scrollToMyRef();
      } else {
        const inProgressCopy = {};
        Object.assign(inProgressCopy, inProgress);
        inProgressCopy[displayCaptions.userId] = message;
        setInProgress(inProgressCopy);
        scrollToMyRef();
      }
    }

  }, [displayCaptions]);

  function scrollToMyRef() {
    const scroll =
      messagesContainer.current.scrollHeight -
      messagesContainer.current.clientHeight;
    messagesContainer.current.scrollTo(0, scroll);
  }

  function handleSendClick(message) {
    onSend("(edited) " + message);
  }

  function renderCaptionContainer() {
    const containers = [];
    for (let index = 0; index < captions.length; index++) {
      const caption = captions[index];
      if (caption && caption["message"]) {
        containers.push(
        <SpeechBubble identifySpeakers={identifySpeakers} caption={caption} senderUserId={senderUserId} index={index} handleSendClick={handleSendClick} />
        );
      }
    }

    if (inProgress) {
      Object.keys(inProgress).forEach((k, i) => {
        if (inProgress[k]) {
          containers.push(<div className="w-100" style={{float: identifySpeakers && k === senderUserId ? "right" : "left"}}>
            <div key={"msg-" + (captions.length + i)} className={identifySpeakers && k === senderUserId ? "scrolling-caption-container-sender" : "scrolling-caption-container"}>
              <p style={{opacity: "100%"}}> {inProgress[k]} </p>
            </div>
          </div>);
        }
      });
    }

    return containers;
  }

  return (
    <div ref={messagesContainer} className="h-100" style={{overflow:"auto"}}>
      {renderCaptionContainer()}
    </div>
  );
}

export default ScrollingCaption;