import React, { createRef, useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAlignCenter, faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import styled from "styled-components";
import { propTypes } from "react-bootstrap/esm/Image";


const TextChat = ({onSend,value}) => {

  let [message, setMessage] = useState("");
  let inputRef = createRef();

  function handleSendClick() {
    if (onSend) {
      onSend(message);
    }
    
    setMessage("");
    inputRef.current.value = "";
  }

  function onTyping(e) {
    if (e.key === 'Enter') {
      handleSendClick();
    } else {
      setMessage(e.target.value);
    }
  }
  
  return(
    <>
      <input ref={inputRef} type="text" onChange={onTyping} className="w-75" style={{resize: "none", borderRadius: "1em", fontSize:"x-large"}}></input>
      <span className="chat-fa-text-chat-icon" onClick = {handleSendClick} >
        <FontAwesomeIcon icon={faPaperPlane} size="lg" />
        {/* <span className="lead" style={{padding: "0.5 em"}}>Send</span> */}
      </span>
    </>
  );
};

export default TextChat;