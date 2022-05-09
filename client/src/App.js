import React from 'react';
import { BrowserRouter, Route, Switch } from "react-router-dom";
import CreateRoom from "./rooms/CreateRoom";
import Room from "./rooms/Room";
import RoomLandingPage from "./rooms/RoomLandingPage";
import ExitRoom from "./rooms/ExitRoom";
import Header from './util/header';
import Footer from './util/footer';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Moment from "react-moment";
import 'moment-timezone';

function App() {
  return (
    <>
    <BrowserRouter>
      <Header />
      <Switch>
        <Route path="/" exact component={CreateRoom} />
        <Route path="/room_/:roomID" component={RoomLandingPage} />
        <Route path="/room/:roomID" component={Room} />
        <Route path="/ExitRoom" component={ExitRoom} />
      </Switch>
      {/* <Footer /> */}
    </BrowserRouter>
    <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="colored" />
    </>
  );
}

export default App;
