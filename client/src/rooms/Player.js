import React, { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faVolumeMute,faVolumeDown, faVolumeUp } from '@fortawesome/free-solid-svg-icons';
const Player = (props) => {
    const [volume, setVolume] = useState(30)
    const [mute, setMute] = useState(false) 
    const MAX = 10;
    const getBackgroundSize = () => {
	    return {
		    backgroundSize: `${(volume * 100) / MAX}% 100%`,
            margin: "5px"
	    };
};
    function VolumeBtns(){
        return mute
            ? <FontAwesomeIcon icon={faVolumeMute} size="lg" style={{color: 'black', '&:hover': {color: 'white'}}} onClick={() => setMute(!mute)} />
            : <FontAwesomeIcon icon={faVolumeDown} size="lg" style={{color: 'black', '&:hover': {color: 'white'}}} onClick={() => setMute(!mute)} />
    }
    return (
        <div>
            <stack direction = "row"  spacing = {2} style = {{display: 'flex',alignItems: 'center' ,justifyContent: 'center',margin:'2px'}}>
            <VolumeBtns />
            <input
	            type="range"
	            min="0"
	            max={MAX}
	            onChange={(e) => setVolume(e.target.value)}
	            style={getBackgroundSize()}
	            value={volume}
            />
            </stack>
        </div>
    )
}
export default Player