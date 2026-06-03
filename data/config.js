SOURCES = [
  { id: "toplab", name: "Toplab Review Center", items: 775 },
  { id: "prevexams", name: "Previous Exams", items: 431 },
];

CATEGORIES = [
  { id: "archdesign", name: "Architectural Design", short: "Arch Design" },
  { id: "profprac", name: "Professional Practice", short: "Prof Practice" },
  { id: "bldglaws", name: "Building Laws", short: "Bldg Laws" },
  { id: "hoatapp", name: "History of Architecture & TAPP", short: "HOA & TAPP" },
  { id: "bldgutil", name: "Building Utilities", short: "Bldg Utilities" },
  { id: "bldgtech", name: "Building Technology", short: "Bldg Tech" },
  { id: "structural", name: "Structural Conceptualization", short: "Structural" },
  { id: "theoryarch", name: "Theory of Architecture", short: "Theory" },
  { id: "histarch", name: "History of Architecture", short: "History" },
  { id: "philasian", name: "Philippine & Asian Architecture", short: "Phil & Asian" },
  { id: "profpraclaw", name: "Professional Practice & Building Laws", short: "Prof Prac & Laws" },
  { id: "interiors", name: "Architectural Interiors & Tropical Architecture", short: "Interiors" },
];

MODES = [
  { id: "normal", name: "Normal",        sub: "+1 correct",   blurb: "One point per correct answer. No penalty for wrong answers." },
  { id: "rw",     name: "Right − Wrong", sub: "+1 / −1", blurb: "One point per correct answer, minus one for every wrong answer. Blanks are zero." },
  { id: "timed",  name: "Timed",         sub: "45:00 clock",  blurb: "Scored like Normal, but the session is timed. It auto-submits when the clock runs out." },
];
