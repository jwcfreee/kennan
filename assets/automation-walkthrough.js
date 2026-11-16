/* AI Lead Generation & Follow-Up — 30-scene interactive 2D motion explainer
   Entirely local visual storytelling. No external requests, credentials, email or API actions. */
(() => {
  'use strict';
  const root = document.getElementById('aiWalkthrough');
  if (!root) return;
  const $ = (s) => root.querySelector(s);
  const art = $('#awSceneArt'), phase=$('#awPhase'), counter=$('#awSceneCounter');
  const visualTag=$('#awVisualTag'), status=$('#awStatus'), category=$('#awCategory');
  const title=$('#awTitle'), voiceover=$('#awVoiceover'), description=$('#awDescription'), metric=$('#awMetric');
  const play=$('#awPlay'), previous=$('#awPrev'), next=$('#awNext'), replay=$('#awReplay');
  const seek=$('#awSeek'), time=$('#awElapsed');
  const actButtons=Array.from(root.querySelectorAll('[data-aw-act]'));
  const DURATION=5, TOTAL=150;
  const acts=[
    {index:0,title:'01 / THE PROBLEM',name:'ACT I — THE PROBLEM'},
    {index:6,title:'02 / THE SOLUTION',name:'ACT II — THE SOLUTION'},
    {index:10,title:'03 / HOW IT WORKS',name:'ACT III — THE WORKFLOW'},
    {index:23,title:'04 / THE IMPACT',name:'ACT IV — THE IMPACT'},
    {index:28,title:'05 / LET’S CONNECT',name:'ACT V — LET’S CONNECT'}
  ];
  const s=(visual,title,vo,detail,proof,label)=>({visual,title,vo,detail,proof,label});
  const scenes=[
    s('The notification storm','Your business is growing.','Your business is growing. But so is the workload.','An expanding customer base brings more messages and administrative work.','12 unread inquiries','THE PROBLEM'),
    s('Customers are waiting','Every lead deserves attention.','Every new inquiry needs attention.','Customers want to know their questions were received and understood.','3 customers waiting','INCOMING INQUIRIES'),
    s('Copy. Paste. Repeat.','Manual work adds up.','Yet valuable time disappears into repetitive work.','Copying names and project details into spreadsheets consumes time.','Repeated data entry','MANUAL TASKS'),
    s('Scattered across tools','Too many disconnected tools.','Information gets scattered across tools and conversations.','Inbox, task board, and lead tracker are disconnected.','Inbox + Sheets + Notes','TOOL OVERLOAD'),
    s('The missed opportunity','Potential leads slip away.','And promising opportunities can be overlooked.','Without a clear process, follow-up tasks can get missed.','Follow-up overdue','MISSED OPPORTUNITY'),
    s('The turning point','What if there were a better way?','What if the routine work could organize itself?','A clearer process helps the team stay focused on customers.','From reactive to organized','THE QUESTION'),
    s('A new helper arrives','Meet your automation team.','Meet AI Lead Generation and Follow-Up.','Tiny digital workers represent the automation operating behind the scenes.','AI-powered workflow','INTRODUCING THE SOLUTION'),
    s('Meet the specialists','Three helpers. One workflow.','A smarter way to coordinate customer inquiries.','Pixel captures, Byte organizes, and Echo prepares communications.','Capture · Analyze · Coordinate','MEET THE HELPERS'),
    s('From chaos to clarity','One connected process.','It turns scattered tasks into a structured process.','Information moves through consistent validation and decision steps.','Organized workflow','THE TRANSFORMATION'),
    s('The three-stage blueprint','Simple to understand.','Here’s how the system works.','Collect and organize, analyze and prepare, then approve and monitor.','01 Capture · 02 Analyze · 03 Track','THE BLUEPRINT'),
    s('A customer submits a form','An inquiry enters the system.','A customer submits an inquiry through a connected form.','A fictional customer enters website-development details and consent.','Form → Submit','STEP 01 / CAPTURE'),
    s('The webhook receives data','The information moves in.','The webhook receives the information instantly.','The submission becomes a structured data packet passed to n8n.','POST /portfolio-lead-intake','WEBHOOK'),
    s('Validation checks the form','Validate before processing.','Required details are checked before the lead is stored.','The workflow checks necessary fields, formats and contact consent.','Validation passed','DATA VALIDATION'),
    s('The lead becomes a record','Keep information organized.','The system keeps lead information organized and checks for duplicates.','New or matching leads are handled through the lead data table.','portfolio_leads','DATA TABLE'),
    s('Gemini receives the inquiry','AI reads the context.','Next, Gemini evaluates the customer’s request.','The model examines the inquiry to help identify sales potential.','Google Gemini','AI ANALYSIS'),
    s('Priority sorting','Focus on the right opportunities.','Inquiries are grouped by priority and sales potential.','High, medium and low categories support faster lead triage.','HIGH · MEDIUM · LOW','SMART ROUTING'),
    s('Relevant details are highlighted','Context matters.','That helps the team focus on meaningful opportunities first.','Service, budget and timing provide context for a review.','Website · $4,500 · 3 weeks','LEAD CONTEXT'),
    s('An email draft appears','Personalized first responses.','AI then prepares a response tailored to the inquiry.','The model prepares a subject and message based on the request.','AI draft prepared','EMAIL DRAFTING'),
    s('Draft quality control','Review-ready, not auto-sent.','Basic validation checks the draft before human review.','Subject and body are checked for completeness before approval.','Draft validation','QUALITY CHECKS'),
    s('The approval desk','Humans make the final call.','The business owner stays in control of communication.','The reviewer may approve, reject or request edits.','Approve · Revise · Reject','HUMAN APPROVAL'),
    s('Feedback leads to revision','Improve with feedback.','Feedback can guide revisions before approval.','AI can revise the initial draft based on human feedback.','Revision requested','REVISION LOOP'),
    s('Controlled Gmail draft','Prepared for delivery.','Approved content can move into a controlled Gmail drafting process.','Draft creation and manual sending are separate stages.','Gmail draft + verification','CONTROLLED SENDING'),
    s('Watch replies and bounces','Smarter follow-up decisions.','Follow-up checks consider timing, replies, and delivery failures.','A scheduled check reviews whether another draft is appropriate.','Due? Replied? Bounced?','MONITORING'),
    s('Duplicates are blocked','Avoid repeated follow-ups.','Duplicate checks help prevent repeated follow-up drafts.','The workflow checks whether a follow-up already exists.','Duplicate found → STOP','DUPLICATE PREVENTION'),
    s('Two workflows compared','Think in minutes saved.','Consider a simple efficiency scenario.','Illustrative triage and first-draft preparation comparison.','8 min manual · 3 min assisted','EFFICIENCY SCENARIO'),
    s('Time savings calculation','Small improvements compound.','Five minutes saved per inquiry adds up across a busy week.','At 50 inquiries, five minutes of savings each equals 250 minutes.','5 × 50 = 250 min','THE CALCULATION'),
    s('Productivity dashboard','More time returned to the team.','That’s roughly four hours of potential time reclaimed.','Projected reduction in preparation work—not a measured client result.','~4.2 hours / 50 leads','POTENTIAL IMPACT'),
    s('Customers and owner reconnect','More focus on relationships.','Time your team can spend building better customer relationships.','Less repetitive preparation allows more attention to real conversations.','Human time prioritized','BUSINESS VALUE'),
    s('Automation and people together','Automate the routine.','Automate the routine. Keep people in control.','An organized workflow supports the team, rather than replacing judgment.','People + systems','THE MESSAGE'),
    s('The invitation','Let’s build a smarter process.','Let’s build a more efficient workflow for your business.','Explore an AI-supported lead management process for your own business.','kennanegloria.xyz','LET’S CONNECT')
  ];
  const x=(v)=>String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const txt=(xx,yy,t,cls='',anchor='start')=>'<text x="'+xx+'" y="'+yy+'" class="'+cls+'" text-anchor="'+anchor+'">'+x(t)+'</text>';
  const rect=(xx,yy,w,h,cls='',rx=12)=>'<rect x="'+xx+'" y="'+yy+'" width="'+w+'" height="'+h+'" rx="'+rx+'" class="'+cls+'"/>';
  const path=(d,cls='')=>'<path d="'+d+'" class="'+cls+'"/>';
  const card=(xx,yy,w,h,label,sub='',cls='aw-svg-card')=>'<g class="aw-pop">'+rect(xx,yy,w,h,cls)+txt(xx+15,yy+28,label,'aw-svg-label')+(sub?txt(xx+15,yy+49,sub,'aw-svg-small'):'')+'</g>';
  const face=(expression='stress')=>{
    const brows=expression==='stress'?path('M-16 -3 L-6 0 M7 0 L17 -3','aw-line'):path('M-16 -4 Q-11 -7 -6 -4 M7 -4 Q12 -7 17 -4','aw-line');
    const mouth=expression==='stress'?path('M-7 20 Q0 14 7 20','aw-line'):path('M-10 13 Q0 25 10 13','aw-line');
    return brows+'<circle cx="-11" cy="4" r="2.5" class="aw-eye"/><circle cx="11" cy="4" r="2.5" class="aw-eye"/>'+mouth;
  };
  const human=(xx,yy,scale=1,expression='stress')=>'<g transform="translate('+xx+' '+yy+') scale('+scale+')" class="aw-person aw-bob">'+
    '<ellipse cx="0" cy="151" rx="86" ry="12" class="aw-svg-shadow"/>'+
    '<path d="M-46 70 Q-56 83 -55 108 L-61 147 L-28 147 L-20 103 L15 103 L29 147 L61 147 L53 90 Q48 72 25 69Z" class="aw-pants"/>'+
    '<path d="M-49 16 Q-71 30 -64 73 L-43 83 L-39 120 L36 120 L41 82 L62 72 Q69 29 48 16 Z" class="aw-shirt"/>'+
    '<path d="M-46 33 Q-80 61 -55 82" class="aw-arm"/><path d="M46 33 Q80 61 55 82" class="aw-arm"/>'+
    '<rect x="-10" y="4" width="20" height="30" rx="7" class="aw-skin"/>'+
    '<circle cx="0" cy="-25" r="42" class="aw-skin"/>'+
    '<path d="M-42 -22 Q-51 -75 -9 -79 Q36 -84 43 -41 Q19 -50 -6 -56 Q-26 -39 -42 -22Z" class="aw-hair"/>'+
    '<g transform="translate(0 -30)">'+face(expression)+'</g></g>';
  const bot=(xx,yy,scale=1,color='blue',action='')=>'<g transform="translate('+xx+' '+yy+') scale('+scale+')" class="aw-helper aw-pop '+(action||'')+'">'+
    '<ellipse cx="0" cy="78" rx="39" ry="7" class="aw-svg-shadow"/>'+
    '<path d="M0 -45 V-62" class="aw-bot-stroke"/><circle cx="0" cy="-65" r="6" class="aw-bot-antenna"/>'+
    '<rect x="-37" y="-47" width="74" height="84" rx="23" class="aw-bot-body '+color+'"/>'+
    '<rect x="-27" y="-32" width="54" height="42" rx="14" class="aw-bot-screen"/>'+
    '<circle cx="-13" cy="-12" r="5" class="aw-bot-eye"/><circle cx="13" cy="-12" r="5" class="aw-bot-eye"/>'+
    '<path d="M-8 2 Q0 10 8 2" class="aw-bot-smile"/>'+
    '<path d="M-37 -4 L-57 14 M37 -4 L57 14 M-15 37 L-21 63 M15 37 L21 63" class="aw-bot-stroke"/>'+
    '</g>';
  const laptop=(xx,yy)=>'<g transform="translate('+xx+' '+yy+')" class="aw-slide">'+
    rect(-84,-64,168,103,'aw-monitor',11)+rect(-70,-49,140,74,'aw-screen',5)+
    txt(0,-20,'INBOX / 24','aw-svg-small','middle')+path('M-50 -9 H46 M-50 3 H19','aw-muted-line')+
    path('M-113 44 L112 44 L131 59 L-130 59 Z','aw-monitor')+'</g>';
  const miniCustomer=(xx,yy,expression='neutral')=>'<g transform="translate('+xx+' '+yy+')" class="aw-pop">'+
    '<circle cx="0" cy="-20" r="25" class="aw-skin"/>'+
    '<path d="M-24 -27 Q-13 -56 18 -41 L24 -21" class="aw-hair"/>'+
    '<path d="M-37 12 Q0 -6 37 12 L44 57 L-44 57 Z" class="aw-shirt"/>'+
    '<circle cx="-8" cy="-20" r="2.3" class="aw-eye"/><circle cx="9" cy="-20" r="2.3" class="aw-eye"/>'+
    (expression==='happy'?path('M-8 -8 Q0 1 9 -8','aw-line'):path('M-7 -7 H8','aw-line'))+'</g>';
  const desk=(xx=160,yy=360)=>'<g>'+rect(xx-116,yy,232,14,'aw-desk',4)+rect(xx-100,yy+14,12,100,'aw-desk',1)+rect(xx+90,yy+14,12,100,'aw-desk',1)+'</g>';
  const arrow=(x1,y1,x2,y2)=>path('M'+x1+' '+y1+' H'+x2,'aw-arrow');
  const pct=(label,xx,yy,w)=>'<g>'+txt(xx,yy-9,label,'aw-svg-small')+rect(xx,yy,w,14,'aw-track',6)+'</g>';
  const bars=(xx,yy,vals)=>vals.map((v,i)=>'<g class="aw-bar-rise" style="--delay:'+(i*0.12)+'s">'+rect(xx+i*58,yy-v,35,v,'aw-bar',4)+'</g>').join('');
  const screen=(inner,scene)=>'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 465" preserveAspectRatio="xMidYMid meet" role="presentation" focusable="false">'+
    '<defs><pattern id="awgrid" width="44" height="44" patternUnits="userSpaceOnUse"><path d="M44 0 H0 V44" class="aw-grid-path"/></pattern></defs>'+
    '<rect width="900" height="465" class="aw-canvas-bg"/><rect width="900" height="465" fill="url(#awgrid)" opacity=".48"/>'+
    '<circle cx="775" cy="70" r="160" class="aw-halo"/><circle cx="140" cy="405" r="150" class="aw-halo muted"/>'+
    inner+'</svg>';
  function artFor(i){
    const scene=scenes[i];
    let h='';
    switch(i){
      case 0: h=desk(300,347)+human(300,252,.88)+laptop(301,311)+
        card(520,95,230,74,'NEW INQUIRY','Website project')+
        card(585,194,235,70,'UNREAD EMAILS','12 awaiting response')+
        card(500,290,254,70,'FOLLOW-UP NEEDED','Tomorrow / 09:00')+
        txt(145,104,'BUSY DAY','aw-svg-eyebrow');break;
      case 1: h=[140,450,755].map((a,k)=>card(a-105,145,210,182,['CUSTOMER 01','CUSTOMER 02','CUSTOMER 03'][k],['Waiting for a reply','Checking phone','Followed up again'][k])+miniCustomer(a,255)).join('')+
        txt(450,100,'INQUIRIES KEEP COMING','aw-svg-head','middle');break;
      case 2: h=desk(220,360)+human(210,260,.8)+laptop(215,315)+
        card(500,145,270,62,'INBOX','Maria / Website')+
        card(500,240,270,62,'SPREADSHEET','Maria / Website')+
        arrow(620,207,620,232)+txt(627,220,'COPY → PASTE','aw-svg-small');break;
      case 3: h=human(145,247,.83)+card(290,90,180,85,'EMAIL','23 unread')+
        card(540,100,190,85,'SHEETS','14 rows')+card(370,267,190,85,'TASK BOARD','Follow-ups')+
        path('M470 140 Q600 220 465 310 Q250 350 380 130','aw-tangle')+
        txt(465,75,'DISCONNECTED TOOLS','aw-svg-head','middle');break;
      case 4: h=human(195,260,.82)+card(430,135,310,170,'LEAD BOARD','3 requests in queue')+
        '<g class="aw-slide">'+rect(492,222,200,60,'aw-warning')+
        txt(515,249,'FOLLOW-UP MISSED','aw-svg-label')+txt(515,270,'Lead requires attention','aw-svg-small')+'</g>';break;
      case 5: h=desk(220,356)+human(220,258,.9)+
        '<circle cx="620" cy="216" r="123" class="aw-question-circle"/>'+
        txt(620,260,'?','aw-question','middle')+
        txt(620,90,'WHAT IF...','aw-svg-head','middle');break;
      case 6: h=human(172,269,.8,'happy')+
        bot(445,230,1.3,'blue')+bot(620,255,.99,'mint')+bot(765,260,.9,'white')+
        txt(580,91,'MEET THE HELPERS','aw-svg-head','middle');break;
      case 7: h=bot(190,230,1.1,'blue')+bot(450,230,1.1,'mint')+bot(710,230,1.1,'white')+
        txt(190,339,'PIXEL','aw-svg-label','middle')+txt(450,339,'BYTE','aw-svg-label','middle')+
        txt(710,339,'ECHO','aw-svg-label','middle')+
        txt(190,363,'CAPTURE','aw-svg-small','middle')+txt(450,363,'ORGANIZE','aw-svg-small','middle')+txt(710,363,'DRAFT','aw-svg-small','middle');break;
      case 8: h=[130,330,530,730].map((v,k)=>card(v-70,174,140,96,['INQUIRY','AI ROUTING','REVIEW','TRACKING'][k],['Validated','Prioritized','Approved','Monitored'][k])).join('')+
        path('M200 219 H260 M400 219 H460 M600 219 H660','aw-arrow')+
        bot(130,90,.58,'blue')+bot(530,90,.58,'white');break;
      case 9: h=[168,450,732].map((v,k)=>'<g>'+rect(v-112,135,224,178,'aw-svg-card')+
        txt(v,198,'0'+(k+1),'aw-number','middle')+
        txt(v,235,['CAPTURE','ANALYZE','FOLLOW UP'][k],'aw-svg-label','middle')+
        txt(v,262,['& ORGANIZE','& PREPARE','& MONITOR'][k],'aw-svg-small','middle')+'</g>').join('')+
        path('M280 221 H335 M564 221 H618','aw-arrow');break;
      case 10: h=rect(180,68,530,350,'aw-svg-card')+
        txt(215,104,'PROJECT INQUIRY','aw-svg-head')+
        [145,195,245,295].map((y,k)=>rect(216,y,458,34,'aw-form-line')+txt(228,y+23,['Name: Maria Santos','Email: maria@example.com','Service: Website Development','Budget: $4,500'][k],'aw-svg-small')).join('')+
        rect(485,348,185,44,'aw-submit')+txt(577,377,'SUBMIT →','aw-submit-text','middle')+bot(735,320,.72,'blue');break;
      case 11: h=card(65,165,230,112,'WEBSITE FORM','Customer submitted')+
        card(590,165,248,112,'N8N WEBHOOK','POST /portfolio-lead-intake')+
        path('M305 224 H584','aw-arrow')+rect(395,190,100,60,'aw-data-packet')+
        txt(445,216,'JSON','aw-packet-text','middle')+txt(445,236,'{ ... }','aw-svg-small','middle')+
        bot(449,330,.7,'blue');break;
      case 12: h=card(305,110,294,240,'VALIDATE FIELDS','')+
        ['Name','Email','Service','Budget','Consent'].map((v,k)=>txt(332,169+k*32,v,'aw-svg-label')+txt(567,169+k*32,'✓','aw-success-text','middle')).join('')+
        bot(181,225,1,'mint')+txt(450,395,'VALIDATION PASSED','aw-success-text','middle');break;
      case 13: h=card(105,135,230,170,'INQUIRY','Maria Santos')+
        card(590,135,225,170,'LEAD DATABASE','portfolio_leads')+
        path('M346 205 H575','aw-arrow')+bot(465,290,.85,'mint')+
        txt(466,93,'CHECK → SAVE / UPDATE','aw-svg-head','middle');break;
      case 14: h=bot(174,229,.98,'blue')+
        '<circle cx="492" cy="225" r="118" class="aw-engine"/>'+
        '<circle cx="492" cy="225" r="84" class="aw-engine-dashed"/>'+
        txt(492,224,'GEMINI','aw-engine-text','middle')+
        txt(492,253,'ANALYSIS','aw-svg-small','middle')+
        card(705,187,145,82,'OUTPUT','Priority')+
        path('M243 225 H365 M612 225 H699','aw-arrow');break;
      case 15: h=card(60,155,216,136,'LEAD','Website request')+
        [ 'HIGH','MEDIUM','LOW' ].map((v,k)=>'<g>'+rect(555,85+k*107,210,79,k===0?'aw-success-card':'aw-svg-card')+
        txt(660,119+k*107,v,'aw-svg-label','middle')+
        txt(660,144+k*107,k===0?'Clear timeline':'Other inquiry','aw-svg-small','middle')+'</g>').join('')+
        path('M287 217 H410 V119 H539 M410 217 H539 M410 217 V334 H539','aw-arrow')+
        bot(405,290,.65,'mint');break;
      case 16: h=card(158,94,583,296,'QUALIFIED LEAD','')+
        ['Website Development','Budget · $4,500','Three-week timeline'].map((v,k)=>'<g>'+rect(185,158+k*65,525,48,'aw-form-line')+
        txt(209,187+k*65,v,'aw-svg-label')+txt(679,189+k*65,'✓','aw-success-text','middle')+'</g>').join('')+
        bot(755,317,.68,'blue');break;
      case 17: h=bot(140,220,1,'white')+
        card(285,77,474,315,'NEW EMAIL DRAFT','')+
        txt(312,161,'SUBJECT: Website project follow-up','aw-svg-label')+
        path('M313 187 H731 M313 225 H680 M313 261 H701 M313 297 H615','aw-text-line')+
        txt(313,346,'Not sent · Awaiting review','aw-svg-small');break;
      case 18: h=card(220,91,469,309,'QUALITY CONTROL','')+
        ['Subject length','Message completeness','Draft format','Human review required'].map((v,k)=>txt(260,170+k*48,v,'aw-svg-label')+
        txt(632,170+k*48,k<3?'✓':'→',k<3?'aw-success-text':'aw-svg-label','middle')).join('')+
        bot(130,265,.8,'mint');break;
      case 19: h=human(176,269,.77,'happy')+
        card(330,98,434,280,'HUMAN APPROVAL','')+
        ['APPROVE','REVISE','REJECT'].map((v,k)=>rect(364,164+k*63,363,46,k===0?'aw-success-card':'aw-form-line')+
        txt(544,194+k*63,v,'aw-svg-label','middle')).join('');break;
      case 20: h=card(75,150,235,125,'FEEDBACK','Adjust the tone')+
        card(583,150,255,125,'REVISED DRAFT','Ready for review')+
        path('M325 210 H569','aw-arrow')+bot(445,293,1,'white')+
        txt(450,90,'REVIEW → REVISE → REVIEW','aw-svg-head','middle');break;
      case 21: h=card(148,130,250,176,'APPROVED CONTENT','Human-reviewed')+
        card(555,130,235,176,'GMAIL DRAFT','Verification queued')+
        path('M410 222 H539','aw-arrow')+bot(480,333,.71,'white')+
        txt(469,88,'CONTROLLED DRAFTING','aw-svg-head','middle');break;
      case 22: h=[177,450,724].map((v,k)=>'<g>'+rect(v-112,142,224,164,k===2?'aw-warning':'aw-svg-card')+
        txt(v,201,['DUE DATE','CUSTOMER REPLY','BOUNCE CHECK'][k],'aw-svg-label','middle')+
        txt(v,239,['Check schedule','Inspect thread','Block if failed'][k],'aw-svg-small','middle')+
        txt(v,279,['◷','✉','!'][k],'aw-number','middle')+'</g>').join('')+
        txt(451,97,'FOLLOW-UP ELIGIBILITY','aw-svg-head','middle');break;
      case 23: h=card(180,132,532,220,'FOLLOW-UP #1','Matching record found')+
        rect(315,244,268,59,'aw-warning')+
        txt(449,282,'STOP · DUPLICATE','aw-warning-text','middle')+
        bot(768,300,.76,'mint')+txt(450,100,'CHECK BEFORE CREATING','aw-svg-head','middle');break;
      case 24: h=card(75,118,325,258,'MANUAL PREPARATION','')+
        card(500,118,325,258,'AI-ASSISTED REVIEW','')+
        txt(233,240,'8 min','aw-big-number','middle')+txt(659,240,'3 min','aw-big-number','middle')+
        rect(112,292,250,30,'aw-warning')+rect(541,292,95,30,'aw-success-card')+
        txt(450,92,'ILLUSTRATIVE SCENARIO','aw-svg-head','middle');break;
      case 25: h=txt(450,121,'5 MIN × 50 INQUIRIES','aw-svg-head','middle')+
        txt(449,272,'250','aw-huge-number','middle')+txt(449,331,'MINUTES OF POTENTIAL SAVINGS','aw-svg-label','middle')+
        bot(150,311,.83,'blue')+bot(744,311,.83,'mint');break;
      case 26: h=card(110,64,676,347,'EFFICIENCY MODEL','')+
        txt(168,193,'~4.2 HOURS','aw-impact-number')+
        txt(170,232,'potential time reclaimed / 50 inquiries','aw-svg-label')+
        bars(460,340,[74,128,174,221])+
        txt(171,343,'NOT A MEASURED RESULT','aw-svg-small');break;
      case 27: h=human(242,265,.98,'happy')+
        miniCustomer(654,220,'happy')+
        bot(442,325,.56,'mint')+
        path('M341 210 Q450 135 562 207','aw-arrow')+
        txt(450,90,'MORE TIME FOR CUSTOMERS','aw-svg-head','middle');break;
      case 28: h=human(190,260,.82,'happy')+bot(393,254,.87,'blue')+
        bot(560,254,.84,'mint')+bot(725,254,.84,'white')+
        txt(450,100,'PEOPLE + AUTOMATION','aw-svg-head','middle')+
        txt(452,381,'HUMAN OVERSIGHT AT EVERY IMPORTANT DECISION','aw-svg-small','middle');break;
      case 29: h='<circle cx="450" cy="183" r="109" class="aw-logo-circle"/>'+
        txt(450,218,'K','aw-logo-letter','middle')+
        txt(450,330,'KENNAN EGLORIA','aw-outro-title','middle')+
        txt(450,363,'AI AUTOMATION & DIGITAL SYSTEMS','aw-svg-small','middle')+
        txt(450,407,'KENNANEGLORIA.XYZ','aw-outro-url','middle');break;
    }
    return screen(h,scene);
  }
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  let current=0,progress=0,playing=false,frame=0,last=0;
  const totalSeconds=()=>current*DURATION+progress;
  const clock=(seconds)=>{const rounded=Math.floor(Math.max(0,Math.min(TOTAL,seconds)));return String(Math.floor(rounded/60)).padStart(2,'0')+':'+String(rounded%60).padStart(2,'0')};
  function setUi(){
    const scene=scenes[current];
    const act=acts.filter(a=>a.index<=current).pop();
    art.innerHTML=artFor(current);
    art.setAttribute('aria-label',scene.visual+'. '+scene.detail);
    phase.textContent=act.title;
    category.textContent=act.name;
    counter.textContent='SCENE '+String(current+1).padStart(2,'0')+' / 30';
    visualTag.textContent=scene.label;
    title.textContent=scene.title;
    voiceover.textContent='“'+scene.vo+'”';
    description.textContent=scene.detail;
    metric.textContent=scene.proof;
    actButtons.forEach(b=>{const chosen=Number(b.dataset.awAct)===act.index;b.classList.toggle('active',chosen);b.setAttribute('aria-pressed',String(chosen))});
    seek.value=String(totalSeconds());
    seek.style.setProperty('--seek-progress',((totalSeconds()/TOTAL)*100)+'%');
    time.textContent=clock(totalSeconds());
    status.textContent=playing?'PLAYING':'PAUSED';
    root.classList.toggle('is-playing',playing);
    play.innerHTML=playing?'Ⅱ <span>Pause Film</span>':'▶ <span>Play Film</span>';
    play.setAttribute('aria-label',playing?'Pause animation':'Play animation');
  }
  function refreshTime(){
    seek.value=String(totalSeconds());
    seek.style.setProperty('--seek-progress',((totalSeconds()/TOTAL)*100)+'%');
    time.textContent=clock(totalSeconds());
  }
  function pause(){playing=false;last=0;if(frame)cancelAnimationFrame(frame);frame=0;setUi()}
  function tick(now){
    if(!playing)return;
    if(last)progress+=Math.min(0.08,(now-last)/1000);
    last=now;
    if(progress>=DURATION){
      progress-=DURATION;
      if(current===scenes.length-1){playing=false;progress=DURATION;setUi();return}
      current++;setUi();
    }
    refreshTime();
    frame=requestAnimationFrame(tick);
  }
  function start(){if(playing)return; if(totalSeconds()>=TOTAL){current=0;progress=0}
    playing=true;last=0;setUi();frame=requestAnimationFrame(tick)}
  function seekTo(seconds){
    const bounded=Math.min(TOTAL,Math.max(0,Number(seconds)||0));
    current=Math.min(scenes.length-1,Math.floor(bounded/DURATION));
    progress=bounded===TOTAL?DURATION:bounded-current*DURATION;
    last=0;setUi();
  }
  play.addEventListener('click',()=>playing?pause():start());
  previous.addEventListener('click',()=>seekTo(Math.max(0,(current-1)*DURATION)));
  next.addEventListener('click',()=>seekTo(Math.min(TOTAL,(current+1)*DURATION)));
  replay.addEventListener('click',()=>{seekTo(0);start()});
  seek.addEventListener('input',()=>seekTo(seek.value));
  actButtons.forEach(btn=>btn.addEventListener('click',()=>seekTo(Number(btn.dataset.awAct)*DURATION)));
  root.addEventListener('keydown',event=>{
    if(event.target===seek)return;
    if(event.key==='ArrowRight'){event.preventDefault();seekTo(Math.min(TOTAL,(current+1)*DURATION))}
    if(event.key==='ArrowLeft'){event.preventDefault();seekTo(Math.max(0,(current-1)*DURATION))}
  });
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&playing)pause()});
  if(reduced.addEventListener)reduced.addEventListener('change',()=>{if(reduced.matches&&playing)pause()});
  setUi();
  // Playback begins only on user command; reduced-motion viewers can advance frame by frame.
})();