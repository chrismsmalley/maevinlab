window.addEventListener("DOMContentLoaded", () => {
  const slug = document.body.dataset.postSlug;
  const mount = document.getElementById("post-nav");
  const posts = Array.isArray(window.MAEVIN_WRITING) ? [...window.MAEVIN_WRITING] : [];

  if (!slug || !mount || !posts.length) return;

  posts.sort((a, b) => new Date(b.date) - new Date(a.date));
  const index = posts.findIndex((post) => post.slug === slug);
  if (index === -1) return;

  const prev = posts[index + 1];
  const next = posts[index - 1];

  const createLink = (post, direction) => {
    const a = document.createElement("a");
    a.className = `post-nav-link ${direction}`;
    if (!post) {
      a.classList.add("is-empty");
      a.setAttribute("aria-hidden", "true");
      return a;
    }
    a.href = post.href;

    const kicker = document.createElement("span");
    kicker.className = "post-nav-kicker";
    kicker.textContent = direction === "prev" ? "Previous" : "Next";

    const title = document.createElement("span");
    title.className = "post-nav-title";
    title.textContent = post.title;

    a.append(kicker, title);
    return a;
  };

  mount.innerHTML = "";
  mount.appendChild(createLink(prev, "prev"));

  const center = document.createElement("a");
  center.className = "post-nav-home";
  center.href = "/writings.html";
  center.textContent = "Back to writing";
  mount.appendChild(center);

  mount.appendChild(createLink(next, "next"));
});
