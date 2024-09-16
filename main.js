const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');

const peerConnectionConfig = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
};

const ws = new WebSocket('ws://localhost:3000');
let localStream;
let peerConnection;

// Get access to the user's camera and microphone
navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    .then(stream => {
        localStream = stream;
        localVideo.srcObject = stream;

        peerConnection = new RTCPeerConnection(peerConnectionConfig);
        peerConnection.addStream(stream);

        peerConnection.onaddstream = (event) => {
            remoteVideo.srcObject = event.stream;
        };

        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                ws.send(JSON.stringify({ type: 'candidate', candidate: event.candidate }));
            }
        };

        ws.onmessage = (event) => {
            const message = JSON.parse(event.data);

            switch (message.type) {
                case 'offer':
                    peerConnection.setRemoteDescription(new RTCSessionDescription(message.offer))
                        .then(() => peerConnection.createAnswer())
                        .then(answer => peerConnection.setLocalDescription(answer))
                        .then(() => ws.send(JSON.stringify({ type: 'answer', answer: peerConnection.localDescription })));
                    break;

                case 'answer':
                    peerConnection.setRemoteDescription(new RTCSessionDescription(message.answer));
                    break;

                case 'candidate':
                    peerConnection.addIceCandidate(new RTCIceCandidate(message.candidate));
                    break;
            }
        };

        // Create and send offer
        peerConnection.createOffer()
            .then(offer => peerConnection.setLocalDescription(offer))
            .then(() => ws.send(JSON.stringify({ type: 'offer', offer: peerConnection.localDescription })));
    })
    .catch(error => console.error('Error accessing media devices.', error));
