
(function () {
  const canvas = document.getElementById("cipher-canvas");
  if (canvas && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const ctx = canvas.getContext("2d");
    const glyphs = ["0", "1", "λ", "ψ", "∴", "⊕", "zk", "sig", "key", "salt", "hash", "CY:\\_"];
    let w = 0, h = 0, dpr = 1, particles = [];

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.width = Math.floor(innerWidth * dpr);
      h = canvas.height = Math.floor(innerHeight * dpr);
      canvas.style.width = innerWidth + "px";
      canvas.style.height = innerHeight + "px";
      const count = Math.max(26, Math.floor((innerWidth * innerHeight) / 36000));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.12 * dpr,
        vy: (Math.random() - 0.5) * 0.10 * dpr,
        g: glyphs[Math.floor(Math.random() * glyphs.length)],
        a: 0.05 + Math.random() * 0.12,
        s: (10 + Math.random() * 11) * dpr
      }));
    }

    function tick() {
      ctx.clearRect(0, 0, w, h);
      ctx.font = `${12 * dpr}px "IBM Plex Mono", "Courier New", monospace`;
      ctx.textBaseline = "middle";

      for (const p of particles) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < -80) p.x = w + 40;
        if (p.x > w + 80) p.x = -40;
        if (p.y < -40) p.y = h + 40;
        if (p.y > h + 40) p.y = -40;

        ctx.globalAlpha = p.a;
        ctx.fillStyle = "#dbeff2";
        ctx.fillText(p.g, p.x, p.y);
      }

      ctx.globalAlpha = 0.04;
      ctx.strokeStyle = "#72f7ff";
      ctx.beginPath();
      for (let i = 0; i < particles.length - 1; i += 2) {
        const a = particles[i], b = particles[i + 1];
        const dx = a.x - b.x, dy = a.y - b.y;
        if ((dx * dx + dy * dy) < 120000 * dpr) {
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
        }
      }
      ctx.stroke();
      requestAnimationFrame(tick);
    }

    addEventListener("resize", resize, { passive: true });
    resize();
    tick();
  }

  const copyButtons = document.querySelectorAll("[data-copy]");
  copyButtons.forEach((btn) => {
    btn.addEventListener("click", async () => {
      const value = btn.getAttribute("data-copy") || "";
      try {
        await navigator.clipboard.writeText(value);
        const old = btn.textContent;
        btn.textContent = "copied";
        setTimeout(() => { btn.textContent = old; }, 1000);
      } catch {
        btn.textContent = "select + copy";
      }
    });
  });

  const year = document.querySelector("[data-year]");
  if (year) year.textContent = String(new Date().getFullYear());

  const verifyForm = document.querySelector("[data-verify-form]");
  if (verifyForm) {
    const input = verifyForm.querySelector("input[name='id']");
    const status = document.querySelector("[data-status]");
    const output = document.querySelector("[data-proof]");
    const dataPath = "data/artifacts.json";

    function normalize(value) {
      return String(value || "")
        .trim()
        .replace(/%5C/gi, "\\")
        .replace(/^cy:\\_/i, "CY:\\_")
        .replace(/^cy:_/i, "CY:_")
        .toLowerCase();
    }

    async function loadRegistry() {
      try {
        const response = await fetch(dataPath, { cache: "no-store" });
        if (!response.ok) throw new Error("registry fetch failed");
        return await response.json();
      } catch (error) {
        return window.CY_ARTIFACTS;
      }
    }

    function proofRow(term, value, hash) {
      const safeValue = String(value || "");
      const copy = hash ? `<button class="copy" data-copy="${safeValue}" type="button">copy</button>` : "";
      return `<div class="proof-row"><dt>${term}</dt><dd class="${hash ? "hash" : ""}">${safeValue} ${copy}</dd></div>`;
    }

    function renderArtifact(artifact) {
      const hashes = artifact.hashes || {};
      output.innerHTML = [
        proofRow("artifact", artifact.artifactName),
        proofRow("minimal", artifact.minimalName),
        proofRow("id", artifact.id),
        proofRow("release", artifact.releaseDate),
        proofRow("creator", artifact.creatorMark),
        proofRow("copyright", artifact.copyrightNotice),
        proofRow("claimed marks", (artifact.claimedMarks || []).join(" / ")),
        proofRow("qr destination", artifact.qrDestination),
        proofRow("sha256 garment", hashes.sha256_garment, true),
        proofRow("sha256 artwork", hashes.sha256_artwork, true),
        proofRow("sha256 metadata", hashes.sha256_metadata, true),
        proofRow("sha256 lifestyle", hashes.sha256_lifestyle, true)
      ].join("");
      output.querySelectorAll("[data-copy]").forEach((btn) => {
        btn.addEventListener("click", async () => {
          try {
            await navigator.clipboard.writeText(btn.getAttribute("data-copy") || "");
            btn.textContent = "copied";
            setTimeout(() => (btn.textContent = "copy"), 1000);
          } catch {
            btn.textContent = "manual";
          }
        });
      });
    }

    async function verify(value) {
      const query = normalize(value);
      const registry = await loadRegistry();
      const artifacts = (registry && registry.artifacts) || [];
      const artifact = artifacts.find((item) => {
        const aliases = [item.id, item.artifactName, item.minimalName].concat(item.verificationAliases || []);
        return aliases.some((alias) => normalize(alias) === query);
      });

      if (artifact) {
        status.className = "status ok";
        status.textContent = "verified // hash witness accepted";
        renderArtifact(artifact);
      } else {
        status.className = "status fail";
        status.textContent = "not found // no witness for supplied artifact";
        output.innerHTML = "";
      }
    }

    const params = new URLSearchParams(location.search);
    const initial = params.get("id") || input.value || "CA-AI-CHUNK-0001";
    input.value = initial;
    verify(initial);

    verifyForm.addEventListener("submit", (event) => {
      event.preventDefault();
      verify(input.value);
      const url = new URL(location.href);
      url.searchParams.set("id", input.value);
      history.replaceState(null, "", url.toString());
    });
  }
})();
