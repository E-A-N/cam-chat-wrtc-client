//see the following page for a proper demo
// https://webrtc.github.io/samples/src/content/peerconnection/pc1/
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');

const peerConnectionConfig = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
};


//192.168.8.201
const parsedParams = new URLSearchParams(location.search)
let ipaddress = parsedParams.get("hostIp") ?
    `ws://${parsedParams.get("hostIp")}:3000`
    : 'ws://localhost:3000'

const websocketURL = ipaddress;
let addElm = document.getElementById('addy');
addElm.innerText = websocketURL;


const ws = new WebSocket(websocketURL);
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

        // Create and send offer
        peerConnection.createOffer()
            .then(offer => peerConnection.setLocalDescription(offer))
            .then(() => ws.send(JSON.stringify({ type: 'offer', offer: peerConnection.localDescription })));

        ws.onmessage = (event) => {
            console.log('eandebug message recieved!!', event)
            if (event.data instanceof Blob) {
                // Convert Blob to text
                const reader = new FileReader();
                reader.onload = () => {
                    const message = reader.result;

                    try {
                        const parsedMessage = JSON.parse(message);

                        switch (parsedMessage.type) {
                            case 'offer':
                                peerConnection.setRemoteDescription(new RTCSessionDescription(parsedMessage.offer))
                                    .then(() => peerConnection.createAnswer())
                                    .then(answer => peerConnection.setLocalDescription(answer))
                                    .then(() => ws.send(JSON.stringify({ type: 'answer', answer: peerConnection.localDescription })));
                                break;

                            case 'answer':
                                peerConnection.setRemoteDescription(new RTCSessionDescription(parsedMessage.answer));
                                break;

                            case 'candidate':
                                peerConnection.addIceCandidate(new RTCIceCandidate(parsedMessage.candidate));
                                break;
                        }
                    } catch (error) {
                        console.error('Error parsing WebSocket message:', error);
                    }
                };
                reader.readAsText(event.data);
            } else {
                console.error('Unexpected message type:', event.data);
            }
        };
    })
    .catch(error => console.error('Error accessing media devices.', error));
