import React from 'react';
import { BrowserRouter, Route, Switch } from "react-router-dom";
import CreateRoom from "./rooms/CreateRoom";
import Room from "./rooms/Room";
import RoomLandingPage from "./rooms/RoomLandingPage";
import Header from './util/header';
import Footer from './util/footer';

function App() {
  return (
    <BrowserRouter>
      <Header />
      <Switch>
        <Route path="/" exact component={CreateRoom} />
        <Route path="/room_/:roomID" component={RoomLandingPage} />
        <Route path="/room/:roomID" component={Room} />
      </Switch>
      <Footer />
    </BrowserRouter>
  );
}

export default App;
