import { useEffect, useState } from "react";
import { Button, Modal } from "react-bootstrap";

const ErrorModal = ({msg, isDisplayed, onClose}) => {
  const errorMessage = msg;
  const [show, setShow] = useState(isDisplayed);

  const handleClose = () => {
    setShow(false);
    if (onClose) {
      onClose();
    }
  }
  // const handleShow = () => setShow(true);

  return (
    <Modal show={show} onHide={handleClose}>
      <Modal.Header>
        <Modal.Title>An error has occurred</Modal.Title>
      </Modal.Header>
      <Modal.Body>{errorMessage}</Modal.Body>
      <Modal.Footer>
        <Button variant="primary" onClick={handleClose}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default ErrorModal;