window.addEventListener("load", () => {
  const overlay = document.getElementById("bg-fade-overlay");
  
  // Add the class that triggers the CSS transition
  overlay.classList.add("fade-out");

  // Optional: Remove it from the DOM entirely after the transition
  overlay.addEventListener("transitionend", () => overlay.remove());
  
  // NOW trigger your actual intro animation
  startMyMainAnimation(); 
});
