import React, { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAlignCenter, faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import styled from "styled-components";
import { propTypes } from "react-bootstrap/esm/Image";


const TextChat = ({onSend,value}) => {
   
  useEffect(() => {
    console.log("use effect log")
    setInitMessage(value)
  })
  let [initMessage, setInitMessage] = useState("")
  let [message, setMessage] = useState("");
  function handleSendClick() {
    if (onSend) {
      onSend(message);
    }
    
    setMessage("");
  }

  function onTyping(e) {
    setMessage(e.target.value)
    console.log("on type")
  }
  
  return(
    <>
      <input type="text" value = {initMessage} onChange={onTyping} className="w-75" style={{resize: "none", borderRadius: "1em", fontSize:"x-large"}}></input>
      <span className="chat-fa-text-chat-icon" onClick = {handleSendClick} >
        <FontAwesomeIcon icon={faPaperPlane} size="lg" />
        {/* <span className="lead" style={{padding: "0.5 em"}}>Send</span> */}
      </span>
    </>
  );
};

export default TextChat;