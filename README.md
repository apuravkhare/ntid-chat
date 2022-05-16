- [Introduction](#introduction)
- [Architecture and workflow](#architecture-and-workflow)
- [Developer Setup](#developer-setup)
  - [Code](#code)
  - [Google Cloud account with a speech-to-text project](#google-cloud-account-with-a-speech-to-text-project)
  - [Firebase account with a Firestore database](#firebase-account-with-a-firestore-database)
  - [Running the application locally](#running-the-application-locally)
    - [Server](#server)
    - [To run the server, from the project root, execute:](#to-run-the-server-from-the-project-root-execute)
    - [Client](#client)
  - [Deployment](#deployment)
- [Developer Notes](#developer-notes)
  - [Front-end design](#front-end-design)
  - [Back-end design](#back-end-design)
  - [Third-party APIs](#third-party-apis)
    - [STUN/TURN servers](#stunturn-servers)

# Introduction
Audio/video chat application with real-time captioning. It can be used to simulate either phone or video conversations.
Additional features allow editing messages that have been sent, logging of the messages confidence levels, and creating full audio/video recordings of the conversations. The application transcribes audio in real-time and utilizes Google's speech-to-text engine to separate phrases to make the transcriptions more understandable. The app is deployed [here](https://ntidchat.herokuapp.com/)

# Architecture and workflow
The application has a ReactJS front-end and a Node.js back-end, both written in vanilla JavaScript.

Participants communicate with each other in "rooms" created by administrators. Each room is identified with a unique key, which is essentially a unique URL. The key can be embellished with permissions for the users in that room.

The front-end streams audio to the back-end and other participants using WebRTC, using the [simple-peer](https://github.com/feross/simple-peer) library APIs.

The back-end connects to Google Cloud's [speech-to-text engine](https://cloud.google.com/speech-to-text/docs) to [transcribe streaming audio](https://cloud.google.com/speech-to-text/docs/streaming-recognize) in real-time.

The text transcripts are relayed to the participants using web sockets as they are created.

For logging, the back-end connects to a Firebase [Firestore database](https://firebase.google.com/docs/firestore/). The store is updated in real-time, and the logs are made available for download to administrators as CSV files.


# Developer Setup
## Code
The codebase can be setup and run from a Windows/Mac/Linux machine. Setting up the development environment will require setting environment variables, which may require administrative privileges on the development machine.

The latest versions of [Node.js](https://nodejs.org/en/) and [ReactJS](https://reactjs.org/) are required to be installed on the machine. The application is currently on **Node.js v7.8.0** and **ReactJS v17.0.2**. Upgrading to newer versions may require updating the library dependencies accordingly, so it is recommended to test all application workflows when upgrading.

It is recommended to use [Visual Studio Code](https://code.visualstudio.com/), and its integrated source control features (or [GitHub desktop](https://desktop.github.com/)) to setup the development environment.

The application uses third-party APIs, and the accounts are needed to run the application in a development environment are described below.

## Google Cloud account with a speech-to-text project
Setup your google cloud account with a speech-to-text project, download credentials for your account, and set them up on your local machine. More info [here](https://cloud.google.com/speech-to-text/docs/quickstart-client-libraries).

This setup will require setting environment variables, which would need appropriate administrator permissions on the development machine.

## Firebase account with a Firestore database
Setup a firebase project with your google account, and add a Firestore database to it. More info [here](https://firebase.google.com/docs/firestore/quickstart?hl=en&authuser=1).

Add an empty collection named "**transcript-logs**" to this database.

## Running the application locally

### Server
To install the dependencies, from the project root, execute:
```
npm install
```

### To run the server, from the project root, execute:
```
npm start
```

### Client
In a separate terminal instance, from the project root, navigate to the client folder:
```
cd client
```

To install the dependencies, execute:
```
npm install
```

To run the client, execute:
```
npm start
```


## Deployment
The application is deployed on [Heroku](https://www.heroku.com/), using the Heroku CLI.

Heroku CLI should be installed and set up on the development machine to perform deployments. The process is described [here](https://devcenter.heroku.com/articles/git).

**Note**: Heroku reported a security breach in May 2022, and temporarily disabled GitHub continuous integration on their platform. This required us to switch to using Heroku CLI for deploying the application. It requires additional setup described [here](https://devcenter.heroku.com/articles/git). It'd be preferable to switch back to continuous integration with GitHub once Heroku brings the feature back.

In essence, an additional command needs to be executed in a terminal instance from the project's root folder, after committing the code changes:
```
git push heroku main
```

# Developer Notes
This section contains notes about practices to keep in mind during development and deployment.

## Front-end design
The application is designed to run on desktop and mobile platforms, and implements responsive design across all pages. Familiarize yourself with your browser's developer tools, they are very helpful in understanding and debugging the user interface.

The application heavily relies on Bootstrap's components, classes, and layout practices to achieve this. When developing the UI, it is recommended to follow these guidelines:
- Look for reusable components from Bootstrap. They are sufficient for our requirements in most cases.
- Do not hardcode widths/heights/margins of HTML elements in pixels. These won't scale well across different devices (and orientations). Bootstrap provides many [classes for responsive design](https://getbootstrap.com/docs/3.4/css/) that we use across the UI, try reusing them where applicable to keep the UI uniform.
- Prefer defining and using CSS classes for styling components unless the styles are very trivial.
- Test all UI changes using the "[Responsive Design Mode](https://firefox-source-docs.mozilla.org/devtools-user/responsive_design_mode/index.html)"/"[Device Toolbar](https://developer.chrome.com/docs/devtools/device-mode/)" features of the developer tools in Firefox/Chrome. It scales the display to those of standard devices (iPad/iPhone/Samsung) and is of great help during the development process.
  - Note that these developer tool features only change the resolution; there are certain CSS classes and JavaScript events that do not work on certain devices/browsers. Always check for compatibility on the MDN docs, like [this one](https://developer.mozilla.org/en-US/docs/Web/CSS/text-decoration-thickness#browser_compatibility).
- Keep user friendliness in mind. Add tooltips and appropriate priority indicators (success/info/warning) to buttons and other components so that their purpose is clear.


## Back-end design


## Third-party APIs
The application uses various third-party APIs that may need debugging. These are some important areas:

### STUN/TURN servers
These are relay servers that help establish a connection between the peers for transmitting audio/video signal. The config is added as a list of servers in Room.js.

As of May 2022, we've switched to using the free servers provided by [Subspace](https://subspace.com/pricing/webrtc-cdn).

