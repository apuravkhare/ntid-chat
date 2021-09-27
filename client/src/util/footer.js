import React from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import "./footer.css";

function Footer() {
  return (
      <div className="container">
        <div className="bg-primary footer">
          <p className="col-sm">
            &copy;{new Date().getFullYear()} Center on Access Technology - NTID/RIT | All rights reserved
          </p>
        </div>
      </div>
  );
}

export default Footer;
