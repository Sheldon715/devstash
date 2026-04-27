const header = document.querySelector("[data-header]");
const yearTarget = document.querySelector("[data-year]");
const billingToggle = document.querySelector("[data-billing-toggle]");
const proPrice = document.querySelector("[data-pro-price]");
const proTerm = document.querySelector("[data-pro-term]");
const stage = document.querySelector("[data-chaos-stage]");
const icons = Array.from(document.querySelectorAll("[data-chaos-icon]"));
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (yearTarget) {
  yearTarget.textContent = new Date().getFullYear();
}

const updateHeader = () => {
  header?.classList.toggle("is-scrolled", window.scrollY > 18);
};

window.addEventListener("scroll", updateHeader, { passive: true });
updateHeader();

if (billingToggle && proPrice && proTerm) {
  billingToggle.addEventListener("change", () => {
    const yearly = billingToggle.checked;
    proPrice.textContent = yearly ? "$72" : "$8";
    proTerm.textContent = yearly ? "/yr" : "/mo";
  });
}

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.16 }
);

document.querySelectorAll(".reveal").forEach((element) => revealObserver.observe(element));

if (stage && icons.length && !reduceMotion) {
  const pointer = { x: -9999, y: -9999, active: false };
  const items = icons.map((icon, index) => ({
    element: icon,
    x: 24 + (index % 4) * 82,
    y: 24 + Math.floor(index / 4) * 106,
    vx: 0.42 + (index % 3) * 0.2,
    vy: 0.36 + (index % 4) * 0.16,
    rotation: index * 13,
    pulse: Math.random() * Math.PI * 2,
  }));

  stage.addEventListener("pointermove", (event) => {
    const rect = stage.getBoundingClientRect();
    pointer.x = event.clientX - rect.left;
    pointer.y = event.clientY - rect.top;
    pointer.active = true;
  });

  stage.addEventListener("pointerleave", () => {
    pointer.active = false;
  });

  const animate = () => {
    const width = stage.clientWidth;
    const height = stage.clientHeight;

    items.forEach((item) => {
      const size = item.element.offsetWidth;
      item.x += item.vx;
      item.y += item.vy;
      item.rotation += item.vx * 0.44;
      item.pulse += 0.035;

      if (item.x <= 8 || item.x + size >= width - 8) {
        item.vx *= -1;
        item.x = Math.max(8, Math.min(item.x, width - size - 8));
      }

      if (item.y <= 8 || item.y + size >= height - 8) {
        item.vy *= -1;
        item.y = Math.max(8, Math.min(item.y, height - size - 8));
      }

      if (pointer.active) {
        const centerX = item.x + size / 2;
        const centerY = item.y + size / 2;
        const dx = centerX - pointer.x;
        const dy = centerY - pointer.y;
        const distance = Math.hypot(dx, dy);
        const radius = 118;

        if (distance < radius && distance > 0.01) {
          const force = (radius - distance) / radius;
          item.x += (dx / distance) * force * 7;
          item.y += (dy / distance) * force * 7;
        }
      }

      const scale = 1 + Math.sin(item.pulse) * 0.045;
      item.element.style.setProperty("--x", `${item.x}px`);
      item.element.style.setProperty("--y", `${item.y}px`);
      item.element.style.setProperty("--r", `${item.rotation}deg`);
      item.element.style.setProperty("--s", scale.toFixed(3));
    });

    requestAnimationFrame(animate);
  };

  animate();
} else {
  icons.forEach((icon, index) => {
    icon.style.setProperty("--x", `${20 + (index % 4) * 76}px`);
    icon.style.setProperty("--y", `${22 + Math.floor(index / 4) * 100}px`);
    icon.style.setProperty("--r", `${index * 7}deg`);
  });
}
