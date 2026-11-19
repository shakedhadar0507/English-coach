import type { GrammarTopic } from "./schema";

export const grammarTopics: GrammarTopic[] = [
  {
    slug: "sentence-structure", level: "A1",
    title_en: "Basic sentence structure (SVO)", title_he: "מבנה משפט בסיסי",
    summary_en: "English sentences usually follow Subject + Verb + Object. Every sentence needs a subject and a verb.",
    summary_he: "משפט באנגלית בנוי בדרך כלל לפי הסדר: נושא, פועל, מושא. בכל משפט חייבים להופיע נושא ופועל, גם כשבעברית אפשר לוותר עליהם.",
    rules: [
      { en: "Word order is fixed: Subject + Verb + Object (+ place + time).", he: "סדר המילים קבוע: נושא, פועל, מושא, ואחר כך מקום וזמן." },
      { en: "English needs a subject: 'It is cold', not 'Is cold'.", he: "באנגלית חייבים נושא. בעברית אומרים 'קר', באנגלית חייבים לומר 'It is cold'." },
      { en: "Present-tense sentences with adjectives or nouns need 'to be': 'She is a doctor'.", he: "בהווה, משפט שמני דורש את הפועל 'to be'. בעברית 'היא רופאה', באנגלית 'She is a doctor'." },
    ],
    examples: [
      { en: "I drink coffee every morning.", he: "אני שותה קפה כל בוקר." },
      { en: "It is late.", he: "מאוחר.", note: "dummy subject 'it'" },
      { en: "My brother is a teacher.", he: "אחי מורה." },
    ],
    mistakes: [
      { wrong: "Is very hot today.", right: "It is very hot today.", he: "חסר נושא. באנגלית מוסיפים 'It'." },
      { wrong: "She teacher.", right: "She is a teacher.", he: "חסר הפועל 'is' ומילית היידוע 'a'." },
    ],
  },
  {
    slug: "present-simple", level: "A1",
    title_en: "Present Simple", title_he: "הווה פשוט",
    summary_en: "Use the Present Simple for habits, routines, facts and permanent situations. Add -s/-es for he, she, it.",
    summary_he: "משתמשים בהווה פשוט להרגלים, שגרה, עובדות ומצבים קבועים. בגוף שלישי יחיד (הוא, היא, זה) מוסיפים לפועל s או es.",
    rules: [
      { en: "he/she/it + verb-s: 'She works', 'He goes', 'It watches'.", he: "בגוף שלישי יחיד מוסיפים s לפועל. אחרי ch, sh, s, x, o מוסיפים es." },
      { en: "Negative: do not / does not + base verb: 'He doesn't like tea'.", he: "שלילה: don't או doesn't ואחריהם הפועל בצורת הבסיס, בלי s." },
      { en: "Questions: Do / Does + subject + base verb: 'Does she live here?'", he: "שאלה: Do או Does בתחילת המשפט, ואחריהם נושא ופועל בסיס." },
    ],
    examples: [
      { en: "She works in a bank.", he: "היא עובדת בבנק." },
      { en: "Water boils at 100 degrees.", he: "מים רותחים ב־100 מעלות." },
      { en: "Do you speak English?", he: "אתה מדבר אנגלית?" },
    ],
    mistakes: [
      { wrong: "He go to work by bus.", right: "He goes to work by bus.", he: "בגוף שלישי יחיד חייבים להוסיף s." },
      { wrong: "She doesn't likes coffee.", right: "She doesn't like coffee.", he: "אחרי doesn't הפועל חוזר לצורת הבסיס." },
    ],
  },
  {
    slug: "present-continuous", level: "A1",
    title_en: "Present Continuous", title_he: "הווה מתמשך",
    summary_en: "Use am/is/are + verb-ing for actions happening now or around now, and for temporary situations.",
    summary_he: "am, is או are ואחריהם פועל עם ing. משתמשים בו לפעולה שקורית עכשיו, או למצב זמני.",
    rules: [
      { en: "Form: am/is/are + verb-ing.", he: "המבנה: am, is או are, ואחריהם פועל עם ing." },
      { en: "Stative verbs (know, like, want, believe) are usually not used in the continuous.", he: "פעלי מצב כמו know, like, want לא באים בדרך כלל בהווה מתמשך." },
      { en: "Can describe fixed future plans: 'I'm meeting Dana tomorrow'.", he: "משמש גם לתוכניות עתידיות שכבר נקבעו." },
    ],
    examples: [
      { en: "I'm working from home today.", he: "אני עובד מהבית היום." },
      { en: "Look! It's raining.", he: "תראה! יורד גשם." },
      { en: "We're meeting the investors on Monday.", he: "אנחנו נפגשים עם המשקיעים ביום שני." },
    ],
    mistakes: [
      { wrong: "I am knowing the answer.", right: "I know the answer.", he: "know הוא פועל מצב, ולא בא בהווה מתמשך." },
      { wrong: "She working now.", right: "She is working now.", he: "חסר is לפני הפועל." },
    ],
  },
  {
    slug: "past-simple", level: "A2",
    title_en: "Past Simple", title_he: "עבר פשוט",
    summary_en: "Use the Past Simple for finished actions at a specific time in the past. Regular verbs add -ed; many common verbs are irregular.",
    summary_he: "משתמשים בעבר פשוט לפעולה שהסתיימה בזמן מסוים בעבר. לפעלים רגילים מוסיפים ed, ולהרבה פעלים נפוצים יש צורה חריגה.",
    rules: [
      { en: "Regular: verb + -ed (worked, played, studied).", he: "פועל רגיל: מוסיפים ed." },
      { en: "Irregular verbs have special forms: go → went, see → saw, buy → bought.", he: "לפעלים חריגים יש צורת עבר מיוחדת שצריך לזכור." },
      { en: "Negative and questions use did + base verb: 'I didn't go', 'Did you see it?'", he: "בשלילה ובשאלה משתמשים ב־did, והפועל חוזר לצורת הבסיס." },
    ],
    examples: [
      { en: "We visited London last year.", he: "ביקרנו בלונדון בשנה שעברה." },
      { en: "I didn't see the email.", he: "לא ראיתי את המייל." },
      { en: "Did you finish the report?", he: "סיימת את הדוח?" },
    ],
    mistakes: [
      { wrong: "I didn't went there.", right: "I didn't go there.", he: "אחרי didn't הפועל בצורת הבסיס." },
      { wrong: "Yesterday I buyed a phone.", right: "Yesterday I bought a phone.", he: "buy הוא פועל חריג. צורת העבר היא bought." },
    ],
  },
  {
    slug: "past-continuous", level: "A2",
    title_en: "Past Continuous", title_he: "עבר מתמשך",
    summary_en: "was/were + verb-ing describes an action in progress at a moment in the past, often interrupted by a Past Simple action.",
    summary_he: "was או were ואחריהם פועל עם ing. מתאר פעולה שהייתה בעיצומה ברגע מסוים בעבר, ולעיתים קרובות נקטעה על ידי פעולה אחרת בעבר פשוט.",
    rules: [
      { en: "Form: was/were + verb-ing.", he: "המבנה: was או were, ואחריהם פועל עם ing." },
      { en: "Long action (Past Continuous) + short interrupting action (Past Simple): 'I was cooking when he called'.", he: "פעולה ארוכה בעבר מתמשך, ופעולה קצרה שקטעה אותה בעבר פשוט." },
    ],
    examples: [
      { en: "I was driving when you called.", he: "נהגתי כשהתקשרת." },
      { en: "At 8 p.m. we were having dinner.", he: "בשמונה בערב אכלנו ארוחת ערב." },
    ],
    mistakes: [
      { wrong: "When he arrived, I cooked dinner.", right: "When he arrived, I was cooking dinner.", he: "אם הבישול היה באמצע כשהוא הגיע, משתמשים בעבר מתמשך." },
    ],
  },
  {
    slug: "future-forms", level: "A2",
    title_en: "Future forms: will, going to, present continuous", title_he: "צורות עתיד",
    summary_en: "Use 'will' for decisions made now, predictions and promises; 'going to' for plans and evidence-based predictions; present continuous for arrangements.",
    summary_he: "will להחלטה שמתקבלת עכשיו, לתחזית ולהבטחה. going to לתוכנית שכבר החלטנו עליה, ולתחזית על סמך מה שרואים. הווה מתמשך לסידור שכבר נקבע.",
    rules: [
      { en: "will + base verb: instant decisions, promises, predictions ('I'll help you').", he: "will ואחריו פועל בסיס: החלטה ספונטנית, הבטחה, תחזית." },
      { en: "am/is/are going to + base verb: plans and intentions ('I'm going to learn Spanish').", he: "going to: כוונה או תוכנית שכבר קיימת." },
      { en: "Present continuous: fixed arrangements with a time ('I'm flying to Berlin on Friday').", he: "הווה מתמשך: סידור עתידי קבוע, בדרך כלל עם זמן מוגדר." },
    ],
    examples: [
      { en: "The phone is ringing. I'll answer it.", he: "הטלפון מצלצל. אני אענה." },
      { en: "Look at those clouds. It's going to rain.", he: "תסתכל על העננים. עומד לרדת גשם." },
      { en: "I'm meeting my mentor at 7.", he: "אני נפגש עם המנטור שלי בשבע." },
    ],
    mistakes: [
      { wrong: "I will to call you.", right: "I will call you.", he: "אחרי will לא מוסיפים to." },
    ],
  },
  {
    slug: "questions-negatives", level: "A1",
    title_en: "Questions and negatives", title_he: "שאלות ושלילה",
    summary_en: "English questions usually need an auxiliary verb (do, does, did, be, have, modal) before the subject.",
    summary_he: "שאלה באנגלית דורשת בדרך כלל פועל עזר לפני הנושא. אי אפשר לשאול רק בעזרת אינטונציה כמו בעברית.",
    rules: [
      { en: "Question word + auxiliary + subject + verb: 'Where do you work?'", he: "מילת שאלה, פועל עזר, נושא, פועל." },
      { en: "With 'be', invert subject and verb: 'Are you ready?'", he: "עם be פשוט מחליפים את מקום הנושא והפועל." },
      { en: "Subject questions have no auxiliary: 'Who called you?'", he: "כששואלים על הנושא עצמו, אין פועל עזר." },
    ],
    examples: [
      { en: "Where do you live?", he: "איפה אתה גר?" },
      { en: "Why didn't she come?", he: "למה היא לא באה?" },
      { en: "Who wrote this?", he: "מי כתב את זה?" },
    ],
    mistakes: [
      { wrong: "Where you live?", right: "Where do you live?", he: "חסר פועל העזר do." },
      { wrong: "What means this word?", right: "What does this word mean?", he: "צריך does, והפועל חוזר לבסיס." },
    ],
  },
  {
    slug: "articles", level: "A1",
    title_en: "Articles: a, an, the", title_he: "מיליות יידוע: a, an, the",
    summary_en: "Use a/an with singular countable nouns mentioned for the first time; use 'the' for specific things both people know.",
    summary_he: "a או an לפני שם עצם יחיד שאפשר לספור, כשמזכירים אותו בפעם הראשונה. the לדבר מסוים שידוע לשני הצדדים. בעברית אין מקבילה ל־a, ולכן קל לשכוח אותה.",
    rules: [
      { en: "a before consonant sounds, an before vowel sounds: a university, an hour.", he: "a לפני צליל עיצור, an לפני צליל תנועה. הכלל הוא לפי הצליל, לא לפי האות." },
      { en: "Singular countable nouns need an article: 'I have a car', not 'I have car'.", he: "שם עצם יחיד שאפשר לספור חייב מילית לפניו." },
      { en: "No article for general plural or uncountable nouns: 'I like dogs', 'Water is important'.", he: "כשמדברים באופן כללי על רבים או על משהו שאי אפשר לספור, לא שמים מילית." },
    ],
    examples: [
      { en: "She's an engineer at a startup.", he: "היא מהנדסת בסטארט־אפ." },
      { en: "The meeting starts at ten.", he: "הפגישה מתחילה בעשר." },
      { en: "Information is valuable.", he: "מידע הוא דבר בעל ערך." },
    ],
    mistakes: [
      { wrong: "He is engineer.", right: "He is an engineer.", he: "לפני מקצוע ביחיד צריך a או an." },
      { wrong: "The life is beautiful.", right: "Life is beautiful.", he: "כשמדברים על מושג כללי, לא שמים the." },
    ],
  },
  {
    slug: "prepositions", level: "A2",
    title_en: "Prepositions of time and place", title_he: "מילות יחס של זמן ומקום",
    summary_en: "in, on, at follow patterns: at for points, on for days and surfaces, in for longer periods and enclosed spaces.",
    summary_he: "at לנקודה מדויקת, on לימים ולמשטחים, in לתקופות ארוכות ולמקומות סגורים.",
    rules: [
      { en: "Time: at 5 o'clock, on Monday, on 3 May, in July, in 2025, in the morning.", he: "זמן: at לשעה, on ליום ולתאריך, in לחודש, לשנה ולחלקי היום." },
      { en: "Place: at the door / at work, on the table / on the wall, in the room / in Tel Aviv.", he: "מקום: at לנקודה, on למשטח, in לתוך מקום." },
    ],
    examples: [
      { en: "The run starts at 6 a.m. on Friday.", he: "הריצה מתחילה בשש בבוקר ביום שישי." },
      { en: "I live in Tel Aviv.", he: "אני גר בתל אביב." },
      { en: "Your keys are on the table.", he: "המפתחות שלך על השולחן." },
    ],
    mistakes: [
      { wrong: "I was born at 1998.", right: "I was born in 1998.", he: "לשנה משתמשים ב־in." },
      { wrong: "See you in Monday.", right: "See you on Monday.", he: "לימים בשבוע משתמשים ב־on." },
    ],
  },
  {
    slug: "present-perfect", level: "B1",
    title_en: "Present Perfect", title_he: "הווה מושלם",
    summary_en: "have/has + past participle connects the past to the present: experiences, unfinished time periods, and recent results.",
    summary_he: "have או has ואחריהם צורת הבינוני הפעול (V3). מחבר בין עבר להווה: ניסיון חיים, פעולה שהתחילה בעבר ונמשכת, ותוצאה שרלוונטית עכשיו. בעברית אין זמן כזה, ולכן זה אחד האתגרים הגדולים.",
    rules: [
      { en: "Life experience, time not stated: 'I have been to New York'.", he: "ניסיון חיים, בלי לציין מתי." },
      { en: "Started in the past and still true, with for/since: 'I have lived here for five years'.", he: "מצב שהתחיל בעבר ועדיין נמשך, עם for (משך) או since (נקודת התחלה)." },
      { en: "Do not use it with a finished time expression (yesterday, in 2020, last week). Use Past Simple instead.", he: "לא משתמשים בו עם זמן שהסתיים (yesterday, last week). אז עוברים לעבר פשוט." },
    ],
    examples: [
      { en: "I've worked here since 2022.", he: "אני עובד כאן מאז 2022." },
      { en: "Have you ever run a marathon?", he: "רצת פעם מרתון?" },
      { en: "She has just sent the deck.", he: "היא בדיוק שלחה את המצגת." },
    ],
    mistakes: [
      { wrong: "I live here for five years.", right: "I have lived here for five years.", he: "מצב שנמשך מהעבר עד עכשיו דורש הווה מושלם, לא הווה פשוט כמו בעברית." },
      { wrong: "I have seen him yesterday.", right: "I saw him yesterday.", he: "עם yesterday משתמשים בעבר פשוט." },
    ],
  },
  {
    slug: "past-perfect", level: "B1",
    title_en: "Past Perfect", title_he: "עבר מושלם",
    summary_en: "had + past participle shows that one past action happened before another past action.",
    summary_he: "had ואחריו V3. מראה שפעולה אחת בעבר קרתה לפני פעולה אחרת בעבר.",
    rules: [
      { en: "Form: had + past participle, for all subjects.", he: "המבנה: had ואחריו צורת V3, זהה לכל הגופים." },
      { en: "Use it for the earlier of two past events when the order matters.", he: "משתמשים בו לפעולה המוקדמת מבין שתיים, כשהסדר חשוב להבנה." },
    ],
    examples: [
      { en: "When I arrived, the meeting had already started.", he: "כשהגעתי, הפגישה כבר התחילה." },
      { en: "She had never flown before her trip to Japan.", he: "היא מעולם לא טסה לפני הטיול ליפן." },
    ],
    mistakes: [
      { wrong: "When I arrived, the train already left.", right: "When I arrived, the train had already left.", he: "הרכבת יצאה לפני שהגעתי, ולכן משתמשים בעבר מושלם." },
    ],
  },
  {
    slug: "modal-verbs", level: "B1",
    title_en: "Modal verbs", title_he: "פעלים מודאליים",
    summary_en: "can, could, must, have to, should, might, may express ability, obligation, advice and possibility. They are followed by the base verb.",
    summary_he: "can, could, must, should, might ועוד, מביעים יכולת, חובה, עצה ואפשרות. אחריהם בא תמיד פועל בצורת הבסיס, בלי to.",
    rules: [
      { en: "Modal + base verb, no -s, no 'to': 'She can swim'.", he: "אחרי פועל מודאלי בא פועל בסיס. בלי s ובלי to." },
      { en: "must = strong obligation from the speaker; have to = external obligation; mustn't = prohibited; don't have to = not necessary.", he: "mustn't פירושו אסור. don't have to פירושו לא חייבים. זה הבדל חשוב." },
      { en: "should = advice; might/may/could = possibility.", he: "should לעצה. might, may או could לאפשרות." },
    ],
    examples: [
      { en: "You should practice speaking every day.", he: "כדאי שתתרגל דיבור כל יום." },
      { en: "You mustn't share your password.", he: "אסור לך לשתף את הסיסמה." },
      { en: "You don't have to come, but you can.", he: "אתה לא חייב לבוא, אבל אתה יכול." },
    ],
    mistakes: [
      { wrong: "She cans speak French.", right: "She can speak French.", he: "לפועל מודאלי לא מוסיפים s." },
      { wrong: "You should to rest.", right: "You should rest.", he: "אחרי should לא באה המילה to." },
    ],
  },
  {
    slug: "conditionals", level: "B1",
    title_en: "Conditionals (zero, first, second)", title_he: "משפטי תנאי",
    summary_en: "Zero: general truths. First: real future possibilities. Second: unreal or imaginary present/future situations.",
    summary_he: "תנאי אפס לעובדות כלליות. תנאי ראשון לאפשרות אמיתית בעתיד. תנאי שני למצב דמיוני או לא סביר.",
    rules: [
      { en: "Zero: If + present, present ('If you heat ice, it melts').", he: "תנאי אפס: if ואחריו הווה, ובתוצאה הווה." },
      { en: "First: If + present, will + base ('If it rains, we'll stay home'). No 'will' in the if-clause.", he: "תנאי ראשון: if ואחריו הווה, ובתוצאה will. בחלק של if לא שמים will." },
      { en: "Second: If + past, would + base ('If I had more time, I would travel'). 'If I were you' is standard.", he: "תנאי שני: if ואחריו עבר, ובתוצאה would. אומרים If I were you, גם בגוף ראשון." },
    ],
    examples: [
      { en: "If we leave now, we'll catch the train.", he: "אם נצא עכשיו, נספיק לרכבת." },
      { en: "If I were you, I'd ask for feedback.", he: "במקומך, הייתי מבקש משוב." },
      { en: "If you don't sleep, you feel tired.", he: "אם לא ישנים, מרגישים עייפים." },
    ],
    mistakes: [
      { wrong: "If it will rain, we will cancel.", right: "If it rains, we will cancel.", he: "אחרי if בתנאי ראשון משתמשים בהווה, לא ב־will." },
      { wrong: "If I would have money, I would buy it.", right: "If I had money, I would buy it.", he: "בתנאי שני, בחלק של if בא עבר פשוט, לא would." },
    ],
  },
  {
    slug: "passive-voice", level: "B2",
    title_en: "Passive voice", title_he: "סביל",
    summary_en: "be + past participle focuses on the action or its receiver rather than who did it. Common in business, news and academic English.",
    summary_he: "be ואחריו V3. מתמקד בפעולה או במי שהפעולה נעשתה עליו, ולא במי שעשה אותה. נפוץ מאוד באנגלית עסקית, בחדשות ובכתיבה אקדמית.",
    rules: [
      { en: "Form: be (in any tense) + past participle: is made, was built, has been approved, will be sent.", he: "המבנה: be בזמן המתאים, ואחריו V3." },
      { en: "Use 'by' only when the agent is important: 'The app was designed by our team'.", he: "מוסיפים by ואת מבצע הפעולה רק כשזה חשוב." },
    ],
    examples: [
      { en: "The contract was signed yesterday.", he: "החוזה נחתם אתמול." },
      { en: "The results will be published next week.", he: "התוצאות יפורסמו בשבוע הבא." },
      { en: "Mistakes have been made.", he: "נעשו טעויות." },
    ],
    mistakes: [
      { wrong: "The report was write by Dana.", right: "The report was written by Dana.", he: "בסביל צריך צורת V3, לא צורת הבסיס." },
    ],
  },
  {
    slug: "reported-speech", level: "B2",
    title_en: "Reported speech", title_he: "דיבור עקיף",
    summary_en: "When reporting what someone said, tenses usually shift back one step after a past reporting verb, and pronouns and time words change.",
    summary_he: "כשמדווחים מה מישהו אמר, אחרי פועל דיווח בעבר הזמן בדרך כלל זז צעד אחד אחורה, וגם הכינויים ומילות הזמן משתנים.",
    rules: [
      { en: "Present → past, past → past perfect, will → would: 'I'm tired' → She said she was tired.", he: "הווה הופך לעבר, עבר הופך לעבר מושלם, will הופך ל־would." },
      { en: "Reported questions use statement word order: 'Where do you live?' → He asked where I lived.", he: "בשאלה עקיפה סדר המילים כמו במשפט רגיל, בלי פועל עזר וללא סימן שאלה." },
      { en: "say vs tell: say (something), tell someone (something).", he: "say לא דורש מושא אדם. tell חייב לבוא עם אדם: told me." },
    ],
    examples: [
      { en: "She said (that) she would send the file.", he: "היא אמרה שהיא תשלח את הקובץ." },
      { en: "He asked me if I had finished.", he: "הוא שאל אותי אם סיימתי." },
    ],
    mistakes: [
      { wrong: "He asked me where did I work.", right: "He asked me where I worked.", he: "בשאלה עקיפה אין did וסדר המילים רגיל." },
      { wrong: "She said me that...", right: "She told me that...", he: "עם מושא אדם משתמשים ב־tell." },
    ],
  },
  {
    slug: "relative-clauses", level: "B2",
    title_en: "Relative clauses", title_he: "משפטי זיקה",
    summary_en: "who (people), which (things), that (people or things), whose (possession), where (places) add information about a noun.",
    summary_he: "who לאנשים, which לדברים, that לשניהם, whose לשייכות, where למקומות. מוסיפים מידע על שם עצם, כמו 'ש' בעברית.",
    rules: [
      { en: "Defining clauses identify which one; no commas; 'that' is common.", he: "משפט זיקה מגדיר מזהה על מי מדובר. אין פסיקים, ואפשר להשתמש ב־that." },
      { en: "Non-defining clauses add extra information; use commas; never 'that'.", he: "משפט זיקה שמוסיף מידע נוסף בא בין פסיקים, ובו לא משתמשים ב־that." },
      { en: "Do not repeat the pronoun: 'the book that I bought', not 'the book that I bought it'.", he: "לא חוזרים על הכינוי. בעברית אומרים 'הספר שקניתי אותו', באנגלית בלי it." },
    ],
    examples: [
      { en: "The founder who pitched first got funding.", he: "המייסד שהציג ראשון קיבל השקעה." },
      { en: "Tel Aviv, which is on the coast, is very humid.", he: "תל אביב, שנמצאת על החוף, לחה מאוד." },
    ],
    mistakes: [
      { wrong: "This is the app that I built it.", right: "This is the app that I built.", he: "לא חוזרים על it בסוף משפט הזיקה." },
    ],
  },
  {
    slug: "advanced-structures", level: "C1",
    title_en: "Advanced structures: inversion, cleft sentences, mixed conditionals", title_he: "מבנים מתקדמים",
    summary_en: "Inversion after negative adverbials, cleft sentences for emphasis, and mixed conditionals for crossing time frames.",
    summary_he: "היפוך סדר אחרי ביטויי שלילה, משפטי הדגשה, ותנאים מעורבים שמחברים בין זמנים שונים.",
    rules: [
      { en: "Inversion: Never / Rarely / Not only + auxiliary + subject: 'Not only did we meet the deadline, we exceeded the target.'", he: "אחרי ביטויי שלילה בתחילת משפט, פועל העזר בא לפני הנושא, כמו בשאלה. סגנון רשמי ומדגיש." },
      { en: "Cleft: What I need is..., It was Dana who...", he: "משפט הדגשה: What I need is או It was... who, כדי לשים דגש על חלק אחד." },
      { en: "Mixed conditional: If + past perfect, would + base (past cause, present result).", he: "תנאי מעורב: סיבה בעבר ותוצאה בהווה." },
    ],
    examples: [
      { en: "Rarely have I seen such a strong team.", he: "לעיתים רחוקות ראיתי צוות חזק כל כך." },
      { en: "What we need is a clearer strategy.", he: "מה שאנחנו צריכים זו אסטרטגיה ברורה יותר." },
      { en: "If I had studied economics, I would understand this report.", he: "אילו למדתי כלכלה, הייתי מבין את הדוח הזה." },
    ],
    mistakes: [
      { wrong: "Never I have seen this.", right: "Never have I seen this.", he: "אחרי Never בתחילת משפט צריך היפוך: פועל עזר ואחריו הנושא." },
    ],
  },
  {
    slug: "discourse-markers", level: "C1",
    title_en: "Discourse markers and natural expression", title_he: "מילות קישור וביטוי טבעי",
    summary_en: "However, therefore, in addition, on the other hand, that said: link ideas logically and sound natural in speech and writing.",
    summary_he: "מילות קישור כמו however, therefore, on the other hand מחברות רעיונות בצורה הגיונית ונותנות לטקסט זרימה טבעית.",
    rules: [
      { en: "Contrast: however, although, whereas, that said. Result: therefore, as a result, so.", he: "ניגוד: however, although, whereas. תוצאה: therefore, as a result." },
      { en: "'However' starts a new sentence or clause and takes a comma: 'However, ...'.", he: "however מתחיל משפט חדש ואחריו פסיק." },
      { en: "Although + clause; despite + noun/-ing: 'Although it rained...' / 'Despite the rain...'.", he: "although ואחריו משפט שלם. despite ואחריו שם עצם או פועל עם ing." },
    ],
    examples: [
      { en: "The product is great. However, the pricing is unclear.", he: "המוצר מצוין. עם זאת, התמחור לא ברור." },
      { en: "Despite the delay, we launched on time.", he: "למרות העיכוב, השקנו בזמן." },
    ],
    mistakes: [
      { wrong: "Despite it was late, we continued.", right: "Although it was late, we continued.", he: "אחרי despite לא בא משפט שלם. משתמשים ב־although." },
    ],
  },
];
