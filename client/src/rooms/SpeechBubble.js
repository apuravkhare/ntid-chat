import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faPaperPlane } from '@fortawesome/free-solid-svg-icons';

const SpeechBubble = ({identifySpeakers, caption, senderUserId, index, handleSendClick}) => {

  const [isEdit, setIsEdit] = useState(false);
  const [message, setMessage] = useState("");

  function onSendClick() {
    setIsEdit(false);
    handleSendClick(message);
  }

  function onTyping(e) {
    if (e.key === 'Enter') {
      onSendClick();
    } else {
      setMessage(e.target.value);
    }
  }

  return(
    <div className="w-100" style={{overflow:"auto" ,float: identifySpeakers && caption["userId"] === senderUserId ? "right" : "left"}}>
      <div className={identifySpeakers && caption["userId"] === senderUserId ? "scrolling-caption-container-sender position-relative" : "scrolling-caption-container"}>
        {caption["userId"] === senderUserId ?
        <FontAwesomeIcon title="Edit" onClick={() => setIsEdit(!isEdit)} className="float-end p-1 chat-fa-icon" icon={faEdit} size="sm" />
        : <></>}
        {isEdit ? 
        (<>
          <p style={{opacity: "0%"}} className="w-75">{caption['message']} </p>
          <FontAwesomeIcon title="Send" className="float-end p-1 chat-fa-icon"  onClick={onSendClick} icon={faPaperPlane} size="lg" />
          <textarea onChange={onTyping} className="position-absolute top-0 h-75" type="text" defaultValue={caption["message"]}></textarea>
        </>)
        : (<p style={{opacity: "100%"}}>{identifySpeakers ? caption["speakerDisplayName"] + ": " + caption["message"] : caption["message"] } </p>)}
      </div>
    </div>
  )
}

export default SpeechBubble;