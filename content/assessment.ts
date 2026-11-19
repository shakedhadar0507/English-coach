import type { AssessmentItem, ListeningMaterial, Level } from "./schema";
import { fill, listen, mc, reading } from "./dsl";

/** Short audio clips used only by the placement test (not reused in lessons). */
export const placementListening: ListeningMaterial[] = [
  { slug: "pt-a1-time", level: "A1", format: "sentence", title_en: "Placement A1", title_he: "מבחן רמה A1", accent: "american", glossary: [],
    segments: [{ speaker: "Speaker", text: "The shop opens at nine and closes at five." }] },
  { slug: "pt-a1-family", level: "A1", format: "sentence", title_en: "Placement A1 b", title_he: "מבחן רמה A1 ב", accent: "american", glossary: [],
    segments: [{ speaker: "Speaker", text: "I have two sisters and one brother. My brother is a doctor." }] },
  { slug: "pt-a2-plans", level: "A2", format: "dialogue", title_en: "Placement A2", title_he: "מבחן רמה A2", accent: "american", glossary: [],
    segments: [{ speaker: "A", text: "Are you coming to the party on Friday?" }, { speaker: "B", text: "I can't. I'm flying to Rome on Thursday night, and I'm back on Monday." }] },
  { slug: "pt-a2-shop", level: "A2", format: "dialogue", title_en: "Placement A2 b", title_he: "מבחן רמה A2 ב", accent: "british", glossary: [],
    segments: [{ speaker: "A", text: "Do you have this jacket in a medium?" }, { speaker: "B", text: "Sorry, we've only got small and large. But we're getting more next week." }] },
  { slug: "pt-b1-work", level: "B1", format: "workplace", title_en: "Placement B1", title_he: "מבחן רמה B1", accent: "american", glossary: [],
    segments: [{ speaker: "Manager", text: "We've moved the client meeting from Tuesday to Wednesday, because their CEO is travelling. Can you update the presentation by Tuesday evening?" }] },
  { slug: "pt-b1-travel", level: "B1", format: "conversation", title_en: "Placement B1 b", title_he: "מבחן רמה B1 ב", accent: "british", glossary: [],
    segments: [{ speaker: "A", text: "How was the trip?" }, { speaker: "B", text: "Honestly, the hotel was disappointing, but the hiking made up for it. I'd go back just for the mountains." }] },
  { slug: "pt-b2-pitch", level: "B2", format: "workplace", title_en: "Placement B2", title_he: "מבחן רמה B2", accent: "american", glossary: [],
    segments: [{ speaker: "Founder", text: "Although our revenue is still modest, our retention numbers suggest that once users try the product, they rarely leave. That's why we're prioritizing acquisition over new features this year." }] },
  { slug: "pt-b2-lecture", level: "B2", format: "academic", title_en: "Placement B2 b", title_he: "מבחן רמה B2 ב", accent: "british", glossary: [],
    segments: [{ speaker: "Lecturer", text: "Contrary to popular belief, multitasking doesn't make us more productive. What actually happens is that we switch rapidly between tasks, and each switch carries a small cost in time and attention." }] },
  { slug: "pt-c1-debate", level: "C1", format: "academic", title_en: "Placement C1", title_he: "מבחן רמה C1", accent: "british", glossary: [],
    segments: [{ speaker: "Speaker", text: "I'm not suggesting the policy is without merit; my concern is rather that its benefits have been overstated, while the costs, which fall disproportionately on smaller firms, have been largely glossed over." }] },
  { slug: "pt-c1-review", level: "C1", format: "workplace", title_en: "Placement C1 b", title_he: "מבחן רמה C1 ב", accent: "american", glossary: [],
    segments: [{ speaker: "Director", text: "Had the team flagged the risk earlier, we could have renegotiated the timeline. As it stands, we'll have to cut scope, which nobody is thrilled about." }] },
];

const item = (slug: string, skill: AssessmentItem["skill"], level: Level, exercise: AssessmentItem["exercise"]): AssessmentItem => ({ slug, skill, level, exercise });
const X = { he: "שאלת מבחן רמה.", en: "Placement item." };

export const assessmentItems: AssessmentItem[] = [
  // ---------------- Vocabulary ----------------
  item("pt-v-a1-1", "vocabulary", "A1", mc("What is the opposite of 'expensive'?", ["cheap", "busy", "tired", "big"], 0, X)),
  item("pt-v-a1-2", "vocabulary", "A1", mc("'Breakfast' is the meal you eat in the…", ["morning", "afternoon", "evening", "night"], 0, X)),
  item("pt-v-a1-3", "vocabulary", "A1", mc("Choose the English for 'שכן'.", ["neighbor", "nephew", "manager", "friend"], 0, X)),
  item("pt-v-a2-1", "vocabulary", "A2", mc("Can I ___ your pen for a minute?", ["borrow", "lend", "rent", "keep"], 0, X)),
  item("pt-v-a2-2", "vocabulary", "A2", mc("Our flight has a two-hour ___.", ["delay", "luggage", "ticket", "reservation"], 0, X)),
  item("pt-v-a2-3", "vocabulary", "A2", mc("I'd like to ___ a table for four at 8 p.m.", ["book", "invite", "borrow", "check"], 0, X)),
  item("pt-v-b1-1", "vocabulary", "B1", mc("The ___ for applications is next Friday. After that, we won't accept any.", ["deadline", "schedule", "salary", "colleague"], 0, X)),
  item("pt-v-b1-2", "vocabulary", "B1", mc("I thought the test would be hard, but it was ___ quite easy.", ["actually", "currently", "eventually", "already"], 0, X)),
  item("pt-v-b1-3", "vocabulary", "B1", mc("We ran ___ of milk, so I'm going to the shop.", ["out", "off", "over", "away"], 0, X)),
  item("pt-v-b2-1", "vocabulary", "B2", mc("There's always a ___ between speed and quality.", ["trade-off", "bottleneck", "breakthrough", "outcome"], 0, X)),
  item("pt-v-b2-2", "vocabulary", "B2", mc("Is this plan ___ with our current budget?", ["feasible", "reliable", "consistent", "significant"], 0, X)),
  item("pt-v-b2-3", "vocabulary", "B2", mc("She came ___ with a brilliant idea for the campaign.", ["up", "out", "over", "across"], 0, X)),
  item("pt-v-c1-1", "vocabulary", "C1", mc("The new process should ___ the risk of errors.", ["mitigate", "undermine", "articulate", "pivot"], 0, X)),
  item("pt-v-c1-2", "vocabulary", "C1", mc("The results were positive, ___ smaller than expected.", ["albeit", "thereby", "whereas", "despite"], 0, X)),
  item("pt-v-c1-3", "vocabulary", "C1", mc("Choose the word closest in meaning to 'ubiquitous'.", ["everywhere", "unique", "unclear", "unnecessary"], 0, X)),

  // ---------------- Grammar ----------------
  item("pt-g-a1-1", "grammar", "A1", mc("She ___ in Tel Aviv.", ["lives", "live", "living", "is live"], 0, X)),
  item("pt-g-a1-2", "grammar", "A1", mc("___ you like coffee?", ["Do", "Does", "Are", "Is"], 0, X)),
  item("pt-g-a1-3", "grammar", "A1", mc("He is ___ engineer.", ["an", "a", "the", "—"], 0, X)),
  item("pt-g-a2-1", "grammar", "A2", mc("I ___ to Paris last summer.", ["went", "go", "have gone", "was go"], 0, X)),
  item("pt-g-a2-2", "grammar", "A2", mc("I was cooking when the phone ___.", ["rang", "was ringing", "rings", "has rung"], 0, X)),
  item("pt-g-a2-3", "grammar", "A2", mc("See you ___ Monday!", ["on", "in", "at", "by"], 0, X)),
  item("pt-g-b1-1", "grammar", "B1", mc("I ___ here since 2021.", ["have worked", "work", "worked", "am working"], 0, X)),
  item("pt-g-b1-2", "grammar", "B1", mc("If it ___ tomorrow, we'll cancel the run.", ["rains", "will rain", "rained", "would rain"], 0, X)),
  item("pt-g-b1-3", "grammar", "B1", mc("You ___ wear a suit. The event is casual.", ["don't have to", "mustn't", "can't", "shouldn't to"], 0, X)),
  item("pt-g-b2-1", "grammar", "B2", mc("The new office ___ next month.", ["will be opened", "will open by", "is opening by", "will been opened"], 0, X)),
  item("pt-g-b2-2", "grammar", "B2", mc("She asked me where ___.", ["I worked", "did I work", "do I work", "I did work"], 0, X)),
  item("pt-g-b2-3", "grammar", "B2", mc("This is the app ___ I told you about.", ["that", "who", "what", "whose"], 0, X)),
  item("pt-g-c1-1", "grammar", "C1", mc("Not only ___ the deadline, but we also exceeded the target.", ["did we meet", "we met", "we did meet", "met we"], 0, X)),
  item("pt-g-c1-2", "grammar", "C1", mc("If I had taken that job, I ___ in London now.", ["would be living", "would have lived", "will live", "had lived"], 0, X)),
  item("pt-g-c1-3", "grammar", "C1", mc("___ the delay, the launch was a success.", ["Despite", "Although", "However", "Even"], 0, X)),

  // ---------------- Listening ----------------
  item("pt-l-a1-1", "listening", "A1", listen("pt-a1-time", "When does the shop close?", ["At 5", "At 9", "At 7", "At 12"], 0, X)),
  item("pt-l-a1-2", "listening", "A1", listen("pt-a1-family", "What is the brother's job?", ["Doctor", "Teacher", "Engineer", "Student"], 0, X)),
  item("pt-l-a2-1", "listening", "A2", listen("pt-a2-plans", "Why can't B come to the party?", ["B will be abroad", "B is sick", "B has to work", "B doesn't like parties"], 0, X)),
  item("pt-l-a2-2", "listening", "A2", listen("pt-a2-shop", "What sizes are available now?", ["Small and large", "Only medium", "Medium and large", "None"], 0, X)),
  item("pt-l-b1-1", "listening", "B1", listen("pt-b1-work", "Why was the meeting moved?", ["The client's CEO is travelling", "The presentation isn't ready", "The manager is sick", "The office is closed"], 0, X)),
  item("pt-l-b1-2", "listening", "B1", listen("pt-b1-travel", "How did B feel about the trip overall?", ["Positive, mainly because of the hiking", "Negative, because of the hotel", "Neutral", "B didn't go"], 0, X)),
  item("pt-l-b2-1", "listening", "B2", listen("pt-b2-pitch", "What is the company focusing on this year?", ["Getting new users", "Building new features", "Increasing prices", "Reducing staff"], 0, X)),
  item("pt-l-b2-2", "listening", "B2", listen("pt-b2-lecture", "What is the lecturer's main point?", ["Switching between tasks has a cost", "Multitasking increases productivity", "People should work longer hours", "Attention is unlimited"], 0, X)),
  item("pt-l-c1-1", "listening", "C1", listen("pt-c1-debate", "What is the speaker's position on the policy?", ["It has some merit, but its benefits are exaggerated", "It is completely useless", "It is perfect as it is", "It mainly helps small firms"], 0, X)),
  item("pt-l-c1-2", "listening", "C1", listen("pt-c1-review", "What is the consequence of the late warning?", ["They will reduce what they deliver", "They will extend the deadline", "They will hire more people", "Nothing will change"], 0, X)),

  // ---------------- Reading ----------------
  item("pt-r-a1-1", "reading", "A1", reading("Hi, I'm Dan. I'm 25 and I live in Haifa with my dog, Max. I work in a hotel. I love the beach.", "Where does Dan work?", ["In a hotel", "At the beach", "In Haifa University", "In a shop"], 0, X)),
  item("pt-r-a1-2", "reading", "A1", reading("The museum is open from Sunday to Thursday, 10 a.m. to 6 p.m. Tickets cost 40 shekels. Students pay 20 shekels.", "How much does a student ticket cost?", ["20 shekels", "40 shekels", "10 shekels", "It is free"], 0, X)),
  item("pt-r-a2-1", "reading", "A2", reading("Dear team, the office will be closed on Monday because of maintenance work. Please work from home. The office will open again on Tuesday at 8 a.m.", "What should employees do on Monday?", ["Work from home", "Come in at 8 a.m.", "Take a day off", "Help with maintenance"], 0, X)),
  item("pt-r-a2-2", "reading", "A2", reading("Last year Mia started running. At first she could only run for five minutes. She practiced three times a week, and after six months she finished her first 10K race.", "What helped Mia improve?", ["Regular practice", "A new coach", "Running every day", "Better shoes"], 0, X)),
  item("pt-r-b1-1", "reading", "B1", reading("Many people believe that learning vocabulary from lists is enough. However, research shows that words are remembered better when they are learned in context and practiced in real sentences. Reviewing them at increasing intervals also helps.", "According to the text, what helps you remember words?", ["Using them in context and reviewing them over time", "Learning long lists quickly", "Reading the dictionary", "Avoiding repetition"], 0, X)),
  item("pt-r-b1-2", "reading", "B1", reading("Our new policy allows employees to work remotely up to two days a week. Requests must be approved by a manager at least one week in advance.", "What must employees do before working remotely?", ["Get approval a week ahead", "Work in the office for a month", "Ask HR the same day", "Nothing"], 0, X)),
  item("pt-r-b2-1", "reading", "B2", reading("While the startup's growth has been impressive, critics point out that it relies heavily on discounts. Once these promotions end, it remains to be seen whether customers will stay.", "What is the critics' concern?", ["Growth may not last without discounts", "The startup is growing too slowly", "Customers dislike the product", "The discounts are too small"], 0, X)),
  item("pt-r-b2-2", "reading", "B2", reading("The study, which followed 2,000 participants for ten years, found a correlation between regular exercise and better memory. The authors stress, however, that correlation does not prove causation.", "What do the authors emphasize?", ["The results don't prove exercise causes better memory", "Exercise definitely improves memory", "The study was too short", "Memory gets worse with exercise"], 0, X)),
  item("pt-r-c1-1", "reading", "C1", reading("Far from being a mere cost-cutting exercise, the restructuring was framed as an attempt to foster autonomy. Whether it achieved this, or simply shifted responsibility onto already overstretched teams, is a matter of considerable debate.", "What does the writer suggest?", ["It's unclear whether the restructuring empowered teams or overburdened them", "The restructuring was only about saving money", "Everyone agrees it was a success", "The teams were not affected"], 0, X)),
  item("pt-r-c1-2", "reading", "C1", reading("Rarely has a single technology been greeted with such a mixture of optimism and dread. Proponents tout unprecedented gains in productivity; skeptics warn that the benefits will accrue to a narrow few.", "What are skeptics worried about?", ["Benefits being unequally distributed", "Productivity falling", "The technology being too slow", "Too much regulation"], 0, X)),
];

// Fill-in-the-blank placement items keep the test from being pure multiple choice.
assessmentItems.push(
  item("pt-g-a2-4", "grammar", "A2", fill("Yesterday I ___ (buy) a new phone.", [["bought"]], X)),
  item("pt-g-b1-4", "grammar", "B1", fill("When I arrived, the meeting ___ already ___ (start).", [["had"], ["started"]], X)),
  item("pt-g-b2-4", "grammar", "B2", fill("The report ___ (write) by our analyst last week.", [["was written"]], X)),
);
