import type { ListeningMaterial } from "./schema";

const L = (m: Omit<ListeningMaterial, "accent" | "glossary"> & Partial<Pick<ListeningMaterial, "accent" | "glossary">>): ListeningMaterial =>
  ({ accent: "american", glossary: [], ...m });

export const listening: ListeningMaterial[] = [
  L({
    slug: "a1-morning-routine", level: "A1", format: "story", title_en: "Noa's morning", title_he: "הבוקר של נועה",
    context_he: "נועה מתארת את שגרת הבוקר שלה.",
    segments: [
      { speaker: "Noa", text: "I usually wake up at six thirty." },
      { speaker: "Noa", text: "I drink a glass of water and I go for a short run." },
      { speaker: "Noa", text: "After that, I have breakfast with my brother." },
      { speaker: "Noa", text: "I take the bus to work at eight fifteen." },
    ],
    glossary: [{ term: "go for a run", he: "לצאת לריצה" }],
  }),
  L({
    slug: "a1-cafe-order", level: "A1", format: "dialogue", title_en: "At the café", title_he: "בבית הקפה",
    segments: [
      { speaker: "Barista", text: "Hi! What can I get you?" },
      { speaker: "Customer", text: "Can I have a large coffee with oat milk, please?" },
      { speaker: "Barista", text: "Sure. Anything to eat?" },
      { speaker: "Customer", text: "Yes, one croissant, please. How much is that?" },
      { speaker: "Barista", text: "That's twenty-four shekels." },
    ],
    glossary: [{ term: "What can I get you?", he: "מה אפשר להביא לך?" }, { term: "oat milk", he: "חלב שיבולת שועל" }],
  }),
  L({
    slug: "a1-directions", level: "A1", format: "dialogue", title_en: "Finding the station", title_he: "מוצאים את התחנה",
    segments: [
      { speaker: "Tourist", text: "Excuse me, where is the train station?" },
      { speaker: "Local", text: "Go straight for two blocks, then turn left." },
      { speaker: "Local", text: "The station is next to a big supermarket." },
      { speaker: "Tourist", text: "Thank you very much!" },
    ],
  }),
  L({
    slug: "a2-hotel-checkin", level: "A2", format: "dialogue", title_en: "Hotel check-in", title_he: "צ'ק־אין במלון", accent: "british",
    segments: [
      { speaker: "Receptionist", text: "Good evening. Do you have a reservation?" },
      { speaker: "Guest", text: "Yes, it's under the name Levi. Two nights." },
      { speaker: "Receptionist", text: "Lovely. You're in room four-twelve, on the fourth floor. Breakfast is from seven to ten." },
      { speaker: "Guest", text: "Great. Is the Wi-Fi free?" },
      { speaker: "Receptionist", text: "Yes, the password is on your key card." },
    ],
    glossary: [{ term: "under the name", he: "על השם" }],
  }),
  L({
    slug: "a2-weekend-plans", level: "A2", format: "conversation", title_en: "Weekend plans", title_he: "תוכניות לסוף השבוע",
    segments: [
      { speaker: "Maya", text: "What are you doing this weekend?" },
      { speaker: "Tom", text: "I'm going to visit my parents in the north. We're having a family dinner on Friday." },
      { speaker: "Maya", text: "Nice! I'm staying in the city. I've got a long run on Saturday morning." },
      { speaker: "Tom", text: "How long?" },
      { speaker: "Maya", text: "Twenty-five kilometers. I'm training for a marathon in November." },
    ],
  }),
  L({
    slug: "a2-doctor-appointment", level: "A2", format: "dialogue", title_en: "Booking an appointment", title_he: "קביעת תור",
    segments: [
      { speaker: "Clinic", text: "Hello, City Clinic. How can I help?" },
      { speaker: "Patient", text: "Hi, I'd like to make an appointment with Dr. Cohen. I hurt my knee while running." },
      { speaker: "Clinic", text: "The first available appointment is on Thursday at nine forty-five." },
      { speaker: "Patient", text: "Do you have anything earlier?" },
      { speaker: "Clinic", text: "Only tomorrow at four in the afternoon." },
      { speaker: "Patient", text: "Tomorrow at four is perfect." },
    ],
  }),
  L({
    slug: "b1-team-standup", level: "B1", format: "workplace", title_en: "Daily stand-up", title_he: "ישיבת בוקר צוותית",
    segments: [
      { speaker: "Lead", text: "Okay, let's start. Dana, what did you work on yesterday?" },
      { speaker: "Dana", text: "I finished the onboarding screens and sent them for review. Today I'm going to fix the login bug." },
      { speaker: "Lead", text: "Any blockers?" },
      { speaker: "Dana", text: "Yes, I still haven't received the final copy from marketing, so I can't finish the welcome email." },
      { speaker: "Lead", text: "I'll follow up with them right after this meeting." },
    ],
    glossary: [{ term: "blocker", he: "חסם, משהו שמונע התקדמות" }, { term: "copy", he: "טקסט שיווקי" }],
  }),
  L({
    slug: "b1-job-interview", level: "B1", format: "workplace", title_en: "A job interview", title_he: "ראיון עבודה",
    segments: [
      { speaker: "Interviewer", text: "Tell me a little about yourself." },
      { speaker: "Candidate", text: "Sure. I'm a business student, and for the past two years I've been running a networking community for students and founders." },
      { speaker: "Interviewer", text: "What has been your biggest challenge?" },
      { speaker: "Candidate", text: "Growing the community without a budget. We focused on word of mouth, and we went from twenty to three hundred members." },
      { speaker: "Interviewer", text: "Impressive. Why are you interested in this role?" },
      { speaker: "Candidate", text: "Because I want to learn how to build products at scale, and your team does exactly that." },
    ],
    glossary: [{ term: "word of mouth", he: "פה לאוזן" }],
  }),
  L({
    slug: "b1-travel-problem", level: "B1", format: "conversation", title_en: "A missed connection", title_he: "טיסת המשך שהוחמצה", accent: "british",
    segments: [
      { speaker: "Passenger", text: "Hi, my flight from Tel Aviv was delayed, and I've missed my connection to Lisbon." },
      { speaker: "Agent", text: "I'm sorry to hear that. Let me check. The next flight leaves at six tomorrow morning." },
      { speaker: "Passenger", text: "Is there anything tonight?" },
      { speaker: "Agent", text: "I'm afraid not. But since the delay was our fault, we'll cover your hotel and a meal." },
    ],
  }),
  L({
    slug: "b2-investor-meeting", level: "B2", format: "workplace", title_en: "Investor Q&A", title_he: "שאלות ותשובות עם משקיע",
    segments: [
      { speaker: "Investor", text: "Your growth looks strong, but what's your customer acquisition cost right now?" },
      { speaker: "Founder", text: "It's around forty dollars, and it has decreased by about thirty percent since we started partnering with universities." },
      { speaker: "Investor", text: "And how long does it take to recover that cost?" },
      { speaker: "Founder", text: "On average, three months. Our retention is the main driver; most users who stay past the first month stay for over a year." },
      { speaker: "Investor", text: "What would you do with the money you're raising?" },
      { speaker: "Founder", text: "Mainly two things: hire two engineers to scale the platform, and expand to three new campuses." },
    ],
    glossary: [{ term: "customer acquisition cost", he: "עלות גיוס לקוח" }, { term: "retention", he: "שימור לקוחות" }],
  }),
  L({
    slug: "b2-remote-work-debate", level: "B2", format: "conversation", title_en: "Is remote work here to stay?", title_he: "האם עבודה מרחוק כאן כדי להישאר?",
    segments: [
      { speaker: "Host", text: "Today we're discussing remote work. Lior, you're a fan, right?" },
      { speaker: "Lior", text: "Mostly, yes. I save almost two hours a day on commuting, and I can focus better at home." },
      { speaker: "Host", text: "Shira, you disagree?" },
      { speaker: "Shira", text: "Not entirely. Remote work is great for focused tasks, but junior employees learn much faster when they sit next to experienced colleagues." },
      { speaker: "Lior", text: "That's a fair point. Maybe the answer is a hybrid model with clear office days." },
    ],
  }),
  L({
    slug: "b2-lecture-sleep", level: "B2", format: "academic", title_en: "Sleep and memory", title_he: "שינה וזיכרון",
    segments: [
      { speaker: "Lecturer", text: "Today I want to look at the relationship between sleep and memory." },
      { speaker: "Lecturer", text: "Research suggests that during deep sleep, the brain replays information we learned during the day." },
      { speaker: "Lecturer", text: "This process, known as consolidation, helps move memories from short-term to long-term storage." },
      { speaker: "Lecturer", text: "In one study, students who slept after learning new vocabulary remembered significantly more words a week later than students who stayed awake." },
      { speaker: "Lecturer", text: "So, if you're studying for an exam, an all-nighter may actually be counterproductive." },
    ],
    glossary: [{ term: "consolidation", he: "קיבוע (זיכרון)" }, { term: "all-nighter", he: "לילה לבן" }, { term: "counterproductive", he: "מזיק למטרה" }],
  }),
  L({
    slug: "c1-product-postmortem", level: "C1", format: "workplace", title_en: "Launch post-mortem", title_he: "תחקיר אחרי השקה",
    segments: [
      { speaker: "PM", text: "Let's be candid about what went wrong with the launch." },
      { speaker: "Engineer", text: "In hindsight, we underestimated the load. Our tests assumed a gradual ramp-up, but traffic spiked within minutes of the announcement." },
      { speaker: "PM", text: "And the rollback took over an hour, which undermined trust with our early adopters." },
      { speaker: "Engineer", text: "Agreed. Had we rehearsed the rollback, we would have cut that to ten minutes at most." },
      { speaker: "PM", text: "So the action items are load testing with realistic spikes, and a rehearsed rollback plan before every major release." },
    ],
    glossary: [{ term: "candid", he: "כן, גלוי לב" }, { term: "rollback", he: "חזרה לגרסה קודמת" }, { term: "ramp-up", he: "עלייה הדרגתית" }],
  }),
  L({
    slug: "c1-academic-ai-ethics", level: "C1", format: "academic", title_en: "Bias in algorithms", title_he: "הטיה באלגוריתמים", accent: "british",
    segments: [
      { speaker: "Lecturer", text: "It is often assumed that algorithms are neutral, simply because they are mathematical." },
      { speaker: "Lecturer", text: "However, a model is only as good as the data it is trained on." },
      { speaker: "Lecturer", text: "If historical hiring data reflects past discrimination, a model trained on that data is likely to reproduce it, albeit unintentionally." },
      { speaker: "Lecturer", text: "Mitigating this requires not only technical fixes, but also transparency about how decisions are made and who is accountable for them." },
    ],
    glossary: [{ term: "accountable", he: "נושא באחריות" }],
  }),
];
