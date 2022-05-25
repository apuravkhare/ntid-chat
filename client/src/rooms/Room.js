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

// Config from: subspace.com
/*
  Client ID: cPgqrBTSlR3fiLiZhrzhgliWJ2zNXlOe
  Client Secret: rkYQ5ojieSJWfkrMClhGw4X8QWDlQs6VfDptRtuffr6dmVrI_zsRZ3-3SoandwHR
 */

/**
 * {"access_token":"eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IlFVRXdRalE0TUVNd01UUTVNMFV4UWtZNE0wTTJSRUl5UWtOR1JqZENORE14TVRJeFJEaEVPQSJ9.eyJodHRwczovL2FwaS5zdWJzcGFjZS5jb20vbWV0YWRhdGEiOnsicHJvamVjdF9pZCI6InByal8yR2I2OWlnSlJibjV2Q1pYWGZOdThJIn0sImlzcyI6Imh0dHBzOi8vc3Vic3BhY2UuYXV0aDAuY29tLyIsInN1YiI6ImNQZ3FyQlRTbFIzZmlMaVpocnpoZ2xpV0oyek5YbE9lQGNsaWVudHMiLCJhdWQiOiJodHRwczovL2FwaS5zdWJzcGFjZS5jb20vIiwiaWF0IjoxNjUyMjkxMzczLCJleHAiOjE2NTIzNzc3NzMsImF6cCI6ImNQZ3FyQlRTbFIzZmlMaVpocnpoZ2xpV0oyek5YbE9lIiwic2NvcGUiOiJjb25zb2xlOmFjY2VzcyBhY2NlbGVyYXRvcnM6cmVhZCBhY2NlbGVyYXRvcnM6d3JpdGUgZ2xvYmFsdHVybjphY2Nlc3Mgc2lwdGVsZXBvcnQ6cmVhZCBzaXB0ZWxlcG9ydDp3cml0ZSBwcm9qZWN0czpyZWFkIHJ0cHNwZWVkOnJlYWQgcnRwc3BlZWQ6d3JpdGUiLCJndHkiOiJjbGllbnQtY3JlZGVudGlhbHMiLCJwZXJtaXNzaW9ucyI6WyJjb25zb2xlOmFjY2VzcyIsImFjY2VsZXJhdG9yczpyZWFkIiwiYWNjZWxlcmF0b3JzOndyaXRlIiwiZ2xvYmFsdHVybjphY2Nlc3MiLCJzaXB0ZWxlcG9ydDpyZWFkIiwic2lwdGVsZXBvcnQ6d3JpdGUiLCJwcm9qZWN0czpyZWFkIiwicnRwc3BlZWQ6cmVhZCIsInJ0cHNwZWVkOndyaXRlIl19.Z-SeqmN4sW6cKGBR4zKkANT8NYSrfnKEQAToIwHmpAueu3gB9c7z4N1mirQcXgULIC6PFziBWEvxMgpWJs2Gb08Ikk2pZVN3r8-Wo6Keb9y2esLtR1juYtoDU_5eZYILN1XwOSQcAxkNCcBFeSRoPT59-gVvdkTYUD_JxWZek3HW--CP-GYzd7_75f991zrHtp_l7aabfZWN9xNtditwneBDd_VKyCK0Lgy0IQopHkWzpXZsCJX0Pc577-PA9uJ428WL92dhXX9nLQJXpXmrvfo1KBAXtka1J0Lud2NvHJkN_FvCtDpYBPifuiF9nJMYQ3rA8Zn_VE4uE0VSW9luig","scope":"console:access accelerators:read accelerators:write globalturn:access sipteleport:read sipteleport:write projects:read rtpspeed:read rtpspeed:write","expires_in":86400,"token_type":"Bearer"}
 */
/**
 * {"iceServers":[{"username":"1652378158:prj_2Gb69igJRbn5vCZXXfNu8I","credential":"BL5Sw/0WtcdKeeQpz6+N0nFRu3A=","urls":"turn:globalturn.subspace.com:3478?transport=udp"},{"username":"1652378158:prj_2Gb69igJRbn5vCZXXfNu8I","credential":"BL5Sw/0WtcdKeeQpz6+N0nFRu3A=","urls":"turn:globalturn.subspace.com:3478?transport=tcp"},{"username":"1652378158:prj_2Gb69igJRbn5vCZXXfNu8I","credential":"BL5Sw/0WtcdKeeQpz6+N0nFRu3A=","urls":"turns:globalturn.subspace.com:5349?transport=udp"},{"username":"1652378158:prj_2Gb69igJRbn5vCZXXfNu8I","credential":"BL5Sw/0WtcdKeeQpz6+N0nFRu3A=","urls":"turns:globalturn.subspace.com:5349?transport=tcp"},{"username":"1652378158:prj_2Gb69igJRbn5vCZXXfNu8I","credential":"BL5Sw/0WtcdKeeQpz6+N0nFRu3A=","urls":"turns:globalturn.subspace.com:443?transport=tcp"}],"ttl":86400}
 */

const iceServersConfig = [
    { urls: "stun:openrelay.metered.ca:80" },
    { "urls": "turn:numb.viagenie.ca", "username": "ak2816@rit.edu", "credential": "jyBQUMNLuSdxR8n" }
    // { "username": "1652934409:prj_2Gb69igJRbn5vCZXXfNu8I", "credential": "4IF0sEFeSHltOVUTxEZo+R+XUEE=", "urls": "turn:globalturn.subspace.com:3478?transport=udp" },
    // { "username": "1652934409:prj_2Gb69igJRbn5vCZXXfNu8I", "credential": "4IF0sEFeSHltOVUTxEZo+R+XUEE=", "urls": "turn:globalturn.subspace.com:3478?transport=tcp" },
    // { "username": "1652934409:prj_2Gb69igJRbn5vCZXXfNu8I", "credential": "4IF0sEFeSHltOVUTxEZo+R+XUEE=", "urls": "turns:globalturn.subspace.com:5349?transport=udp" },
    // { "username": "1652934409:prj_2Gb69igJRbn5vCZXXfNu8I", "credential": "4IF0sEFeSHltOVUTxEZo+R+XUEE=", "urls": "turns:globalturn.subspace.com:5349?transport=tcp" },
    // { "username": "1652934409:prj_2Gb69igJRbn5vCZXXfNu8I", "credential": "4IF0sEFeSHltOVUTxEZo+R+XUEE=", "urls": "turns:globalturn.subspace.com:443?transport=tcp" },
    // { "url": "turn:numb.viagenie.ca", "username": "ak2816@rit.edu", "credential": "jyBQUMNLuSdxR8n" }
];

// const iceServersConfig = [
//     {
//         urls: "stun:openrelay.metered.ca:80",
//     },
//     {
//         url: "turn:numb.viagenie.ca",
//         username: "ak2816@rit.edu",
//         credential: "jyBQUMNLuSdxR8n"
//     },
    // {
    //     url: 'turn:numb.viagenie.ca',
    //     username: 'webrtc@live.com',
    //     credential: 'muazkh',
    // },
    // {
    //     urls: "turns:openrelay.metered.ca:443",
    //     username: "openrelayproject",
    //     credential: "openrelayproject",
    // },
    // {
    //     urls: "turns:staticauth.openrelay.metered.ca:443",
    //     username: "openrelayproject",
    //     credential: "openrelayproject",
    // },
    // {
    //     urls: "turn:openrelay.metered.ca:80",
    //     username: "openrelayproject",
    //     credential: "openrelayproject",
    // },
    // {
    //     urls: "turn:openrelay.metered.ca:443",
    //     username: "openrelayproject",
    //     credential: "openrelayproject",
    // },
    // {
    //     urls: "turn:openrelay.metered.ca:443?transport=tcp",
    //     username: "openrelayproject",
    //     credential: "openrelayproject",
    // },
// ];

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

            socketRef.current.emit("join room", { roomID: roomID, isAsync: roomOptions.isAsync });
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

            socketRef.current.on("speechDataSync", payload => {
                if (payload) {
                    updateCaptionsSync(payload);
                }
            })

            socketRef.current.on("notification", payload => {
                if (payload) {
                    AppUtil.createNotification(payload.message, payload.type)
                } else {
                    AppUtil.createNotification("An error has occurred. Please contact administrator.")
                }
            });

            socketRef.current.on("syncSpeechStarted", payload => {
                isMuted.current = false;
                setAsrResultSync("");
            });

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

    function updateCaptionsSync(payload) {
        console.debug('Payload received');
        console.debug('Set ASR Result: ' + JSON.stringify(payload));
        setAsrResultSync(payload);
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
        // console.log('Room - microphone process');
        var left = e.inputBuffer.getChannelData(0);
        var left16 = convertFloat32ToInt16(left);
        socketRef.current.emit('binaryAudioData', left16);
    }

    function createPeer(userToSignal, callerID, stream) {
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

    function addPeer(incomingSignal, callerID, stream) {
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

    function onSyncSpeech() {
        socketRef.current.emit("syncSpeech");
    }

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
        isMuted.current = true;
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
