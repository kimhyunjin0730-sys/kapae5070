/* ═══════════════════════════════════════════════════════
   ★ JourneySection V2
   고용정보 수집 → AI 워크그래피 → 매칭·추천
   실제 작동하는 검색·필터·인포그래픽 섹션
   app.js 의 기존 JourneySection 을 이 코드로 교체하세요.
═══════════════════════════════════════════════════════ */
const JourneySection = (() => {

  /* ── 데이터 ── */
  const SOURCES = [
    {
      id: 'worknet', color: '#3B7DD8', colorAlpha: 'rgba(59,125,216,.12)', colorBorder: 'rgba(59,125,216,.3)',
      icon: `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="2" y="3" width="16" height="12" rx="2"/><path d="M7 19h6M10 15v4"/></svg>`,
      label: '고용노동부 워크넷', sublabel: '공공 · 정부 공식 DB',
      count: 12847, newCount: 312,
      description: '고용노동부 공식 워크넷 DB. 중장년 우선채용, 신중년 특화 일자리, 재취업 지원 프로그램까지 포함.',
    },
    {
      id: 'public', color: '#0B8A5C', colorAlpha: 'rgba(11,138,92,.12)', colorBorder: 'rgba(11,138,92,.3)',
      icon: `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M3 17V8l7-5 7 5v9"/><rect x="7" y="11" width="6" height="6"/></svg>`,
      label: '공공기관 · 지자체', sublabel: '지역 공공 일자리 DB',
      count: 5391, newCount: 87,
      description: '17개 광역지자체 및 공공기관 채용공고. 사회적 일자리, 지역 맞춤형 중장년 일자리 포함.',
    },
    {
      id: 'private', color: '#7C3AED', colorAlpha: 'rgba(124,58,237,.12)', colorBorder: 'rgba(124,58,237,.3)',
      icon: `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="10" cy="7" r="3"/><path d="M3 17c0-3.3 3.1-6 7-6s7 2.7 7 6"/></svg>`,
      label: '사람인 · 잡코리아', sublabel: '민간 채용 플랫폼',
      count: 38204, newCount: 1843,
      description: '사람인, 잡코리아, 인크루트 등 주요 민간 채용 플랫폼. 경력직 채용, 전문직 포지션 중심 수집.',
    },
    {
      id: 'corporate', color: '#B8976A', colorAlpha: 'rgba(184,151,106,.12)', colorBorder: 'rgba(184,151,106,.3)',
      icon: `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="2" y="6" width="16" height="12" rx="1"/><path d="M6 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/><path d="M10 11v2M8 13h4"/></svg>`,
      label: '기업 직접 채용공고', sublabel: 'B2B · 자문 · 프로젝트',
      count: 4120, newCount: 134,
      description: '대기업·중견기업 자체 채용 페이지 직접 크롤링. 고문, 자문역, 단기 프로젝트, 파트타임 포지션 포함.',
    },
  ];

  const JOB_DATA = [
    { id:'j1', type:'employ', title:'생산관리 전문 컨설턴트', company:'중소기업진흥공단', source:'worknet', region:'서울·경기', salary:'월 350~500만', score:96, tags:['정규직','시니어우대'], fit:'제조업 20년 경력과 ISO 인증 경험이 직접 매칭됩니다.' },
    { id:'j2', type:'consult', title:'ISO 인증 품질 자문위원', company:'(주)한국품질연구원', source:'corporate', region:'전국(재택)', salary:'프로젝트 단위', score:91, tags:['자문','재택가능'], fit:'품질관리 암묵지 패턴이 자문 역할에 최적 매칭됩니다.' },
    { id:'j3', type:'edu', title:'제조업 직업훈련 강사', company:'한국산업인력공단', source:'public', region:'경기·인천', salary:'시간당 6~9만원', score:88, tags:['강의','유연근무'], fit:'현장 경험을 교육 콘텐츠로 전환할 수 있는 포지션입니다.' },
    { id:'j4', type:'project', title:'스마트공장 구축 PMO', company:'삼성전기 협력사', source:'private', region:'수원·화성', salary:'계약 협의', score:85, tags:['프로젝트','단기'], fit:'생산라인 구축 PMO 경험이 직접 활용됩니다.' },
    { id:'j5', type:'consult', title:'스타트업 제조 CTO 자문', company:'(주)애그리테크', source:'corporate', region:'판교', salary:'스톡옵션 포함', score:82, tags:['파트타임','스타트업'], fit:'기술 장인 DNA가 초기 스타트업에 높은 가치를 발휘합니다.' },
    { id:'j6', type:'employ', title:'품질보증 전문위원', company:'현대모비스 협력사', source:'private', region:'아산·천안', salary:'월 400~550만', score:79, tags:['전문직','시니어'], fit:'품질 시스템 구축 경험이 요구 역량과 일치합니다.' },
    { id:'j7', type:'edu', title:'기술창업 멘토 (제조분야)', company:'서울창업허브', source:'public', region:'서울', salary:'월 150~200만', score:74, tags:['멘토링','파트타임'], fit:'실전 창업 및 공장 운영 경험이 멘토링에 활용됩니다.' },
    { id:'j8', type:'project', title:'동남아 기술이전 자문', company:'KOTRA 자문단', source:'worknet', region:'해외(베트남)', salary:'협의', score:71, tags:['해외','단기'], fit:'글로벌 생산 경험 보유자에게 적합한 프로젝트입니다.' },
  ];

  const INFOGRAPHICS = [
    { label:'수집 소스', value:'4개', sub:'공공+민간+기업직접', color:'#3B7DD8' },
    { label:'총 공고', value:'60,562', sub:'실시간 업데이트', color:'#0B8A5C' },
    { label:'중장년 적합', value:'20,362', sub:'AI 분류 기준', color:'#7C3AED' },
    { label:'신규 (24h)', value:'2,376', sub:'어제 대비 +14%', color:'#B8976A' },
  ];

  const FEED_ITEMS = {
    worknet:  ['생산관리 팀장 (50대 우대)·워크넷','시니어 기술 자문위원·워크넷','중소기업 품질 컨설턴트·워크넷','경력단절 재취업 지원 사업·워크넷'],
    public:   ['지역 기술 멘토 전문가·서울시','중소기업 컨설턴트·경기도','직업훈련 강사 (제조)·고용센터','사회적기업 기술자문·중진공'],
    private:  ['공정개선 전문 매니저·사람인','ISO 인증 담당자·잡코리아','생산기술 전문위원·사람인','품질관리 책임자 (계약직)·잡코리아'],
    corporate:['스타트업 제조 자문·직접공고','공정 최적화 프리랜서·직접공고','신규 생산라인 PMO·직접공고','기술이전 해외자문·직접공고'],
  };

  const TYPE_LABELS = { employ:'재취업', consult:'자문·컨설팅', edu:'강의·교육', project:'프로젝트' };
  const SOURCE_NAMES = { worknet:'워크넷', public:'공공기관', private:'민간플랫폼', corporate:'기업직접' };

  /* ── CSS ── */
  const CSS = `
.js2-section{
  background:linear-gradient(180deg,#06111C 0%,#0A1824 50%,#060D14 100%);
  padding:120px 0;
  position:relative;
  overflow:hidden;
}
.js2-section::before{
  content:'';position:absolute;inset:0;
  background-image:linear-gradient(rgba(184,151,106,.018) 1px,transparent 1px),linear-gradient(90deg,rgba(184,151,106,.018) 1px,transparent 1px);
  background-size:72px 72px;pointer-events:none;
}
.js2-glow-l{position:absolute;top:20%;left:-200px;width:600px;height:600px;border-radius:50%;background:radial-gradient(circle,rgba(59,125,216,.06) 0%,transparent 70%);pointer-events:none;}
.js2-glow-r{position:absolute;bottom:10%;right:-200px;width:500px;height:500px;border-radius:50%;background:radial-gradient(circle,rgba(184,151,106,.05) 0%,transparent 70%);pointer-events:none;}
.js2-wrap{max-width:1280px;margin:0 auto;padding:0 60px;position:relative;z-index:2;}

/* ── Header ── */
.js2-hdr{text-align:center;margin-bottom:72px;}
.js2-eyebrow{display:inline-flex;align-items:center;gap:14px;margin-bottom:24px;}
.js2-eyebrow-line{width:40px;height:1px;background:linear-gradient(90deg,transparent,#B8976A);}
.js2-eyebrow-line.r{background:linear-gradient(90deg,#B8976A,transparent);}
.js2-eyebrow-text{font-family:'Cormorant Garamond',serif;font-size:11.5px;color:#B8976A;letter-spacing:.24em;text-transform:uppercase;}
.js2-title{font-family:'Noto Serif KR',serif;font-size:clamp(1.9rem,3.2vw,2.9rem);font-weight:400;color:#fff;line-height:1.3;letter-spacing:-.02em;margin-bottom:16px;}
.js2-title em{font-style:italic;color:#B8976A;}
.js2-subtitle{font-family:'Cormorant Garamond',serif;font-size:17px;font-weight:300;color:rgba(255,255,255,.3);letter-spacing:.1em;font-style:italic;}

/* ── Infographic band ── */
.js2-info-band{display:grid;grid-template-columns:repeat(4,1fr);gap:2px;margin-bottom:72px;background:rgba(184,151,106,.08);}
.js2-info-cell{background:#06111C;padding:28px 24px;text-align:center;position:relative;overflow:hidden;transition:background .3s;}
.js2-info-cell:hover{background:#0A1824;}
.js2-info-cell::after{content:'';position:absolute;bottom:0;left:0;width:100%;height:2px;transform:scaleX(0);transform-origin:left;transition:transform .4s var(--ease-out,cubic-bezier(.22,1,.36,1));}
.js2-info-cell:hover::after{transform:scaleX(1);}
.js2-info-num{font-family:'Bebas Neue',sans-serif;font-size:clamp(2rem,3.5vw,3rem);line-height:1;margin-bottom:6px;transition:color .3s;}
.js2-info-label{font-size:10px;font-weight:700;color:rgba(255,255,255,.35);letter-spacing:.18em;text-transform:uppercase;margin-bottom:4px;}
.js2-info-sub{font-size:11.5px;font-weight:300;color:rgba(255,255,255,.2);}

/* ── Flow diagram ── */
.js2-flow{display:grid;grid-template-columns:1fr 32px 1fr 32px 1fr;align-items:stretch;gap:0;margin-bottom:72px;}
.js2-flow-conn{display:flex;flex-direction:column;align-items:center;justify-content:center;padding-top:52px;}
.js2-flow-conn-inner{display:flex;flex-direction:column;align-items:center;gap:3px;}
.js2-conn-line{width:32px;height:1px;background:linear-gradient(90deg,rgba(184,151,106,.3),rgba(184,151,106,.8),rgba(184,151,106,.3));position:relative;overflow:hidden;}
.js2-conn-line::after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(255,255,255,.7),transparent);animation:jsConnFlow 2s linear infinite;}
@keyframes jsConnFlow{0%{transform:translateX(-100%)}100%{transform:translateX(200%)}}
.js2-conn-arrow{width:0;height:0;border-top:4px solid transparent;border-bottom:4px solid transparent;border-left:7px solid rgba(184,151,106,.7);}
.js2-conn-label{font-family:'Cormorant Garamond',serif;font-size:9.5px;color:rgba(184,151,106,.45);letter-spacing:.16em;text-transform:uppercase;margin-top:4px;}
.js2-flow-card{border:1px solid rgba(255,255,255,.06);background:rgba(255,255,255,.025);padding:32px 28px;position:relative;overflow:hidden;transition:background .3s,border-color .3s,transform .3s;}
.js2-flow-card:hover{background:rgba(255,255,255,.04);transform:translateY(-3px);}
.js2-flow-card::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;}
.js2-flow-card.c-gold::before{background:#B8976A;}
.js2-flow-card.c-purple::before{background:#7C3AED;}
.js2-flow-card.c-teal::before{background:#0B6E5A;}
.js2-flow-card:hover.c-gold{border-color:rgba(184,151,106,.25);}
.js2-flow-card:hover.c-purple{border-color:rgba(124,58,237,.25);}
.js2-flow-card:hover.c-teal{border-color:rgba(11,110,90,.25);}
.js2-flow-bg-num{position:absolute;right:16px;bottom:10px;font-family:'Bebas Neue',sans-serif;font-size:72px;line-height:1;color:rgba(255,255,255,.02);pointer-events:none;}
.js2-flow-step-no{font-family:'Cormorant Garamond',serif;font-size:10px;letter-spacing:.2em;text-transform:uppercase;margin-bottom:12px;}
.js2-flow-icon{width:44px;height:44px;border:1px solid;display:flex;align-items:center;justify-content:center;margin-bottom:20px;}
.js2-flow-icon.g{border-color:rgba(184,151,106,.3);color:#B8976A;}
.js2-flow-icon.p{border-color:rgba(124,58,237,.3);color:#A78BFA;}
.js2-flow-icon.t{border-color:rgba(11,110,90,.3);color:#4ade80;}
.js2-flow-icon svg{width:20px;height:20px;}
.js2-flow-title{font-family:'Noto Serif KR',serif;font-size:17px;font-weight:600;color:#fff;line-height:1.45;margin-bottom:12px;}
.js2-flow-desc{font-size:12.5px;font-weight:300;color:rgba(255,255,255,.42);line-height:1.95;margin-bottom:20px;}
.js2-flow-desc strong{font-weight:500;}
.c-gold .js2-flow-desc strong{color:#D4B896;}
.c-purple .js2-flow-desc strong{color:#C4B5FD;}
.c-teal .js2-flow-desc strong{color:#86EFAC;}
.js2-flow-features{display:flex;flex-direction:column;gap:7px;margin-bottom:20px;}
.js2-flow-feat{display:flex;align-items:flex-start;gap:8px;font-size:12px;color:rgba(255,255,255,.42);line-height:1.65;}
.js2-flow-feat-ic{flex-shrink:0;margin-top:1px;font-size:13px;}
.js2-flow-cta{display:inline-flex;align-items:center;gap:8px;padding:9px 18px;font-size:12px;font-weight:600;font-family:'Noto Sans KR',sans-serif;border:none;cursor:pointer;transition:.22s;text-decoration:none;}
.js2-flow-cta.g{background:rgba(184,151,106,.15);border:1px solid rgba(184,151,106,.3);color:#B8976A;}
.js2-flow-cta.g:hover{background:#B8976A;color:#06111C;}
.js2-flow-cta.p{background:rgba(124,58,237,.15);border:1px solid rgba(124,58,237,.35);color:#A78BFA;}
.js2-flow-cta.p:hover{background:#7C3AED;color:#fff;}
.js2-flow-cta.t{background:rgba(11,110,90,.15);border:1px solid rgba(11,110,90,.3);color:#4ade80;}
.js2-flow-cta.t:hover{background:rgba(11,110,90,.3);}
.js2-flow-cta-arrow{transition:transform .2s;}
.js2-flow-cta:hover .js2-flow-cta-arrow{transform:translateX(3px);}

/* ── Interactive panel ── */
.js2-panel{background:rgba(255,255,255,.02);border:1px solid rgba(184,151,106,.1);padding:0;margin-bottom:72px;overflow:hidden;}
.js2-panel-tabs{display:flex;border-bottom:1px solid rgba(255,255,255,.06);background:rgba(0,0,0,.2);}
.js2-ptab{flex:1;padding:16px 20px;font-size:12px;font-weight:500;font-family:'Noto Sans KR',sans-serif;color:rgba(255,255,255,.32);cursor:pointer;border-bottom:2px solid transparent;transition:.18s;text-align:center;letter-spacing:.04em;background:none;border-right:1px solid rgba(255,255,255,.04);}
.js2-ptab:last-child{border-right:none;}
.js2-ptab:hover{color:rgba(255,255,255,.6);}
.js2-ptab.on{color:#B8976A;border-bottom-color:#B8976A;background:rgba(184,151,106,.04);}
.js2-panel-body{padding:32px 36px;}

/* ── SOURCE explorer ── */
.js2-src-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-bottom:24px;}
.js2-src-card{border:1px solid rgba(255,255,255,.07);padding:20px;cursor:pointer;transition:border-color .2s,background .2s;position:relative;overflow:hidden;}
.js2-src-card::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;opacity:0;transition:opacity .2s;}
.js2-src-card.on{background:rgba(255,255,255,.04);}
.js2-src-card.on::before{opacity:1;}
.js2-src-card-top{display:flex;align-items:center;gap:12px;margin-bottom:14px;}
.js2-src-icon{width:36px;height:36px;border:1px solid;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.js2-src-icon svg{width:16px;height:16px;}
.js2-src-name{font-family:'Noto Serif KR',serif;font-size:14px;font-weight:500;color:#fff;}
.js2-src-type{font-size:11px;font-weight:300;color:rgba(255,255,255,.3);margin-top:2px;}
.js2-src-metrics{display:grid;grid-template-columns:1fr 1fr;gap:8px;}
.js2-src-metric{background:rgba(0,0,0,.2);padding:10px 12px;}
.js2-src-metric-num{font-family:'Bebas Neue',sans-serif;font-size:22px;line-height:1;margin-bottom:2px;}
.js2-src-metric-label{font-size:10px;color:rgba(255,255,255,.3);letter-spacing:.06em;}
.js2-feed-area{border:1px solid rgba(255,255,255,.06);padding:16px;background:rgba(0,0,0,.15);}
.js2-feed-hdr{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;}
.js2-feed-title{font-size:10px;font-weight:700;color:rgba(255,255,255,.3);letter-spacing:.18em;text-transform:uppercase;}
.js2-feed-pulse{display:flex;align-items:center;gap:5px;font-size:10px;color:rgba(255,255,255,.25);}
.js2-feed-pulse-dot{width:5px;height:5px;border-radius:50%;animation:js2Pulse 2s ease-in-out infinite;}
@keyframes js2Pulse{0%,100%{opacity:1}50%{opacity:.2}}
.js2-feed-list{display:flex;flex-direction:column;gap:5px;min-height:120px;}
.js2-feed-item{display:flex;align-items:center;gap:10px;padding:8px 10px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.04);font-size:12px;color:rgba(255,255,255,.5);animation:js2SlideIn .35s ease both;}
@keyframes js2SlideIn{from{opacity:0;transform:translateX(-10px)}to{opacity:1;transform:none}}
.js2-feed-dot{width:5px;height:5px;border-radius:50%;flex-shrink:0;}
.js2-feed-item-src{font-size:10px;color:rgba(255,255,255,.2);margin-left:auto;white-space:nowrap;padding-left:8px;}
.js2-src-desc-box{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);padding:14px 16px;margin-top:12px;font-size:12.5px;font-weight:300;color:rgba(255,255,255,.45);line-height:1.85;}
.js2-ai-bar-section{margin-top:20px;}
.js2-ai-bar-label{font-size:10px;font-weight:700;color:rgba(255,255,255,.3);letter-spacing:.16em;text-transform:uppercase;margin-bottom:8px;}
.js2-ai-bar-row{display:flex;align-items:center;gap:10px;margin-bottom:6px;}
.js2-ai-bar-name{font-size:11.5px;color:rgba(255,255,255,.4);min-width:100px;}
.js2-ai-bar-track{flex:1;height:4px;background:rgba(255,255,255,.06);overflow:hidden;}
.js2-ai-bar-fill{height:100%;transition:width 1.2s cubic-bezier(.22,1,.36,1);}
.js2-ai-bar-val{font-size:11px;color:rgba(255,255,255,.35);min-width:36px;text-align:right;}

/* ── MATCH tab ── */
.js2-match-controls{display:flex;align-items:center;gap:8px;margin-bottom:20px;flex-wrap:wrap;}
.js2-filter-btn{padding:7px 16px;border:1px solid rgba(255,255,255,.09);font-size:12px;color:rgba(255,255,255,.38);cursor:pointer;transition:.16s;font-family:'Noto Sans KR',sans-serif;background:none;letter-spacing:.03em;}
.js2-filter-btn:hover{border-color:rgba(184,151,106,.3);color:#D4B896;}
.js2-filter-btn.on{border-color:#B8976A;color:#D4B896;background:rgba(184,151,106,.08);}
.js2-match-sort{margin-left:auto;font-size:12px;color:rgba(255,255,255,.3);display:flex;align-items:center;gap:6px;}
.js2-match-sort select{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);color:rgba(255,255,255,.5);font-size:12px;padding:5px 10px;font-family:'Noto Sans KR',sans-serif;outline:none;cursor:pointer;}
.js2-match-sort select option{background:#0A1824;}
.js2-match-list{display:flex;flex-direction:column;gap:8px;}
.js2-match-item{border:1px solid rgba(255,255,255,.06);padding:16px 18px;display:grid;grid-template-columns:70px 1px 1fr auto;gap:16px;align-items:center;cursor:pointer;transition:background .18s,border-color .18s;position:relative;overflow:hidden;}
.js2-match-item::before{content:'';position:absolute;left:0;top:0;bottom:0;width:0;transition:width .25s;}
.js2-match-item:hover{background:rgba(255,255,255,.03);}
.js2-match-item.top-match::before{background:#B8976A;width:3px;}
.js2-match-item.top-match{border-color:rgba(184,151,106,.2);}
.js2-match-score-wrap{text-align:center;flex-shrink:0;}
.js2-match-score{font-family:'Bebas Neue',sans-serif;font-size:28px;line-height:1;margin-bottom:2px;}
.js2-match-score-label{font-size:9px;color:rgba(255,255,255,.2);letter-spacing:.1em;text-transform:uppercase;}
.js2-match-divider{width:1px;background:rgba(255,255,255,.06);align-self:stretch;}
.js2-match-info{}
.js2-match-top-badge{display:inline-block;font-size:9px;background:rgba(184,151,106,.15);border:1px solid rgba(184,151,106,.3);color:#B8976A;padding:2px 8px;letter-spacing:.1em;margin-bottom:6px;}
.js2-match-title{font-family:'Noto Serif KR',serif;font-size:15px;font-weight:500;color:#fff;margin-bottom:4px;}
.js2-match-company{font-size:12px;color:rgba(255,255,255,.35);margin-bottom:6px;display:flex;align-items:center;gap:8px;}
.js2-match-tags{display:flex;gap:5px;flex-wrap:wrap;}
.js2-match-tag{font-size:10.5px;padding:3px 9px;border:1px solid rgba(255,255,255,.08);color:rgba(255,255,255,.35);}
.js2-match-right{text-align:right;flex-shrink:0;}
.js2-match-salary{font-size:13px;font-weight:500;color:#B8976A;margin-bottom:6px;}
.js2-match-region{font-size:11px;color:rgba(255,255,255,.3);}
.js2-match-fit{display:none;border-top:1px solid rgba(255,255,255,.05);margin-top:12px;padding-top:12px;font-size:12px;color:rgba(255,255,255,.45);line-height:1.8;grid-column:1/-1;}
.js2-match-item.expanded .js2-match-fit{display:block;}
.js2-match-item.expanded{background:rgba(255,255,255,.04);}
.js2-no-results{padding:40px;text-align:center;color:rgba(255,255,255,.2);font-size:13px;}

/* ── Outcome ── */
.js2-outcome{display:grid;grid-template-columns:repeat(4,1fr);gap:2px;background:rgba(184,151,106,.08);}
.js2-outcome-cell{background:#06111C;padding:36px 28px;transition:background .3s;}
.js2-outcome-cell:hover{background:#0A1824;}
.js2-outcome-num{font-family:'Bebas Neue',sans-serif;font-size:clamp(2rem,3vw,2.8rem);color:#B8976A;line-height:1;margin-bottom:8px;}
.js2-outcome-title{font-family:'Noto Serif KR',serif;font-size:14px;font-weight:500;color:#fff;margin-bottom:6px;}
.js2-outcome-desc{font-size:12px;font-weight:300;color:rgba(255,255,255,.32);line-height:1.75;}

/* ── Responsive ── */
@media(max-width:1080px){
  .js2-flow{grid-template-columns:1fr;gap:24px;}
  .js2-flow-conn{display:none;}
  .js2-info-band{grid-template-columns:1fr 1fr;}
  .js2-outcome{grid-template-columns:1fr 1fr;}
  .js2-src-grid{grid-template-columns:1fr;}
}
@media(max-width:768px){
  .js2-section{padding:72px 0;}
  .js2-wrap{padding:0 24px;}
  .js2-info-band{grid-template-columns:1fr 1fr;}
  .js2-panel-body{padding:20px;}
  .js2-match-item{grid-template-columns:56px 1px 1fr;gap:10px;}
  .js2-match-right{display:none;}
  .js2-outcome{grid-template-columns:1fr 1fr;}
  .js2-panel-tabs{overflow-x:auto;}
  .js2-ptab{white-space:nowrap;font-size:11px;padding:14px 16px;}
}
@media(max-width:480px){
  .js2-src-grid{grid-template-columns:1fr;}
  .js2-outcome{grid-template-columns:1fr;}
  .js2-info-band{grid-template-columns:1fr 1fr;}
}
`;

  /* ── 아이콘 SVG ── */
  const ICONS = {
    clipboard:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/><path d="M9 12h6M9 16h4"/></svg>`,
    ai:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><circle cx="15" cy="9" r="2"/><circle cx="9" cy="15" r="2"/><circle cx="15" cy="15" r="2"/><circle cx="12" cy="12" r="1.5"/></svg>`,
    match:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>`,
  };

  /* ── HTML 빌더 ── */
  function buildHTML() {
    const infoBand = INFOGRAPHICS.map((info, i) => `
      <div class="js2-info-cell rv" style="--cell-color:${info.color};">
        <div class="js2-info-label">${info.label}</div>
        <div class="js2-info-num" id="js2InfoNum${i}" style="color:${info.color}">0</div>
        <div class="js2-info-sub">${info.sub}</div>
      </div>`).join('');

    const srcCards = SOURCES.map((s, i) => `
      <div class="js2-src-card ${i===0?'on':''}" id="jsSrc-${s.id}" onclick="JS2.selectSource('${s.id}')"
           style="--sc:${s.color};">
        <div class="js2-src-card::before" style="background:${s.color};"></div>
        <div class="js2-src-card-top">
          <div class="js2-src-icon" style="border-color:${s.colorBorder};color:${s.color};">${s.icon}</div>
          <div>
            <div class="js2-src-name">${s.label}</div>
            <div class="js2-src-type">${s.sublabel}</div>
          </div>
        </div>
        <div class="js2-src-metrics">
          <div class="js2-src-metric">
            <div class="js2-src-metric-num" style="color:${s.color};">${s.count.toLocaleString()}</div>
            <div class="js2-src-metric-label">전체 공고</div>
          </div>
          <div class="js2-src-metric">
            <div class="js2-src-metric-num" style="color:${s.color};">+${s.newCount.toLocaleString()}</div>
            <div class="js2-src-metric-label">오늘 신규</div>
          </div>
        </div>
      </div>`).join('');

    return `
<section class="js2-section rv" id="journey">
  <div class="js2-glow-l"></div>
  <div class="js2-glow-r"></div>
  <div class="js2-wrap">

    <!-- 헤더 -->
    <div class="js2-hdr rv">
      <div class="js2-eyebrow">
        <span class="js2-eyebrow-line"></span>
        <span class="js2-eyebrow-text">KAPAE × Purplenet · AI 고용정보 시스템</span>
        <span class="js2-eyebrow-line r"></span>
      </div>
      <h2 class="js2-title">경험을 수집하고, <em>워크그래피로</em> 만들고<br>새로운 일로 연결됩니다</h2>
      <p class="js2-subtitle">From Employment Data · Through Workgraphy · To Your Next Chapter</p>
    </div>

    <!-- 인포그래픽 밴드 -->
    <div class="js2-info-band rv d1">
      ${infoBand}
    </div>

    <!-- 3단계 플로우 -->
    <div class="js2-flow rv d2">
      <!-- STEP 1 -->
      <div class="js2-flow-card c-gold">
        <span class="js2-flow-bg-num">01</span>
        <div class="js2-flow-step-no" style="color:#B8976A;">STEP 01 · @ KAPAE</div>
        <div class="js2-flow-icon g">${ICONS.clipboard}</div>
        <h3 class="js2-flow-title">고용정보 수집<br>&amp; 경험 자산화</h3>
        <p class="js2-flow-desc">4개 소스에서 <strong>6만여 건의 공고를 AI가 실시간 수집</strong>합니다. 중장년 적합 여부를 자동 분류하고, 개인 경력 데이터와 매핑합니다.</p>
        <div class="js2-flow-features">
          <div class="js2-flow-feat"><span class="js2-flow-feat-ic">📊</span><span>고용노동부 워크넷 실시간 연동</span></div>
          <div class="js2-flow-feat"><span class="js2-flow-feat-ic">🔍</span><span>민간 플랫폼 + 기업 직접공고 크롤링</span></div>
          <div class="js2-flow-feat"><span class="js2-flow-feat-ic">⚙️</span><span>AI 중장년 적합도 자동 분류·정제</span></div>
          <div class="js2-flow-feat"><span class="js2-flow-feat-ic">📌</span><span>직무·스킬·산업 구조화 입력</span></div>
        </div>
        <button class="js2-flow-cta g" onclick="document.querySelector('.js2-ptab[data-tab=source]').click()">소스 탐색하기 <span class="js2-flow-cta-arrow">→</span></button>
      </div>
      <div class="js2-flow-conn"><div class="js2-flow-conn-inner"><div class="js2-conn-line"></div><div class="js2-conn-arrow"></div><div class="js2-conn-label">연동</div></div></div>
      <!-- STEP 2 -->
      <div class="js2-flow-card c-purple">
        <span class="js2-flow-bg-num">02</span>
        <div class="js2-flow-step-no" style="color:#A78BFA;">STEP 02 · @ Purplenet</div>
        <div class="js2-flow-icon p">${ICONS.ai}</div>
        <h3 class="js2-flow-title">AI 워크그래피<br>생성 &amp; 경험 진단</h3>
        <p class="js2-flow-desc">수집 정보를 바탕으로 <strong>AI가 워크그래피를 자동 생성</strong>합니다. 이력서가 아닌 "일할 수 있는 능력의 좌표"로 구조화합니다.</p>
        <div class="js2-flow-features">
          <div class="js2-flow-feat"><span class="js2-flow-feat-ic">🤖</span><span>AI 인터뷰 + 자동 편집 워크그래피 생성</span></div>
          <div class="js2-flow-feat"><span class="js2-flow-feat-ic">💎</span><span>경험 가치 진단 (100점) + 암묵지 분석</span></div>
          <div class="js2-flow-feat"><span class="js2-flow-feat-ic">🎯</span><span>전환 가능 직무 AI 추천 및 포트폴리오화</span></div>
          <div class="js2-flow-feat"><span class="js2-flow-feat-ic">📖</span><span>디지털 암묵지북 / 클래스 콘텐츠 생성</span></div>
        </div>
        <a href="https://purplnetlanding.vercel.app/" target="_blank" class="js2-flow-cta p">퍼플넷에서 만들기 <span class="js2-flow-cta-arrow">→</span></a>
      </div>
      <div class="js2-flow-conn"><div class="js2-flow-conn-inner"><div class="js2-conn-line"></div><div class="js2-conn-arrow"></div><div class="js2-conn-label">매칭</div></div></div>
      <!-- STEP 3 -->
      <div class="js2-flow-card c-teal">
        <span class="js2-flow-bg-num">03</span>
        <div class="js2-flow-step-no" style="color:#4ade80;">STEP 03 · @ KAPAE</div>
        <div class="js2-flow-icon t">${ICONS.match}</div>
        <h3 class="js2-flow-title">매칭·추천<br>&amp; 진로 코칭</h3>
        <p class="js2-flow-desc">워크그래피 기반으로 <strong>AI 일자리 매칭</strong>과 교육·자격증 연계, 1:1 진로 코칭까지 KAPAE가 원스톱 지원합니다.</p>
        <div class="js2-flow-features">
          <div class="js2-flow-feat"><span class="js2-flow-feat-ic">🔗</span><span>재취업·자문·강연·프로젝트 AI 매칭</span></div>
          <div class="js2-flow-feat"><span class="js2-flow-feat-ic">🎓</span><span>직업교육 연결 · 자격증 발급 · 인증</span></div>
          <div class="js2-flow-feat"><span class="js2-flow-feat-ic">🧭</span><span>1:1 진로 상담 및 생애설계 코칭</span></div>
          <div class="js2-flow-feat"><span class="js2-flow-feat-ic">🌐</span><span>산업별 문제해결 프로젝트 연결</span></div>
        </div>
        <button class="js2-flow-cta t" onclick="document.querySelector('.js2-ptab[data-tab=match]').click()">매칭 결과 보기 <span class="js2-flow-cta-arrow">→</span></button>
      </div>
    </div>

    <!-- 인터랙티브 패널 -->
    <div class="js2-panel rv d2">
      <div class="js2-panel-tabs">
        <button class="js2-ptab on" data-tab="source" onclick="JS2.switchTab('source')">📊 고용정보 소스 탐색</button>
        <button class="js2-ptab" data-tab="match" onclick="JS2.switchTab('match')">🎯 AI 매칭 결과 데모</button>
      </div>
      <div class="js2-panel-body">

        <!-- SOURCE 탭 -->
        <div id="js2Tab-source">
          <div class="js2-src-grid">${srcCards}</div>
          <div class="js2-feed-area">
            <div class="js2-feed-hdr">
              <div class="js2-feed-title" id="js2FeedTitle">실시간 수집 피드 · 고용노동부 워크넷</div>
              <div class="js2-feed-pulse"><span class="js2-feed-pulse-dot" style="background:#B8976A;"></span>실시간 수집 중</div>
            </div>
            <div class="js2-feed-list" id="js2FeedList"></div>
            <div class="js2-src-desc-box" id="js2SrcDesc"></div>
          </div>
          <div class="js2-ai-bar-section">
            <div class="js2-ai-bar-label">AI 분류 처리 현황</div>
            ${[
              {label:'중장년 키워드 필터', val:92, color:'#3B7DD8'},
              {label:'연령 적합도 분류', val:87, color:'#0B8A5C'},
              {label:'직무 매핑', val:78, color:'#7C3AED'},
              {label:'중복 제거', val:95, color:'#B8976A'},
            ].map(b=>`
            <div class="js2-ai-bar-row">
              <div class="js2-ai-bar-name">${b.label}</div>
              <div class="js2-ai-bar-track"><div class="js2-ai-bar-fill js2-bar-animate" data-val="${b.val}" style="width:0%;background:${b.color};"></div></div>
              <div class="js2-ai-bar-val">${b.val}%</div>
            </div>`).join('')}
          </div>
        </div>

        <!-- MATCH 탭 -->
        <div id="js2Tab-match" style="display:none;">
          <div class="js2-match-controls">
            <button class="js2-filter-btn on" data-type="all" onclick="JS2.filterMatch(this,'all')">전체 (${JOB_DATA.length})</button>
            ${Object.entries(TYPE_LABELS).map(([k,v])=>`<button class="js2-filter-btn" data-type="${k}" onclick="JS2.filterMatch(this,'${k}')">${v} (${JOB_DATA.filter(j=>j.type===k).length})</button>`).join('')}
            <div class="js2-match-sort">
              정렬:
              <select id="js2SortSel" onchange="JS2.sortMatch()">
                <option value="score">적합도 높은 순</option>
                <option value="salary">급여 높은 순</option>
                <option value="new">최신순</option>
              </select>
            </div>
          </div>
          <div class="js2-match-list" id="js2MatchList"></div>
        </div>

      </div>
    </div>

    <!-- 기대효과 -->
    <div class="js2-outcome rv d3">
      ${[
        {num:'01', title:'경험의 객관화', desc:'감(感)이 아닌 구조화된 데이터로 나의 능력을 증명합니다'},
        {num:'02', title:'경험의 상품화', desc:'암묵지를 디지털 자산·콘텐츠·수익 모델로 전환합니다'},
        {num:'03', title:'컨설팅 역량 강화', desc:'산업별 문제 해결 프로젝트로 전문 컨설턴트로 성장합니다'},
        {num:'04', title:'미래 준비', desc:'퍼플넷 네트워크를 통해 지속가능한 커리어를 설계합니다'},
      ].map(o=>`
      <div class="js2-outcome-cell rv">
        <div class="js2-outcome-num">${o.num}</div>
        <div class="js2-outcome-title">${o.title}</div>
        <div class="js2-outcome-desc">${o.desc}</div>
      </div>`).join('')}
    </div>

  </div>
</section>`;
  }

  /* ── JS 로직 ── */
  let currentSource = 'worknet';
  let feedInterval = null;
  let feedIdx = 0;
  let currentType = 'all';
  let inited = false;

  function initScrollReveal2() {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('vis'); });
    }, { threshold: 0.06 });
    document.querySelectorAll('#journey .rv').forEach(el => obs.observe(el));
  }

  function animateInfoNums() {
    INFOGRAPHICS.forEach((info, i) => {
      const el = document.getElementById(`js2InfoNum${i}`);
      if (!el) return;
      const raw = info.value.replace(/[^0-9]/g, '');
      const target = parseInt(raw, 10);
      if (!target) { el.textContent = info.value; return; }
      const isK = info.value.includes(',');
      let start = 0;
      const steps = 50;
      const step = () => {
        start++;
        const pct = start / steps;
        const ease = 1 - Math.pow(1 - pct, 3);
        const val = Math.round(target * ease);
        el.textContent = isK ? val.toLocaleString() : info.value.replace(raw, val.toString());
        if (start < steps) requestAnimationFrame(step);
        else el.textContent = info.value;
      };
      setTimeout(() => requestAnimationFrame(step), i * 120);
    });
  }

  function animateBars() {
    document.querySelectorAll('.js2-bar-animate').forEach(bar => {
      const val = bar.dataset.val;
      setTimeout(() => { bar.style.width = val + '%'; }, 400);
    });
  }

  function startFeed(srcId) {
    clearInterval(feedInterval);
    feedIdx = 0;
    const list = document.getElementById('js2FeedList');
    if (!list) return;
    list.innerHTML = '';
    const items = FEED_ITEMS[srcId] || [];
    const src = SOURCES.find(s => s.id === srcId);

    feedInterval = setInterval(() => {
      if (list.children.length >= 5) list.removeChild(list.firstChild);
      const raw = items[feedIdx % items.length];
      const [text, srcLabel] = raw.split('·');
      const d = document.createElement('div');
      d.className = 'js2-feed-item';
      d.style.animationDelay = '0ms';
      d.innerHTML = `<span class="js2-feed-dot" style="background:${src.color};"></span>${text.trim()}<span class="js2-feed-item-src">${srcLabel ? srcLabel.trim() : ''}</span>`;
      list.appendChild(d);
      feedIdx++;
    }, 1300);
  }

  function selectSource(srcId) {
    currentSource = srcId;
    document.querySelectorAll('.js2-src-card').forEach(c => {
      const isOn = c.id === `jsSrc-${srcId}`;
      c.classList.toggle('on', isOn);
      // 선택된 카드에 좌측 컬러 바
      c.style.borderLeftColor = isOn ? (SOURCES.find(s=>s.id===srcId)||{}).color || '' : '';
      c.style.borderLeftWidth = isOn ? '3px' : '1px';
    });
    const src = SOURCES.find(s => s.id === srcId);
    if (!src) return;
    const title = document.getElementById('js2FeedTitle');
    if (title) title.textContent = `실시간 수집 피드 · ${src.label}`;
    const desc = document.getElementById('js2SrcDesc');
    if (desc) desc.textContent = src.description;
    startFeed(srcId);
  }

  function switchTab(tab) {
    document.querySelectorAll('.js2-ptab').forEach(t => t.classList.toggle('on', t.dataset.tab === tab));
    document.getElementById('js2Tab-source').style.display = tab === 'source' ? 'block' : 'none';
    document.getElementById('js2Tab-match').style.display = tab === 'match' ? 'block' : 'none';
    if (tab === 'match') renderMatchList();
  }

  function filterMatch(btn, type) {
    currentType = type;
    document.querySelectorAll('.js2-filter-btn').forEach(b => b.classList.remove('on'));
    btn.classList.add('on');
    renderMatchList();
  }

  function sortMatch() { renderMatchList(); }

  function renderMatchList() {
    const list = document.getElementById('js2MatchList');
    if (!list) return;
    let items = currentType === 'all' ? [...JOB_DATA] : JOB_DATA.filter(j => j.type === currentType);
    const sort = document.getElementById('js2SortSel')?.value || 'score';
    if (sort === 'score') items.sort((a,b) => b.score - a.score);
    else if (sort === 'new') items.sort((a,b) => a.id < b.id ? 1 : -1);

    if (!items.length) {
      list.innerHTML = `<div class="js2-no-results">해당 유형의 매칭 결과가 없습니다.</div>`;
      return;
    }
    const scoreColor = s => s >= 90 ? '#4ade80' : s >= 80 ? '#B8976A' : '#6b7280';
    list.innerHTML = items.map((item, idx) => `
      <div class="js2-match-item ${item.score >= 90 ? 'top-match' : ''}" id="jm-${item.id}" onclick="JS2.toggleMatch('${item.id}')" style="animation:js2SlideIn ${idx*60}ms ease both;">
        ${item.score >= 90 ? `<div class="js2-match-top-badge" style="display:none;">★ 최우선 추천</div>` : ''}
        <div class="js2-match-score-wrap">
          <div class="js2-match-score" style="color:${scoreColor(item.score)};">${item.score}%</div>
          <div class="js2-match-score-label">적합도</div>
        </div>
        <div class="js2-match-divider"></div>
        <div class="js2-match-info">
          ${item.score >= 90 ? `<span class="js2-match-top-badge">★ 최우선 추천</span>` : ''}
          <div class="js2-match-title">${item.title}</div>
          <div class="js2-match-company">
            ${item.company}
            <span style="font-size:10px;padding:1px 7px;border:1px solid rgba(255,255,255,.08);color:rgba(255,255,255,.25);">${SOURCE_NAMES[item.source]}</span>
            <span style="font-size:10px;padding:1px 7px;border:1px solid rgba(255,255,255,.08);color:rgba(255,255,255,.25);">${TYPE_LABELS[item.type]}</span>
          </div>
          <div class="js2-match-tags">${item.tags.map(t=>`<span class="js2-match-tag">${t}</span>`).join('')}</div>
        </div>
        <div class="js2-match-right">
          <div class="js2-match-salary">${item.salary}</div>
          <div class="js2-match-region">📍 ${item.region}</div>
        </div>
        <div class="js2-match-fit">💡 <strong style="color:#D4B896;">AI 매칭 근거:</strong> ${item.fit}</div>
      </div>`).join('');
  }

  function toggleMatch(id) {
    const el = document.getElementById(`jm-${id}`);
    if (el) el.classList.toggle('expanded');
  }

  function init() {
    /* CSS 주입 */
    if (!document.getElementById('js2CSS')) {
      const st = document.createElement('style');
      st.id = 'js2CSS';
      st.textContent = CSS;
      document.head.appendChild(st);
    }

    /* HTML 삽입 — #purplenet 뒤 */
    const anchor = document.getElementById('purplenet') || document.getElementById('history');
    if (anchor) {
      anchor.insertAdjacentHTML('afterend', buildHTML());
    } else {
      document.body.insertAdjacentHTML('beforeend', buildHTML());
    }

    /* 전역 노출 */
    window.JS2 = { selectSource, switchTab, filterMatch, sortMatch, toggleMatch };

    /* 인포 셀 after 색상 — JS로 직접 */
    INFOGRAPHICS.forEach((info, i) => {
      const cells = document.querySelectorAll('.js2-info-cell');
      if (cells[i]) cells[i].style.setProperty('--cell-color', info.color);
    });

    /* 셀 hover border bottom 색상 동적 주입 */
    INFOGRAPHICS.forEach((info, i) => {
      const cells = document.querySelectorAll('.js2-info-cell');
      if (!cells[i]) return;
      cells[i].addEventListener('mouseenter', () => {
        cells[i].style.borderBottom = `2px solid ${info.color}`;
      });
      cells[i].addEventListener('mouseleave', () => {
        cells[i].style.borderBottom = '';
      });
    });

    /* src card 선택 초기화 */
    selectSource('worknet');

    /* IntersectionObserver — 섹션 노출 시 애니메이션 */
    const sectionEl = document.getElementById('journey');
    if (sectionEl) {
      const obs = new IntersectionObserver(entries => {
        entries.forEach(e => {
          if (e.isIntersecting && !inited) {
            inited = true;
            animateInfoNums();
            setTimeout(animateBars, 600);
          }
        });
      }, { threshold: 0.08 });
      obs.observe(sectionEl);
    }

    /* 스크롤 리빌 */
    initScrollReveal2();
  }

  return { init };
})();
