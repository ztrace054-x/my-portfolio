/* Only projects with real repository evidence belong in this list. */
export const projects = Object.freeze([
  Object.freeze({
    id: "ztrace-portfolio",
    title: "ZTRACE Cybersecurity Learning Portfolio",
    status: "In progress",
    type: "Portfolio / frontend",
    summary: "A static, client-side portfolio built with semantic HTML, CSS, and vanilla JavaScript. It presents learning records, planned labs, and evidence without claiming live scanning or authentication.",
    technologies: Object.freeze(["HTML", "CSS", "Vanilla JavaScript"]),
    sourceUrl: "https://github.com/ztrace054-x/my-portfolio",
    publicUrl: "https://ztrace054-x.github.io/my-portfolio/",
    scopeNote: "The intro is illustrative. No backend, authentication service, or live security scanner is implemented."
  })
]);
