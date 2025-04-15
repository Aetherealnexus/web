document.addEventListener("DOMContentLoaded", () => {
    const arrow = document.querySelector(".scroll-indicator .arrow");
  
    if (arrow) {
      arrow.addEventListener("click", () => {
        const nextSection = arrow.closest("section").nextElementSibling;
        if (nextSection) {
          nextSection.scrollIntoView({ behavior: "smooth" });
        }
      });
    }
  });
  