import React from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import { Container, Navbar } from 'react-bootstrap';
import "./footer.css";

function Footer() {
  return (
    <Navbar bg="primary" variant="dark" fixed="bottom">
        <Container>
          <p className="col-sm" style={{color: "white"}}>
            &copy;{new Date().getFullYear()} Center on Access Technology - NTID/RIT | All rights reserved
          </p>
        </Container>
    </Navbar>
      // <div className="container">
      //   <div className="bg-primary footer">
      //     <p className="col-sm">
      //       &copy;{new Date().getFullYear()} Center on Access Technology - NTID/RIT | All rights reserved
      //     </p>
      //   </div>
      // </div>
  );
}

export default Footer;
