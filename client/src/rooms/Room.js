import React, { useEffect, useRef, useState, } from "react";
import { useHistory } from "react-router";
import io from "socket.io-client";
import Peer from "simple-peer";
import styled from "styled-components";
import "../util/room.css";
import { faClosedCaptioning, faCommentAlt, faEllipsisV, faMicrophone,faTextHeight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button, Col, Container, Dropdown, Form, Navbar, Row } from "react-bootstrap";
import TextChat from "./TextChat";
import ScrollingCaption from "./ScrollingCaption";
import ErrorModal from "../util/ErrorModal";
import { NotificationContainer, NotificationManager } from 'react-notifications';
import { toast } from 'react-toastify';
import AppConstants from "../AppConstants";
import AppUtil from "../util/AppUtil";


const StyledVideo = styled.video`
    height: 90%;
    margin: 0.5em;
    max-width: 100%;
`;

const Styledbutton = styled.button`
    background-color: #2eb82e;
    border-radius: 7px;
`;

const Caption = styled.p`
    background-color: #2a2a2e;
    color: white;
    padding: 0.2em;
    margin-bottom: auto;
    border-radius: 3px;
`;


const Video = ({peer, onActionSelect}) => {
    const ref = useRef();

    useEffect(() => {
        peer.on("stream", stream => {
            ref.current.srcObject = stream;
        })
    }, []);

    return (
        <>
            {/* <span className="video-options" >
            <FontAwesomeIcon icon={faEllipsisV} size="sm" />
            &nbsp;Options
        </span> */}
            <Dropdown style={{ position: "absolute", marginTop: "1em", marginLeft: "1em", zIndex: "999" }} onSelect={(eventKey, event) => onActionSelect(eventKey)}>
                <Dropdown.Toggle variant="outline-secondary" size="sm">
                    Options
                </Dropdown.Toggle>
                <Dropdown.Menu>
                    <Dropdown.Item eventKey={AppConstants.videoNotificationOptions.speakUp}>Speak Up</Dropdown.Item>
                    <Dropdown.Item eventKey={AppConstants.videoNotificationOptions.slowDown}>Slow Down</Dropdown.Item>
                    <Dropdown.Item eventKey={AppConstants.videoNotificationOptions.speakClearer}>Speak Clearer</Dropdown.Item>
                </Dropdown.Menu>
            </Dropdown>
            <StyledVideo playsInline autoPlay ref={ref} >
            </StyledVideo>
        </>
    );
}

const Audio = (props) => {
    const ref = useRef();

    useEffect(() => {
        props.peer.on("stream", stream => {
            ref.current.srcObject = stream;
        })
    }, []);

    return (
        <>
            {/* <FontAwesomeIcon icon={faMicrophone} className="chat-fa-icon" size="lg" /> */}
            <audio playsInline autoPlay ref={ref}></audio>
        </>
    )
}


const videoConstraints = {
    height: window.innerHeight / 3,
    width: window.innerWidth / 3
};

const audioConstraints = {
    channelCount: 1
}

const allowedFontSizes = ["small", "medium", "large", "x-large", "xx-large"];

const iceServersConfig = [
    {
        urls: "stun:openrelay.metered.ca:80",
    },
    {
        urls: "turn:openrelay.metered.ca:80",
        username: "openrelayproject",
        credential: "openrelayproject",
    },
    {
        urls: "turn:openrelay.metered.ca:443",
        username: "openrelayproject",
        credential: "openrelayproject",
    },
    {
        urls: "turn:openrelay.metered.ca:443?transport=tcp",
        username: "openrelayproject",
        credential: "openrelayproject",
    },
];

const Room = (props) => {
    const [fontSizeIndex, setFontSizeIndex] = useState(2);
    const [peers, setPeers] = useState([]);
    const [asrResult, setAsrResult] = useState();
    const isMuted = useRef(false);
    const socketRef = useRef();
    const userVideo = useRef();
    const userAudio = useRef();
    const peersRef = useRef([]);
    const [roomID, roomOptions] = AppUtil.getQueryParams(props);
    const history = useHistory();
    const selectedDevices = history.location.state;
    let AudioContext = useRef();
    let context = useRef();
    let processor = useRef();
    let audioStream = useRef();
    let input = useRef();

    useEffect(() => {
        const hasGetUserMedia = !!(navigator.getUserMedia || navigator.webkitGetUserMedia ||
            navigator.mozGetUserMedia || navigator.msGetUserMedia || (navigator.mediaDevices && navigator.mediaDevices.getUserMedia));

        if (!hasGetUserMedia) {
            AppUtil.createNotification("This browser does not support streaming audio/video.", AppConstants.notificationType.error);
            return;
        }

        socketRef.current = io.connect("/");
        AudioContext.current = window.AudioContext || window.webkitAudioContext;
        context.current = new AudioContext.current();
        
        try {
            processor.current = context.current.createScriptProcessor(2048, 1, 1);
        } catch {
            AppUtil.createNotification("An error occurred while attempting to access your microphone/camera. Please rejoin this room or contact administrator.", AppConstants.notificationType.error);
            return false;
        }

        const selectedVideoConstraints = !!selectedDevices.selectedVideoDevice ? { ...videoConstraints, deviceId: selectedDevices.selectedVideoDevice } : videoConstraints;
        const selectedAudioConstraints = !!selectedDevices.selectedAudioDevice ? { ...audioConstraints, deviceId: selectedDevices.selectedAudioDevice } : 
        audioConstraints;

        navigator.mediaDevices.getUserMedia({ video: roomOptions.video ? selectedVideoConstraints : false, audio: selectedAudioConstraints }).then(stream => {
            audioStream.current = new MediaStream(stream.getAudioTracks());
            input.current = context.current.createMediaStreamSource(audioStream.current);
            input.current.connect(processor.current);
            processor.current.connect(context.current.destination);

            processor.current.onaudioprocess = function (e) {
                if (!isMuted.current && roomOptions.generateCaptions) {
                    microphoneProcess(e);
                }
            };

            if (roomOptions.video) {
                userVideo.current.srcObject = stream;
            
            // check if this can be used for echo cancellation
            // userVideo.current.volume = 0;
            } else {
                userAudio.current.srcObject = stream;
            }

            socketRef.current.emit("join room", roomID);
            socketRef.current.on("all users", users => {
                const peers = [];
                users.forEach(userID => {
                    const peer = createPeer(userID, socketRef.current.id, stream);
                    peersRef.current.push({
                        peerID: userID,
                        peer,
                    })
                    peers.push(peer);
                })
                setPeers(peers);
            })

            socketRef.current.on("user joined", payload => {
                const peer = addPeer(payload.signal, payload.callerID, stream);
                peersRef.current.push({
                    peerID: payload.callerID,
                    peer,
                })

                setPeers(users => [...users, peer]);
            });

            socketRef.current.on("receiving returned signal", payload => {
                const item = peersRef.current.find(p => p.peerID === payload.id);
                item.peer.signal(payload.signal);
            });

            socketRef.current.on("speechData", payload => {
                if (payload) {
                    updateCaptions(payload);
                    // var r = {"results":[{"alternatives":[{"words":[],"transcript":"hello","confidence":0}],"isFinal":false,"stability":0.009999999776482582,"resultEndTime":{"seconds":"3","nanos":200000000},"channelTag":0,"languageCode":""}],"error":null,"speechEventType":"SPEECH_EVENT_UNSPECIFIED"}
                }
            })

            socketRef.current.on("notification", payload => {
                if (payload) {
                    AppUtil.createNotification(payload.message, payload.type)
                } else {
                    AppUtil.createNotification("An error has occurred. Please contact administrator.")
                }
            });
        })
        .catch(error => {
            AppUtil.createNotification("An error occurred while attempting to access your microphone/camera. Please rejoin this room or contact administrator.", AppConstants.notificationType.error);
        })
    }, []);

    function change(){
        setFontSizeIndex(current => current === allowedFontSizes.length - 1 ? 0 : current + 1)
    }

    function updateCaptions(payload) {
        console.debug('Payload received');
        console.debug('Set ASR Result: ' + JSON.stringify(payload));
        setAsrResult(payload);

        // TODO: choose item with max alt.confidence here. (0.0 indicates confidence was not set)
        // if (roomOptions.video) {
        //     var newTranscript = payload.results[0].alternatives.map(alt => alt.transcript).join(" ");
        //     // var captionsUpdated = (captions.length > 100) ? newTranscript : captions + newTranscript; // newTranscript;
        //     var captionsUpdated = "Speaker " + payload.speakerIndex + ": " + newTranscript;
        //     console.log(payload);
        //     // setCaptions(captionsUpdated);
        //     setAsrResult(payload);
        // } else {
        //     console.log('Set ASR Result: ' + JSON.stringify(payload));
        //     setAsrResult(payload);
        // }
    }

    function convertFloat32ToInt16(buffer) {
        let l = buffer.length;
        let buf = new Int16Array(l / 3);
    
        while (l--) {
            if (l % 3 === 0) {
                buf[l / 3] = buffer[l] * 0xFFFF;
            }
        }
        return buf.buffer
    }

    function microphoneProcess(e) {
        console.log('Room - microphone process');
        var left = e.inputBuffer.getChannelData(0);
        var left16 = convertFloat32ToInt16(left);
        socketRef.current.emit('binaryAudioData', left16);
    }

    function createPeer(userToSignal, callerID, stream) {
        const peer = new Peer({
            initiator: true,
            trickle: false,
            config: { iceServers: iceServersConfig },
            stream,
        });

        peer.on("signal", signal => {
            socketRef.current.emit("sending signal", { userToSignal, callerID, signal })
        })

        return peer;
    }

    function addPeer(incomingSignal, callerID, stream) {
        const peer = new Peer({
            initiator: false,
            trickle: false,
            config: { iceServers: iceServersConfig },
            stream,
        })

        peer.on("signal", signal => {
            socketRef.current.emit("returning signal", { signal, callerID })
        })

        peer.signal(incomingSignal);

        return peer;
    }

    function renderOptions() {
        return (
            <Navbar bg="light" fixed="bottom">
                <Container>
                    <Row className="w-100">
                        <div className="p-0">
                            {(roomOptions.video || roomOptions.admin) && <TextChat onSend={sendTypedMessage} fontSize={allowedFontSizes[fontSizeIndex]}></TextChat>}
                            {/* TODO: Enable below after adding a mode for synchronized talking */}
                            {/* <span className={isMuted.current ? "chat-fa-text-chat-icon" : "chat-fa-text-chat-icon-talking"} onClick={toggleSpeech} >
                                <FontAwesomeIcon icon={faMicrophone} size="lg" />
                                <span className="lead" style={{padding: "0.5em"}}>Talk</span>
                            </span> */}
                            <span className="chat-fa-text-chat-icon" onClick = {change}>
                                <FontAwesomeIcon icon={faTextHeight} size="lg"  />
                            </span>
                            {/* <span  style= {{float: "right"}}>
                                <Styledbutton onClick={()=>{history.push("/ExitRoom")}}>Leave</Styledbutton>
                            </span> */}
                            <span>
                                <Button style={{ float: "right" }} variant="danger" onClick={() => history.push("/ExitRoom")}>Exit</Button>
                                {roomOptions.admin && <Button style={{ float: "right" }} variant="primary">Intervene</Button>}
                            </span>
                        </div>
                    </Row>
                </Container>
            </Navbar>);
    }

    function notifyUser(eventKey, peerIndex) {
        const peerID = peersRef.current[peerIndex].peerID;
        console.log("notify user: " + eventKey + " - " + peerID );
        switch (eventKey) {
            case AppConstants.videoNotificationOptions.slowDown:
                socketRef.current.emit("notifyPeer", { peerId: peerID, type: AppConstants.notificationType.warning, message: "Please slow down to improve the captioning accuracy." });
                break;
        
            case AppConstants.videoNotificationOptions.speakUp:
                socketRef.current.emit("notifyPeer", { peerId: peerID, type: AppConstants.notificationType.warning, message: "Please speak up to improve the captioning accuracy." });
                break;
            case AppConstants.videoNotificationOptions.speakClearer:
                socketRef.current.emit("notifyPeer", { peerId: peerID, type: AppConstants.notificationType.warning, message: "Please speak more clearly to improve the captioning accuracy." });
                break;
        }
        
    }

    function renderVideo() {
        return (
            <div className="h-100" style={{display:!!roomOptions.video ? "inherit":"none"}}>
                {/* User's own video */}
                <Col className="h-100">
                    <StyledVideo muted ref={userVideo} autoPlay playsInline />
                </Col>
                {/* All other videos */}
                {peers.map((peer, index) => {
                    return (
                        <Col className="h-100"><Video key={"video-" + index} peer={peer} onActionSelect={(eventKey) => notifyUser(eventKey, index)} /></Col>
                    );
                })}
            </div>
        );
    }

    function renderAudio() {
        return (
            <Col>
                <p className="text-dark text-opacity-75 float-end">{ (peers && peers.length ? peers.length + 1 : 1) + " user(s) in this room" }</p>
                {/* User's audio */}
                    {/* <Audio ref={userAudio} autoPlay playsInline /> */}
                    {/* <FontAwesomeIcon icon={faMicrophone} className="chat-fa-icon" size="lg" /> */}
                    <audio muted playsInline autoPlay ref={userAudio}></audio>
                {/* All other audio */}
                {peers.map((peer, index) => {
                    return (
                        <Audio peer={peer} key={"audio-" + index} autoPlay playsInline />
                    );
                })}
            </Col>
        )
    }

    function renderAdmin() {
        return (
            <Col>
                <p className="text-dark text-opacity-75 float-end">{(peers && peers.length ? peers.length + 1 : 1) + " user(s) in this room"}</p>
                {/* Only render other users' audio */}
                {peers.map((peer, index) => {
                    return (
                        <Audio peer={peer} key={"audio-" + index} autoPlay playsInline />
                    );
                })}
            </Col>
        )
    }

    function sendTypedMessage(message) {
        socketRef.current.emit('textMessage', message);
    }

    function sendEditedMessage(message, parentMessageId) {
        socketRef.current.emit('editMessage', { message: message, parentMessageId: parentMessageId });
    }

    function toggleSpeech() {
        console.log('toggling isMuted to: ' + (!isMuted.current));
        isMuted.current = !isMuted.current;
    }

    return (
        <>
        <Container className="h-100" style={{overflow:"auto"}}>
            <Row className="align-items-center" style={{boxShadow:"0px 2px 5px #999999", height: !roomOptions.video ? "2em" : (roomOptions.showCaptions ? "33%" : "50%"), overflow:"auto"}}>
                {roomOptions.video ? renderVideo() : renderAudio()}
            </Row>
            <Row hidden={roomOptions.showCaptions === false} className="align-items-center" style={{height: roomOptions.video ? "50%" : "75%", fontSize: allowedFontSizes[fontSizeIndex]}}>
                <Col className="h-100">
                    <ScrollingCaption onSend={sendEditedMessage} style = {{}} currentUserId={socketRef.current && socketRef.current.id} displayCaptions={asrResult} identifySpeakers={roomOptions.identifySpeakers} messageEditType={roomOptions.messageEditType} />
                </Col>
            </Row>
            <Row hidden={roomOptions.showCaptions === true} className="align-items-center" style={{height: roomOptions.video ? "50%" : "75%", textAlign: "center"}}>
                <Col className="h-100">
                    <div className="text-dark text-opacity-50" style={{padding: "5em"}}>
                        <FontAwesomeIcon icon={faClosedCaptioning} size="3x" />
                        <h5>You do not have access to view captions in this room.</h5>
                    </div>
                </Col>
            </Row>
        </Container>
        {renderOptions()}
        </>
    );
};

export default Room;
