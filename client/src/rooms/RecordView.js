import { useReactMediaRecorder } from "react-media-recorder";
import React, { useEffect, useRef, useState, } from "react";
import { saveAs } from "file-saver";
import styled from "styled-components";
import { Button, ButtonGroup, Dropdown, Form, FormCheck, Modal, OverlayTrigger, Table, ToggleButton, Tooltip } from 'react-bootstrap';


const RecordView = () => {
  const [blob,setBlob] = useState([])
  const { status, startRecording, stopRecording, mediaBlobUrl } = useReactMediaRecorder({ screen: true });

  function download(mediaBlobUrl){
  if (mediaBlobUrl && mediaBlobUrl != blob){
    setBlob(mediaBlobUrl)
    saveAs(mediaBlobUrl, "video.mp4");
  }
  }

  return (
    <div style={{margin:"10px"}}>
      <Button onClick={startRecording}>Start Recording</Button>
      <Button onClick={stopRecording}>Stop Recording</Button>
      <Button onClick={()=>download(mediaBlobUrl)}>download</Button>
    </div>
  );
};

export default RecordView