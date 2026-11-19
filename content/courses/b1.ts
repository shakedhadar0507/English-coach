import type { CourseInput as Course } from "../schema";
import { dictation, err, essay, fill, fix, listen, mc, order, reading, rewrite, speak, tr, write } from "../dsl";

export const courseB1: Course = {
  slug: "work-and-career-b1", category: "professional-communication", level: "B1",
  title_en: "Work, Career and Opinions", title_he: "עבודה, קריירה ודעות",
  description_en: "Talk about experience, handle meetings and interviews, and give your opinion clearly.",
  description_he: "לדבר על ניסיון, להשתתף בפגישות ובראיונות, ולהביע דעה בבהירות.",
  goals: ["business", "job_interviews", "general_fluency"],
  modules: [{
    slug: "b1-work", title_en: "At work", title_he: "בעבודה",
    units: [
      {
        slug: "b1-workplace", level: "B1", title_en: "Updates and deadlines", title_he: "עדכונים ודדליינים",
        objectives: [
          { en: "Give a short work update in a stand-up meeting", he: "לתת עדכון קצר בפגישת בוקר" },
          { en: "Use the present perfect for recent results", he: "להשתמש ב־present perfect לתוצאות עדכניות" },
          { en: "Talk about blockers and next steps", he: "לדבר על חסמים וצעדים הבאים" },
        ],
        prerequisites: ["a2-last-weekend"],
        grammar: ["present-perfect", "modal-verbs"],
        vocabulary: ["deadline", "schedule", "colleague", "customer", "figure out", "look forward to"],
        lessons: [
          {
            slug: "b1-workplace-grammar", kind: "grammar", minutes: 7,
            title_en: "Present perfect vs past simple", title_he: "present perfect מול past simple",
            intro_he: "כשיש זמן מוגדר בעבר כמו yesterday משתמשים ב־past simple. כשהתוצאה חשובה עכשיו ואין זמן מוגדר: present perfect.",
            intro_en: "Finished time (yesterday) → past simple. Result now, no finished time → present perfect.",
            exercises: [
              mc("I ___ the report. You can review it now.", ["finished", "have finished", "finish", "was finishing"], 1, { grammar: "present-perfect", he: "התוצאה רלוונטית עכשיו ואין זמן מוגדר: have finished.", en: "Result now, no time given: present perfect." }),
              mc("We ___ the client yesterday.", ["have met", "met", "meet", "have meet"], 1, { grammar: "present-perfect", he: "yesterday הוא זמן גמור, ולכן past simple.", en: "'yesterday' = finished time → past simple." }),
              fill("I still ___ (not / receive) the final copy from marketing.", [["haven't received", "have not received"]], { grammar: "present-perfect", he: "still עם שלילה בהווה מושלם: haven't received.", en: "'still' + negative present perfect." }),
              fix("I work here since 2022.", ["I have worked here since 2022.", "I've worked here since 2022.", "I have been working here since 2022.", "I've been working here since 2022."], { grammar: "present-perfect", he: "עם since על מצב שנמשך עד היום משתמשים ב־present perfect, לא בהווה פשוט.", en: "With 'since' for a situation continuing now, use present perfect." }),
              mc("You ___ send the invoice today. The deadline is tomorrow, so there's no rush.", ["mustn't", "don't have to", "can't", "shouldn't to"], 1, { grammar: "modal-verbs", he: "don't have to פירושו לא חייבים. mustn't פירושו אסור.", en: "don't have to = not necessary; mustn't = prohibited." }),
              err(["Have", "you", "sent", "the email", "yesterday?"], 4, { grammar: "present-perfect", he: "yesterday לא מתאים ל־present perfect. צריך Did you send.", en: "'yesterday' doesn't go with present perfect; use 'Did you send…?'" }),
              order("Have you talked to the customer yet?", { grammar: "present-perfect", he: "yet בסוף שאלה בהווה מושלם.", en: "'yet' goes at the end of the question." }),
            ],
          },
          {
            slug: "b1-workplace-listening", kind: "listening", minutes: 5,
            title_en: "The daily stand-up", title_he: "פגישת הבוקר",
            exercises: [
              listen("b1-team-standup", "What did Dana finish yesterday?", ["The login bug", "The onboarding screens", "The welcome email", "The marketing copy"], 1, { he: "היא אומרת I finished the onboarding screens.", en: "'I finished the onboarding screens.'" }),
              listen("b1-team-standup", "Why can't Dana finish the welcome email?", ["She is sick", "The login is broken", "She hasn't received the final copy", "The deadline was moved"], 2, { he: "היא עדיין לא קיבלה את הטקסט הסופי מהשיווק.", en: "She still hasn't received the final copy." }),
              listen("b1-team-standup", "What will the lead do?", ["Write the copy", "Fix the bug", "Follow up with marketing", "Cancel the email"], 2, { he: "I'll follow up with them פירושו שהוא יבדוק מולם.", en: "'I'll follow up with them.'" }),
              dictation("b1-team-standup", 2, ["Any blockers?"], { he: "blockers הם דברים שמעכבים את העבודה.", en: "Blockers = things stopping progress." }),
            ],
          },
          {
            slug: "b1-workplace-vocab", kind: "vocabulary", minutes: 5,
            title_en: "Work vocabulary", title_he: "אוצר מילים לעבודה",
            exercises: [
              mc("We need to move the ___. The client wants the design by Friday.", ["deadline", "dead end", "headline", "timeline"], 0, { vocab: "deadline", he: "deadline הוא המועד האחרון להגשה.", en: "Deadline = the latest time to finish." }),
              mc("I can't ___ how to fix this bug.", ["figure out", "figure up", "find up", "work up"], 0, { vocab: "figure out", he: "figure out פירושו להבין או למצוא פתרון.", en: "figure out = understand / solve." }),
              fill("I'm looking forward to ___ with you.", [["working"]], { vocab: "look forward to", he: "אחרי look forward to מגיע פועל עם ing.", en: "look forward to + -ing." }),
              tr("העמית שלי עוזר לי עם הלקוחות.", ["My colleague helps me with the customers.", "My colleague helps me with customers.", "My coworker helps me with the customers.", "My co-worker helps me with the customers."], { vocab: "colleague", he: "colleague הוא עמית לעבודה.", en: "colleague = coworker." }),
              speak("Give a 30-second stand-up update: what you did yesterday, what you'll do today, and one blocker.", "תן עדכון של חצי דקה: מה עשית אתמול, מה תעשה היום וחסם אחד.", ["yesterday", "today", "blocker"], "Yesterday I finished the budget for the event. Today I'm going to confirm the venue. One blocker: I haven't heard back from the sponsor yet.", { he: "אתמול בעבר פשוט, תוצאות עכשיו ב־present perfect.", en: "Past simple for yesterday, present perfect for current results." }),
            ],
          },
        ],
      },
      {
        slug: "b1-career", level: "B1", title_en: "Job interviews", title_he: "ראיונות עבודה",
        objectives: [
          { en: "Talk about your experience and achievements", he: "לדבר על הניסיון וההישגים שלך" },
          { en: "Answer common interview questions", he: "לענות על שאלות ראיון נפוצות" },
          { en: "Use 'for' and 'since' correctly", he: "להשתמש נכון ב־for וב־since" },
        ],
        prerequisites: ["b1-workplace"],
        grammar: ["present-perfect", "past-perfect"],
        vocabulary: ["experience", "skill", "achieve", "opportunity", "strength", "weakness", "apply", "interview"],
        lessons: [
          {
            slug: "b1-career-listening", kind: "listening", minutes: 6,
            title_en: "A real interview", title_he: "ראיון אמיתי",
            exercises: [
              listen("b1-job-interview", "What has the candidate been doing for the past two years?", ["Working at a bank", "Running a networking community", "Studying abroad", "Building an app"], 1, { he: "הוא מנהל קהילת נטוורקינג לסטודנטים ויזמים.", en: "Running a networking community." }),
              listen("b1-job-interview", "How did the community grow?", ["Paid ads", "Word of mouth", "A university grant", "Sponsorships"], 1, { he: "word of mouth הוא המלצות מפה לאוזן.", en: "Word of mouth." }),
              listen("b1-job-interview", "How many members does the community have now?", ["Twenty", "Two hundred", "Three hundred", "Thirty"], 2, { he: "from twenty to three hundred, כלומר שלוש מאות.", en: "From twenty to three hundred." }),
              dictation("b1-job-interview", 4, ["Impressive. Why are you interested in this role?", "Impressive! Why are you interested in this role?"], { he: "interested in ואחריו שם עצם.", en: "interested in + noun." }),
            ],
          },
          {
            slug: "b1-career-grammar", kind: "grammar", minutes: 6,
            title_en: "For, since and the past perfect", title_he: "for, since ועבר מושלם",
            intro_he: "for למשך זמן (for two years), since לנקודת התחלה (since 2023). past perfect מתאר משהו שקרה לפני משהו אחר בעבר.",
            intro_en: "for + period, since + starting point. Past perfect = earlier past.",
            exercises: [
              mc("I've managed the community ___ two years.", ["since", "for", "from", "during"], 1, { grammar: "present-perfect", he: "two years הוא משך זמן, ולכן for.", en: "A period → for." }),
              mc("She has worked in sales ___ 2021.", ["for", "since", "from", "in"], 1, { grammar: "present-perfect", he: "2021 היא נקודת התחלה, ולכן since.", en: "A starting point → since." }),
              mc("When I arrived, the interview ___.", ["already started", "had already started", "has already started", "already starts"], 1, { grammar: "past-perfect", he: "הראיון התחיל לפני שהגעתי: had started.", en: "Earlier past → past perfect." }),
              fill("By the time we launched, we ___ (talk) to over fifty users.", [["had talked", "had already talked"]], { grammar: "past-perfect", he: "by the time בעבר, והפעולה הקודמת ב־had ופועל בצורה שלישית.", en: "By the time + past → had + past participle." }),
              rewrite("I started working here three years ago.", "Rewrite using 'for' and the present perfect.", "כתוב מחדש עם for ועם present perfect.", ["I have worked here for three years.", "I've worked here for three years.", "I have been working here for three years.", "I've been working here for three years."], { grammar: "present-perfect", he: "התחלתי לפני שלוש שנים ואני עדיין כאן: I've worked here for three years.", en: "Started 3 years ago and still here → present perfect + for." }),
            ],
          },
          {
            slug: "b1-career-speaking", kind: "speaking", minutes: 8,
            title_en: "Tell me about yourself", title_he: "ספר לי על עצמך",
            exercises: [
              mc("Which answer to 'What's your biggest weakness?' sounds most professional?", ["I don't have weaknesses.", "Sometimes I take on too much, so I've started planning my week more carefully.", "I'm lazy.", "I hate working with people."], 1, { vocab: "weakness", he: "תשובה טובה מציגה חולשה אמיתית יחד עם מה שאתה עושה כדי להשתפר.", en: "Show a real weakness plus what you're doing about it." }),
              tr("הגשתי מועמדות למשרה בחברת סטארט־אפ.", ["I applied for a job at a startup.", "I applied for a position at a startup.", "I applied for a job at a start-up.", "I applied for a role at a startup."], { vocab: "apply", he: "apply for a job, עם for.", en: "apply for a job/position." }),
              speak("Answer: 'Tell me about yourself.' Talk for about 45 seconds about your studies, experience and one achievement.", "ענה על השאלה ספר לי על עצמך. דבר כ־45 שניות על הלימודים, הניסיון והישג אחד.", ["experience", "achieve"], "I'm a business student at Reichman University. For the past two years, I've been running a community that connects students with experienced founders. One thing I've achieved is growing it from twenty to three hundred members without a budget.", { grammar: "present-perfect", he: "for the past two years עם present perfect.", en: "'For the past two years' + present perfect." }),
              essay("Write a short cover letter paragraph (80–120 words) for a job you would like. Mention your experience, a skill and an achievement.", "כתוב פסקה ממכתב מקדים (80 עד 120 מילים) למשרה שהיית רוצה. ציין ניסיון, מיומנות והישג.", 70, 160, "I am applying for the Community Manager position at your company. For the past two years, I have been managing a networking community for students and founders. During this time, I have organized more than forty events and built partnerships with three universities. My strongest skill is bringing people together and keeping them engaged. I am especially proud that we grew from twenty to three hundred members through word of mouth alone. I would welcome the opportunity to bring this experience to your team.", { grammar: "present-perfect", he: "בדוק present perfect עם for ו־since, וטון מקצועי.", en: "Check present perfect with for/since and a professional tone." }),
            ],
          },
        ],
      },
      {
        slug: "b1-opinions", level: "B1", title_en: "Giving opinions and solving problems", title_he: "להביע דעה ולפתור בעיות",
        objectives: [
          { en: "Give and justify an opinion", he: "להביע דעה ולנמק אותה" },
          { en: "Talk about hypothetical situations with conditionals", he: "לדבר על מצבים היפותטיים עם משפטי תנאי" },
          { en: "Handle a travel problem politely", he: "לטפל בבעיה בטיול בנימוס" },
        ],
        prerequisites: ["b1-workplace"],
        grammar: ["conditionals", "modal-verbs"],
        vocabulary: ["in my opinion", "agree", "advantage", "disadvantage", "actually", "eventually", "decision"],
        lessons: [
          {
            slug: "b1-opinions-grammar", kind: "grammar", minutes: 7,
            title_en: "First and second conditional", title_he: "משפטי תנאי ראשון ושני",
            intro_he: "תנאי ראשון למצב אפשרי: If it rains, I will stay home. תנאי שני למצב דמיוני: If I had more time, I would travel.",
            intro_en: "1st: real possibility (If + present, will). 2nd: imaginary (If + past, would).",
            exercises: [
              mc("If it ___ tomorrow, we'll run on the treadmill.", ["will rain", "rains", "rained", "would rain"], 1, { grammar: "conditionals", he: "בתנאי ראשון, בחלק של if משתמשים בהווה ולא ב־will.", en: "1st conditional: 'if' + present, not will." }),
              mc("If I ___ more money, I would invest in a startup.", ["have", "had", "will have", "would have"], 1, { grammar: "conditionals", he: "מצב דמיוני: if ואחריו עבר, ובחלק השני would.", en: "2nd conditional: if + past, would + verb." }),
              fix("If I will see him, I will tell him.", ["If I see him, I will tell him.", "If I see him, I'll tell him."], { grammar: "conditionals", he: "אחרי if לא משתמשים ב־will.", en: "No 'will' after 'if'." }),
              mc("You ___ try the new café. It's great.", ["should", "must to", "would", "ought"], 0, { grammar: "modal-verbs", he: "should משמש להמלצה.", en: "'should' for advice." }),
              order("What would you do if you lost your passport?", { grammar: "conditionals", he: "שאלה בתנאי שני: What would you do if ואחריו עבר.", en: "What would you do if + past?" }),
              err(["If", "I", "would know", "the answer,", "I would tell you."], 2, { grammar: "conditionals", he: "בחלק של if משתמשים ב־knew ולא ב־would know.", en: "Use 'knew' in the if-clause, not 'would know'." }),
            ],
          },
          {
            slug: "b1-opinions-reading", kind: "reading", minutes: 6,
            title_en: "Remote or office?", title_he: "מהבית או מהמשרד?",
            exercises: [
              reading("Many companies now let employees work from home two or three days a week. Supporters say it saves time and money on commuting. Critics argue that new employees learn more slowly without colleagues nearby. Some companies have found a middle path: fixed office days for team meetings, and home days for focused work.", "What is the 'middle path' mentioned in the text?", ["Working only from home", "Fixed office days plus home days", "Moving the office closer", "Hiring only experienced people"], 1, { he: "הטקסט מתאר ימי משרד קבועים לפגישות וימי בית לעבודה מרוכזת.", en: "Fixed office days + home days." }),
              reading("Many companies now let employees work from home two or three days a week. Supporters say it saves time and money on commuting. Critics argue that new employees learn more slowly without colleagues nearby.", "According to critics, who is most affected by remote work?", ["Managers", "New employees", "Customers", "Experienced engineers"], 1, { he: "המבקרים טוענים שעובדים חדשים לומדים לאט יותר.", en: "New employees learn more slowly." }),
              mc("Which phrase introduces an opposite idea?", ["On the other hand,", "In addition,", "For example,", "As a result,"], 0, { vocab: "disadvantage", he: "On the other hand מציג צד שני או ניגוד.", en: "'On the other hand' introduces a contrast." }),
              write("Write one sentence giving your opinion about remote work. Start with 'In my opinion'.", "כתוב משפט אחד עם דעתך על עבודה מהבית. התחל ב־In my opinion.", ["In my opinion"], "In my opinion, a hybrid model works best because it combines focus and teamwork.", { vocab: "in my opinion", he: "אחרי הדעה כדאי לנמק עם because.", en: "Give a reason with 'because'." }),
            ],
          },
          {
            slug: "b1-opinions-travel", kind: "listening", minutes: 6,
            title_en: "A missed connection", title_he: "טיסת המשך שהוחמצה",
            exercises: [
              listen("b1-travel-problem", "What is the passenger's problem?", ["Lost luggage", "A missed connection", "A wrong ticket", "A cancelled hotel"], 1, { he: "הטיסה התעכבה והוא פספס את טיסת ההמשך.", en: "He missed his connection." }),
              listen("b1-travel-problem", "What does the airline offer?", ["A refund", "A hotel and a meal", "A taxi", "A business-class seat"], 1, { he: "הנציג אומר שהחברה תממן מלון וארוחה: we'll cover your hotel and a meal.", en: "Hotel and a meal." }),
              dictation("b1-travel-problem", 2, ["Is there anything tonight?"], { he: "בשאלות משתמשים במילה anything במשמעות משהו, למשל: יש משהו הערב?", en: "'anything' in questions." }),
              speak("Your flight was cancelled. Politely ask the agent for options and say which one you prefer and why.", "הטיסה שלך בוטלה. בקש בנימוס מהנציג אפשרויות, ואמור במה אתה בוחר ולמה.", ["would", "prefer"], "Hi, my flight was just cancelled. What options do I have? I would prefer the morning flight, because I have a meeting at noon. Would you also be able to cover a hotel for tonight?", { grammar: "modal-verbs", he: "would ו־could הופכים בקשה למנומסת.", en: "'would'/'could' make requests polite." }),
            ],
          },
        ],
      },
    ],
  }],
};
