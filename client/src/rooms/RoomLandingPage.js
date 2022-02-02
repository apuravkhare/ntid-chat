import React, { Component } from "react";
import { useHistory } from "react-router";
import { Button } from "react-bootstrap";

const RoomLandingPage = (props) => {

  const history = useHistory();
  function beginChat() {
    history.push({
      pathname: `/room/${props.match.params.roomID}`,
      search: props.location.search,
      // state: { roomID: props.match.params.roomID }
    })
    // props.history.push(`/room/${id}`);
  }

  // function getQueryParams(qs) {
  //   const parsed = parse(props.location.search.replace("?", ""));
  //   parsed.video = (parsed.video === "true");
  //   parsed.captions = (parsed.captions === "true");
  //   return [props.match.params.roomID, parsed];
  // }
  
  return (
    <div className="text-center welcome">
        <h3>VoIP Chat Application</h3>
        <p className="lead">This application requires access to your microphone to proceed with the study. Click on the 'Begin Study' button below to provide this access, and begin the study.</p>
        {/* <Redirect from = "/room_/:id" to = "/room/:id" />
        <Route path="/room/:id">

        </Route> */}
        <Button variant="success" onClick={beginChat}>
            Begin study
        </Button>
    </div>
  );
}
export default RoomLandingPage;
