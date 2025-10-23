document.addEventListener("DOMContentLoaded", () => {
  const overlay = document.createElement("div");
  overlay.id = "bg-fade-overlay";
  document.body.appendChild(overlay);

  overlay.addEventListener("animationend", () => overlay.remove());
});
