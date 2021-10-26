import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import Peer from "simple-peer";
import styled from "styled-components";
import "../util/room.css";
import { parse } from 'querystring';
import { faCommentAlt } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { OverlayTrigger, Popover } from "react-bootstrap";
import TextChat from "./TextChat";
import ScrollingCaption from "./ScrollingCaption";
import ErrorModal from "../util/ErrorModal";

const Container = styled.div`
    padding: 20px;
    display: flex;
    height: 80vh;
    width: 90%;
    margin: auto;
    flex-wrap: wrap;
`;

const StyledVideo = styled.video`
    height: 40%;
    width: 50%;
`;

const Caption = styled.p`
    font-size: x-large;
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
        <StyledVideo playsInline autoPlay ref={ref} />
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
    const [peers, setPeers] = useState([]);
    const [captions, setCaptions] = useState("");
    const [asrResult, setAsrResult] = useState();
    const [errorMsg, setErrorMsg] = useState("");
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
        console.log('Room - useEffect');
        socketRef.current = io.connect("/");
        AudioContext.current = window.AudioContext || window.webkitAudioContext;
        context.current = new AudioContext.current();
        processor.current = context.current.createScriptProcessor(2048, 1, 1);

        navigator.mediaDevices.getUserMedia({ video: videoConstraints, audio: audioConstraints }).then(stream => {
            audioStream.current = new MediaStream(stream.getAudioTracks());
            // console.log("SETTINGS");
            // console.log(audioStream.current.getAudioTracks()[0].getSettings());
            input.current = context.current.createMediaStreamSource(audioStream.current);
            input.current.connect(processor.current);

            processor.current.onaudioprocess = function (e) {
                microphoneProcess(e);
            };

            // if (roomOptions.video) {
            userVideo.current.srcObject = stream;
            
            // check if this can be used for echo cancellation
            userVideo.current.volume = 0;
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
                setErrorMsg("Room full, please contact administrator.");
                console.log("Room full, please try later!");
            });
        })
    }, []);

    function getQueryParams(qs) {
        const parsed = parse(props.location.search.replace("?", ""));
        parsed.video = (parsed.video === "true");
        parsed.captions = (parsed.captions === "true");
        return [props.match.params.roomID, parsed];
        // return [props.location.state.roomID, parsed];
    }

    function updateCaptions(payload) {
        console.log('Payload received');

        // TODO: choose item with max alt.confidence here. (0.0 indicates confidence was not set)
        if (roomOptions.video) {
            var newTranscript = payload.results[0].alternatives.map(alt => alt.transcript).join(" ");
            var captionsUpdated = (captions.length > 100) ? newTranscript : captions + newTranscript; // newTranscript;
            console.log(payload);
            setCaptions(captionsUpdated);
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

    function renderVideoMode() {
        return (
            <Container>
                {/* User's own video */}
                <StyledVideo muted ref={userVideo} autoPlay playsInline />
    
                {/* All other videos */}
                {roomOptions.video && peers.map((peer, index) => {
                    return (
                        <Video key={index} peer={peer} />
                    );
                })}
                <Caption>
                    {captions}
                </Caption>
                {/* <OverlayTrigger
                  trigger="click"
                  key="top"
                  placement="top"
                  overlay={<Popover id={`popover-positioned-top`} style={{height: "50%", width: "50%"}}>
                                <Popover.Header as="h3">Chat</Popover.Header>
                                    <Popover.Body>
                                      <TextChat></TextChat>
                                    </Popover.Body>
                            </Popover>}>
                    <span className="chat-fa-text-chat-icon" >
                        <FontAwesomeIcon icon={faCommentAlt} className="chat-fa-icon" size="lg"  />
                        <span className="lead" style={{paddingLeft: "0.5em"}}>Chat</span>
                    </span>
                </OverlayTrigger> */}
            </Container>
        );
    }

    function renderCaptionsMode() {
        return (
            <Container>
                {/* Still transmitting user's video to participants who have access to see it */}
                <StyledVideo muted ref={userVideo} autoPlay playsInline style={{ height: "0px", width: "0px" }} />
                <ScrollingCaption captionCount={3} displayCaptions={asrResult}>
                </ScrollingCaption>
            </Container>
        );
    }

    return (
        <>
            {roomOptions.video ? renderVideoMode() : renderCaptionsMode()}
            {errorMsg ? <ErrorModal msg={errorMsg} isDisplayed={!!errorMsg} onClose={() => setErrorMsg("")}></ErrorModal> : <></>}
        </>
    );
};

export default Room;
