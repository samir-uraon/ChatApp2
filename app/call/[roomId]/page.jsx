"use client";

import { useParams } from "next/navigation";
import VideoCall from "@/components/VideoCall";

export default function CallPage() {
  const { roomId } = useParams();

  return <VideoCall roomId={roomId} />;
}