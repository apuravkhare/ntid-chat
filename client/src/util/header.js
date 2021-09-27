import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import "./header.css";

class Header extends React.Component {
    render() {
        return (
            <nav className="navbar navbar-expand-sm bg-primary navbar-dark navbar-custom">
                <div className="navbar-header">
                    <h2 className="navbar-brand">IP-CTS Research Tool</h2>
                </div>
            </nav>
        )
    }
}
export default Header;
