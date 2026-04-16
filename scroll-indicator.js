(function () {
  function scrollToTarget(targetSelector) {
    if (!targetSelector) return;

    const target = document.querySelector(targetSelector);
    if (!target) return;

    target.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }

  document.addEventListener("click", (event) => {
    const trigger = event.target.closest(".scroll-indicator[data-target]");
    if (!trigger) return;

    scrollToTarget(trigger.getAttribute("data-target"));
  });

  document.addEventListener("keydown", (event) => {
    const trigger = event.target.closest(".scroll-indicator[data-target]");
    if (!trigger) return;

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      scrollToTarget(trigger.getAttribute("data-target"));
    }
  });
})();