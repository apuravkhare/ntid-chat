import React, { useState } from "react";
import { v1 as uuid } from "uuid";
import "../util/room.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCopy, faDownload, faEdit, faInfoCircle, faPaperPlane, faQuestionCircle } from '@fortawesome/free-solid-svg-icons';
import { Button, ButtonGroup, Dropdown, Form, FormCheck, Modal, OverlayTrigger, Tab, Table, ToggleButton, Tooltip } from 'react-bootstrap';
import { stringify } from "querystring";
import {CopyToClipboard} from 'react-copy-to-clipboard';
import AppUtil from "../util/AppUtil";
import AppConstants from "../AppConstants";
import Moment from "react-moment";
import { ExportToCsv } from 'export-to-csv';
import moment from 'moment';

const CreateRoom = (props) => {
    const [roomId, setRoomId] = useState("");
    const routerPath = "room_/";
    const [queryParams, setQueryParams] = useState(genQueryParams());
    const [copyBtnToolTipText, setCopyBtnToolTipText] = useState("Copy Room ID");
    const [audioModeParticipantType, setAudioModeParticipantType] = useState("hh");
    const [showTranscripts, setShowTranscripts] = useState(false);
    const [showOptionsHelp, setShowOptionsHelp] = useState(false);
    const [transcripts, setTranscripts] = useState([]);

    function genQueryParams(video = false, captions = false, genCaptions = false, idSpeaker = false, edit = "none", admin = false, async = true) {
        return { video: video, captions: captions, genCaptions: genCaptions, idSpeaker: idSpeaker, edit: edit, admin: admin, async: async }
    }

    function getFullUri(params) {
        return window.location.href + routerPath + createFullQueryString(params);
    }

    function showCopiedOverlay() {
        setCopyBtnToolTipText("Copied!");
        setTimeout(() => {
            setCopyBtnToolTipText("Copy Room ID")
        }, 2000)
    }

    function createNewRoomId(eventKey) {
        let newRoomId = uuid();
        setRoomId(newRoomId);
        if (eventKey === 'video') {
            setQueryParams(genQueryParams(true, true, true, true, "inline", false, true));
        } else {
            // essentially not used currently, but sets a default in case one is needed
            setQueryParams(genQueryParams(false, true, true, false, "none", false, true));
        }
    }

    function toggleCaptions() {
        setQueryParams({ ...queryParams, captions: !queryParams.captions });
    }

    function toggleGenCaptions() {
        setQueryParams({ ...queryParams, genCaptions: !queryParams.genCaptions });
    }

    function toggleIdentifySpeaker() {
        setQueryParams({ ...queryParams, idSpeaker: !queryParams.idSpeaker });
    }

    function toggleAsyncMode() {
        setQueryParams({ ...queryParams, async: !queryParams.async });
    }

    function changeMessageEditType(type) {
        setQueryParams({ ...queryParams, edit: type });
    }

    function createFullQueryString(params) {
        return roomId + "?" + stringify(params);
    }

    const renderTooltip = (props) => (
        <Tooltip id="button-tooltip" {...props}>
            {copyBtnToolTipText}
        </Tooltip>
    );

    function renderUriBox(params) {
        return (<>
            <span style={{ border: "1px solid gray", borderRadius: 4, padding: "0.5em", userSelect: "none", display: "inline-block", backgroundColor: "white" }}>{createFullQueryString(params)}</span>
            <OverlayTrigger
                placement="right"
                delay={{ show: 200, hide: 500 }}
                overlay={renderTooltip}
            >
                <CopyToClipboard text={getFullUri(params)} onCopy={showCopiedOverlay}>
                    <span style={{ padding: "0.5em", cursor: "pointer" }}>
                        <FontAwesomeIcon icon={faCopy} size="lg" />
                        &nbsp;Copy
                    </span>
                </CopyToClipboard>
            </OverlayTrigger>
        </>);
    }

    function downloadTranscripts() {
        fetch("/api/transcript", {
            method: 'GET'
        }).then(response => {
            response.json().then(data => {
                console.log(data.sort((tr1, tr2) => new Date(tr2["timestamp"]) - new Date(tr1["timestamp"])));
                setTranscripts(data.sort((tr1, tr2) => new Date(tr2["timestamp"]) - new Date(tr1["timestamp"]))); 
                setShowTranscripts(true);
            }).catch(error => {
                console.error(error);
                AppUtil.createNotification("An error occurred while trying to fetch the transcripts. Please contact administrator.", AppConstants.notificationType.error);
            });
        }).catch(error => {
            console.error(error);
            AppUtil.createNotification("An error occurred while trying to fetch the transcripts. Please contact administrator.", AppConstants.notificationType.error);
        });
    }

    function handleModalClose() {
        setShowTranscripts(false);
    }

    function handleHelpModalClose() {
        setShowOptionsHelp(false);
    }

    function renderCaptionPhoneOptions() {
        return (
            <>
                <label htmlFor="app-room-id-hh">Hard of Hearing Participant:</label>
                <div id="app-room-id-hh">{renderUriBox(genQueryParams(false, true, false, false, "none"))}</div>
                <label htmlFor="app-room-id-h">Hearing Participant:</label>
                <div id="app-room-id-h">{renderUriBox(genQueryParams(false, false, true, false, "none"))}</div>
                <label htmlFor="app-room-id-admin">Overseer:</label>
                <div id="app-room-id-admin">{renderUriBox(genQueryParams(false, true, false, false, "inline", true))}</div>
            </>);
    }

    function renderVideoOptions() {
        return (
            <>
                <div className="room-id-options">
                    <Form style={{ textAlign: "left" }}>
                        <fieldset>
                            <Form.Check id="app-display-captions" type="switch" checked={queryParams['captions']} onChange={toggleCaptions} label="Show Captions" />
                            <Form.Check id="app-generate-captions" type="switch" checked={queryParams['genCaptions']} onChange={toggleGenCaptions} label="Generate Captions" />
                            <Form.Check id="app-id-speaker" type="switch" checked={queryParams['idSpeaker']} onChange={toggleIdentifySpeaker} label="Identify Speakers" />
                            <Form.Check id="app-speaker-async" type="switch" checked={queryParams['async']} onChange={toggleAsyncMode} label="Transcribe asynchronously" />

                            <label htmlFor="app-message-edit-type">Edit messages: &nbsp;</label>
                            <ButtonGroup id="app-message-edit-type" size="sm">
                                <ToggleButton id="message-edit-type-new" type="radio" variant="outline-primary" value="new" onChange={(e) => changeMessageEditType(e.currentTarget.value)} checked={queryParams['edit'] === "new"}>
                                    Create new
                                </ToggleButton>
                                <ToggleButton id="message-edit-type-inline" type="radio" variant="outline-primary" value="inline" onChange={(e) => changeMessageEditType(e.currentTarget.value)} checked={queryParams['edit'] === "inline"}>
                                    Inline
                                </ToggleButton>
                                <ToggleButton id="participant-type-none" type="radio" variant="outline-primary" value="none" onChange={(e) => changeMessageEditType(e.currentTarget.value)} checked={queryParams['edit'] === "none"}>
                                    Disabled
                                </ToggleButton>
                            </ButtonGroup>

                        </fieldset>
                    </Form>
                </div>
                <div style={{ padding: "0.5em" }}>
                    {renderUriBox(queryParams)}
                </div>
            </>
        );
    }

    function downloadTranscript(id, timestamp) {
        fetch("/api/download?" + new URLSearchParams({ id: id }), {
            method: 'GET'
        }).then(response => {
            response.json().then(data => {
                const formattedData = data["messages"]
                .map(msg => JSON.parse(msg))
                .filter(msg => msg.results && msg.results[0] && msg.results[0]["alternatives"] && msg.results[0]["alternatives"].length > 0)
                .map(msg => { return {
                    "id": msg["id"],
                    "userId": msg["userId"],
                    "transcript": msg.results[0].alternatives.map(alt => alt.transcript).join(" "),
                    "type": msg["type"],
                    "confidence": msg.results[0].alternatives.map(alt => alt["confidence"]).reduce((acc, conf) => acc > conf ? acc : conf, 0.0),
                    "resultEndTime": msg.results[0]["resultEndTime"]["nanos"]
                 }
                });

                const options = {
                    fieldSeparator: ',',
                    filename: moment(timestamp).format("MMM DD YYYY, hh-mm-ss"),
                    quoteStrings: '"',
                    decimalSeparator: '.',
                    showLabels: true,
                    showTitle: true,
                    title: moment(timestamp).format("MMM DD YYYY, hh-mm-ss"),
                    useTextFile: false,
                    useBom: true,
                    useKeysAsHeaders: true,
                };

                const csvExporter = new ExportToCsv(options);
                csvExporter.generateCsv(formattedData);
            }).catch(error => {
                console.error(error);
                AppUtil.createNotification("An error occurred while trying to download the transcripts. Please contact administrator.", AppConstants.notificationType.error);
            });
        }).catch(error => {
            console.error(error);
            AppUtil.createNotification("An error occurred while trying to download the transcripts. Please contact administrator.", AppConstants.notificationType.error);
        })
    }

    function renderTranscriptsTable() {
        return (
            <Table bordered size="sm">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Date</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {(transcripts && transcripts.length > 0) ? transcripts.map((tr, index) =>
                        <tr key={index}>
                            <td>{index + 1}</td>
                            <td><Moment format="MMM DD YYYY, hh:mm:ss">{tr["timestamp"]}</Moment></td>
                            <td><FontAwesomeIcon title="Download" className="chat-fa-icon" icon={faDownload} onClick={() => downloadTranscript(tr["id"], tr["timestamp"])} /></td>
                        </tr>)
                        : <></>}
                </tbody>
            </Table>);
    }

    function renderOptionsHelp() {
        return (
            <>
            <div>
                The toggles can be used to create shareable links with varying permissions for users in the same room. The options are described below:
            </div>
                <Table bordered size="sm">
                    <thead>
                        <tr>
                            <th>Option</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Show Captions</td>
                            <td>Toggles the display of captions to the user.</td>
                        </tr>
                        <tr>
                            <td>Generate Captions</td>
                            <td>Toggles whether captions should be generated for the user.</td>
                        </tr>
                        <tr>
                            <td>Identify Speakers</td>
                            <td>
                                <p>Toggles whether captions should uniquely identify the speakers.</p>
                                <p>If <b>enabled</b>, shows unique speaker names at the beginning of each caption. It also right aligns a user's own captions in green speech bubbles, while the other users' captions are left aligned in blue speech bubbles.</p>
                                <p>If <b>disabled</b>, no names are shown along with the captions, and all messages are left aligned in blue speech bubbles.</p>
                            </td>
                        </tr>
                        <tr>
                            <td>Transcribe asynchronously</td>
                            <td><p>Toggles the mode of message delivery.</p>
                                <p>If <b>enabled</b>, the speech is transcribed and captions delivered to the all other users in real-time. The application is always listening and continuously transcribing the speech in this mode.</p>
                                <p>If <b>disabled</b>, the user clicks a button to begin transcription, then clicks the "send" button to share the transcription to all participants.</p>
                            </td>
                        </tr>
                        <tr>
                            <td>Edit messages</td>
                            <td>
                                <p>Changes the mode of editing messages in a room. If any option other than "Disabled" is chosen, a user's own messages appear with an Edit ( <FontAwesomeIcon icon={faEdit} size="sm"/> ) icon, which when clicked, allows messages to be edited. Edited messages can be resent by pressing "Enter" or clicking the Send ( <FontAwesomeIcon icon={faPaperPlane} size="sm" /> ) icon.</p>
                                <p>Note that messages can be edited only after they are identified as a complete utterance by the Google speech-to-text engine, and the icon appears only after a message is considered complete.</p>
                                <p><b>Create New</b> sends the edited message as an entirely new caption. Users receive a notification indicating that they've received an edited message.</p>
                                <p><b>Inline</b> changes the message in place. Users receive a notification indicating that a message in the conversation has been edited.</p>
                                <p><b>Disabled</b> turns off message editing.</p>
                            </td>
                        </tr>
                    </tbody>
                </Table>
            </>);
    }

    return (
        <>
            <div className="text-center welcome">
                <h3>VoIP Chat Application</h3>
                <p className="lead">Simulation of Internet-protocol captioned telephone service (IP-CTS) research tool</p>
                <br />
                <span className="home-screen-buttons-container">
                    <Dropdown onSelect={(eventKey, event) => createNewRoomId(eventKey)}>
                        <Dropdown.Toggle variant="success" id="dropdown-basic">
                            Generate New Room Token
                        </Dropdown.Toggle>

                        <Dropdown.Menu>
                            <Dropdown.Item eventKey="audio">Captioned Phone</Dropdown.Item>
                            <Dropdown.Item eventKey="video">Video Chat</Dropdown.Item>
                        </Dropdown.Menu>
                    </Dropdown>
                    <Button variant="secondary" onClick={downloadTranscripts}>Download Transcripts</Button>
                </span> 
                {/* <button className="btn btn-success btn-lg" onClick={create}>Generate New Room Token</button> */}
                <div hidden={!roomId} style={{ marginTop: "1em" }}>
                    <p className="lead">Use the options below to create shareable tokens with altered room permissions.&nbsp;
                    <FontAwesomeIcon className="chat-fa-icon" title="Options help" icon={faQuestionCircle} onClick={() => setShowOptionsHelp(!showOptionsHelp)} />
                    </p>
                    <p className="lead">Use the copy button below ( <FontAwesomeIcon icon={faCopy} size="sm" /> ) to copy the link to be shared with participants.</p>
                    {!!queryParams["video"] ? renderVideoOptions() : renderCaptionPhoneOptions()}
                </div>
            </div>

            <Modal show={showTranscripts} onHide={handleModalClose}>
                <Modal.Header closeButton>
                    <Modal.Title>Download Transcripts</Modal.Title>
                </Modal.Header>
                <Modal.Body style={{maxHeight:"50vh", overflowY:"scroll"}}>
                    {renderTranscriptsTable()}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleModalClose}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>

            <Modal show={showOptionsHelp} onHide={handleHelpModalClose}>
                <Modal.Header closeButton>
                    <Modal.Title>Room Options</Modal.Title>
                </Modal.Header>
                <Modal.Body style={{maxHeight:"50vh", overflowY:"scroll"}}>
                    {renderOptionsHelp()}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleHelpModalClose}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
};

export default CreateRoom;
