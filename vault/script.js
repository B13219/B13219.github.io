const story = document.querySelector(".motion-story");
const motionObject = document.querySelector(".motion-object");
const intro = document.querySelector(".motion-intro");
const scenes = [...document.querySelectorAll(".motion-scene")];
const finalScene = document.querySelector(".motion-final");
const progressBar = document.querySelector(".motion-progress b");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const stops = [0, 0.16, 0.32, 0.5, 0.68, 0.84, 1];
const tracks = {
  x: [30, 19, 26, 0, -25, 0, 0],
  y: [64, 6, -4, 0, 5, 0, -8],
  scale: [0.52, 0.76, 0.9, 2.45, 0.78, 1.5, 2.65],
  rotate: [-13, -4, 7, 0, -7, 2, 0],
  radius: [44, 36, 28, 2, 34, 18, 0],
};

let target = 0;
let current = 0;
let frame = 0;

const clamp = (value) => Math.min(1, Math.max(0, value));
const smooth = (value) => {
  const x = clamp(value);
  return x * x * (3 - 2 * x);
};
const between = (progress, start, end) =>
  smooth((progress - start) / (end - start));

function interpolate(progress, values) {
  if (progress <= stops[0]) return values[0];
  if (progress >= stops.at(-1)) return values.at(-1);
  const index = stops.findIndex((stop) => stop >= progress);
  const start = index - 1;
  const local = smooth(
    (progress - stops[start]) / (stops[index] - stops[start])
  );
  return values[start] + (values[index] - values[start]) * local;
}

function sceneOpacity(progress, start, end) {
  return (
    between(progress, start, start + 0.055) *
    (1 - between(progress, end - 0.055, end))
  );
}

function measure() {
  const rect = story.getBoundingClientRect();
  return clamp(-rect.top / Math.max(1, rect.height - window.innerHeight));
}

function render(progress) {
  const x = interpolate(progress, tracks.x);
  const y = interpolate(progress, tracks.y);
  const scale = interpolate(progress, tracks.scale);
  const rotate = reducedMotion ? 0 : interpolate(progress, tracks.rotate);
  const radius = interpolate(progress, tracks.radius);
  const introExit = between(progress, 0.08, 0.2);
  const finalIn = between(progress, 0.83, 0.93);

  motionObject.style.setProperty("--x", `${x}vw`);
  motionObject.style.setProperty("--y", `${y}vh`);
  motionObject.style.setProperty("--scale", scale);
  motionObject.style.setProperty("--rotate", `${rotate}deg`);
  motionObject.style.setProperty("--radius", `${radius}px`);
  intro.style.opacity = 1 - introExit;
  intro.style.transform = `translateY(calc(-50% - ${introExit * 48}px))`;

  scenes.forEach((scene, index) => {
    const start = 0.2 + index * 0.2;
    const end = start + 0.2;
    const enter = between(progress, start, start + 0.07);
    const exit = between(progress, end - 0.06, end);
    scene.style.opacity = sceneOpacity(progress, start, end);
    scene.style.transform = `translateY(calc(-50% + ${
      (1 - enter) * 42 - exit * 32
    }px))`;
  });

  finalScene.style.opacity = finalIn;
  finalScene.style.transform = `translateY(${(1 - finalIn) * 35}px)`;
  progressBar.style.transform = `scaleX(${progress})`;
}

function animate() {
  const next = reducedMotion ? target : current + (target - current) * 0.095;
  current = Math.abs(target - next) < 0.0003 ? target : next;
  render(current);
  if (current !== target) {
    frame = requestAnimationFrame(animate);
  } else {
    frame = 0;
  }
}

function update() {
  target = measure();
  if (!frame) frame = requestAnimationFrame(animate);
}

target = measure();
current = target;
render(current);
addEventListener("scroll", update, { passive: true });
addEventListener("resize", update);

document.querySelector("#booking-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  const subject = encodeURIComponent(
    `Vault project enquiry — ${data.get("service") || "New project"}`
  );
  const body = encodeURIComponent(
    [
      `Name: ${data.get("name") || ""}`,
      `Company: ${data.get("company") || ""}`,
      `Email: ${data.get("email") || ""}`,
      `Phone / WhatsApp: ${data.get("phone") || ""}`,
      `Service: ${data.get("service") || ""}`,
      `Preferred date: ${data.get("date") || ""}`,
      `Location: ${data.get("location") || ""}`,
      "",
      "Brief:",
      data.get("brief") || "",
    ].join("\n")
  );
  document.querySelector("#form-message").textContent =
    "Opening your email app with the project details…";
  window.location.href = `mailto:hello@vault.co.tz?subject=${subject}&body=${body}`;
});
