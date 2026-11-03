import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#080808",
          border: "12px solid #FF4D00",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "#FF4D00",
          fontWeight: 900,
          fontSize: 78,
          fontFamily: "sans-serif",
        }}
      >
        AF
      </div>
    ),
    { ...size }
  );
}
