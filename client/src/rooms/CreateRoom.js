import React, { useState } from "react";
import { v1 as uuid } from "uuid";
import "../util/room.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCopy } from '@fortawesome/free-solid-svg-icons';
import { ButtonGroup, Dropdown, Form, FormCheck, OverlayTrigger, ToggleButton, Tooltip } from 'react-bootstrap';
import { stringify } from "querystring";

const CreateRoom = (props) => {
    // const [displayRoomId, setDisplayRoomId] = useState("");
    const [roomId, setRoomId] = useState("");
    const routerPath = "room_/";
    // const videoQueryParam = "?v=true";
    // const captionQueryParam = "?c=true";
    const [queryParams, setQueryParams] = useState({ video: false, captions: false, genCaptions: false, idSpeaker: false });
    const [copyBtnToolTipText, setCopyBtnToolTipText] = useState("Copy Room ID");
    const [audioModeParticipantType, setAudioModeParticipantType] = useState("hh");
    
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

    function createNewRoomId(eventKey) {
        let newRoomId = uuid();
        setRoomId(newRoomId);
        if (eventKey === 'video') {
            setQueryParams({ video: true, captions: true, genCaptions: true, idSpeaker: true });
        } else {
            setQueryParams({ video: false, captions: audioModeParticipantType==="hh", genCaptions: audioModeParticipantType==="h", idSpeaker: false });
        }
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

    function setAudioParticipantType(type) {
        setAudioModeParticipantType(type);
        setQueryParams({ video: queryParams.video, captions: type==="hh", genCaptions: type==="h", idSpeaker: queryParams.idSpeaker });
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
            <div>
                <Dropdown onSelect={(eventKey, event) => createNewRoomId(eventKey)}>
                    <Dropdown.Toggle variant="success" id="dropdown-basic">
                        Generate New Room Token
                    </Dropdown.Toggle>

                    <Dropdown.Menu>
                        <Dropdown.Item eventKey="audio">Captioned Phone</Dropdown.Item>
                        <Dropdown.Item eventKey="video">Video Chat</Dropdown.Item>
                    </Dropdown.Menu>
                </Dropdown>
            </div>
            {/* <button className="btn btn-success btn-lg" onClick={create}>Generate New Room Token</button> */}
            <div hidden={!roomId} style={{marginTop: "1em"}}>
                <p className="lead">Use the options below to create shareable tokens with altered room permissions.
                </p>
                <div className="room-id-options">
                    <Form style={{textAlign:"left"}}>
                        <fieldset>
                            <label form="app-participant-type" style={{display: !queryParams["video"] ? "inherit" : "none"}}>Participant Type:</label>
                            <ButtonGroup id="app-participant-type" style={{display: !queryParams["video"] ? "inherit" : "none"}}>
                                <ToggleButton id="participant-type-hh" type="radio" variant="outline-primary" value="hh" onChange={(e) => setAudioParticipantType(e.currentTarget.value)} checked={audioModeParticipantType==="hh"}>
                                    Hard-of-hearing
                                </ToggleButton>
                                <ToggleButton id="participant-type-h" type="radio" variant="outline-primary" value="h" onChange={(e) => setAudioParticipantType(e.currentTarget.value)} checked={audioModeParticipantType==="h"}>
                                    Hearing
                                </ToggleButton>
                            </ButtonGroup>

                            <Form.Check id="app-display-captions" type="switch" checked={queryParams['captions']} onChange={toggleCaptions} label="Show Captions" style={{display: !!queryParams["video"] ? "inherit" : "none"}} />
                            <Form.Check id="app-generate-captions" type="switch" checked={queryParams['genCaptions']} onChange={toggleGenCaptions} label="Generate Captions" style={{display: !!queryParams["video"] ? "inherit" : "none"}} />
                            <Form.Check id="app-id-speaker" type="switch" checked={queryParams['idSpeaker']} onChange={toggleIdentifySpeaker} label="Identify Speakers" style={{display: !!queryParams["video"] ? "inherit" : "none"}} />
                        </fieldset>
                    </Form>
                </div>
                <div style={{padding: "0.5em"}}>
                    <span style={{border: "1px solid gray", borderRadius: 4, padding: "0.5em", userSelect: "none", display:"inline-block"}}>{createFullQueryString()}</span>
                    <OverlayTrigger
                        placement="right"
                        delay={{ show: 200, hide: 500 }}
                        overlay={renderTooltip}
                      >
                    <span style={{padding: "0.5em", cursor:"pointer"}} onClick={copyIdToClipboard}>
                        <FontAwesomeIcon icon={faCopy} className="chat-fa-icon" size="lg" />
                        &nbsp;Copy
                    </span>
                    </OverlayTrigger>
                </div>
            </div>
        </div>
    );
};

export default CreateRoom;
