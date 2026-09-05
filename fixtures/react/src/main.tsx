import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { GalleryFixture } from "./GalleryFixture.js";
import "./styles.css";

const root = document.getElementById("root");
if (!root) throw new Error("React fixture root is missing.");

createRoot(root).render(
  <StrictMode>
    <GalleryFixture />
  </StrictMode>
);
