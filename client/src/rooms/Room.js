import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import Peer from "simple-peer";
import styled from "styled-components";
import "../util/room.css";
import { parse } from 'querystring';
import { faCommentAlt, faMicrophone,faTextHeight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Col, Container, Navbar, Row } from "react-bootstrap";
import TextChat from "./TextChat";
import ScrollingCaption from "./ScrollingCaption";
import ErrorModal from "../util/ErrorModal";


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

const Video = (props) => {
    const ref = useRef();

    useEffect(() => {
        props.peer.on("stream", stream => {
            ref.current.srcObject = stream;
        })
    }, []);

    return (
        <StyledVideo playsInline autoPlay ref={ref} >
        </StyledVideo>
        
    );
}


const videoConstraints = {
    height: window.innerHeight / 2,
    width: window.innerWidth / 2
};

const audioConstraints = {
    channelCount: 1
}

const Room = (props) => {
    const [fontSize,setFontSize] = useState(16);
    const [peers, setPeers] = useState([]);
    const [captions, setCaptions] = useState("");
    const [asrResult, setAsrResult] = useState();
    const [errorMsg, setErrorMsg] = useState("");
    const [editedMessage, setEditedMessage] = useState("");
    const isMuted = useRef(false);
    // const [canBeginChat, setCanBeginChat] = useState(false);
    const socketRef = useRef();
    const userVideo = useRef();
    const peersRef = useRef([]);
    const [roomID, roomOptions] = getQueryParams();
    let AudioContext = useRef();
    let context = useRef();
    let processor = useRef();
    let audioStream = useRef();
    let input = useRef();
    
    useEffect(() => {
        const hasGetUserMedia = !!(navigator.getUserMedia || navigator.webkitGetUserMedia ||
            navigator.mozGetUserMedia || navigator.msGetUserMedia || (navigator.mediaDevices && navigator.mediaDevices.getUserMedia));

        if (!hasGetUserMedia) {
            setErrorMsg("This browser does not support streaming audio/video.");
            return;
        }
        
        console.log('Room - useEffect');
        socketRef.current = io.connect("/");
        AudioContext.current = window.AudioContext || window.webkitAudioContext;
        context.current = new AudioContext.current();
        
        try {
            processor.current = context.current.createScriptProcessor(2048, 1, 1);
        } catch {
            console.error('Error creating scriptProcessorNode');
        }

        navigator.mediaDevices.getUserMedia({ video: videoConstraints, audio: audioConstraints }).then(stream => {
            audioStream.current = new MediaStream(stream.getAudioTracks());
            // console.log("SETTINGS");
            // console.log(audioStream.current.getAudioTracks()[0].getSettings());
            input.current = context.current.createMediaStreamSource(audioStream.current);
            input.current.connect(processor.current);
            processor.current.connect(context.current.destination);

            processor.current.onaudioprocess = function (e) {
                if (!isMuted.current && roomOptions.generateCaptions) {
                    microphoneProcess(e);
                }
            };

            // if (roomOptions.video) {
            userVideo.current.srcObject = stream;
            
            // check if this can be used for echo cancellation
            // userVideo.current.volume = 0;
            // }

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
                // console.log(JSON.stringify(payload));
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

            socketRef.current.on("room full", payload => {
                if (payload && payload.msg) {
                    setErrorMsg(payload.msg);
                    console.log(payload.msg);
                } else {
                    setErrorMsg("Room full, please contact administrator.");
                    console.log("Room full, please try later!");
                }
            });
        })
    }, []);

    function increaseSize(){
        if (fontSize >= 22) {
            setFontSize(22)
        }
        else{
            setFontSize(fontSize+2)
        }
        console.log(fontSize)
    }

    function getQueryParams(qs) {
        const parsed = parse(props.location.search.replace("?", ""));
        parsed.video = (parsed.video === "true");
        parsed.showCaptions = (parsed.captions === "true");
        parsed.identifySpeakers = (parsed.idSpeaker === "true");
        parsed.generateCaptions = (parsed.genCaptions === "true");
        return [props.match.params.roomID, parsed];
        // return [props.location.state.roomID, parsed];
    }

    function updateCaptions(payload) {
        console.log('Payload received');

        // TODO: choose item with max alt.confidence here. (0.0 indicates confidence was not set)
        if (roomOptions.video) {
            var newTranscript = payload.results[0].alternatives.map(alt => alt.transcript).join(" ");
            // var captionsUpdated = (captions.length > 100) ? newTranscript : captions + newTranscript; // newTranscript;
            var captionsUpdated = "Speaker " + payload.speakerIndex + ": " + newTranscript;
            console.log(payload);
            // setCaptions(captionsUpdated);
            setAsrResult(payload);
        } else {
            console.log('Set ASR Result: ' + JSON.stringify(payload));
            setAsrResult(payload);
        }
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
                        <Col xs  lg="9">
                            <TextChat value = {editedMessage} onSend={sendTypedMessage}></TextChat>
                        </Col>
                        <Col>
                            <span className={isMuted.current ? "chat-fa-text-chat-icon" : "chat-fa-text-chat-icon-talking"} onClick={toggleSpeech} >
                                <FontAwesomeIcon icon={faMicrophone} className="chat-fa-icon" size="lg" />
                                <span className="lead" style={{padding: "0.5em"}}>Talk</span>
                            </span>
                            <span>
                                <button className="chat-fa-text-chat-icon" onClick = {increaseSize}>
                                    <FontAwesomeIcon icon={faTextHeight} size="lg"  />
                                </button>
                            </span>
                        </Col>
                    </Row>
                </Container>
            </Navbar>);
    }

    function renderVideo() {
        return (
            <div style={{display:!!roomOptions.video ? "inherit":"none"}}>
                {/* User's own video */}
                <Col className="h-100">
                    <StyledVideo muted ref={userVideo} autoPlay playsInline />
                </Col>
                {/* All other videos */}
                {peers.map((peer, index) => {
                    return (
                        <Col className="h-100"><Video key={index} peer={peer} /></Col>
                    );
                })}
            </div>
        );
    }

    function sendTypedMessage(message) {
        console.log("Message: " + message);
        socketRef.current.emit('textMessage', message);
    }

    function toggleSpeech() {
        console.log('toggling isMuted to: ' + (!isMuted.current));
        isMuted.current = !isMuted.current;
    }

    function onClickEditHandler(msg){
        setEditedMessage(msg)
        console.log("room")
    }

    return (
        <>
        <Container className="h-100" style={{overflow:"auto"}}>
            <Row className="align-items-center" style={{boxShadow:"0px 2px 5px #999999", height: !!roomOptions.showCaptions ? "33%" : "75%", overflow:"auto"}} hidden={!roomOptions.video}>
                {/* {roomOptions.video ? renderVideo() : (<StyledVideo muted ref={userVideo} autoPlay playsInline style={{ height: "0px", width: "0px" }} />)} */}
                {renderVideo()}
            </Row>
            <Row hidden={roomOptions.showCaptions === false} className="align-items-center" style={{height: roomOptions.video ? "50%" : "75%"}}>
                <Col className="h-100">
                    <ScrollingCaption onEditClick = {onClickEditHandler}style = {{  fontSize:  `${fontSize}px`}} currentUserId={socketRef.current && socketRef.current.id} displayCaptions={asrResult} identifySpeakers={roomOptions.identifySpeakers} />
                </Col>
            </Row>
        </Container>
        {renderOptions()}
        {errorMsg ? <ErrorModal msg={errorMsg} isDisplayed={!!errorMsg} onClose={() => setErrorMsg("")}></ErrorModal> : <></>}
        </>
    );
};

export default Room;
