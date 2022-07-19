import React from 'react';
 
import Clock from 'react-live-clock';

const Time = (props) => {
  const isAdmin = props.parsed.admin
  return (
    <Clock style = {{visibility: isAdmin == 'true'? "visible": "hidden", color : 'white', margin: "5px"}}format={'HH:mm:ss'} ticking={true} timezone={'US/Eastern'} />
  )
}
 
export default Time