import React, { useState } from "react";
import { v1 as uuid } from "uuid";
import "../util/room.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCopy } from '@fortawesome/free-solid-svg-icons';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import { stringify } from "querystring";

const CreateRoom = (props) => {
    // const [displayRoomId, setDisplayRoomId] = useState("");
    const [roomId, setRoomId] = useState("");
    const routerPath = "room_/";
    // const videoQueryParam = "?v=true";
    // const captionQueryParam = "?c=true";
    const [queryParams, setQueryParams] = useState({ video: true, captions: true, genCaptions: true, idSpeaker: true });
    const [copyBtnToolTipText, setCopyBtnToolTipText] = useState("Copy Room ID");
    
    function create() {
        // const id = uuid();
        // props.history.push(`/room/${id}`);
        let newRoomId = uuid();
        setRoomId(newRoomId);
        // setDisplayRoomId(createFullQueryString());
    }

    function copyIdToClipboard() {
        navigator.clipboard.writeText(window.location.href + routerPath + createFullQueryString());
        setCopyBtnToolTipText("Copied!");
        setTimeout(() => {
            setCopyBtnToolTipText("Copy Room ID")
        }, 2000)
    }

    function toggleVideo() {
        setQueryParams({ video: !queryParams.video, captions: queryParams.captions, genCaptions: queryParams.genCaptions, idSpeaker: queryParams.idSpeaker });
        // setDisplayRoomId(createFullQueryString());
    }

    function toggleCaptions() {
        setQueryParams({ video: queryParams.video, captions: !queryParams.captions, genCaptions: queryParams.genCaptions, idSpeaker: queryParams.idSpeaker });
        // setDisplayRoomId(createFullQueryString());
    }

    function toggleGenCaptions() {
        setQueryParams({ video: queryParams.video, captions: queryParams.captions, genCaptions: !queryParams.genCaptions, idSpeaker: queryParams.idSpeaker });
        // setDisplayRoomId(createFullQueryString());
    }

    function toggleIdentifySpeaker() {
        setQueryParams({ video: queryParams.video, captions: queryParams.captions, genCaptions: queryParams.genCaptions, idSpeaker: !queryParams.idSpeaker });
    }

    function createFullQueryString() {
        return roomId + "?" + stringify(queryParams);
    }

    const renderTooltip = (props) => (
        <Tooltip id="button-tooltip" {...props}>
          {copyBtnToolTipText}
        </Tooltip>
      );
      

    return (
        <div className="text-center welcome">
            <h3>VoIP Chat Application</h3>
            <p className="lead">Simulation of Internet-protocol captioned telephone service (IP-CTS) research tool</p>
            <br />
            <button className="btn btn-success btn-lg" onClick={create}>Generate New Room Token</button>
            <div hidden={!roomId} style={{marginTop: "1em"}}>
                <p className="lead">Use the checkboxes below to create shareable tokens with altered room permissions.
                </p>
                <div>
                    <span style={{border: "1px solid gray", borderRadius: 4, padding: "0.5em", userSelect: "none"}}>{createFullQueryString()}</span>
                    <OverlayTrigger
                        placement="right"
                        delay={{ show: 200, hide: 500 }}
                        overlay={renderTooltip}
                      >
                    <span style={{padding: "0.5em"}}>
                        <FontAwesomeIcon onClick={copyIdToClipboard} icon={faCopy} className="chat-fa-icon" size="lg"  />
                    </span>
                    </OverlayTrigger>
                </div>
                <div style={{padding: "0.5em"}}>
                    <span style={{margin: "0.4em"}}>
                        <input type="checkbox" checked={queryParams['video']} onChange={toggleVideo} />
                        <label style={{paddingLeft: "0.25em"}}>Allow Video</label>
                    </span>
                    <span style={{margin: "0.4em"}}>
                        <input type="checkbox" checked={queryParams['captions']} onChange={toggleCaptions} />
                        <label style={{paddingLeft: "0.25em"}}>Show Captions</label>
                    </span>
                    <span style={{margin: "0.4em"}}>
                        <input type="checkbox" checked={queryParams['genCaptions']} onChange={toggleGenCaptions} />
                        <label style={{paddingLeft: "0.25em"}}>Generate Captions</label>
                    </span>
                    <span style={{margin: "0.4em"}}>
                        <input type="checkbox" checked={queryParams['idSpeaker']} onChange={toggleIdentifySpeaker} />
                        <label style={{paddingLeft: "0.25em"}}>Identify Speakers</label>
                    </span>
                </div>
            </div>
        </div>
    );
};

export default CreateRoom;
