export const writeUpsContent = Object.freeze({
 title:"Write-ups",eyebrow:"KNOWLEDGE BASE / 005",badge:"NO PUBLISHED NOTES",
 intro:"A future home for clear, reviewed notes based on real learning. Nothing has been published yet.",
 emptyEyebrow:"PUBLISHED NOTES / 000",emptyTitle:"No write-ups yet",
 emptyDescription:"No write-ups have been published. Notes will be added only after the learning or authorized exercise actually takes place.",
 futureEyebrow:"FUTURE FORMAT",
 planned:Object.freeze({
  title:"Authorized Lab Journal",status:"Planned template",
  description:"A planned structure for recording an authorized exercise after it has actually been completed. This is not a completed write-up.",
  sections:Object.freeze([
   Object.freeze({id:"objective",number:"01",label:"Objective",text:"State the learning question and what a successful, safe investigation would establish."}),
   Object.freeze({id:"authorization",number:"02",label:"Authorization & Environment",text:"Record written permission, in-scope assets, environment details, and explicit testing limits."}),
   Object.freeze({id:"tools-method",number:"03",label:"Tools & Methodology",text:"List only tools actually used and explain the steps taken in the authorized environment."}),
   Object.freeze({id:"technical-notes",number:"04",label:"Technical Explanation",text:"Explain the relevant concept in your own words and include commands or request examples when appropriate."}),
   Object.freeze({id:"evidence",number:"05",label:"Evidence & Findings",text:"Attach real screenshots or diagrams, redact sensitive values, and separate observations from assumptions."}),
   Object.freeze({id:"outcome",number:"06",label:"Outcome & Lessons",text:"Record the verified outcome, what was learned, what remains uncertain, and a safe next step."}),
   Object.freeze({id:"references",number:"07",label:"References & Status",text:"Link the original lab or source, record the date and completion status, and do not claim completion without evidence."})
  ])
 })
});
