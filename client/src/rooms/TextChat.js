import React, { useRef, useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAlignCenter, faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import styled from "styled-components";


const TextChat = ({onSend}) => {
  let [message, setMessage] = useState("");

  function handleSendClick() {
    if (onSend) {
      onSend(message);
    }
    
    setMessage("");
  }

  function onTyping(e) {
    setMessage(e.target.value)
  }
  
  return(
    <>
      <input type="text" onChange={onTyping} className="w-75 h-100" style={{resize: "none", borderRadius: 30, fontSize:"x-large"}}></input>
      <span className="chat-fa-text-chat-icon" onClick = {handleSendClick} style={{marginLeft:"0.5em"}}>
        <FontAwesomeIcon icon={faPaperPlane} className="chat-fa-icon" size="lg" />
        <span className="lead" style={{padding: "0.5 em"}}>Send</span>
      </span>
    </>
  );
};

export default TextChat;