export const skillProgressContent = Object.freeze({
 title:"Skill Progress",eyebrow:"LEARNING / SKILL TRACKER",badge:"BASELINE / ZERO",
 intro:"A transparent snapshot of the topics being studied. Values remain at zero until progress can be supported by a verified learning record.",
 baselineEyebrow:"STARTING BASELINE",baselineNote:"Values stay at zero until a milestone is verified; status labels describe learning plans, not achievements.",valueLabel:"RECORDED PROGRESS",
 skills:Object.freeze([
  Object.freeze({id:"linux",name:"Linux",value:0,status:"In progress",note:"Building familiarity with command-line fundamentals."}),
  Object.freeze({id:"networking",name:"Networking",value:0,status:"In progress",note:"Studying how systems communicate and exchange data."}),
  Object.freeze({id:"recon",name:"Recon",value:0,status:"In progress",note:"Learning reconnaissance concepts and responsible boundaries."}),
  Object.freeze({id:"web-basics",name:"Web basics",value:0,status:"Planned",note:"Planned after core networking and web concepts are clearer."}),
  Object.freeze({id:"scripting",name:"Scripting",value:0,status:"Planned",note:"A future foundation for understanding and automating simple tasks."})
 ])
});
// Update me later: revise values only when a skill milestone has been verified.
