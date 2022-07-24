import React from 'react';
 
import Clock from 'react-live-clock';

const Time = (props) => {
  const isAdmin = props.parsed.admin
  const genCaptions = props.parsed.genCaptions
  return (
    <Clock style = {{visibility: (isAdmin == 'true' || genCaptions == "true")? "visible": "hidden", color : 'white', margin: "5px"}}format={'HH:mm:ss'} ticking={true} timezone={'US/Eastern'} />
  )
}
 
export default Time