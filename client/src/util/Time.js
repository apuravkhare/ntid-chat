import React from 'react';
 
import Clock from 'react-live-clock';

export default class Time extends React.Component {
    render() {
      return (
        <Clock style = {{color : 'white', margin: "5px"}}format={'HH:mm:ss'} ticking={true} timezone={'US/Eastern'} />
      )
    }
}
 
