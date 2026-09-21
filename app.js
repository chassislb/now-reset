(function () {
  "use strict";

  var STORAGE_KEY = "shift_profile_v1";

  var ROLE_SUGGESTIONS = ["Professional", "Parent", "Partner", "Friend", "Daughter/Sibling", "Creative", "Leader"];

  var BODY_RESETS = [
    { type: "breath", seconds: 90, label: "Slow-exhale breathing", text: "Breathe in through your nose for 4 counts. Hold for 4. Exhale slowly through your mouth for 8. Repeat until the timer ends." },
    { type: "senses", seconds: 75, label: "5-4-3-2-1 senses", text: "Name 5 things you can see. 4 you can touch. 3 you can hear. 2 you can smell. 1 you can taste." },
    { type: "bodyscan", seconds: 60, label: "Body scan", text: "Starting at your jaw, consciously relax: jaw, shoulders, hands, stomach, legs." },
    { type: "movement", seconds: 45, label: "Movement", text: "Stand up. Roll your shoulders back 5 times. Shake out your hands. Sit back down." },
    { type: "cold", seconds: 40, label: "Cold-water reset", text: "Run cold water over your wrists, or splash your face with cold water." }
  ];

  var ASSUMPTION_PHRASES = ["trying to", "wants to", "thinks i", "thinks that", "hates me", "doesn't care", "don't care", "doesn't respect", "on purpose", "meant to", "always does", "always doing", "never listens", "is trying", "probably thinks", "must think", "wanted to hurt", "knows exactly"];

  var DECISION_OPTIONS = [
    { id: "ignore", label: "Ignore it" },
    { id: "let-go", label: "Let it go" },
    { id: "say-no", label: "Say no" },
    { id: "set-boundary", label: "Set a boundary" },
    { id: "address-calmly", label: "Address it calmly" },
    { id: "practical-action", label: "Take practical action" },
    { id: "deal-later", label: "Deal with it later" }
  ];

  var SUGGESTED_BY_ENERGY = {
    "yes": ["address-calmly", "set-boundary", "practical-action"],
    "not-now": ["deal-later"],
    "no": ["ignore", "let-go"]
  };

  var CLOSE_LINES = {
    "ignore": { direct: "Don't respond. Don't check again today.", warm: "You don't owe this a response. Let it sit.", gentle: "You're allowed to simply not respond to this." },
    "let-go": { direct: "It's closed. Don't reopen it in your head.", warm: "This one's done — let your mind close the tab too.", gentle: "You can release this now. It doesn't need to live in your head anymore." },
    "say-no": { direct: "Say no. One sentence. No justification.", warm: "Say no plainly — you don't need to explain yourself.", gentle: "A simple 'no' is a complete sentence. You don't owe more than that." },
    "set-boundary": { direct: "State the boundary once. Calmly. Then hold it.", warm: "Name the boundary clearly and kindly — then hold it, even if it's uncomfortable.", gentle: "Let them know where the line is, gently but firmly — and trust yourself to hold it." },
    "address-calmly": { direct: "Say what needs saying. Facts only. Then stop.", warm: "Say what's true, stay steady, and let that be enough.", gentle: "You can speak your truth calmly — you don't need to convince anyone." },
    "practical-action": { direct: "Do the next concrete step. Nothing else.", warm: "Take the one practical step in front of you — that's all this needs right now.", gentle: "Just the next small, practical step. That's enough for now." },
    "deal-later": { direct: "Not now. Set a time. Close this.", warm: "You're allowed to shelve this until you're ready — just pick when.", gentle: "It's okay to come back to this later, when you have more capacity." }
  };

  var TONE_COPY = {
    facts: { direct: "What literally happened? Just the facts. No mind-reading.", warm: "Let's start with what actually happened — just the facts, not what you think it meant.", gentle: "Take a breath. Now tell me only what happened — not what you imagine they meant by it." },
    energy: { direct: "Answer honestly. Not how it feels — what it actually is.", warm: "Be honest with yourself here — feelings aren't the same as facts.", gentle: "It's okay to feel something and still decide it doesn't need your energy." },
    control: { direct: "Own your column. Let go of theirs.", warm: "Focus on your column — the other one was never yours to carry.", gentle: "You only ever have to manage your own column. The rest isn't yours to hold." },
    body: { direct: "One reset. Then move.", warm: "Just this one thing — then we keep going.", gentle: "Just a moment for your body before we continue." },
    identity: { direct: "Not who you were when this happened. Who you decided to be. Their read of you isn't evidence.", warm: "Remember who you're building yourself into — their opinion of you doesn't get a vote in that.", gentle: "You get to choose to respond as the person you're becoming. What they think of you isn't proof of anything." }
  };

  var PATTERN_UNLOCK = 10;

  var SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;

  function micButton(targetId) {
    if (!SpeechRecognitionCtor) return "";
    return '<button type="button" class="mic-btn" data-action="mic-toggle" data-target="' + targetId + '">🎤</button>';
  }

  function setFieldValue(el, value) {
    var setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
    setter.call(el, value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }

  function stopMic() {
    document.querySelectorAll(".mic-btn.listening").forEach(function (b) { b.classList.remove("listening"); });
    state.mic.recognition = null;
    state.mic.targetId = null;
  }

  function toggleMic(targetId) {
    if (state.mic.recognition && state.mic.targetId === targetId) {
      state.mic.recognition.stop();
      return;
    }
    if (state.mic.recognition) state.mic.recognition.stop();
    var el = document.getElementById(targetId);
    if (!el) return;
    var baseText = el.value;
    var rec = new SpeechRecognitionCtor();
    rec.lang = navigator.language || "en-US";
    rec.continuous = true;
    rec.interimResults = true;
    rec.onstart = function () {
      document.querySelectorAll('.mic-btn[data-target="' + targetId + '"]').forEach(function (b) { b.classList.add("listening"); });
    };
    rec.onresult = function (e) {
      var finalText = "";
      var interim = "";
      for (var i = e.resultIndex; i < e.results.length; i++) {
        var transcript = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalText += transcript;
        else interim += transcript;
      }
      if (finalText) baseText = (baseText ? baseText.replace(/\s+$/, "") + " " : "") + finalText.trim();
      setFieldValue(el, baseText + (interim ? (baseText ? " " : "") + interim : ""));
    };
    rec.onerror = function () { stopMic(); };
    rec.onend = function () { stopMic(); };
    state.mic.recognition = rec;
    state.mic.targetId = targetId;
    rec.start();
  }

  function defaultProfile() {
    return {
      onboarded: false,
      identitySentence: "",
      roles: [],
      bestSelfWord: "",
      oldPattern: "",
      newPattern: "",
      values: [],
      valuesBreakUnder: "",
      valuesConflictWinner: "",
      boundaries: [],
      nonNegotiables: [],
      boundaryNotHeld: "",
      boundaryCost: "",
      triggerCategories: [],
      oldReactions: [],
      whoseOpinion: "",
      storyWhenDisrespected: "",
      energyWorthy: [],
      energyNotWorthy: [],
      decisionWorthyExample: "",
      regretAction: "",
      truthAfter24h: "",
      whatMustBeTrue: [],
      ruleBeforeResponding: "",
      resetsLog: [],
      lastTone: null,
      lastBodyType: null,
      groqApiKey: "",
      groqModel: "llama-3.3-70b-versatile"
    };
  }

  function loadProfile() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultProfile();
      var parsed = JSON.parse(raw);
      return Object.assign(defaultProfile(), parsed);
    } catch (e) {
      return defaultProfile();
    }
  }

  function saveProfile() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.profile)); } catch (e) {}
  }

  var ONBOARD_STEPS = ["intro", "identity-1", "identity-2", "values", "boundaries-1", "boundaries-2", "traps-1", "traps-2", "energy", "rules", "done"];

  var state = {
    profile: loadProfile(),
    screen: "home",
    onboardIndex: 0,
    reset: null,
    timerHandle: null,
    decode: null,
    mic: { recognition: null, targetId: null },
    anchorOffset: 0
  };

  function buildAnchorPool(p) {
    var pool = [];
    if (p.identitySentence) pool.push(p.identitySentence);
    p.values.forEach(function (v) { pool.push("You value " + v + "."); });
    p.nonNegotiables.forEach(function (v) { pool.push("Non-negotiable: " + v + "."); });
    p.roles.forEach(function (r) { if (r.descriptor) pool.push(r.role + ": " + r.descriptor); });
    if (p.ruleBeforeResponding) pool.push("Your rule: " + p.ruleBeforeResponding);
    if (p.newPattern) pool.push("You're building: " + p.newPattern);
    return pool;
  }

  function dayOfYear(d) {
    var start = new Date(d.getFullYear(), 0, 0);
    return Math.floor((d - start) / 86400000);
  }

  function getAnchorText() {
    var pool = buildAnchorPool(state.profile);
    if (!pool.length) return "Add your values and identity in Settings to see your daily anchor here.";
    var idx = (dayOfYear(new Date()) + (state.anchorOffset || 0)) % pool.length;
    return pool[idx];
  }

  if (!state.profile.onboarded) state.screen = "onboarding";

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function startOfWeek(d) {
    var date = new Date(d);
    var day = date.getDay();
    var diff = (day === 0 ? -6 : 1) - day;
    date.setDate(date.getDate() + diff);
    date.setHours(0, 0, 0, 0);
    return date.getTime();
  }

  function resetsThisWeek() {
    var wk = startOfWeek(Date.now());
    return state.profile.resetsLog.filter(function (r) { return r.ts >= wk; }).length;
  }

  // ---------- generic field renderers ----------

  function tagList(scope, field, tags, opts) {
    opts = opts || {};
    var html = '<div class="tag-row">';
    (tags || []).forEach(function (t) {
      html += '<span class="chip removable"><span>' + esc(t) + '</span><span class="x" data-action="remove-tag" data-scope="' + scope + '" data-field="' + field + '" data-value="' + esc(t) + '">×</span></span>';
    });
    html += "</div>";
    html += '<div class="tag-input-row"><input type="text" class="tag-input-field" data-scope="' + scope + '" data-field="' + field + '" placeholder="' + esc(opts.placeholder || "Type and press +") + '" />';
    html += '<button class="addbtn" data-action="add-tag" data-scope="' + scope + '" data-field="' + field + '">+</button></div>';
    if (opts.suggestions && opts.suggestions.length) {
      html += '<div class="tag-row" style="margin-top:10px">';
      opts.suggestions.forEach(function (s) {
        if ((tags || []).indexOf(s) === -1) {
          html += '<span class="chip suggested-add" data-action="add-tag-value" data-scope="' + scope + '" data-field="' + field + '" data-value="' + esc(s) + '">+ ' + esc(s) + "</span>";
        }
      });
      html += "</div>";
    }
    return html;
  }

  function textField(scope, field, value, placeholder) {
    return '<input type="text" data-scope="' + scope + '" data-field="' + field + '" data-action="text-input" value="' + esc(value || "") + '" placeholder="' + esc(placeholder || "") + '" />';
  }

  function textareaField(scope, field, value, placeholder, rows) {
    var id = "ta_" + scope + "_" + field;
    return '<div class="textarea-wrap"><textarea id="' + id + '" rows="' + (rows || 3) + '" data-scope="' + scope + '" data-field="' + field + '" data-action="text-input" placeholder="' + esc(placeholder || "") + '">' + esc(value || "") + "</textarea>" + micButton(id) + "</div>";
  }

  function getScopeObj(scope) {
    return scope === "reset" ? state.reset : state.profile;
  }

  // ---------- ONBOARDING ----------

  function progressDots(total, current) {
    var html = '<div class="dots">';
    for (var i = 0; i < total; i++) {
      html += '<div class="dot ' + (i === current ? "active" : i < current ? "done" : "") + '"></div>';
    }
    html += "</div>";
    return html;
  }

  function renderOnboarding() {
    var step = ONBOARD_STEPS[state.onboardIndex];
    var p = state.profile;
    var body = "";
    var showBack = state.onboardIndex > 0 && step !== "done";
    var showDots = step !== "intro" && step !== "done";

    if (step === "intro") {
      body =
        '<div class="home-hero">' +
        '<div class="home-title">SHIFT</div>' +
        '<p class="step-sub" style="max-width:340px">This app exists to help you stop giving your energy to things that don\'t deserve it, and come back to who you\'ve decided to be.</p>' +
        '<p class="step-sub" style="max-width:340px">First, let\'s define that person. This takes about 5 minutes, once. You can edit it anytime.</p>' +
        '<button class="btn btn-primary" style="width:220px" data-action="onboard-next">Start</button>' +
        "</div>";
      return '<div class="screen">' + body + "</div>";
    }

    if (step === "identity-1") {
      body =
        '<h1 class="step-title">Who are you becoming?</h1>' +
        '<p class="step-sub">In one sentence.</p>' +
        '<div class="card">' + textField("profile", "identitySentence", p.identitySentence, "e.g. Someone who is calm, unshaken, and doesn't need everyone's approval.") + "</div>" +
        '<div class="field-label" style="margin-top:6px">Which roles matter most right now?</div>' +
        '<p class="field-hint">Tap to add a role, then describe who you want to be in it.</p>' +
        '<div class="tag-row">' + ROLE_SUGGESTIONS.map(function (r) {
          var exists = p.roles.some(function (row) { return row.role === r; });
          return '<span class="chip ' + (exists ? "selected" : "") + '" data-action="add-role" data-value="' + esc(r) + '">' + esc(r) + "</span>";
        }).join("") + "</div>" +
        p.roles.map(function (row, i) {
          return '<div class="identity-role-row"><div class="role-name">' + esc(row.role) + '</div>' +
            '<input type="text" data-action="update-role" data-index="' + i + '" value="' + esc(row.descriptor) + '" placeholder="As a ' + esc(row.role.toLowerCase()) + ', I am…" />' +
            '<span class="x" data-action="remove-role" data-index="' + i + '">×</span></div>';
        }).join("");
    } else if (step === "identity-2") {
      body =
        '<h1 class="step-title">A little more about that person</h1>' +
        '<div class="section-block"><div class="field-label">At your best, one word people would use for you</div>' + textField("profile", "bestSelfWord", p.bestSelfWord, "e.g. steady") + "</div>" +
        '<div class="section-block"><div class="field-label">What shows up when you\'re triggered — and what do you want instead?</div>' +
        '<p class="field-hint">Old pattern</p>' + textField("profile", "oldPattern", p.oldPattern, "e.g. I overexplain and spiral") +
        '<p class="field-hint" style="margin-top:10px">What you want instead</p>' + textField("profile", "newPattern", p.newPattern, "e.g. I pause and say less") + "</div>";
    } else if (step === "values") {
      body =
        '<h1 class="step-title">Your values</h1>' +
        '<div class="section-block"><div class="field-label">3–6 values that actually run your life</div>' +
        '<p class="field-hint">Not ones that sound nice. The ones you actually operate by.</p>' +
        tagList("profile", "values", p.values, { placeholder: "e.g. peace, integrity, growth" }) + "</div>" +
        '<div class="section-block"><div class="field-label">Which one do you break the fastest under pressure?</div>' + textField("profile", "valuesBreakUnder", p.valuesBreakUnder, "optional") + "</div>" +
        '<div class="section-block"><div class="field-label">When two values conflict, which usually wins?</div>' + textField("profile", "valuesConflictWinner", p.valuesConflictWinner, "optional") + "</div>";
    } else if (step === "boundaries-1") {
      body =
        '<h1 class="step-title">Boundaries</h1>' +
        '<div class="section-block"><div class="field-label">What will you no longer tolerate from other people?</div>' + tagList("profile", "boundaries", p.boundaries, { placeholder: "e.g. being spoken to disrespectfully" }) + "</div>" +
        '<div class="section-block"><div class="field-label">Your non-negotiables</div><p class="field-hint">Things you won\'t compromise on, regardless of who\'s asking.</p>' + tagList("profile", "nonNegotiables", p.nonNegotiables, { placeholder: "e.g. my honesty, my rest" }) + "</div>";
    } else if (step === "boundaries-2") {
      body =
        '<h1 class="step-title">Being honest about it</h1>' +
        '<div class="section-block"><div class="field-label">A boundary you\'ve stated before but haven\'t held</div>' + textareaField("profile", "boundaryNotHeld", p.boundaryNotHeld, "optional", 2) + "</div>" +
        '<div class="section-block"><div class="field-label">What does it cost you when you don\'t hold a boundary?</div>' + textareaField("profile", "boundaryCost", p.boundaryCost, "optional", 2) + "</div>";
    } else if (step === "traps-1") {
      body =
        '<h1 class="step-title">What hooks you</h1>' +
        '<div class="section-block"><div class="field-label">Specific situations that hook you emotionally</div>' +
        '<p class="field-hint">These will show up later as quick tags when you use a reset, so the app can show you your real patterns over time.</p>' +
        tagList("profile", "triggerCategories", p.triggerCategories, { placeholder: "e.g. being left on read", suggestions: ["Someone's opinion of me", "Being excluded", "Being criticized", "Family conflict", "Being ignored", "Gossip"] }) + "</div>" +
        '<div class="section-block"><div class="field-label">What do you usually do right after you get hooked?</div>' + tagList("profile", "oldReactions", p.oldReactions, { placeholder: "e.g. overexplain, go silent" }) + "</div>";
    } else if (step === "traps-2") {
      body =
        '<h1 class="step-title">A little deeper</h1>' +
        '<div class="section-block"><div class="field-label">Whose opinion do you give the most power to?</div>' + textareaField("profile", "whoseOpinion", p.whoseOpinion, "optional", 3) + "</div>" +
        '<div class="section-block"><div class="field-label">The story you tell yourself when someone disrespects you</div>' + textareaField("profile", "storyWhenDisrespected", p.storyWhenDisrespected, "optional", 2) + "</div>";
    } else if (step === "energy") {
      body =
        '<h1 class="step-title">What deserves your energy</h1>' +
        '<div class="section-block"><div class="field-label">What actually deserves your energy right now</div>' + tagList("profile", "energyWorthy", p.energyWorthy, { placeholder: "e.g. my health, my work, my kids" }) + "</div>" +
        '<div class="section-block"><div class="field-label">What does NOT deserve your energy, even if it feels urgent</div>' + tagList("profile", "energyNotWorthy", p.energyNotWorthy, { placeholder: "e.g. other people's opinions of me" }) + "</div>" +
        '<div class="section-block"><div class="field-label">A decision-worthy problem — one that genuinely needs action</div>' + textareaField("profile", "decisionWorthyExample", p.decisionWorthyExample, "optional", 3) + "</div>";
    } else if (step === "rules") {
      body =
        '<h1 class="step-title">Your rules for deciding</h1>' +
        '<div class="section-block"><div class="field-label">When activated, what do you do that you regret later?</div>' + textareaField("profile", "regretAction", p.regretAction, "e.g. send the text immediately", 3) + "</div>" +
        '<div class="section-block"><div class="field-label">What\'s true 24 hours later that wasn\'t obvious in the moment?</div>' + textareaField("profile", "truthAfter24h", p.truthAfter24h, "optional", 3) + "</div>" +
        '<div class="section-block"><div class="field-label">What has to be true for something to actually require action?</div>' + tagList("profile", "whatMustBeTrue", p.whatMustBeTrue, { placeholder: "e.g. it affects my safety" }) + "</div>" +
        '<div class="section-block"><div class="field-label">Your rule before you respond to anything that stings</div>' + textareaField("profile", "ruleBeforeResponding", p.ruleBeforeResponding, "e.g. wait 1 hour", 3) + "</div>";
    } else if (step === "done") {
      body =
        '<div class="home-hero">' +
        '<div class="home-title" style="font-size:26px">You\'re set.</div>' +
        '<p class="step-sub" style="max-width:340px">This is who you decided to be. Edit it anytime from Settings.</p>' +
        '<button class="btn btn-primary" style="width:220px" data-action="onboard-finish">Enter SHIFT</button>' +
        "</div>";
      return '<div class="screen">' + body + "</div>";
    }

    var dots = showDots ? progressDots(ONBOARD_STEPS.length - 2, state.onboardIndex - 1) : "";
    var nav = '<div class="nav-row">' +
      (showBack ? '<button class="btn btn-secondary" data-action="onboard-back">Back</button>' : "") +
      '<button class="btn btn-primary" data-action="onboard-next">Next</button>' +
      "</div>";

    return '<div class="screen">' + dots + body + nav + "</div>";
  }

  // ---------- HOME ----------

  function renderHome() {
    var unlocked = state.profile.resetsLog.length >= PATTERN_UNLOCK;
    return '<div class="screen">' +
      '<div class="topbar"><span class="app-name">SHIFT</span><button class="iconbtn" data-action="open-settings">⚙</button></div>' +
      '<div class="home-hero">' +
      '<div><div class="home-title">SHIFT</div><p class="home-tagline">Protect your energy. Return to yourself.</p></div>' +
      '<div class="anchor-card"><button class="iconbtn" data-action="anchor-shuffle">↻</button><div class="anchor-label">TODAY</div><div class="anchor-text">' + esc(getAnchorText()) + "</div></div>" +
      '<button class="reset-btn" data-action="start-reset">RESET</button>' +
      '<div class="reset-btn-sub">Does this deserve you?</div>' +
      '<div class="home-links">' +
      '<span class="pill-link" data-action="open-identity">My Identity</span>' +
      '<span class="pill-link" data-action="open-decode">Decode</span>' +
      (unlocked ? '<span class="pill-link" data-action="open-patterns">Patterns</span>' : "") +
      "</div>" +
      '<div class="home-stat">Resets this week: ' + resetsThisWeek() + "</div>" +
      "</div></div>";
  }

  // ---------- IDENTITY REFERENCE ----------

  function renderIdentity() {
    var p = state.profile;
    function section(title, items) {
      if (!items || !items.length) return "";
      return '<div class="section-block"><div class="field-label">' + esc(title) + '</div><div class="tag-row">' +
        items.map(function (i) { return '<span class="chip">' + esc(i) + "</span>"; }).join("") + "</div></div>";
    }
    var roleLines = p.roles.filter(function (r) { return r.descriptor; }).map(function (r) { return r.role + ": " + r.descriptor; });
    return '<div class="screen">' +
      '<div class="topbar"><button class="iconbtn" data-action="go-home">←</button><span class="app-name">IDENTITY</span><button class="iconbtn" data-action="open-settings">⚙</button></div>' +
      (p.identitySentence ? '<div class="insight-card">' + esc(p.identitySentence) + "</div>" : "") +
      section("Roles", roleLines) +
      section("Values", p.values) +
      section("Non-negotiables", p.nonNegotiables) +
      section("Boundaries", p.boundaries) +
      section("Deserves my energy", p.energyWorthy) +
      section("Does NOT deserve my energy", p.energyNotWorthy) +
      (p.ruleBeforeResponding ? '<div class="section-block"><div class="field-label">My rule</div><p class="step-sub">' + esc(p.ruleBeforeResponding) + "</p></div>" : "") +
      "</div>";
  }

  // ---------- SETTINGS (edit everything, reuses onboarding field renderers) ----------

  function renderSettings() {
    var p = state.profile;
    var html = '<div class="screen">' +
      '<div class="topbar"><button class="iconbtn" data-action="go-home">←</button><span class="app-name">SETTINGS</span><span></span></div>';

    html += '<div class="settings-section-title">Identity</div>' +
      textField("profile", "identitySentence", p.identitySentence, "Who are you becoming?") ;
    html += '<div style="margin-top:14px">' + p.roles.map(function (row, i) {
      return '<div class="identity-role-row"><div class="role-name">' + esc(row.role) + '</div>' +
        '<input type="text" data-action="update-role" data-index="' + i + '" value="' + esc(row.descriptor) + '" />' +
        '<span class="x" data-action="remove-role" data-index="' + i + '">×</span></div>';
    }).join("") + "</div>";
    html += '<div class="tag-row">' + ROLE_SUGGESTIONS.map(function (r) {
      var exists = p.roles.some(function (row) { return row.role === r; });
      return exists ? "" : '<span class="chip suggested-add" data-action="add-role" data-value="' + esc(r) + '">+ ' + esc(r) + "</span>";
    }).join("") + "</div>";

    html += '<div class="settings-section-title">Values</div>' + tagList("profile", "values", p.values, { placeholder: "add a value" });
    html += '<div class="settings-section-title">Non-negotiables</div>' + tagList("profile", "nonNegotiables", p.nonNegotiables, { placeholder: "add one" });
    html += '<div class="settings-section-title">Boundaries</div>' + tagList("profile", "boundaries", p.boundaries, { placeholder: "add one" });
    html += '<div class="settings-section-title">Situations that hook me</div>' + tagList("profile", "triggerCategories", p.triggerCategories, { placeholder: "add one" });
    html += '<div class="settings-section-title">Deserves my energy</div>' + tagList("profile", "energyWorthy", p.energyWorthy, { placeholder: "add one" });
    html += '<div class="settings-section-title">Does NOT deserve my energy</div>' + tagList("profile", "energyNotWorthy", p.energyNotWorthy, { placeholder: "add one" });
    html += '<div class="settings-section-title">What must be true to require action</div>' + tagList("profile", "whatMustBeTrue", p.whatMustBeTrue, { placeholder: "add one" });

    html += '<div class="settings-section-title">Whose opinion I give too much power to</div>' + textareaField("profile", "whoseOpinion", p.whoseOpinion, "optional", 3);
    html += '<div class="settings-section-title">The story I tell myself when disrespected</div>' + textareaField("profile", "storyWhenDisrespected", p.storyWhenDisrespected, "optional", 3);
    html += '<div class="settings-section-title">A decision-worthy problem</div>' + textareaField("profile", "decisionWorthyExample", p.decisionWorthyExample, "optional", 3);
    html += '<div class="settings-section-title">What I regret doing when activated</div>' + textareaField("profile", "regretAction", p.regretAction, "optional", 3);
    html += '<div class="settings-section-title">What\'s true 24 hours later</div>' + textareaField("profile", "truthAfter24h", p.truthAfter24h, "optional", 3);
    html += '<div class="settings-section-title">My rule before I respond</div>' + textareaField("profile", "ruleBeforeResponding", p.ruleBeforeResponding, "", 3);

    html += '<div class="settings-section-title">Decode (AI)</div>' +
      '<p class="field-hint">Free API key from console.groq.com/keys — stored only on this device.</p>' +
      textField("profile", "groqApiKey", p.groqApiKey, "gsk_...") +
      '<div style="margin-top:10px">' + textField("profile", "groqModel", p.groqModel, "llama-3.3-70b-versatile") + "</div>";

    html += '<div class="settings-section-title">Backup</div>' +
      '<p class="field-hint">Move your values to another device (like your phone) without retyping.</p>' +
      '<div class="btn-row"><button class="btn btn-secondary" data-action="export-data">Copy my data</button>' +
      '<button class="btn btn-secondary" data-action="import-data">Import from clipboard</button></div>';

    html += '<div class="settings-section-title">Data</div>' +
      '<button class="btn btn-danger" data-action="clear-data">Erase all my data on this device</button>';

    html += "</div>";
    return html;
  }

  // ---------- PATTERNS ----------

  function renderPatterns() {
    var log = state.profile.resetsLog;
    var byCat = {};
    log.forEach(function (r) {
      var c = r.category || "Uncategorized";
      byCat[c] = byCat[c] || { count: 0, decisions: {} };
      byCat[c].count++;
      byCat[c].decisions[r.decision] = (byCat[c].decisions[r.decision] || 0) + 1;
    });
    var cats = Object.keys(byCat).sort(function (a, b) { return byCat[b].count - byCat[a].count; });
    var html = '<div class="screen">' +
      '<div class="topbar"><button class="iconbtn" data-action="go-home">←</button><span class="app-name">PATTERNS</span><span></span></div>';

    if (!cats.length) {
      html += '<div class="empty-state">No patterns yet.</div></div>';
      return html;
    }

    var top = cats[0];
    var topDecisions = byCat[top].decisions;
    var topDecisionId = Object.keys(topDecisions).sort(function (a, b) { return topDecisions[b] - topDecisions[a]; })[0];
    var topDecisionLabel = (DECISION_OPTIONS.find(function (d) { return d.id === topDecisionId; }) || {}).label || topDecisionId;

    html += '<div class="insight-card">You\'ve flagged "' + esc(top) + '" ' + byCat[top].count + " time" + (byCat[top].count === 1 ? "" : "s") + ". " +
      topDecisions[topDecisionId] + " of those times you chose “" + esc(topDecisionLabel) + "”. This may be worth noticing.</div>";

    html += '<div class="card">' + cats.map(function (c) {
      return '<div class="patterns-row"><span class="patterns-cat">' + esc(c) + '</span><span class="patterns-count">' + byCat[c].count + "</span></div>";
    }).join("") + "</div>";

    html += '<p class="step-sub">Total resets logged: ' + log.length + "</p></div>";
    return html;
  }

  // ---------- DECODE (AI-assisted, for bigger layered situations) ----------

  function buildDecodeSystemPrompt(p) {
    var lines = [
      "You are the grounding assistant inside a personal app called SHIFT, built for exactly one person. You are not a general chatbot.",
      "Your job: help them decode a complex, emotionally loaded situation. Separate observable facts from interpretation/story, identify what is actually within their control, and reconnect them to the values, boundaries, and identity they defined for themselves below. Push toward a clear, deliberate decision.",
      "Hard rules:",
      "- Keep every reply short: a few tight sentences, rarely a short paragraph. Never long essays.",
      "- No reassurance loops or generic validation phrases repeated over and over. One brief acknowledgment at most, then move to substance.",
      "- Ground responses in THEIR stated values/boundaries/identity below, referencing them directly, not generic advice.",
      "- Explicitly separate: what happened (facts) vs. what they're interpreting or assuming; what is in their control vs. not; which of their own stated values or boundaries is actually at stake.",
      "- Push toward clarity and a decision, not endless exploration. End most replies with either a sharp question or a suggested next step.",
      "- Never diagnose any person, including third parties they describe, and never give clinical/medical advice.",
      "- If they describe a real, current safety threat to themselves, name that plainly once and suggest contacting local emergency services or a crisis line, briefly, without lecturing.",
      "",
      "THEIR PROFILE:",
      "Identity: " + (p.identitySentence || "—"),
      "Roles: " + (p.roles.map(function (r) { return r.role + ": " + r.descriptor; }).join("; ") || "—"),
      "Values: " + (p.values.join(", ") || "—"),
      "Non-negotiables: " + (p.nonNegotiables.join(", ") || "—"),
      "Boundaries: " + (p.boundaries.join(", ") || "—"),
      "Deserves their energy: " + (p.energyWorthy.join(", ") || "—"),
      "Does NOT deserve their energy: " + (p.energyNotWorthy.join(", ") || "—"),
      "Their rule before responding to anything that stings: " + (p.ruleBeforeResponding || "—"),
      "Old pattern they're leaving behind: " + (p.oldPattern || "—") + " → New pattern they want: " + (p.newPattern || "—")
    ];
    return lines.join("\n");
  }

  var SCRIPT_DECISIONS = ["say-no", "set-boundary", "address-calmly", "practical-action"];

  function buildScriptSystemPrompt(p) {
    var profileBlock = buildDecodeSystemPrompt(p).split("THEIR PROFILE:")[1];
    return [
      "You write extremely short, ready-to-use scripts for one person inside an app called SHIFT.",
      "You are not a therapist. Do not analyze, reassure, or explain. Output ONLY the exact words they could say or send.",
      "1 to 3 sentences. First person. No preamble like \"Here's a script\" or \"You could say\" — just the words themselves.",
      "Match the requested tone exactly: direct = blunt and short; warm = firm but kind; gentle = soft but still clear.",
      "Let the wording reflect their stated values/boundaries below where relevant, but do not quote the values back at them explicitly.",
      "",
      "THEIR PROFILE:" + profileBlock
    ].join("\n");
  }

  function requestScript() {
    var r = state.reset, p = state.profile;
    r.scriptLoading = true;
    r.scriptError = null;
    render();
    var decisionLabel = (DECISION_OPTIONS.find(function (d) { return d.id === r.decision; }) || {}).label || r.decision;
    var userMsg = "Situation: " + r.facts + "\nChosen path: " + decisionLabel + "\nTone: " + (r.tone || "direct");

    fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + p.groqApiKey },
      body: JSON.stringify({
        model: p.groqModel || "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: buildScriptSystemPrompt(p) },
          { role: "user", content: userMsg }
        ],
        temperature: 0.5,
        max_tokens: 150
      })
    })
      .then(function (res) {
        if (!res.ok) {
          return res.text().then(function (t) { throw new Error("API error " + res.status + ": " + t.slice(0, 200)); });
        }
        return res.json();
      })
      .then(function (data) {
        var reply = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
        r.script = (reply || "").trim();
        r.scriptLoading = false;
        render();
      })
      .catch(function (err) {
        r.scriptLoading = false;
        r.scriptError = err.message || "Couldn't reach Groq.";
        render();
      });
  }

  function openDecode() {
    if (!state.decode) state.decode = { messages: [], loading: false, error: null, input: "" };
    state.screen = "decode";
    render();
  }

  function sendDecodeMessage(text) {
    var d = state.decode;
    d.messages.push({ role: "user", content: text });
    d.loading = true;
    d.error = null;
    render();

    var apiMessages = [{ role: "system", content: buildDecodeSystemPrompt(state.profile) }].concat(
      d.messages.map(function (m) { return { role: m.role, content: m.content }; })
    );

    fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + state.profile.groqApiKey
      },
      body: JSON.stringify({
        model: state.profile.groqModel || "llama-3.3-70b-versatile",
        messages: apiMessages,
        temperature: 0.6,
        max_tokens: 400
      })
    })
      .then(function (res) {
        if (!res.ok) {
          return res.text().then(function (t) {
            throw new Error("API error " + res.status + ": " + t.slice(0, 200));
          });
        }
        return res.json();
      })
      .then(function (data) {
        var reply = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
        d.messages.push({ role: "assistant", content: reply || "(no response)" });
        d.loading = false;
        render();
      })
      .catch(function (err) {
        d.loading = false;
        d.error = err.message || "Something went wrong reaching Groq.";
        render();
      });
  }

  function renderDecode() {
    var p = state.profile;
    var d = state.decode;
    if (!p.groqApiKey) {
      return '<div class="screen">' +
        '<div class="topbar"><button class="iconbtn" data-action="go-home">←</button><span class="app-name">DECODE</span><button class="iconbtn" data-action="open-settings">⚙</button></div>' +
        '<div class="empty-state">Add a free Groq API key in Settings to use Decode.<br><br>Get one at console.groq.com/keys</div>' +
        "</div>";
    }
    var html = '<div class="screen">' +
      '<div class="topbar"><button class="iconbtn" data-action="go-home">←</button><span class="app-name">DECODE</span><button class="iconbtn" data-action="decode-new">New</button></div>';

    if (!d.messages.length) {
      html += '<p class="step-sub">Write out the situation. As much as you need. I\'ll help you decode it against what you\'ve already said matters to you.</p>';
    }

    html += '<div class="chat-messages">';
    d.messages.forEach(function (m) {
      html += '<div class="chat-bubble ' + m.role + '">' + esc(m.content).replace(/\n/g, "<br>") + "</div>";
    });
    if (d.loading) html += '<div class="chat-bubble assistant loading">…</div>';
    html += "</div>";

    if (d.error) html += '<div class="warn-banner">' + esc(d.error) + "</div>";

    html += '<div class="chat-input-row">' +
      '<textarea rows="2" id="decode-input" placeholder="Type here…">' + esc(d.input || "") + "</textarea>" +
      micButton("decode-input") +
      '<button class="addbtn" data-action="decode-send" ' + (d.loading ? "disabled" : "") + ">↑</button>" +
      "</div>";

    return html + "</div>";
  }

  // ---------- RESET FLOW ----------

  function pickBodyReset() {
    var candidates = BODY_RESETS.filter(function (b) { return b.type !== state.profile.lastBodyType; });
    var pool = candidates.length ? candidates : BODY_RESETS;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function startReset() {
    state.reset = {
      step: "tone",
      tone: state.profile.lastTone || null,
      facts: "",
      factsWarned: false,
      factsOverride: false,
      category: null,
      energyAnswer: null,
      mineSelected: [],
      notMineSelected: [],
      body: pickBodyReset(),
      bodySecondsLeft: 0,
      identitySelected: [],
      decision: null,
      avoidNudge: false,
      script: null,
      scriptLoading: false,
      scriptError: null
    };
    state.reset.bodySecondsLeft = state.reset.body.seconds;
    state.screen = "reset";
    render();
  }

  function endReset(save) {
    if (save) {
      state.profile.resetsLog.push({
        ts: Date.now(),
        category: state.reset.category || "Uncategorized",
        energyAnswer: state.reset.energyAnswer,
        decision: state.reset.decision
      });
      state.profile.lastTone = state.reset.tone;
      state.profile.lastBodyType = state.reset.body.type;
      saveProfile();
    }
    clearTimer();
    state.reset = null;
    state.screen = "home";
    render();
  }

  function clearTimer() {
    if (state.timerHandle) { clearInterval(state.timerHandle); state.timerHandle = null; }
  }

  var MINE_ITEMS = ["My response", "My behavior", "My boundaries", "My attention", "My decisions", "My next action"];
  var NOT_MINE_ITEMS = ["Their opinion", "Their mood", "Their reaction", "Gossip", "Their assumptions", "Their choices", "Their perception of me"];

  function renderReset() {
    var r = state.reset;
    var p = state.profile;
    var tone = r.tone || "direct";
    var body = "";
    var backAction = "reset-back";
    var stepOrder = ["tone", "facts", "energy", "control", "body", "identity", "decision", "close"];
    var idx = stepOrder.indexOf(r.step);

    if (r.step === "tone") {
      body = '<h1 class="step-title">Reset</h1>' +
        '<p class="step-sub">Pick the tone for this one.</p>' +
        '<div class="choice-list">' +
        ["direct", "warm", "gentle"].map(function (t) {
          var labels = { direct: "Direct, no fluff", warm: "Firm but warm", gentle: "Gentle" };
          return '<button class="choice-btn ' + (r.tone === t ? "picked" : "") + '" data-action="set-tone" data-value="' + t + '">' + labels[t] + "</button>";
        }).join("") + "</div>" +
        '<div class="nav-row"><button class="btn btn-secondary" data-action="cancel-reset">Cancel</button>' +
        '<button class="btn btn-primary" data-action="reset-next" ' + (r.tone ? "" : "disabled") + ">Continue</button></div>";
      return '<div class="screen">' + body + "</div>";
    }

    if (r.step === "facts") {
      var showWarn = r.factsWarned && !r.factsOverride;
      body = '<h1 class="step-title">1. Facts</h1>' +
        '<p class="step-sub">' + TONE_COPY.facts[tone] + "</p>" +
        '<div class="card">' + textareaField("reset", "facts", r.facts, "Just what happened. 1–2 sentences.", 3) + "</div>";
      if (showWarn) {
        body += '<div class="warn-banner">That might be an interpretation, not a fact. Want to rephrase it as just what happened?</div>' +
          '<div class="btn-row"><button class="btn btn-secondary" data-action="facts-rephrase">Rephrase</button><button class="btn btn-primary" data-action="facts-override">Continue anyway</button></div>';
      }
      if (p.triggerCategories.length) {
        body += '<div class="field-label" style="margin-top:22px">What kind of situation is this?</div>' +
          '<div class="tag-row">' + p.triggerCategories.concat(["Other"]).map(function (c) {
            return '<span class="chip ' + (r.category === c ? "selected" : "") + '" data-action="set-category" data-value="' + esc(c) + '">' + esc(c) + "</span>";
          }).join("") + "</div>";
      }
      body += '<div class="nav-row"><button class="btn btn-secondary" data-action="' + backAction + '">Back</button>' +
        '<button class="btn btn-primary" data-action="facts-continue" ' + (r.facts.trim() ? "" : "disabled") + ">Continue</button></div>";
      return '<div class="screen">' + body + "</div>";
    }

    if (r.step === "energy") {
      body = '<h1 class="step-title">2. Energy check</h1>' +
        '<p class="step-sub">Does this actually deserve your energy?</p>' +
        '<p class="field-hint">Does it affect your values, responsibilities, relationships, safety, work, money, reputation — or require a real boundary? Hurt feelings alone aren\'t proof it needs action.</p>' +
        '<p class="field-hint">The sting is information about a boundary or value — not a signal to run from it or fix it immediately.</p>' +
        '<p class="step-sub">' + TONE_COPY.energy[tone] + "</p>" +
        '<div class="choice-list">' +
        [["yes", "Yes"], ["not-now", "Not now"], ["no", "No"]].map(function (o) {
          return '<button class="choice-btn ' + (r.energyAnswer === o[0] ? "picked" : "") + '" data-action="set-energy" data-value="' + o[0] + '">' + o[1] + "</button>";
        }).join("") + "</div>" +
        '<div class="nav-row"><button class="btn btn-secondary" data-action="' + backAction + '">Back</button>' +
        '<button class="btn btn-primary" data-action="reset-next" ' + (r.energyAnswer ? "" : "disabled") + ">Continue</button></div>";
      return '<div class="screen">' + body + "</div>";
    }

    if (r.step === "control") {
      body = '<h1 class="step-title">3. Control check</h1>' +
        '<p class="step-sub">' + TONE_COPY.control[tone] + "</p>" +
        '<div class="control-grid">' +
        '<div><div class="control-col-title mine">MINE</div>' + MINE_ITEMS.map(function (i) {
          return '<button class="control-chip mine ' + (r.mineSelected.indexOf(i) > -1 ? "selected" : "") + '" data-action="toggle-mine" data-value="' + esc(i) + '">' + esc(i) + "</button>";
        }).join("") + "</div>" +
        '<div><div class="control-col-title notmine">NOT MINE</div>' + NOT_MINE_ITEMS.map(function (i) {
          return '<button class="control-chip notmine ' + (r.notMineSelected.indexOf(i) > -1 ? "selected" : "") + '" data-action="toggle-notmine" data-value="' + esc(i) + '">' + esc(i) + "</button>";
        }).join("") + "</div>" +
        "</div>" +
        '<div class="nav-row"><button class="btn btn-secondary" data-action="' + backAction + '">Back</button>' +
        '<button class="btn btn-primary" data-action="reset-next">Continue</button></div>';
      return '<div class="screen">' + body + "</div>";
    }

    if (r.step === "body") {
      body = '<h1 class="step-title">4. Body reset</h1>' +
        '<p class="step-sub">' + TONE_COPY.body[tone] + "</p>" +
        '<div class="timer-wrap">' +
        '<div class="timer-type">' + esc(r.body.label) + "</div>" +
        '<div class="timer-num">' + r.bodySecondsLeft + "</div>" +
        '<div class="timer-instructions">' + esc(r.body.text) + "</div>" +
        "</div>" +
        '<div class="nav-row"><button class="btn btn-secondary" data-action="skip-body">Skip</button>' +
        '<button class="btn btn-primary" data-action="reset-next">Continue</button></div>';
      return '<div class="screen">' + body + "</div>";
    }

    if (r.step === "identity") {
      var tags = [];
      p.values.forEach(function (v) { tags.push(v); });
      p.roles.forEach(function (row) { if (row.descriptor) tags.push(row.role + ": " + row.descriptor); });
      p.nonNegotiables.forEach(function (v) { tags.push(v); });
      body = '<h1 class="step-title">5. Who did you decide to be?</h1>' +
        '<p class="step-sub">' + TONE_COPY.identity[tone] + "</p>";
      if (tags.length) {
        body += '<div class="tag-row">' + tags.map(function (t) {
          return '<span class="chip ' + (r.identitySelected.indexOf(t) > -1 ? "selected" : "") + '" data-action="toggle-identity" data-value="' + esc(t) + '">' + esc(t) + "</span>";
        }).join("") + "</div>";
      } else {
        body += '<div class="empty-state">Add your values and identity in Settings to see them here.</div>';
      }
      if (p.ruleBeforeResponding) {
        body += '<div class="identity-note">Your rule: ' + esc(p.ruleBeforeResponding) + "</div>";
      }
      body += '<div class="close-line" style="font-size:18px;margin-top:20px">What would that version of you do next?</div>';
      body += '<div class="nav-row"><button class="btn btn-secondary" data-action="' + backAction + '">Back</button>' +
        '<button class="btn btn-primary" data-action="reset-next">Continue</button></div>';
      return '<div class="screen">' + body + "</div>";
    }

    if (r.step === "decision") {
      var suggested = SUGGESTED_BY_ENERGY[r.energyAnswer] || [];
      body = '<h1 class="step-title">6. Decision</h1>' +
        '<div class="warn-banner">Before you act: no impulsive messages. No over-explaining. No trying to control how they see you.</div>' +
        '<div class="choice-list">' + DECISION_OPTIONS.map(function (o) {
          var isSug = suggested.indexOf(o.id) > -1;
          return '<button class="choice-btn ' + (r.decision === o.id ? "picked" : "") + '" data-action="set-decision" data-value="' + o.id + '">' + o.label +
            (isSug ? '<span class="choice-badge">Suggested</span>' : "") + "</button>";
        }).join("") + "</div>";
      if (r.avoidNudge) {
        body += '<div class="warn-banner">This one affects something you said matters (a value, responsibility, or boundary). Sure this is the move, or would addressing it calmly serve you better?</div>' +
          '<div class="btn-row"><button class="btn btn-secondary" data-action="avoid-change">Change my choice</button><button class="btn btn-primary" data-action="avoid-confirm">I\'m sure</button></div>';
      } else {
        body += '<div class="nav-row"><button class="btn btn-secondary" data-action="' + backAction + '">Back</button>' +
          '<button class="btn btn-primary" data-action="decision-continue" ' + (r.decision ? "" : "disabled") + ">Continue</button></div>";
      }
      return '<div class="screen">' + body + "</div>";
    }

    if (r.step === "close") {
      var line = (CLOSE_LINES[r.decision] || {})[tone] || "Decision made. Move on.";
      body = '<h1 class="step-title">7. Close</h1>' +
        '<div class="close-line">' + esc(line) + "</div>";
      if (SCRIPT_DECISIONS.indexOf(r.decision) > -1 && p.groqApiKey) {
        if (r.script) {
          body += '<div class="chat-bubble assistant">' + esc(r.script).replace(/\n/g, "<br>") + "</div>";
        } else if (r.scriptLoading) {
          body += '<div class="chat-bubble assistant loading">…</div>';
        } else {
          body += '<button class="btn btn-secondary" data-action="get-script">Help me word this</button>';
        }
        if (r.scriptError) body += '<div class="warn-banner">' + esc(r.scriptError) + "</div>";
      }
      body += '<button class="btn btn-primary" data-action="finish-reset">Done</button>';
      return '<div class="screen">' + body + "</div>";
    }

    return "";
  }

  function startBodyTimer() {
    clearTimer();
    state.timerHandle = setInterval(function () {
      if (!state.reset || state.reset.step !== "body") { clearTimer(); return; }
      state.reset.bodySecondsLeft--;
      if (state.reset.bodySecondsLeft <= 0) {
        clearTimer();
        state.reset.bodySecondsLeft = 0;
        renderTimerOnly();
        setTimeout(function () {
          if (state.reset && state.reset.step === "body") { state.reset.step = "identity"; render(); }
        }, 700);
        return;
      }
      renderTimerOnly();
    }, 1000);
  }

  function renderTimerOnly() {
    var num = document.querySelector(".timer-num");
    if (num && state.reset) num.textContent = state.reset.bodySecondsLeft;
  }

  // ---------- RENDER DISPATCH ----------

  function render() {
    var app = document.getElementById("app");
    if (state.screen === "onboarding") app.innerHTML = renderOnboarding();
    else if (state.screen === "home") app.innerHTML = renderHome();
    else if (state.screen === "identity") app.innerHTML = renderIdentity();
    else if (state.screen === "settings") app.innerHTML = renderSettings();
    else if (state.screen === "patterns") app.innerHTML = renderPatterns();
    else if (state.screen === "decode") app.innerHTML = renderDecode();
    else if (state.screen === "reset") {
      app.innerHTML = renderReset();
      if (state.reset && state.reset.step === "body") startBodyTimer();
      else clearTimer();
    }
  }

  // ---------- EVENT HANDLING (delegated) ----------

  function mutateTag(action) {
    var scope = action.dataset.scope;
    var field = action.dataset.field;
    var obj = getScopeObj(scope);
    if (!obj[field]) obj[field] = [];
    return obj;
  }

  document.addEventListener("DOMContentLoaded", function () {
    render();
    registerSW();
  });

  document.getElementById && null;

  document.body.addEventListener("click", function (e) {
    var t = e.target.closest("[data-action]");
    if (!t) return;
    var action = t.dataset.action;
    var val = t.dataset.value;

    if (action === "onboard-next") {
      if (state.onboardIndex < ONBOARD_STEPS.length - 1) { state.onboardIndex++; saveProfile(); render(); }
    } else if (action === "onboard-back") {
      if (state.onboardIndex > 0) { state.onboardIndex--; render(); }
    } else if (action === "onboard-finish") {
      state.profile.onboarded = true;
      saveProfile();
      state.screen = "home";
      render();
    } else if (action === "go-home") {
      state.screen = "home"; render();
    } else if (action === "open-settings") {
      state.screen = "settings"; render();
    } else if (action === "open-identity") {
      state.screen = "identity"; render();
    } else if (action === "open-patterns") {
      state.screen = "patterns"; render();
    } else if (action === "mic-toggle") {
      toggleMic(t.dataset.target);
    } else if (action === "anchor-shuffle") {
      var pool = buildAnchorPool(state.profile);
      state.anchorOffset = (state.anchorOffset || 0) + 1;
      if (pool.length) state.anchorOffset = state.anchorOffset % pool.length;
      render();
    } else if (action === "open-decode") {
      openDecode();
    } else if (action === "decode-new") {
      state.decode = { messages: [], loading: false, error: null, input: "" };
      render();
    } else if (action === "decode-send") {
      var ta = document.getElementById("decode-input");
      var text = ta ? ta.value.trim() : "";
      if (text && !state.decode.loading) {
        state.decode.input = "";
        sendDecodeMessage(text);
      }
    } else if (action === "export-data") {
      var exportJson = JSON.stringify(state.profile);
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(exportJson).then(function () {
          window.alert("Copied. On your other device, open this app, go to Settings, and tap Import from clipboard.");
        }).catch(function () { window.prompt("Copy this text:", exportJson); });
      } else {
        window.prompt("Copy this text:", exportJson);
      }
    } else if (action === "import-data") {
      var applyImport = function (text) {
        try {
          var parsed = JSON.parse(text);
          state.profile = Object.assign(defaultProfile(), parsed);
          state.profile.onboarded = true;
          saveProfile();
          render();
          window.alert("Imported.");
        } catch (e) {
          window.alert("That didn't look like valid SHIFT data.");
        }
      };
      if (navigator.clipboard && navigator.clipboard.readText) {
        navigator.clipboard.readText().then(applyImport).catch(function () {
          var text = window.prompt("Paste your SHIFT data:");
          if (text) applyImport(text);
        });
      } else {
        var text2 = window.prompt("Paste your SHIFT data:");
        if (text2) applyImport(text2);
      }
    } else if (action === "clear-data") {
      if (window.confirm("This permanently erases everything on this device. Continue?")) {
        localStorage.removeItem(STORAGE_KEY);
        state.profile = defaultProfile();
        state.onboardIndex = 0;
        state.screen = "onboarding";
        render();
      }
    } else if (action === "add-role") {
      if (!state.profile.roles.some(function (r) { return r.role === val; })) {
        state.profile.roles.push({ role: val, descriptor: "" });
        saveProfile(); render();
      }
    } else if (action === "remove-role") {
      state.profile.roles.splice(Number(t.dataset.index), 1);
      saveProfile(); render();
    } else if (action === "add-tag" || action === "add-tag-value") {
      var scope = t.dataset.scope, field = t.dataset.field;
      var obj = getScopeObj(scope);
      var value;
      if (action === "add-tag-value") {
        value = val;
      } else {
        var input = t.parentElement.querySelector(".tag-input-field");
        value = input ? input.value.trim() : "";
      }
      if (value) {
        if (!obj[field]) obj[field] = [];
        if (obj[field].indexOf(value) === -1) obj[field].push(value);
        if (scope === "profile") saveProfile();
        render();
      }
    } else if (action === "remove-tag") {
      var scope2 = t.dataset.scope, field2 = t.dataset.field;
      var obj2 = getScopeObj(scope2);
      obj2[field2] = (obj2[field2] || []).filter(function (x) { return x !== val; });
      if (scope2 === "profile") saveProfile();
      render();
    } else if (action === "start-reset") {
      startReset();
    } else if (action === "cancel-reset") {
      endReset(false);
    } else if (action === "reset-back") {
      var order = ["tone", "facts", "energy", "control", "body", "identity", "decision", "close"];
      var i = order.indexOf(state.reset.step);
      if (i > 0) { state.reset.step = order[i - 1]; render(); } else { endReset(false); }
    } else if (action === "set-tone") {
      state.reset.tone = val; render();
    } else if (action === "reset-next") {
      var order2 = ["tone", "facts", "energy", "control", "body", "identity", "decision", "close"];
      var j = order2.indexOf(state.reset.step);
      state.reset.step = order2[j + 1];
      render();
    } else if (action === "facts-continue") {
      var facts = state.reset.facts.toLowerCase();
      var hasAssumption = ASSUMPTION_PHRASES.some(function (p) { return facts.indexOf(p) > -1; });
      if (hasAssumption && !state.reset.factsOverride) {
        state.reset.factsWarned = true;
        render();
      } else {
        state.reset.step = "energy";
        render();
      }
    } else if (action === "facts-rephrase") {
      state.reset.factsWarned = false;
      render();
      var ta = document.querySelector('textarea[data-field="facts"]');
      if (ta) ta.focus();
    } else if (action === "facts-override") {
      state.reset.factsOverride = true;
      state.reset.step = "energy";
      render();
    } else if (action === "set-category") {
      state.reset.category = val; render();
    } else if (action === "set-energy") {
      state.reset.energyAnswer = val; render();
    } else if (action === "toggle-mine") {
      var arr = state.reset.mineSelected;
      var pos = arr.indexOf(val);
      if (pos > -1) arr.splice(pos, 1); else arr.push(val);
      render();
    } else if (action === "toggle-notmine") {
      var arr2 = state.reset.notMineSelected;
      var pos2 = arr2.indexOf(val);
      if (pos2 > -1) arr2.splice(pos2, 1); else arr2.push(val);
      render();
    } else if (action === "toggle-identity") {
      var arr3 = state.reset.identitySelected;
      var pos3 = arr3.indexOf(val);
      if (pos3 > -1) arr3.splice(pos3, 1); else arr3.push(val);
      render();
    } else if (action === "skip-body") {
      clearTimer();
      state.reset.step = "identity";
      render();
    } else if (action === "set-decision") {
      state.reset.decision = val;
      render();
    } else if (action === "decision-continue") {
      var needsNudge = state.reset.energyAnswer === "yes" && (state.reset.decision === "ignore" || state.reset.decision === "let-go") && !state.reset.avoidNudge;
      if (needsNudge) {
        state.reset.avoidNudge = true;
        render();
      } else {
        state.reset.step = "close";
        render();
      }
    } else if (action === "avoid-change") {
      state.reset.avoidNudge = false;
      state.reset.decision = null;
      render();
    } else if (action === "avoid-confirm") {
      state.reset.avoidNudge = false;
      state.reset.step = "close";
      render();
    } else if (action === "get-script") {
      requestScript();
    } else if (action === "finish-reset") {
      endReset(true);
    }
  });

  document.body.addEventListener("input", function (e) {
    var t = e.target;
    if (t.id === "decode-input" && state.decode) {
      state.decode.input = t.value;
      return;
    }
    if (!t.dataset || !t.dataset.action) return;
    if (t.dataset.action === "update-role") {
      state.profile.roles[Number(t.dataset.index)].descriptor = t.value;
      saveProfile();
      return;
    }
    if (!t.dataset.field) return;
    var scope = t.dataset.scope || "profile";
    var obj = getScopeObj(scope);
    if (t.dataset.action === "text-input") {
      obj[t.dataset.field] = t.value;
      if (scope === "profile") saveProfile();
      var isFactsField = t.dataset.field === "facts";
      var isOnboardTextField = state.screen === "onboarding";
      if (!isFactsField && !isOnboardTextField) {
        // re-render only for cases needing live validation elsewhere; avoid caret jump otherwise
      }
      if (isFactsField) {
        var btn = document.querySelector('[data-action="facts-continue"]');
        if (btn) btn.disabled = !t.value.trim();
        if (state.reset.factsWarned) { state.reset.factsWarned = false; }
      }
    }
  });

  document.body.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey && e.target.id === "decode-input") {
      e.preventDefault();
      var text = e.target.value.trim();
      if (text && state.decode && !state.decode.loading) {
        state.decode.input = "";
        sendDecodeMessage(text);
      }
      return;
    }
    if (e.key === "Enter" && e.target.classList && e.target.classList.contains("tag-input-field")) {
      e.preventDefault();
      var scope = e.target.dataset.scope, field = e.target.dataset.field;
      var obj = getScopeObj(scope);
      var value = e.target.value.trim();
      if (value) {
        if (!obj[field]) obj[field] = [];
        if (obj[field].indexOf(value) === -1) obj[field].push(value);
        if (scope === "profile") saveProfile();
        render();
      }
    }
  });

  function registerSW() {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("sw.js").catch(function () {});
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", render);
  } else {
    render();
    registerSW();
  }
})();
