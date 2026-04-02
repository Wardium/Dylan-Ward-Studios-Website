window.addEventListener("load", () => {
  const overlay = document.getElementById("bg-fade-overlay");

  // Optional: Remove it from the DOM entirely after the transition
  overlay.addEventListener("transitionend", () => overlay.remove());
  
  // NOW trigger your actual intro animation
  startMyMainAnimation(); 
});
