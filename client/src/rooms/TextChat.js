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
      <div style={{height: "25%"}}>
        <textarea rows={5} onChange={onTyping}></textarea>
        <span style={{padding: "0.5em"}}>
          <FontAwesomeIcon onClick={handleSendClick} icon={faPaperPlane} className="chat-fa-icon" size="lg"  />
        </span>
      </div>
    </>
  );
};

export default TextChat;