import React, { useRef, useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane } from '@fortawesome/free-solid-svg-icons';

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
        <textarea rows={2} cols={80} onChange={onTyping} style={{resize: "none"}}></textarea>
        <span style={{padding: "0.5em", lineHeight: "0.5em"}}>
          <button className="chat-fa-text-chat-icon" onClick = {handleSendClick}>
            <FontAwesomeIcon icon={faPaperPlane} className="chat-fa-icon" size="lg"  />
            <span className="lead" style={{padding: "0.5em"}}>Send</span>
          </button>
          
        </span>
      </div>
    </>
  );
};

export default TextChat;