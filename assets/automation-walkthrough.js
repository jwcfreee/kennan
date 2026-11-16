
/* AI Lead Automation — interactive illustrated walkthrough.
   Static, fictional demonstration: no requests, email delivery or n8n calls. */
(() => {
  const root = document.getElementById('aiWalkthrough');
  if (!root) return;
  const steps = [
    {label:'Capture',title:'Every inquiry, captured.',description:'A visitor submits a project inquiry. The webhook validates the name, email, service, budget and consent before storing the lead.',proof:'Example: Maria Santos · Website development · $4,500 budget',packet:'NEW LEAD',sub:'Webhook received',caption:'A form submission becomes a structured lead record.'},
    {label:'Qualify',title:'Know which lead needs attention.',description:'Google Gemini reviews the inquiry and suggests high, medium or low priority. Validation checks the output before the result enters the lead database.',proof:'Example classification: HIGH PRIORITY · Clear project and timeline',packet:'HIGH PRIORITY',sub:'AI qualification',caption:'A high-priority inquiry is identified for review.'},
    {label:'Draft',title:'Turn context into a first response.',description:'Gemini prepares a tailored email subject and body using the customer’s request. The draft is checked for basic quality and completeness.',proof:'Draft preview: “Thanks for sharing your website plans…”',packet:'DRAFT READY',sub:'Personalized email',caption:'The response is generated as a draft, not sent.'},
    {label:'Approve',title:'Keep a human in control.',description:'A reviewer can approve, reject or request a revision. If the draft needs changes, the AI revision process uses the reviewer’s feedback.',proof:'Decision options: Approve / Reject / Revise',packet:'HUMAN REVIEW',sub:'Approval required',caption:'Human approval is a separate workflow step.'},
    {label:'Gmail',title:'Prepare delivery with safeguards.',description:'Approved content can be saved as a Gmail draft. A separate verification stage checks recipient, draft identity, approval and status before any manually controlled test send.',proof:'Prototype status: Gmail sending is intentionally disconnected from automatic triggers.',packet:'GMAIL DRAFT',sub:'Controlled sending',caption:'The demo does not send emails or contact Gmail.'},
    {label:'Monitor',title:'Follow up without ignoring signals.',description:'Scheduled checks evaluate due dates, replies, delivery failures and duplicate drafts. In a fictional bounced-email test, the lead was correctly blocked from follow-up.',proof:'Tested outcome: Delivery failed → follow-up blocked',packet:'FOLLOW-UP BLOCKED',sub:'Bounce detected',caption:'Safeguards stop a follow-up when delivery fails.'}
  ];
  const buttons = Array.from(root.querySelectorAll('.aw-step'));
  const title = root.querySelector('#awTitle');
  const description = root.querySelector('#awDescription');
  const proof = root.querySelector('#awProof');
  const packet = root.querySelector('#awPacket');
  const sub = root.querySelector('#awPacketSub');
  const caption = root.querySelector('#awCaption');
  const indexEl = root.querySelector('#awIndex');
  const durationEl = root.querySelector('#awTime');
  const progress = root.querySelector('#awProgress');
  const line = root.querySelector('#awStepLine');
  const play = root.querySelector('#awPlay');
  const prev = root.querySelector('#awPrev');
  const next = root.querySelector('#awNext');
  const replay = root.querySelector('#awReplay');
  const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
  const DURATION=5200;
  let index=0, elapsed=0, playing=false, previousTime=0, frame=0;
  function render(){
    const step=steps[index];
    title.textContent=step.title;
    description.textContent=step.description;
    proof.textContent=step.proof;
    packet.textContent=step.packet;
    sub.textContent=step.sub;
    caption.textContent=step.caption;
    indexEl.textContent=String(index+1).padStart(2,'0')+' / '+String(steps.length).padStart(2,'0');
    line.style.width=(index/(steps.length-1)*100)+'%';
    buttons.forEach((button,i)=>{
      const active=i===index;
      button.classList.toggle('is-active',active);
      button.classList.toggle('is-complete',i<index);
      button.setAttribute('aria-current',active?'step':'false');
      button.setAttribute('aria-pressed',String(active));
    });
    refreshProgress();
  }
  function refreshProgress(){
    const fraction=Math.min(1,elapsed/DURATION);
    progress.style.width=((index+fraction)/steps.length*100)+'%';
    durationEl.textContent=String(index+1)+' / '+steps.length;
  }
  function pause(){
    playing=false;root.classList.remove('is-playing');
    play.textContent='▶ Play';play.setAttribute('aria-label','Play walkthrough');
    cancelAnimationFrame(frame);frame=0;
  }
  function tick(timestamp){
    if(!playing) return;
    if(previousTime) elapsed+=Math.min(timestamp-previousTime,100);
    previousTime=timestamp;
    if(elapsed>=DURATION){
      elapsed=0;
      index=(index+1)%steps.length;
      render();
    } else refreshProgress();
    frame=requestAnimationFrame(tick);
  }
  function start(){
    if(reducedMotion && reducedMotion.matches) return;
    if(playing)return;
    playing=true;previousTime=0;root.classList.add('is-playing');
    play.textContent='Ⅱ Pause';play.setAttribute('aria-label','Pause walkthrough');
    frame=requestAnimationFrame(tick);
  }
  function select(i){
    index=(i+steps.length)%steps.length;
    elapsed=0;previousTime=0;render();
  }
  buttons.forEach((button,i)=>button.addEventListener('click',()=>select(i)));
  play.addEventListener('click',()=>playing?pause():start());
  prev.addEventListener('click',()=>select(index-1));
  next.addEventListener('click',()=>select(index+1));
  replay.addEventListener('click',()=>{select(0);if(!reducedMotion?.matches)start();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)pause()});
  if(reducedMotion){
    const onChange=()=>{if(reducedMotion.matches)pause()};
    if(reducedMotion.addEventListener)reducedMotion.addEventListener('change',onChange);
    else if(reducedMotion.addListener)reducedMotion.addListener(onChange);
  }
  render();
  // The visitor starts playback explicitly; no unexpected motion or Gmail actions.
})();
