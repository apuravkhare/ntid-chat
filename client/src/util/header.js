import React from 'react';
import "./header.css";
import { Container, Navbar } from 'react-bootstrap';

class Header extends React.Component {
    render() {
        return (
            <Navbar bg="primary" variant="dark">
                <Container>
                    <Navbar.Brand>IP-CTS Research Tool</Navbar.Brand>
                    <Navbar.Text>
                        &copy;{new Date().getFullYear()} Center on Access Technology - NTID/RIT | All rights reserved
                    </Navbar.Text>
                </Container>
            </Navbar>
            // <nav className="navbar navbar-expand-sm bg-primary navbar-dark navbar-custom">
            //     <div className="navbar-header">
            //         <h2 className="navbar-brand">IP-CTS Research Tool</h2>
            //     </div>
            // </nav>
        )
    }
}
export default Header;
