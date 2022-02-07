import React, { useRef, useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAlignCenter, faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import styled from "styled-components";

const Container = styled.button`
  display: inline-block;
  margin-right: 1em;
  text-align: center;
  height: 6.5vh
`;


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
      <div style={{display: "flex", alignItems: "center"}}>
        <textarea  rows={2} cols={80} onChange={onTyping} style={{resize: "none",borderRadius: 30}}></textarea>
        <span style={{padding: "0.5em", lineHeight: "0.5em"}}>
          <Container  className="chat-fa-text-chat-icon" onClick = {handleSendClick}>
            <FontAwesomeIcon icon={faPaperPlane} className="chat-fa-icon" size="lg"  />
            <span className="lead" style={{padding: "0.5 em"}}>Send</span>
          </Container>
          
        </span>
      </div>
    </>
  );
};

export default TextChat;