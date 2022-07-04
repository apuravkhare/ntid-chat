import { useReactMediaRecorder } from "react-media-recorder";
import React, { useState } from "react";
import { saveAs } from "file-saver";
import styled from "styled-components";
import { Button } from 'react-bootstrap';

const buttonStyle = {
  margin: "2px"
};

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
    <div style={{margin:"10px", display: "flex" }}>
      <Button style={buttonStyle} onClick={startRecording}>Start Recording</Button>
      <Button style={buttonStyle}  onClick={stopRecording}>Stop Recording</Button>
      <Button style={buttonStyle} onClick={()=>download(mediaBlobUrl)}>download</Button>
    </div>
  );
};

export default RecordView