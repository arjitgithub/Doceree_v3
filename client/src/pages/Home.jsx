import React from "react";
import "../DocHubLayoutDesign/home.css";

export default function Home() {
  return (
    <div className="homeFullscreen">
      <video
        className="homeVideo"
        src="/homePageVideo.mp4"
        autoPlay
        muted
        loop
        playsInline
      />
    </div>
  );
}
