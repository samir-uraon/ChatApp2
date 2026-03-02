"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function VideoCall({ roomId }) {
  const router = useRouter();

  const localVideo = useRef(null);
  const remoteVideo = useRef(null);

  const [stream, setStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);

  // 🎥 Get User Media
  useEffect(() => {
    const getLocalStream = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 640 }, height: { ideal: 480 } },
      audio: true,
    });
    if (localVideo.current) localVideo.current.srcObject = stream;
    return stream;
  } catch (err) {
    console.error("Camera error:", err);
    if (err.name === "NotAllowedError") {
      alert("Camera access denied. Please allow camera permissions.");
    } else if (err.name === "NotFoundError") {
      alert("No camera device found. Connect a camera.");
    } else if (err.name === "NotReadableError") {
      alert("Camera is already in use by another app or tab.");
    } else {
      alert("Cannot start video: " + err.message);
    }
    return null;
  }
};

    getLocalStream();

    return () => {
      stream?.getTracks().forEach(track => track.stop());
    };
  }, [roomId]);

  // 🔇 Toggle Mute
  const toggleMute = () => {
    if (!stream) return;
    stream.getAudioTracks().forEach(track => {
      track.enabled = !track.enabled;
    });
    setIsMuted(!isMuted);
  };

  // 📷 Toggle Camera
  const toggleCamera = () => {
    if (!stream) return;
    stream.getVideoTracks().forEach(track => {
      track.enabled = !track.enabled;
    });
    setCameraOff(!cameraOff);
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4 text-white">

      <p className="absolute top-4 text-gray-400 text-sm">
        Room: {roomId}
      </p>

      {/* VIDEO SECTION */}
      <div className="w-full max-w-6xl flex flex-col md:flex-row gap-4">

        {/* Remote Video */}
        <video
          ref={remoteVideo}
          autoPlay
          playsInline
          className="w-full md:w-2/3 aspect-video bg-black rounded-2xl object-cover shadow-xl"
        />

        {/* Local Video */}
        <video
          ref={localVideo}
          autoPlay
          muted
          playsInline
          className="w-full md:w-1/3 aspect-video bg-black rounded-2xl object-cover shadow-lg"
        />

      </div>

      {/* CONTROLS */}
      <div className="mt-6 flex gap-4">

        <button
          onClick={toggleMute}
          className="bg-gray-700 hover:bg-gray-600 px-5 py-2 rounded-full"
        >
          {isMuted ? "🔇 Unmute" : "🎤 Mute"}
        </button>

        <button
          onClick={toggleCamera}
          className="bg-gray-700 hover:bg-gray-600 px-5 py-2 rounded-full"
        >
          {cameraOff ? "📷 Turn On" : "📷 Turn Off"}
        </button>

        <button
          onClick={() => router.push("/dashboard")}
          className="bg-red-600 hover:bg-red-700 px-6 py-2 rounded-full"
        >
          End Call
        </button>

      </div>
    </div>
  );
}