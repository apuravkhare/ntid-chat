import React, { createRef, useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAlignCenter, faArrowUp, faMicrophone, faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import styled from "styled-components";
import { propTypes } from "react-bootstrap/esm/Image";


const TextChat = ({onSend, fontSize, enableSpeech, onSpeech, externalInput, isListening}) => {

  let [message, setMessage] = useState("");
  let inputRef = createRef();

  useEffect(() => {
    if (!!externalInput) {
      const message = externalInput.results[0].alternatives.map(alt => alt.transcript).join(" ");
      inputRef.current.value = message;
      setMessage(message);
    }
  }, [externalInput]);

  function handleSendClick() {
    if (onSend) {
      onSend(message);
    }
    
    setMessage("");
    inputRef.current.value = "";
  }

  function onTyping(e) {
    setMessage(e.target.value);
  }

  function onKeyUp(e) {
    if (e.key === 'Enter') {
      handleSendClick();
    }
  }

  function handleSpeechClick() {
    onSpeech();
  }

  return (
    <>
      <input ref={inputRef} type="text" onKeyUp={onKeyUp} onChange={onTyping} className="w-75" style={{ resize: "none", borderRadius: "1em", fontSize: fontSize }}></input>
      <span className="chat-fa-text-chat-icon" onClick={handleSendClick} >
        <FontAwesomeIcon icon={faArrowUp} size="lg" />
        {/* <span className="lead" style={{padding: "0.5 em"}}>Send</span> */}
      </span>
      {enableSpeech &&
        <span className={isListening ? "chat-fa-text-mic-icon-enabled" : "chat-fa-text-mic-icon" } onClick={handleSpeechClick} >
          <FontAwesomeIcon icon={faMicrophone} size="lg" />
        </span>}
    </>
  );
};

export default TextChat;