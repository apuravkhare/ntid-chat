import React, { createRef, useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import AppConstants from "../AppConstants";
import StringDistanceCalculator from "../util/StringDistanceCalculator";

const SpeechBubble = ({identifySpeakers, caption, senderUserId, index, handleSendClick, messageId, messageEditType}) => {

  const [isEdit, setIsEdit] = useState(false);
  const [message, setMessage] = useState("");
  const textAreaRef = createRef();

  useEffect(() => {
    if (isEdit && textAreaRef.current) {
      textAreaRef.current.focus();
      textAreaRef.current.setSelectionRange(textAreaRef.current.value.length, textAreaRef.current.value.length);
    }
  }, [isEdit]);

  function onSendClick() {
    setIsEdit(false);
    handleSendClick(message, messageId);
  }

  function onTyping(e) {
    setMessage(e.target.value);
  }

  function onKeyUp(e) {
    if (e.key === 'Enter') {
      onSendClick();
    }
  }

  function renderDiff(diff, original, edited) {
    switch (diff.type) {
      case StringDistanceCalculator.editTypes.substitution:
        return <> <span className="deleted-word">{original[diff.i - 1]} </span><span className="substituted-word">{edited[diff.j - 1]} </span> </>;
      case StringDistanceCalculator.editTypes.deletion:
        return <span className="deleted-word">{original[diff.i - 1]} </span>;
      default:
        return <span>{edited[diff.j - 1]} </span>;
    }
  }

  function renderSplitText() {
    const text = caption["message"];

    if (caption["parentMessage"]) {
      const original = caption["parentMessage"].split(" ").filter(str => !!str && str !== " ").map(str => str.trim().replace("\n", ""));
      const edited = text.split(" ").filter(str => !!str && str !== " ").map(str => str.trim().replace("\n", ""));
      let { levenPath } = StringDistanceCalculator.computeDistance(original, edited);
      return <span style={{overflowWrap: "break-word"}}>
          {identifySpeakers && (caption["speakerDisplayName"]  + " (edited): ")} 
          { levenPath.slice(1).map(diff => renderDiff(diff, original, edited)) }
        </span>;
    } else {
      if (text && text.length > 0) {
        return <span style={{overflowWrap: "break-word"}}>
            {identifySpeakers && (caption["speakerDisplayName"] + ": ")}
            {text.split(" ").map(word => (<span>{word} </span>))}
          </span>;
      } else {
        return <></>;
      }
    }
  }

  return(
    <div className="w-100" style={{overflow:"auto" ,float: identifySpeakers && caption["userId"] === senderUserId ? "right" : "left"}}>
      <div className={identifySpeakers && caption["userId"] === senderUserId ? "scrolling-caption-container-sender position-relative" : "scrolling-caption-container"}>
        {messageEditType !== AppConstants.messageEditTye.disabled && caption["userId"] === senderUserId ?
        <FontAwesomeIcon title="Edit" onClick={() => setIsEdit(!isEdit)} className="float-end p-1 chat-fa-icon" icon={faEdit} size="sm" />
        : <></>}
        {isEdit ? 
        (<>
          <p style={{opacity: "0%"}} className="w-75">{caption['message']} </p>
          <FontAwesomeIcon title="Send" className="float-end p-1 chat-fa-icon"  onClick={onSendClick} icon={faPaperPlane} size="lg" />
          <textarea ref={textAreaRef} onKeyUp={onKeyUp} onChange={onTyping} className="position-absolute top-0 h-75" type="text" defaultValue={caption["message"]}></textarea>
        </>)
        : (<p style={{opacity: "100%"}}>{ renderSplitText() } </p>)}
      </div>
    </div>
  )
}

export default SpeechBubble;