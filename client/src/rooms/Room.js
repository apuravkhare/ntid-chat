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
import myImage from "../man_talking.jpeg"
/** 
 * Placeholder component for the HTML video tag, with additional styles.
 */
const StyledVideo = styled.video`
    height: 90%;
    margin: 0.5em;
    max-width: 100%;
`;


const Caption = styled.p`
    background-color: #2a2a2e;
    color: white;
    padding: 0.2em;
    margin-bottom: auto;
    border-radius: 3px;
`;

/**
 * Component for a single video element.
 * @param params An object containing the peer from which to show the video, and the callback for notifications.
 * @returns An instance of the component for one video feed.
 */
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
                <Dropdown.Toggle variant="outline-primary" size="sm">
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

/**
 * Component for a single audio element.
 * @param props An object containing the peer from which to show the audio.
 * @returns An instance of the component for one audio feed.
 */
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

// const iceServersConfig = [
//     { urls: "stun:stun.l.google.com:19302" },
//     { "urls": "turn:numb.viagenie.ca", "username": "ak2816@rit.edu", "credential": "jyBQUMNLuSdxR8n" }
// ];

/**
 * Component for the room page for a user. This screen holds all major components for the communication and caption components.
 * @param {*} props Props for the component. Currently used for passing parameters from the previous page.
 * @returns An instance of the component for one room.
 */
const Room = (props) => {
    const [fontSizeIndex, setFontSizeIndex] = useState(2);
    const [peers, setPeers] = useState([]);
    const [asrResult, setAsrResult] = useState();
    const [asrResultSync, setAsrResultSync] = useState();
    const isMuted = useRef(true);
    const socketRef = useRef();
    const userVideo = useRef();
    const userAudio = useRef();
    const peersRef = useRef([]);
    const [roomID, roomOptions] = AppUtil.getQueryParams(props);
    const history = useHistory();
    const selectedDevices = history.location.state;
    // const [iceServersConfig, setIceServersConfig] = useState();
    let AudioContext = useRef();
    let context = useRef();
    let processor = useRef();
    let audioStream = useRef();
    let input = useRef();

    /**
     * Runs on component load, and contains all the major operations for initiating the conversation and establishing listeners used throughout.
     */
    useEffect(() => {

        // Check for browser support.
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

        // Obtain permissions for the microphone and camera. Use the devices selected on the configure page, if any. Use the default ones otherwise.
        navigator.mediaDevices.getUserMedia({ video: roomOptions.video ? selectedVideoConstraints : false, audio: selectedAudioConstraints }).then(stream => {
            audioStream.current = new MediaStream(stream.getAudioTracks());
            input.current = context.current.createMediaStreamSource(audioStream.current);
            input.current.connect(processor.current);
            processor.current.connect(context.current.destination);

            // Called when the browser detects audio.
            // TODO: Chrome issues a warning for this function as it will be deprecated soon. We need to find a library/alternate mechanism for doing this.
            processor.current.onaudioprocess = function (e) {
                if (((!roomOptions.isAsync && !isMuted.current) || roomOptions.isAsync) && roomOptions.generateCaptions) {
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

            // 06/01/2022: Switched to Twilio servers. They require us to authenticate credentials every time, so we can't hardcode any servers.
            // We want to do these operations only after setting the ICE servers
            getIceServers(iceServersConfig => {
                // Step 1: Tell the server that a participant has joined.
                socketRef.current.emit("join room", { roomID: roomID, isAsync: roomOptions.isAsync })

                // Step 2: Obtain information of other users in that room, and connect the audio/video stream to them both ways.
                socketRef.current.on("all users", users => {
                    const peers = [];
                    users.forEach(userID => {
                        const peer = createPeer(userID, socketRef.current.id, stream, iceServersConfig);
                        peersRef.current.push({
                            peerID: userID,
                            peer,
                        })
                        peers.push(peer);
                    })
                    setPeers(peers);
                })
    
                // Step 3: Create a listener for when a new user joins this room - we essentially need to connect the audio/video stream to them.
                socketRef.current.on("user joined", payload => {
                    const peer = addPeer(payload.signal, payload.callerID, stream, iceServersConfig);
                    peersRef.current.push({
                        peerID: payload.callerID,
                        peer,
                    })
    
                    setPeers(users => [...users, peer]);
                });
            });
            
            // Step 4. On confirmation that a new user has been connected, transmit the audio/video.
            socketRef.current.on("receiving returned signal", payload => {
                const item = peersRef.current.find(p => p.peerID === payload.id);
                item.peer.signal(payload.signal);
            });

            // When captions are received from the server, display them as per the user's config.
            socketRef.current.on("speechData", payload => {
                if (payload) {
                    updateCaptions(payload);
                    // var r = {"results":[{"alternatives":[{"words":[],"transcript":"hello","confidence":0}],"isFinal":false,"stability":0.009999999776482582,"resultEndTime":{"seconds":"3","nanos":200000000},"channelTag":0,"languageCode":""}],"error":null,"speechEventType":"SPEECH_EVENT_UNSPECIFIED"}
                }
            })

            // If the application is in synchronous mode, display the captions in the text box.
            socketRef.current.on("speechDataSync", payload => {
                if (payload) {
                    updateCaptionsSync(payload);
                }
            })

            // When the server issues a notification, show the corresponding toast notification.
            socketRef.current.on("notification", payload => {
                if (payload) {
                    AppUtil.createNotification(payload.message, payload.type)
                } else {
                    AppUtil.createNotification("An error has occurred. Please contact administrator.")
                }
            });

            // User has clicked the microphone button, and the ASR engine has started.
            socketRef.current.on("syncSpeechStarted", payload => {
                isMuted.current = false;
                setAsrResultSync("");
            });

            // The ASR engine has marked the sentence as complete, and has stopped listening.
            // TODO: We may need to change/restart here if extended listening is required.
            socketRef.current.on("syncSpeechEnded", payload => {
                isMuted.current = true;
                AppUtil.createNotification("The sentence is marked complete by the ASR engine. Please click the mic icon to type another message.", AppConstants.notificationType.info);
                setAsrResultSync("");
            });
            
        })
        .catch(error => {
            AppUtil.createNotification("An error occurred while attempting to access your microphone/camera. Please rejoin this room or contact administrator.", AppConstants.notificationType.error);
        })
    }, []);

    function change(){
        setFontSizeIndex(current => current === allowedFontSizes.length - 1 ? 0 : current + 1)
    }

    /**
     * Updates the captions in the text box for synchronous mode.
     * @param {*} payload The captions to display
     */
    function updateCaptionsSync(payload) {
        console.debug('Payload received');
        console.debug('Set ASR Result: ' + JSON.stringify(payload));
        setAsrResultSync(payload);
    }

    /**
     * Gets the ICE server config after authentication from the server.
     * @param {*} emitCallback The function to call when the server config is successfully received.
     */
    function getIceServers(emitCallback) {
        fetch("/api/credentials", {
            method: 'GET'
        }).then(response => {
            response.json().then(data => {
                emitCallback(data.iceServers);
            }).catch(error => {
                console.error(error);
                AppUtil.createNotification("An error occurred while connecting to the relay servers. Please contact administrator.", AppConstants.notificationType.error);
            });
        }).catch(error => {
            console.error(error);
            AppUtil.createNotification("An error occurred while connecting to the relay servers. Please contact administrator.", AppConstants.notificationType.error);
        });
    }

    /**
     * Updates captions in asynchronous (continuous) mode.
     * @param {*} payload The captions to display.
     */
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

    /**
     * Helper function for converting audio buffer format for processing.
     * @param {*} buffer Float 32 buffer.
     * @returns Int 16 version of the buffer.
     */
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

    /**
     * Sends the formatted (single channel, 16 bit) audio data to the server.
     * @param {*} e The audio data.
     */
    function microphoneProcess(e) {
        // console.log('Room - microphone process');
        var left = e.inputBuffer.getChannelData(0);
        var left16 = convertFloat32ToInt16(left);
        socketRef.current.emit('binaryAudioData', left16);
    }

    /**
     * Creates a peer for the current user to connect to another user in the room.
     * @param {String} userToSignal The socket id of a peer in the room.
     * @param {String} callerID The socket id of the current user.
     * @param {*} stream Current user's audio/video.
     * @param {*} iceServersConfig ICE servers to use for the connection.
     * @returns The peer object for the other user.
     */
    function createPeer(userToSignal, callerID, stream, iceServersConfig) {
        console.debug("Creating peer with ICE servers:");
        console.debug(iceServersConfig);

        const peer = new Peer({
            initiator: true,
            trickle: false,
            config: { iceServers: iceServersConfig, iceTransportPolicy: "relay" },
            stream,
        });

        peer.on("signal", signal => {
            socketRef.current.emit("sending signal", { userToSignal, callerID, signal })
        })

        return peer;
    }

    /**
     * Creates a peer when a new user joins this room.
     * @param {String} incomingSignal Audio/video from the new user.
     * @param {String} callerID The socket id of the new user.
     * @param {*} stream Current user's audio/video.
     * @param {*} iceServersConfig ICE servers to use for the connection.
     * @returns The peer object for the new user.
     */
    function addPeer(incomingSignal, callerID, stream, iceServersConfig) {
        const peer = new Peer({
            initiator: false,
            trickle: false,
            config: { iceServers: iceServersConfig, iceTransportPolicy: "relay" },
            stream,
        })

        peer.on("signal", signal => {
            socketRef.current.emit("returning signal", { signal, callerID })
        })

        peer.signal(incomingSignal);

        return peer;
    }

    /**
     * Called when the microphone icon is clicked.
     */
    function onSyncSpeech() {
        socketRef.current.emit("syncSpeech");
    }

    /**
     * Renders the bottom bar with options as per user's config.
     * @returns HTML for the bottom bar.
     */
    function renderOptions() {
        return (
            <Navbar bg="light" fixed="bottom">
                <Container>
                    <Row className="w-100">
                        <div className="p-0">
                            {(roomOptions.video || roomOptions.admin) && <TextChat onSend={sendTypedMessage} fontSize={allowedFontSizes[fontSizeIndex]} enableSpeech={!roomOptions.isAsync} onSpeech={onSyncSpeech} externalInput={asrResultSync} isListening={!isMuted.current}></TextChat>}
                            {/* TODO: Enable below after adding a mode for synchronized talking */}
                            
                            <span className="chat-fa-text-chat-icon" onClick={change}>
                                <FontAwesomeIcon icon={faTextHeight} size="lg" />
                            </span>
                            <span>
                                <Button variant="danger" style={{ margin: "10px" }} onClick={() => { history.push("/ExitRoom") }}>Leave</Button>
                            </span>
                        </div>
                    </Row>
                </Container>
            </Navbar>);
    }

    /**
     * Mechanism to send notifications to an individual user.
     * @param {*} eventKey The type of notification to send.
     * @param {*} peerIndex The index of the user to notify.
     */
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

    /**
     * Renders the video section of the room.
     * @returns HTML for the user and peers' video.
     */
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

    /**
     * Renders the audio section of the room.
     * @returns HTML for the user and peers' audio.
     */
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

    /**
     * In progress: Renders the admin functions to intercept with a video on demand.
     * @returns HTML for the admin operations.
     */
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

    /**
     * Mechanism to send a text message as a caption to users in the current room.
     * @param {String} message The message to send.
     */
    function sendTypedMessage(message) {
        socketRef.current.emit('textMessage', message);
        isMuted.current = true;
    }

    /**
     * Mechanism to send a potentially modified message as a caption to users in the current room.
     * @param {*} message The message to send.
     * @param {*} parentMessageId ID of the message that was modified to create the current message.
     */
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
                        <div> <img src={myImage} style = {{ height: 200 ,width: 240}} alt="Man Talking" /></div>
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
