export const attackSurface = Object.freeze({
 title:"Attack Surface — Authorized Labs", eyebrow:"SCOPE / AUTHORIZED PRACTICE", badge:"AUTHORIZED LABS / EMPTY",
 intro:"A place to document only systems you own or have explicit permission to assess. No targets are configured and no scans are performed here.",
 banner:"Authorized practice only", bannerDetail:"Only work inside a clearly defined, permitted scope. This page does not run scans or connect to targets.",
 statsAriaLabel:"Attack surface zero-state metrics", metricTag:"ZERO STATE",
 stats:Object.freeze([
  Object.freeze({id:"authorized-labs",mark:"01",label:"Authorized Labs",value:0,note:"No lab entries recorded"}),
  Object.freeze({id:"scopes-reviewed",mark:"02",label:"Scopes Reviewed",value:0,note:"No scope reviews recorded"}),
  Object.freeze({id:"targets-in-scope",mark:"03",label:"Targets In Scope",value:0,note:"No authorized targets configured"})
 ]),
 chart:Object.freeze({heading:"Scope radar",simulatedLabel:"SIMULATED",emptyLabel:"NO DATA",ariaLabel:"Simulated empty radar chart; no target data or scan results are present",description:"Radar grid only. No target measurements, findings, or scan results are present."}),
 guidanceEyebrow:"PRACTICE BOUNDARIES",guidanceHeading:"Scope before action.",
 guidance:Object.freeze([
  Object.freeze({id:"scope",number:"01",label:"Scope",text:"Record the exact assets and activities included in the approved scope before any practice begins."}),
  Object.freeze({id:"permission",number:"02",label:"Permission",text:"Use written authorization and follow the owner's rules, time window, and testing limits."}),
  Object.freeze({id:"ethics",number:"03",label:"Ethics",text:"Stay within permission, avoid disruption, protect private data, and stop if scope is unclear."})
 ])
});
