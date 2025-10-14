import React from "react";
import { Link } from "react-router-dom";

export const NotFound: React.FC = () => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        padding: "20px",
        textAlign: "center",
        background: "#f9fafb",
      }}
    >
      <h1 style={{ color: "#dc2626", marginBottom: "16px", fontSize: "4rem" }}>
        404
      </h1>
      <h2 style={{ color: "#374151", marginBottom: "16px" }}>Page Not Found</h2>
      <p style={{ color: "#6b7280", marginBottom: "24px", maxWidth: "400px" }}>
        The page you're looking for doesn't exist. You may have mistyped the
        address or the page may have moved.
      </p>
      <Link
        to="/"
        style={{
          padding: "12px 24px",
          background: "#667eea",
          color: "white",
          textDecoration: "none",
          borderRadius: "8px",
          fontSize: "16px",
          fontWeight: "600",
          transition: "background-color 0.2s",
        }}
      >
        Go Home
      </Link>
    </div>
  );
};
