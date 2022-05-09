import React, { createRef, useEffect, useRef, useState } from "react";
import AppConstants from "../AppConstants";
import SpeechBubble from "./SpeechBubble";
import ScrollToBottom from 'react-scroll-to-bottom';

const ScrollingCaption = ({currentUserId, displayCaptions, identifySpeakers, onSend, messageEditType}) => {
  const senderUserId = currentUserId;
  // const [captions, setCaptions] = useState([{"userId": 1, "message": "This is a test message This is a test message"}, {"userId": 2, "message": "This is a test message 2 This is a test message 2 This is a test message 2 This is a test message 2 This is a test message 2"}]); // [{ string: string }]
  const [captions, setCaptions] = useState([]);
  const [inProgress, setInProgress] = useState({}); // { string: string }
  let messagesContainer = createRef();

  useEffect(() => {
    if (displayCaptions && displayCaptions.results && displayCaptions.results[0]) {
      const message = displayCaptions.results[0].alternatives.map(alt => alt.transcript).join(" ");
      if (displayCaptions.results[0].isFinal) {
        const captionsCopy = [...captions];

        if (displayCaptions.parentMessageId && messageEditType === AppConstants.messageEditTye.inline) {
          // changing the object by reference should be enough here.
          const originalCaption = captionsCopy.find(c => c.id === displayCaptions.parentMessageId)
          originalCaption.id = displayCaptions.id;
          originalCaption.parentMessage = originalCaption.message;
          originalCaption.message = message;
        } else {
          captionsCopy.push({ "id": displayCaptions.id, "userId": displayCaptions.userId, message: message, speakerDisplayName: "Speaker " + displayCaptions.speakerIndex, "parentMessage": displayCaptions.parentMessageId ? captionsCopy.find(c => c.id === displayCaptions.parentMessageId)?.message : null });
        }


        const inProgressCopy = {};
        Object.assign(inProgressCopy, inProgress);
        delete inProgressCopy[displayCaptions.userId];
        setCaptions(captionsCopy);
        setInProgress(inProgressCopy);
        //scrollToMyRef();
      } else {
        const inProgressCopy = {};
        Object.assign(inProgressCopy, inProgress);
        inProgressCopy[displayCaptions.userId] = message;
        setInProgress(inProgressCopy);
        //scrollToMyRef();
      }
    }

  }, [displayCaptions]);

  function scrollToMyRef() {
    const scroll =
      messagesContainer.current.scrollHeight -
      messagesContainer.current.clientHeight;
    messagesContainer.current.scrollTo(0, scroll);
  }

  function renderCaptionContainer() {
    const containers = [];
    for (let index = 0; index < captions.length; index++) {
      const caption = captions[index];
      if (caption && caption["message"]) {
        containers.push(
        <SpeechBubble key={"msg-" + index} identifySpeakers={identifySpeakers} caption={caption} senderUserId={senderUserId} index={index} handleSendClick={onSend} messageId={caption["id"]} messageEditType={messageEditType} />
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
    <ScrollToBottom className='h-100'>{renderCaptionContainer()}</ScrollToBottom>
    // <div ref={messagesContainer} className="h-100" style={{overflow:"auto"}}>
    //   {renderCaptionContainer()}
    // </div>
  );
}

export default ScrollingCaption;