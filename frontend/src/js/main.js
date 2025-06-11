function toggleMenu() {
  const navMenu = document.querySelector(".nav-menu");
  const hamburger = document.querySelector(".hamburger");

  navMenu.classList.toggle("active");
  hamburger.innerHTML = navMenu.classList.contains("active") ? "✕" : "☰";
}

// Close menu when clicking on nav links
document.querySelectorAll(".nav-link, .btn").forEach((link) => {
  link.addEventListener("click", () => {
    const navMenu = document.querySelector(".nav-menu");
    const hamburger = document.querySelector(".hamburger");

    if (navMenu.classList.contains("active")) {
      navMenu.classList.remove("active");
      hamburger.innerHTML = "☰";
    }
  });
});

// // Navbar scroll effect
// window.addEventListener("scroll", () => {
//   const navbar = document.querySelector(".navbar");
//   if (window.scrollY > 50) {
//     navbar.style.background = "rgba(255, 255, 255, 0.98)";
//     navbar.style.boxShadow = "0 2px 10px rgba(0, 0, 0, 0.1)";
//   } else {
//     navbar.style.background = "rgba(255, 255, 255, 0.95)";
//     navbar.style.boxShadow = "none";
//   }
// });

// Intersection Observer for animations
// const observerOptions = {
//   threshold: 0.1,
//   rootMargin: "0px 0px -50px 0px",
// };

// const observer = new IntersectionObserver((entries) => {
//   entries.forEach((entry) => {
//     if (entry.isIntersecting) {
//       entry.target.style.opacity = "1";
//       entry.target.style.transform = "translateY(0)";
//     }
//   });
// }, observerOptions);

// // Observe feature cards
// document.querySelectorAll(".feature-card").forEach((card) => {
//   card.style.opacity = "0";
//   card.style.transform = "translateY(20px)";
//   card.style.transition = "all 0.6s ease";
//   observer.observe(card);
// });

// function toggleMenu() {
//   const navMenu = document.querySelector(".nav-menu");
//   const hamburger = document.querySelector(".hamburger");

//   navMenu.classList.toggle("active");
//   hamburger.innerHTML = navMenu.classList.contains("active") ? "✕" : "☰";
// }

// // Close menu when clicking on nav links
// document.querySelectorAll(".nav-link, .btn").forEach((link) => {
//   link.addEventListener("click", () => {
//     const navMenu = document.querySelector(".nav-menu");
//     const hamburger = document.querySelector(".hamburger");

//     if (navMenu.classList.contains("active")) {
//       navMenu.classList.remove("active");
//       hamburger.innerHTML = "☰";
//     }
//   });
// });

// // Navbar scroll effect
// window.addEventListener("scroll", () => {
//   const navbar = document.querySelector(".navbar");
//   if (window.scrollY > 50) {
//     navbar.style.background = "rgba(255, 255, 255, 0.98)";
//     navbar.style.boxShadow = "0 2px 10px rgba(0, 0, 0, 0.1)";
//   } else {
//     navbar.style.background = "rgba(255, 255, 255, 0.95)";
//     navbar.style.boxShadow = "none";
//   }
// });

// // Intersection Observer for animations
// const observerOptions = {
//   threshold: 0.1,
//   rootMargin: "0px 0px -50px 0px",
// };

// const observer = new IntersectionObserver((entries) => {
//   entries.forEach((entry) => {
//     if (entry.isIntersecting) {
//       entry.target.style.opacity = "1";
//       entry.target.style.transform = "translateY(0)";
//     }
//   });
// }, observerOptions);

// // Observe feature cards
// document.querySelectorAll(".feature-card").forEach((card) => {
//   card.style.opacity = "0";
//   card.style.transform = "translateY(20px)";
//   card.style.transition = "all 0.6s ease";
//   observer.observe(card);
// });
