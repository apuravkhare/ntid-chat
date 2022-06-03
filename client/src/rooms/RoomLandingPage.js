import React, { Component, useEffect, useRef, useState } from "react";
import { useHistory } from "react-router";
import { Button, Card, Form, ListGroup, ListGroupItem } from "react-bootstrap";
import AppUtil from "../util/AppUtil";
import AppConstants from "../AppConstants";
import AudioVisualizer from "../util/AudioVisualizer";

/**
 * Component for the landing page for a participant to converse in.
 * @param {*} props The component props.
 * @returns HTML for the landing page.
 */
const RoomLandingPage = (props) => {

  const [videoDevices, setVideoDevices] = useState();
  const [audioInputDevices, setAudioInputDevices] = useState();
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [selectedVideoDevice, setSelectedVideoDevice] = useState();
  const [selectedAudioDevice, setSelectedAudioDevice] = useState();
  const [roomID, roomOptions] = AppUtil.getQueryParams(props);
  const userVideo = useRef();
  const userAudio = useRef();
  const userAudioStream = useRef();

  const history = useHistory();

  /**
   * Changes the current location to the room page.
   */
  function beginChat() {
    history.push({
      pathname: `/room/${props.match.params.roomID}`,
      search: props.location.search,
      state: { selectedAudioDevice: selectedAudioDevice, selectedVideoDevice: selectedVideoDevice }
      // state: { roomID: props.match.params.roomID }
    })
    // props.history.push(`/room/${id}`);
  }

  // useEffect(() => {
  //   return () => {
  //     window.stream.getTracks().forEach(track => track.stop());
  //   }
  // }, [])

  /**
   * Helper function to display a default error message on this page.
   * @param {*} error The error message to log.
   */
  function showErrorMessage(error) {
    console.error(error);
    AppUtil.createNotification("An error occurred while attempting to access your microphone/camera. Please rejoin this room or contact administrator.", AppConstants.notificationType.error);
  }

  /**
   * Callback to use after permissions to the audio/video devices have been obtained.
   * @param {*} devices The devices that the permissions are obtained for.
   */
  function gotDevices(devices) {
    const filteredVideoDevices = devices.filter(device => device.kind === 'videoinput');
    setVideoDevices(filteredVideoDevices);

    const filteredAudioDevices = devices.filter(device => device.kind === 'audioinput');
    setAudioInputDevices(filteredAudioDevices);
  }

  /**
   * Shows the configuration screen.
   */
  function configureMediaDevices() {
    navigator.mediaDevices.enumerateDevices().then(devices => {
      gotDevices(devices);
      setIsConfiguring(true);
      changeInputs(audioInputDevices && audioInputDevices[0].deviceId, videoDevices && videoDevices[0].deviceId);
    }).catch(showErrorMessage);
  }

  /**
   * Gets the list of available video devices.
   * @returns The available video devices, as a list of HTML elements for a HTML drop down.
   */
  function getVideoDeviceOptions() {
    if (videoDevices) {
      return videoDevices.map((device, index) => <option key={index} value={device.deviceId}> {!!device.label ? device.label : "Camera " + (index + 1)} </option>);
    } else {
      showErrorMessage();
    }
  }

  /**
   * Gets the list of available audio devices.
   * @returns The available audio devices, as a list of HTML elements for a HTML drop down.
   */
  function getAudioDeviceOptions() {
    if (audioInputDevices) {
      return audioInputDevices.map((device, index) => <option key={index} value={device.deviceId}> {!!device.label ? device.label : "Microphone " + (index + 1)} </option>);
    } else {
      showErrorMessage();
    }
  }

  /**
   * Changes the audio/video device in use.
   * @param {*} audioDeviceId The ID of the selected audio device.
   * @param {*} videoDeviceId The ID of the selected video device.
   */
  function changeInputs(audioDeviceId, videoDeviceId) {
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

      if (roomOptions.video) {
        userVideo.current.srcObject = stream;
      }
      
      userAudioStream.current = new MediaStream(stream.getAudioTracks());
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

  /**
   * Generates HTML for the configuration screen.
   * @returns The HTML for the configuration screen.
   */
  function renderConfigScreen() {
    return (
      <Card className="w-75 m-auto">
        <Card.Body>
          <Card.Title>Configure inputs</Card.Title>
          <Card.Subtitle className="mb-2 text-muted">You may be asked to grant this application permissions to your audio/video devices.
          {/* Please allow those and select the audio/video devices that you'd like to use. */}
          </Card.Subtitle>
          <ListGroup>
            {roomOptions.video &&
              <ListGroupItem>
                <div className="h-25 m-auto" >
                  <video className="h-100" style={{ maxHeight: "250px" }} ref={userVideo} muted playsInline autoPlay></video>
                </div>
                <div>
                  <Form.Label htmlFor="app-select-video" >Select Video:</Form.Label>
                  <Form.Select id="app-select-video" onChange={e => changeInputs(null, e.target.value)} >
                    {getVideoDeviceOptions()}
                  </Form.Select>
                </div>
              </ListGroupItem>
            }
            <ListGroupItem>
              <audio playsInline autoPlay ref={userAudio}></audio>
              <div style={{height: "10%"}} >
                <AudioVisualizer audioStream={userAudioStream.current} />
              </div>
              <div>
                <Form.Label htmlFor="app-select-audio" >Select Audio:</Form.Label>
                <Form.Select id="app-select-audio" onChange={e => changeInputs(e.target.value, null)} >
                  {getAudioDeviceOptions()}
                </Form.Select>
              </div>
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

  /**
   * Generates HTML for the landing page.
   * @returns The HTML for the landing page.
   */
  function renderHomeScreen() {
    return (
      <div className="text-center welcome">
        <h3>VoIP Chat Application</h3>
        <p className="lead">This application requires access to your microphone to proceed with the study.</p>
        {/* <p className="lead">Click on the 'Begin Study' button below to provide this access, and begin the study.</p> */}
        <span className="lead">Click on the </span><Button variant="success" size="sm" disabled>Begin study</Button><span className="lead"> button below to provide this access, and begin the study.</span>
        <br/>
        <span className="lead">Click on the </span><Button variant="outline-primary" size="sm" disabled>Configure</Button><span className="lead"> button below to test or change your microphone.</span>
        <br/>
        <br/>

        <Button className="mx-2" variant="outline-primary" onClick={configureMediaDevices}>
          Configure
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
