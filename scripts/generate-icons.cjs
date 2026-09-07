const sharp=require('sharp');
const fs=require('node:fs');
const mark=`<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024"><path d="M245 675L427 335l109 196 67-115 181 259" stroke="#F6F7F3" stroke-width="42" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M418 755c160-93-67-133 95-217" stroke="#E4572E" stroke-width="34" stroke-linecap="round" fill="none"/><circle cx="694" cy="313" r="37" fill="#E4572E"/></svg>`;
(async()=>{fs.writeFileSync('assets/images/trailsafe-mark.svg',mark);await sharp(Buffer.from(mark)).png().toFile('assets/images/trailsafe-mark.png');await sharp({create:{width:1024,height:1024,channels:4,background:'#1B3A2E'}}).composite([{input:Buffer.from(mark)}]).png().toFile('assets/images/trailsafe-icon.png');})();
