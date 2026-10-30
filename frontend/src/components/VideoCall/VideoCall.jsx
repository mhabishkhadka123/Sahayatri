import { useCallback, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { API_BASE_URL } from '../../services/api';

const SOCKET_URL = API_BASE_URL.replace(/\/api\/?$/, '').replace(/\/$/, '');
const ICE_SERVERS = [{ urls: 'stun:stun.l.google.com:19302' }];

const VideoCall = ({ remoteUser }) => {
  const socketRef = useRef(null);
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const callIdRef = useRef(null);
  const pendingCandidatesRef = useRef([]);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [callState, setCallState] = useState('idle');
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const stopMedia = useCallback(() => {
    peerRef.current?.close();
    peerRef.current = null;
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    pendingCandidatesRef.current = [];
    setLocalStream(null);
    setRemoteStream(null);
    setIsMuted(false);
    setIsCameraOff(false);
  }, []);

  const closeCall = useCallback((notifyPeer = false) => {
    const callId = callIdRef.current;
    if (notifyPeer && callId) {
      socketRef.current?.emit('call_end', { callId });
    }
    callIdRef.current = null;
    stopMedia();
    setCallState('idle');
  }, [stopMedia]);

  const getLocalMedia = useCallback(async () => {
    if (localStreamRef.current) return localStreamRef.current;
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('Audio/video calling is not supported by this browser');
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
    localStreamRef.current = stream;
    setLocalStream(stream);
    return stream;
  }, []);

  const getPeerConnection = useCallback(() => {
    if (peerRef.current) return peerRef.current;
    if (typeof RTCPeerConnection === 'undefined') {
      throw new Error('WebRTC is not supported by this browser');
    }

    const peer = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    localStreamRef.current?.getTracks().forEach((track) => {
      peer.addTrack(track, localStreamRef.current);
    });
    peer.ontrack = (event) => {
      const [stream] = event.streams;
      if (stream) setRemoteStream(stream);
    };
    peer.onicecandidate = (event) => {
      if (event.candidate && callIdRef.current) {
        socketRef.current?.emit('webrtc_ice_candidate', {
          callId: callIdRef.current,
          candidate: event.candidate,
        });
      }
    };
    peer.onconnectionstatechange = () => {
      if (peer.connectionState === 'connected') setCallState('connected');
      if (['failed', 'closed', 'disconnected'].includes(peer.connectionState)) {
        if (peer.connectionState === 'failed') {
          setError('The call connection failed. Check your network and try again.');
        }
      }
    };
    peerRef.current = peer;
    return peer;
  }, []);

  const applyPendingCandidates = useCallback(async (peer) => {
    const candidates = pendingCandidatesRef.current;
    pendingCandidatesRef.current = [];
    for (const candidate of candidates) {
      await peer.addIceCandidate(new RTCIceCandidate(candidate));
    }
  }, []);

  const emitWithAck = useCallback((eventName, payload) => new Promise((resolve, reject) => {
    const socket = socketRef.current;
    if (!socket?.connected) {
      reject(new Error('Call signaling is not connected'));
      return;
    }

    socket.timeout(10000).emit(eventName, payload, (timeoutError, response) => {
      if (timeoutError) {
        reject(new Error('Call signaling timed out. Please try again.'));
      } else if (response?.error) {
        reject(new Error(response.error));
      } else {
        resolve(response);
      }
    });
  }), []);

  const startCall = async () => {
    setError('');
    setNotice('');
    setCallState('requesting-media');
    try {
      await getLocalMedia();
      const response = await emitWithAck('call_user', { userId: remoteUser.id });
      callIdRef.current = response.callId;
      setCallState('calling');
    } catch (callError) {
      stopMedia();
      setCallState('idle');
      setError(callError.message || 'Unable to start the call');
    }
  };

  const answerCall = async () => {
    setError('');
    setNotice('');
    setCallState('connecting');
    try {
      await getLocalMedia();
      getPeerConnection();
      await emitWithAck('call_accept', { callId: callIdRef.current });
    } catch (callError) {
      closeCall(true);
      setError(callError.message || 'Unable to answer the call');
    }
  };

  const handleOffer = useCallback(async (payload) => {
    if (payload.callId !== callIdRef.current) return;
    try {
      await getLocalMedia();
      const peer = getPeerConnection();
      await peer.setRemoteDescription(new RTCSessionDescription(payload.description));
      await applyPendingCandidates(peer);
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      socketRef.current?.emit('webrtc_answer', {
        callId: callIdRef.current,
        description: peer.localDescription,
      });
      setCallState('connecting');
    } catch (callError) {
      setError(callError.message || 'Unable to establish the call');
      closeCall(true);
    }
  }, [applyPendingCandidates, closeCall, getLocalMedia, getPeerConnection]);

  const handleAnswer = useCallback(async (payload) => {
    if (payload.callId !== callIdRef.current || !peerRef.current) return;
    try {
      await peerRef.current.setRemoteDescription(new RTCSessionDescription(payload.description));
      await applyPendingCandidates(peerRef.current);
      setCallState('connecting');
    } catch (callError) {
      setError(callError.message || 'Unable to connect the call');
      closeCall(true);
    }
  }, [applyPendingCandidates, closeCall]);

  const handleCandidate = useCallback(async (payload) => {
    if (payload.callId !== callIdRef.current) return;
    if (!peerRef.current?.remoteDescription) {
      pendingCandidatesRef.current.push(payload.candidate);
      return;
    }
    try {
      await peerRef.current.addIceCandidate(new RTCIceCandidate(payload.candidate));
    } catch (candidateError) {
      console.error('Unable to add WebRTC ICE candidate:', candidateError);
    }
  }, []);

  useEffect(() => {
    if (!remoteUser?.id) return undefined;

    const socket = io(SOCKET_URL, {
      auth: { token: localStorage.getItem('authToken') },
      withCredentials: true,
    });
    socketRef.current = socket;

    socket.on('incoming_call', (payload) => {
      if (!payload.caller?.id || callIdRef.current) {
        if (payload.caller?.id) socket.emit('call_reject', { callId: payload.callId });
        return;
      }
      callIdRef.current = payload.callId;
      setNotice(`${payload.caller.firstName || 'Your match'} is calling...`);
      setCallState('incoming');
      setError('');
    });
    socket.on('call_accepted', async ({ callId }) => {
      if (callId !== callIdRef.current) return;
      try {
        const peer = getPeerConnection();
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        socket.emit('webrtc_offer', { callId, description: peer.localDescription });
        setCallState('connecting');
      } catch (callError) {
        setError(callError.message || 'Unable to create call offer');
        closeCall(true);
      }
    });
    socket.on('call_rejected', ({ callId }) => {
      if (callId !== callIdRef.current) return;
      closeCall(false);
      setNotice('The call was declined.');
    });
    socket.on('call_ended', ({ callId, reason }) => {
      if (callId !== callIdRef.current) return;
      closeCall(false);
      setNotice(reason === 'timeout' ? 'The call was not answered.' : 'The call has ended.');
    });
    socket.on('webrtc_offer', handleOffer);
    socket.on('webrtc_answer', handleAnswer);
    socket.on('webrtc_ice_candidate', handleCandidate);
    socket.on('connect_error', (socketError) => {
      setError(socketError.message || 'Unable to connect to call service');
    });

    return () => {
      if (callIdRef.current) socket.emit('call_end', { callId: callIdRef.current });
      socket.disconnect();
      socketRef.current = null;
      closeCall(false);
    };
  }, [remoteUser?.id, closeCall, getPeerConnection, handleAnswer, handleCandidate, handleOffer]);

  useEffect(() => {
    if (localVideoRef.current) localVideoRef.current.srcObject = localStream;
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
  }, [remoteStream]);

  const toggleMicrophone = () => {
    const nextMuted = !isMuted;
    localStreamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = !nextMuted;
    });
    setIsMuted(nextMuted);
  };

  const toggleCamera = () => {
    const nextCameraOff = !isCameraOff;
    localStreamRef.current?.getVideoTracks().forEach((track) => {
      track.enabled = !nextCameraOff;
    });
    setIsCameraOff(nextCameraOff);
  };

  if (!remoteUser?.id) return null;

  return (
    <section className="border-b border-gray-200 bg-white p-3" aria-label="Video call">
      {callState === 'idle' ? (
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-gray-600">{notice || `Call ${remoteUser.firstName || 'companion'}`}</span>
          <button
            type="button"
            onClick={startCall}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            Start video call
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-gray-700">
              {callState === 'incoming' ? notice : `Call ${callState === 'connected' ? 'connected' : 'in progress'}`}
            </p>
            <div className="flex gap-2">
              {callState === 'incoming' && (
                <>
                  <button type="button" onClick={answerCall} className="rounded bg-green-600 px-3 py-1.5 text-sm text-white">
                    Answer
                  </button>
                  <button type="button" onClick={() => {
                    socketRef.current?.emit('call_reject', { callId: callIdRef.current });
                    closeCall(false);
                  }} className="rounded bg-red-600 px-3 py-1.5 text-sm text-white">
                    Decline
                  </button>
                </>
              )}
              {localStream && (
                <>
                  <button type="button" onClick={toggleMicrophone} className="rounded bg-gray-200 px-3 py-1.5 text-sm">
                    {isMuted ? 'Unmute' : 'Mute'}
                  </button>
                  <button type="button" onClick={toggleCamera} className="rounded bg-gray-200 px-3 py-1.5 text-sm">
                    {isCameraOff ? 'Camera on' : 'Camera off'}
                  </button>
                </>
              )}
              <button type="button" onClick={() => closeCall(true)} className="rounded bg-red-600 px-3 py-1.5 text-sm text-white">
                End call
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <video ref={localVideoRef} autoPlay playsInline muted className="max-h-64 w-full rounded-lg bg-gray-900 object-cover" />
            <video ref={remoteVideoRef} autoPlay playsInline className="max-h-64 w-full rounded-lg bg-gray-900 object-cover" />
          </div>
        </div>
      )}
      {error && <p className="mt-2 text-sm text-red-600" role="alert">{error}</p>}
    </section>
  );
};

export default VideoCall;
