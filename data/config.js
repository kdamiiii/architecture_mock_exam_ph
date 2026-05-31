SOURCES = [
  { id: "jpt", name: "JPT Learning Center", items: 1240 },
  { id: "ucj", name: "UC Jaguars Mock Exam", items: 860 },
];

CATEGORIES = [
  { id: "struct", name: "Structural Conceptual Design", short: "Structural" },
  { id: "hist",   name: "History & Theory",             short: "History" },
  { id: "prac",   name: "Professional Practice",        short: "Practice" },
  { id: "util",   name: "Building Utilities",           short: "Utilities" },
  { id: "design", name: "Architectural Design",         short: "Design" },
  { id: "mats",   name: "Building Materials",           short: "Materials" },
];

MODES = [
  { id: "normal", name: "Normal",        sub: "+1 correct",   blurb: "One point per correct answer. No penalty for wrong answers." },
  { id: "rw",     name: "Right − Wrong", sub: "+1 / −1", blurb: "One point per correct answer, minus one for every wrong answer. Blanks are zero." },
  { id: "timed",  name: "Timed",         sub: "45:00 clock",  blurb: "Scored like Normal, but the session is timed. It auto-submits when the clock runs out." },
];
