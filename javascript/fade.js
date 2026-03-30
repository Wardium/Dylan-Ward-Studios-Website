window.addEventListener("load", () => {
  const overlay = document.createElement("div");
  overlay.id = "bg-fade-overlay";
  document.body.appendChild(overlay);

  overlay.addEventListener("animationend", () => overlay.remove());
});
