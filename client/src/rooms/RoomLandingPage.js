import React, { Component, useRef, useState } from "react";
import { useHistory } from "react-router";
import { Button, Card, Form, ListGroup, ListGroupItem } from "react-bootstrap";
import AppUtil from "../util/AppUtil";
import AppConstants from "../AppConstants";

const RoomLandingPage = (props) => {

  const [videoDevices, setVideoDevices] = useState();
  const [audioInputDevices, setAudioInputDevices] = useState();
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [selectedVideoDevice, setSelectedVideoDevice] = useState();
  const [selectedAudioDevice, setSelectedAudioDevice] = useState();
  const userVideo = useRef();

  const history = useHistory();
  function beginChat() {
    history.push({
      pathname: `/room/${props.match.params.roomID}`,
      search: props.location.search,
      // state: { roomID: props.match.params.roomID }
    })
    // props.history.push(`/room/${id}`);
  }

  function showErrorMessage(error) {
    console.error(error);
    AppUtil.createNotification("An error occurred while attempting to access your microphone/camera. Please rejoin this room or contact administrator.", AppConstants.notificationType.error);
  }

  function gotDevices(devices) {
    const filteredVideoDevices = devices.filter(device => device.kind === 'videoinput');
    setVideoDevices(filteredVideoDevices);

    const filteredAudioDevices = devices.filter(device => device.kind === 'audioinput');
    setAudioInputDevices(filteredAudioDevices);
  }

  function configureMediaDevices() {
    navigator.mediaDevices.enumerateDevices().then(devices => {
      gotDevices(devices);
      setIsConfiguring(true);
      // changeInputs(audioInputDevices && audioInputDevices[0].deviceId, videoDevices && videoDevices[0].deviceId);
    }).catch(showErrorMessage);
  }

  function getVideoDeviceOptions() {
    if (videoDevices) {
      return videoDevices.map((device, index) => <option key={index} value={device.deviceId}> {!!device.label ? device.label : "Camera " + (index + 1)} </option>);
    } else {
      showErrorMessage();
    }
  }

  function getAudioDeviceOptions() {
    if (audioInputDevices) {
      return audioInputDevices.map((device, index) => <option key={index} value={device.deviceId}> {!!device.label ? device.label : "Microphone " + (index + 1)} </option>);
    } else {
      showErrorMessage();
    }
  }

  function changeInputs(audioDeviceId, videoDeviceId) {
    console.log("Change Inputs: ");
    console.log(audioDeviceId);
    console.log("Change Inputs: " + videoDeviceId);

    if (window.stream) {
      window.stream.getTracks().forEach(track => { track.stop(); });
    }

    const audioSource = audioDeviceId || selectedAudioDevice;
    const videoSource = videoDeviceId || selectedVideoDevice;

    const constraints = {
      audio: {deviceId: audioSource ? { exact: audioSource } : undefined},
      video: {deviceId: videoSource ? { exact: videoSource } : undefined}
    };

    navigator.mediaDevices.getUserMedia(constraints).then(stream => {
      window.stream = stream; // make stream available to console
      userVideo.current.srcObject = stream;
      // Refresh button list in case labels have become available
      return navigator.mediaDevices.enumerateDevices();
    }).then(devices => gotDevices(devices))
    .catch(showErrorMessage);

    if (videoDeviceId) {
      setSelectedVideoDevice(videoDeviceId);
    }

    if (audioDeviceId) {
      setSelectedAudioDevice(audioDeviceId);
    }
  }

  function renderConfigScreen() {
    return (
      <Card className="h-75 w-75 m-auto">
        <Card.Body>
          <Card.Title>Configure inputs</Card.Title>
          <Card.Subtitle className="mb-2 text-muted">You may be asked to grant this application permissions to your audio/video devices. Please allow those and select the audio/video devices that you'd like to use.</Card.Subtitle>
          <ListGroup>
            <ListGroupItem>
              <div className="w-50 m-auto">
                <video className="w-100" ref={userVideo} muted playsInline autoPlay></video>
              </div>
              <div>
                <Form.Label htmlFor="app-select-video" >Select Video:</Form.Label>
                <Form.Select id="app-select-video" onChange={e => changeInputs(null, e.target.value)} >
                  {getVideoDeviceOptions()}
                </Form.Select>
              </div>
            </ListGroupItem>
            <ListGroupItem>
              <Form.Label htmlFor="app-select-audio" >Select Audio:</Form.Label>
              <Form.Select id="app-select-audio" onChange={e => changeInputs(e.target.value, null)} >
                {getAudioDeviceOptions()}
              </Form.Select>
            </ListGroupItem>
          </ListGroup>

          <span className="float-end">
            <Button className="mx-1" variant="secondary" onClick={() => setIsConfiguring(false)}>
              Cancel
            </Button>
            <Button className="mx-0" variant="success" onClick={beginChat}>
              Begin study
            </Button>
          </span>
        </Card.Body>
      </Card>
    )
  }

  function renderHomeScreen() {
    return (
      <div className="text-center welcome">
        <h3>VoIP Chat Application</h3>
        <p className="lead">This application requires access to your microphone to proceed with the study. Click on the 'Begin Study' button below to provide this access, and begin the study.</p>
        {/* <Redirect from = "/room_/:id" to = "/room/:id" />
          <Route path="/room/:id">
  
          </Route> */}
        <Button className="mx-2" variant="secondary" onClick={configureMediaDevices} >
          Configure audio/video
        </Button>
        <Button variant="success" onClick={beginChat}>
          Begin study
        </Button>
      </div>
    );
  }

  return isConfiguring ? renderConfigScreen() : renderHomeScreen();

}
export default RoomLandingPage;
