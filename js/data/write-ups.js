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
   Object.freeze({id:"objective",number:"01",label:"Objective",text:"Describe the learning question or objective for the exercise."}),
   Object.freeze({id:"permitted-scope",number:"02",label:"Permitted Scope",text:"Record the written permission, in-scope assets, and relevant limits."}),
   Object.freeze({id:"observations",number:"03",label:"Observations",text:"Summarize evidence actually observed, removing sensitive information."}),
   Object.freeze({id:"lessons",number:"04",label:"Lessons",text:"Note what was learned, what remains uncertain, and a safe next step."})
  ])
 })
});
