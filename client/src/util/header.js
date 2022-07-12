import React from 'react';
import "./header.css";
import { Container, Navbar,Nav,NavDropdown} from 'react-bootstrap';
import RecordView from "./RecordView";
import Time from "./Time";
class Header extends React.Component {
    render() {
        return (
            <Navbar bg="dark" variant="dark">
                <Container>
                    <Navbar.Brand>IP-CTS Research Tool</Navbar.Brand>
                    <Navbar.Toggle aria-controls="basic-navbar-nav" />
                    <Navbar.Collapse id="basic-navbar-nav">
                    <Nav className="me-auto">
                    <NavDropdown title="Options" id="basic-nav-dropdown">
                    <NavDropdown.Item href="#action/3.1"><RecordView/></NavDropdown.Item>
                    </NavDropdown>
                </Nav>
                </Navbar.Collapse>
                    {/* <Navbar.Text>
                        &copy;{new Date().getFullYear()} Center on Access Technology - NTID/RIT | All rights reserved
                    </Navbar.Text> */}
                </Container>
                <Time/>
            </Navbar>
        )
    }
}
export default Header;
