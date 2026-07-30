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

const supabaseUrl = "https://hxqsnztxokfemmysyjyw.supabase.co";
const supabaseKey = "sb_publishable_eu-_vai9eG2R89we1eIlxw_Quzds9c9";
const reviewReadApi =
  `${supabaseUrl}/rest/v1/reviews_public?select=id,name,company,project,rating,review&order=approved_at.desc&limit=12`;
const reviewSubmitApi = `${supabaseUrl}/rest/v1/review_submissions`;
const reviewStack = document.querySelector("#review-stack");
const reviewInvite = document.querySelector(".review-invite");
const reviewEmpty = document.querySelector("#review-empty");
const reviewForm = document.querySelector("#review-form");
const reviewMessage = document.querySelector("#review-message");

function createReviewCard(review, index) {
  const card = document.createElement("article");
  const number = String(index + 1).padStart(2, "0");
  const stars = "★".repeat(Math.max(1, Math.min(5, Number(review.rating))));
  const attribution = [review.company, review.project].filter(Boolean).join(" · ");
  card.className = "review-card review-card-text";
  card.style.top = `${80 + index * 18}px`;

  const glow = document.createElement("div");
  glow.className = "review-glow";
  const count = document.createElement("div");
  count.className = "review-number";
  count.textContent = number;
  const rating = document.createElement("div");
  rating.className = "review-rating";
  rating.setAttribute("aria-label", `${review.rating} out of 5 stars`);
  rating.textContent = stars;
  const copy = document.createElement("div");
  copy.className = "review-copy";
  const quote = document.createElement("blockquote");
  quote.textContent = `“${review.review}”`;
  const meta = document.createElement("div");
  const name = document.createElement("strong");
  name.textContent = review.name;
  const project = document.createElement("span");
  project.textContent = attribution;
  meta.append(name, project);
  copy.append(quote, meta);
  card.append(glow, count, rating, copy);
  return card;
}

fetch(reviewReadApi, { headers: { apikey: supabaseKey } })
  .then((response) => (response.ok ? response.json() : []))
  .then((reviews = []) => {
    if (!reviews.length) return;
    reviewEmpty.remove();
    reviews.forEach((review, index) => {
      reviewStack.insertBefore(createReviewCard(review, index), reviewInvite);
    });
  })
  .catch(() => {});

reviewForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = reviewForm.querySelector("button");
  const data = new FormData(reviewForm);
  button.disabled = true;

  if (data.get("website")) {
    reviewMessage.textContent =
      "Thank you. Your words are with the studio and will appear after approval.";
    reviewForm.reset();
    button.disabled = false;
    return;
  }
  reviewMessage.textContent = "Sending your review to the studio…";

  try {
    const response = await fetch(reviewSubmitApi, {
      method: "POST",
      headers: {
        apikey: supabaseKey,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        name: data.get("name"),
        company: data.get("company") || "",
        email: data.get("email"),
        project: data.get("project"),
        rating: Number(data.get("rating")),
        review: data.get("review"),
        consent: data.get("consent") === "on",
      }),
    });
    if (!response.ok) {
      throw new Error(
        "We could not save your review. Please check the form and try again."
      );
    }
    reviewMessage.textContent =
      "Thank you. Your words are with the studio and will appear after approval.";
    reviewForm.reset();
  } catch (error) {
    reviewMessage.textContent =
      error.message || "We could not save your review. Please try again.";
  } finally {
    button.disabled = false;
  }
});
