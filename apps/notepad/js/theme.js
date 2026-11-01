// BrowOS: moved here from an inline <script> in index.html,
// because Chrome extensions don't allow inline scripts.

if (localStorage.getItem('mode')) {
  if (localStorage.getItem('mode') == 'dark') {
    document.body.classList.add("dark");
    document.querySelector('.navbar').classList.remove("navbar-default");
  } else  {
    document.body.classList.remove("dark");
    document.querySelector('.navbar').classList.add("navbar-default");
  }
} else {
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.body.classList.add("dark");
    document.querySelector('.navbar').classList.remove("navbar-default");
  } else {
    document.body.classList.remove("dark");
    document.querySelector('.navbar').classList.add("navbar-default");
  }
}

const favicon = document.querySelector('link[rel="icon"]')

document.addEventListener("visibilitychange", () => {
  const hidden = document.hidden
  favicon.setAttribute("href", `favicon${hidden ? "-hidden" : ""}.ico`)
})
