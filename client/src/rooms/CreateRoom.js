import React, { useState } from "react";
import { v1 as uuid } from "uuid";
import "../util/room.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCopy, faDownload } from '@fortawesome/free-solid-svg-icons';
import { Button, ButtonGroup, Dropdown, Form, FormCheck, Modal, OverlayTrigger, Table, ToggleButton, Tooltip } from 'react-bootstrap';
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
    const [transcripts, setTranscripts] = useState([]);

    function genQueryParams(video = false, captions = false, genCaptions = false, idSpeaker = false, edit = "none", admin = false) {
        return { video: video, captions: captions, genCaptions: genCaptions, idSpeaker: idSpeaker, edit: edit, admin: admin }
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
            setQueryParams(genQueryParams(true, true, true, true, "inline", false));
        } else {
            // essentially not used currently, but sets a default in case one is needed
            setQueryParams(genQueryParams(false, true, true, false, "none", false));
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
                setTranscripts(data); 
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
                    <p className="lead">Use the options below to create shareable tokens with altered room permissions.
                    </p>
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
        </>
    );
};

export default CreateRoom;
