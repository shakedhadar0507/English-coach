import type { CourseInput as Course } from "../schema";
import { dictation, err, essay, fill, fix, listen, mc, reading, rewrite, speak, tr, write } from "../dsl";

export const courseB2: Course = {
  slug: "business-startups-b2", category: "business-english", level: "B2",
  title_en: "Business and Startups", title_he: "עסקים וסטארט־אפים",
  description_en: "Pitch an idea, run meetings, negotiate and sound natural with business expressions.",
  description_he: "להציג רעיון, לנהל פגישות, לנהל משא ומתן ולהישמע טבעי עם ביטויים עסקיים.",
  goals: ["business", "presentations", "job_interviews"],
  modules: [{
    slug: "b2-business", title_en: "Startup English", title_he: "אנגלית של סטארט־אפים",
    units: [
      {
        slug: "b2-startup-pitch", level: "B2", title_en: "Pitching to investors", title_he: "הצגה למשקיעים",
        objectives: [
          { en: "Present traction and numbers clearly", he: "להציג נתונים והתקדמות בבהירות" },
          { en: "Answer investor questions with confidence", he: "לענות על שאלות משקיעים בביטחון" },
          { en: "Use the passive voice to describe processes and results", he: "להשתמש בסביל כדי לתאר תהליכים ותוצאות" },
        ],
        prerequisites: ["b1-career"],
        grammar: ["passive-voice", "relative-clauses"],
        vocabulary: ["revenue", "profit", "investor", "pitch", "scale", "raise", "feasible"],
        lessons: [
          {
            slug: "b2-pitch-listening", kind: "listening", minutes: 6,
            title_en: "Questions from an investor", title_he: "שאלות של משקיע",
            exercises: [
              listen("b2-investor-meeting", "What is the current customer acquisition cost?", ["About $14", "About $40", "About $30", "About $400"], 1, { he: "המייסד אומר around forty dollars, כלומר כארבעים דולר.", en: "'around forty dollars'." }),
              listen("b2-investor-meeting", "Why has the cost decreased?", ["They stopped advertising", "Partnerships with universities", "A new pricing model", "A larger sales team"], 1, { he: "העלות ירדה מאז שהתחילו שיתופי פעולה עם אוניברסיטאות.", en: "Since partnering with universities." }),
              listen("b2-investor-meeting", "What will they do with the investment?", ["Open an office abroad", "Hire engineers and expand to new campuses", "Buy a competitor", "Spend it on marketing"], 1, { he: "לגייס שני מהנדסים ולהתרחב לשלושה קמפוסים חדשים.", en: "Hire two engineers and expand to three campuses." }),
              dictation("b2-investor-meeting", 4, ["What would you do with the money you're raising?", "What would you do with the money you are raising?"], { vocab: "raise", he: "raise money פירושו לגייס כסף.", en: "raise money = get investment." }),
            ],
          },
          {
            slug: "b2-pitch-grammar", kind: "grammar", minutes: 7,
            title_en: "The passive in business", title_he: "סביל באנגלית עסקית",
            intro_he: "בסביל המוקד הוא על הפעולה או התוצאה ולא על מי שביצע אותה: The platform was launched in 2024.",
            intro_en: "The passive focuses on the action/result: 'The platform was launched in 2024.'",
            exercises: [
              mc("The app ___ by more than 3,000 students last semester.", ["used", "was used", "has used", "is using"], 1, { grammar: "passive-voice", he: "האפליקציה לא השתמשה, השתמשו בה: was used.", en: "The app didn't use; it was used." }),
              mc("All payments ___ securely through Stripe.", ["process", "are processed", "are processing", "processed"], 1, { grammar: "passive-voice", he: "תהליך קבוע בסביל: are processed.", en: "Present passive: are processed." }),
              rewrite("We will launch the new feature next month.", "Rewrite in the passive.", "כתוב מחדש בסביל.", ["The new feature will be launched next month."], { grammar: "passive-voice", he: "will be ואחריו צורה שלישית: will be launched.", en: "will be + past participle." }),
              mc("Our founder, ___ previously worked at Google, leads the product team.", ["which", "who", "whose", "that"], 1, { grammar: "relative-clauses", he: "על אדם משתמשים ב־who. בפסוקית עם פסיקים לא משתמשים ב־that.", en: "People → who; no 'that' in non-defining clauses." }),
              fix("The decision was took by the board.", ["The decision was taken by the board.", "The decision was made by the board."], { grammar: "passive-voice", he: "בסביל משתמשים בצורה השלישית: taken, לא took.", en: "Use the past participle: taken." }),
              err(["The product", "who", "we built", "solves", "a real problem."], 1, { grammar: "relative-clauses", he: "על דבר משתמשים ב־that או which, לא ב־who.", en: "Things → that/which, not who." }),
            ],
          },
          {
            slug: "b2-pitch-speaking", kind: "speaking", minutes: 8,
            title_en: "Your one-minute pitch", title_he: "פיץ' של דקה",
            exercises: [
              mc("Which sentence sounds most natural in a pitch?", ["We are growing 20% month over month.", "We grow every month 20 percent more.", "Each month we are more 20%.", "Our growth is month to month of 20%."], 0, { vocab: "scale", he: "month over month הוא הביטוי המקובל לצמיחה חודשית.", en: "'month over month' is the standard phrase." }),
              tr("ההכנסות שלנו הוכפלו מאז ינואר.", ["Our revenue has doubled since January.", "Our revenues have doubled since January.", "Revenue has doubled since January."], { vocab: "revenue", grammar: "present-perfect", he: "since ינואר עם present perfect: has doubled.", en: "since + present perfect." }),
              fill("Is this plan ___ with only two engineers?", [["feasible", "realistic"]], { vocab: "feasible", he: "feasible פירושו ישים, אפשרי לביצוע.", en: "feasible = possible to do." }),
              speak("Pitch your project or community in about one minute: the problem, your solution, traction, and what you need.", "הצג את הפרויקט או הקהילה שלך בכדקה: הבעיה, הפתרון, ההתקדמות ומה אתה צריך.", ["problem", "growing", "raise"], "Students want to meet senior founders, but networking events are awkward and expensive. We built Run for Startups: early-morning group runs where students and CEOs talk naturally. We've grown to three hundred members in two years, and companies are already asking to sponsor. We're looking for partners to scale to three more cities.", { he: "מבנה ברור: בעיה, פתרון, נתונים, בקשה.", en: "Clear structure: problem, solution, traction, ask." }),
            ],
          },
        ],
      },
      {
        slug: "b2-meetings", level: "B2", title_en: "Meetings and negotiation", title_he: "פגישות ומשא ומתן",
        objectives: [
          { en: "Agree, disagree and suggest politely", he: "להסכים, לא להסכים ולהציע בנימוס" },
          { en: "Report what others said", he: "לדווח מה אחרים אמרו" },
          { en: "Negotiate a simple deal", he: "לנהל משא ומתן פשוט" },
        ],
        prerequisites: ["b2-startup-pitch"],
        grammar: ["reported-speech", "modal-verbs"],
        vocabulary: ["negotiate", "stakeholder", "follow up", "on track", "trade-off", "bottleneck", "point out"],
        lessons: [
          {
            slug: "b2-meetings-listening", kind: "listening", minutes: 6,
            title_en: "A debate on remote work", title_he: "ויכוח על עבודה מהבית",
            exercises: [
              listen("b2-remote-work-debate", "What is Lior's main benefit of remote work?", ["Higher salary", "Saving time on commuting", "Better coffee", "More meetings"], 1, { he: "ליאור חוסך כמעט שעתיים ביום על נסיעות.", en: "He saves almost two hours a day commuting." }),
              listen("b2-remote-work-debate", "What is Shira's concern?", ["Security", "Junior employees learn more slowly", "Higher costs", "Bad internet"], 1, { he: "שירה אומרת שעובדים צעירים לומדים מהר יותר ליד עמיתים מנוסים.", en: "Juniors learn faster next to experienced colleagues." }),
              listen("b2-remote-work-debate", "What do they agree on in the end?", ["Fully remote work", "A hybrid model with clear office days", "Five office days", "No change"], 1, { he: "מודל היברידי עם ימי משרד קבועים.", en: "A hybrid model with clear office days." }),
              dictation("b2-remote-work-debate", 4, ["That's a fair point. Maybe the answer is a hybrid model with clear office days.", "That is a fair point. Maybe the answer is a hybrid model with clear office days."], { he: "That's a fair point הוא דרך מנומסת להודות בטיעון של הצד השני.", en: "'That's a fair point' acknowledges the other side." }),
            ],
          },
          {
            slug: "b2-meetings-grammar", kind: "grammar", minutes: 7,
            title_en: "Reported speech", title_he: "דיבור עקיף",
            intro_he: "בדיבור עקיף בדרך כלל זזים זמן אחד אחורה: I am busy הופך ל־She said she was busy.",
            intro_en: "In reported speech we usually shift tense back: 'I am busy' → She said she was busy.",
            exercises: [
              mc("\"We will send the contract today.\" → They said they ___ the contract that day.", ["will send", "would send", "sent", "have sent"], 1, { grammar: "reported-speech", he: "will הופך ל־would בדיבור עקיף.", en: "will → would." }),
              mc("\"I'm working on it.\" → He said he ___ on it.", ["is working", "was working", "works", "has worked"], 1, { grammar: "reported-speech", he: "am working הופך ל־was working.", en: "am working → was working." }),
              mc("She ___ me that the deadline had changed.", ["said", "told", "spoke", "talked"], 1, { grammar: "reported-speech", he: "tell מקבל אדם אחריו: told me. say לא: said that.", en: "tell + person (told me); say + that." }),
              fix("He asked me what did I think.", ["He asked me what I thought."], { grammar: "reported-speech", he: "בשאלה עקיפה סדר המילים כמו במשפט רגיל, בלי did.", en: "Reported questions use statement word order, no 'did'." }),
              rewrite("\"Can you follow up with the client?\" she asked me.", "Report this request using 'asked me to'.", "דווח על הבקשה עם asked me to.", ["She asked me to follow up with the client."], { grammar: "reported-speech", vocab: "follow up", he: "בקשה מדווחים עם asked someone to ואחריו פועל.", en: "Requests: asked someone to + verb." }),
            ],
          },
          {
            slug: "b2-meetings-vocab", kind: "vocabulary", minutes: 6,
            title_en: "Meeting language", title_he: "שפת פגישות",
            exercises: [
              mc("The approval process is the main ___. Everything waits for legal.", ["bottleneck", "bottle", "deadline", "benchmark"], 0, { vocab: "bottleneck", he: "bottleneck הוא צוואר בקבוק, נקודה שמעכבת הכול.", en: "Bottleneck = the point that slows everything." }),
              mc("Are we still ___ for the March launch?", ["on track", "in track", "on the road", "at track"], 0, { vocab: "on track", he: "on track פירושו מתקדמים לפי התוכנית.", en: "on track = progressing as planned." }),
              mc("Which is the most polite way to disagree in a meeting?", ["I see your point, but I'm not sure that's the best option.", "You're wrong.", "That's a stupid idea.", "No."], 0, { he: "קודם מכירים בטיעון, ואז מציגים דעה אחרת בעדינות.", en: "Acknowledge first, then disagree softly." }),
              tr("יש פה פשרה בין מהירות לאיכות.", ["There's a trade-off between speed and quality.", "There is a trade-off between speed and quality.", "There's a tradeoff between speed and quality."], { vocab: "trade-off", he: "trade-off הוא פשרה בין שני דברים רצויים.", en: "trade-off = balancing two good things." }),
              speak("Negotiate with a sponsor: they offer $500 for your event; you want $1,000. Propose a compromise.", "נהל משא ומתן עם ספונסר: הוא מציע 500 דולר לאירוע ואתה רוצה 1,000. הצע פשרה.", ["offer", "how about", "in return"], "Thanks for the offer. Our events usually bring over a hundred founders and students, so we were hoping for a thousand. How about seven hundred and fifty, and in return we'll give you a speaking slot and your logo on all our posts?", { vocab: "negotiate", he: "How about הוא דרך רכה להציע. in return מציע תמורה.", en: "'How about…?' to propose; 'in return' to offer value." }),
            ],
          },
        ],
      },
      {
        slug: "b2-idioms", level: "B2", title_en: "Natural expressions and academic listening", title_he: "ביטויים טבעיים והאזנה אקדמית",
        objectives: [
          { en: "Use common business idioms correctly", he: "להשתמש נכון בניבים עסקיים נפוצים" },
          { en: "Follow a short academic lecture", he: "לעקוב אחרי הרצאה אקדמית קצרה" },
          { en: "Write a clear argument paragraph", he: "לכתוב פסקת טיעון ברורה" },
        ],
        prerequisites: ["b2-meetings"],
        grammar: ["relative-clauses", "conditionals"],
        vocabulary: ["break the ice", "on the same page", "a piece of cake", "hit the ground running", "come up with", "evidence", "significant"],
        lessons: [
          {
            slug: "b2-idioms-vocab", kind: "vocabulary", minutes: 6,
            title_en: "Idioms you'll actually hear", title_he: "ניבים שבאמת שומעים",
            exercises: [
              mc("Before we start, let's make sure we're all ___.", ["on the same page", "in the same book", "on the same line", "at the same page"], 0, { vocab: "on the same page", he: "on the same page פירושו מסכימים ומבינים אותו דבר.", en: "on the same page = in agreement." }),
              mc("A short game at the start of a meeting can help ___.", ["break the ice", "break the glass", "cut the ice", "melt the ice"], 0, { vocab: "break the ice", he: "break the ice פירושו לשבור את הקרח בתחילת מפגש.", en: "break the ice = make people comfortable." }),
              mc("The new hire already knew the tools, so she ___.", ["hit the ground running", "hit the road", "ran the ground", "hit the floor"], 0, { vocab: "hit the ground running", he: "hit the ground running פירושו להתחיל לעבוד ביעילות מהרגע הראשון.", en: "Start effectively from day one." }),
              fill("We need to ___ a better name for the event.", [["come up with"]], { vocab: "come up with", he: "come up with פירושו להמציא או להגות רעיון.", en: "come up with = think of an idea." }),
              mc("For him, the exam was ___. He finished in twenty minutes.", ["a piece of cake", "a piece of pie", "a cup of tea", "a slice of bread"], 0, { vocab: "a piece of cake", he: "a piece of cake פירושו משהו קל מאוד.", en: "Very easy." }),
            ],
          },
          {
            slug: "b2-idioms-lecture", kind: "listening", minutes: 7,
            title_en: "Lecture: sleep and memory", title_he: "הרצאה: שינה וזיכרון",
            exercises: [
              listen("b2-lecture-sleep", "What happens during deep sleep, according to the lecture?", ["The brain rests completely", "The brain replays information from the day", "Memories are deleted", "We learn new words"], 1, { he: "המוח משחזר מידע שנלמד במהלך היום.", en: "The brain replays information learned that day." }),
              listen("b2-lecture-sleep", "What is 'consolidation'?", ["Forgetting unimportant details", "Moving memories to long-term storage", "Sleeping less", "Studying all night"], 1, { he: "consolidation הוא העברת זיכרונות מזיכרון קצר טווח לארוך טווח.", en: "Moving memories from short- to long-term." }),
              listen("b2-lecture-sleep", "What is the lecturer's conclusion about all-nighters?", ["They are effective", "They may be counterproductive", "They are necessary", "They improve focus"], 1, { he: "counterproductive פירושו שזה עלול להזיק יותר משזה עוזר.", en: "They may actually be counterproductive." }),
              dictation("b2-lecture-sleep", 0, ["Today I want to look at the relationship between sleep and memory."], { vocab: "significant", he: "relationship between ואחריו שני דברים.", en: "relationship between A and B." }),
            ],
          },
          {
            slug: "b2-idioms-writing", kind: "writing", minutes: 10,
            title_en: "Write an argument", title_he: "כתיבת טיעון",
            exercises: [
              reading("Some universities are considering banning laptops in lectures. Supporters claim that students who take notes by hand remember more. However, others point out that laptops help students with disabilities and allow faster note-taking. A possible compromise is to create laptop-free zones in each lecture hall.", "What compromise does the text suggest?", ["Banning laptops completely", "Laptop-free zones in each hall", "Recording all lectures", "Allowing only tablets"], 1, { vocab: "point out", he: "הפשרה היא אזורים ללא מחשבים בכל אולם.", en: "Laptop-free zones." }),
              err(["The study", "which", "was published last year", "it shows", "a significant effect."], 3, { grammar: "relative-clauses", he: "אחרי פסוקית זיקה לא חוזרים על הנושא עם it. צריך shows.", en: "Don't repeat the subject with 'it' after a relative clause." }),
              write("Write one sentence that supports an opinion with evidence. Use 'evidence' and 'suggests'.", "כתוב משפט אחד שתומך בדעה בעזרת ראיות. השתמש ב־evidence וב־suggests.", ["evidence", "suggests"], "Recent evidence suggests that short breaks improve concentration.", { vocab: "evidence", he: "evidence היא מילה שאין לה רבים: לא evidences.", en: "'evidence' is uncountable." }),
              essay("Should companies require employees to come to the office? Write 120–160 words with a clear opinion, two reasons and one counter-argument.", "האם חברות צריכות לחייב עובדים להגיע למשרד? כתוב 120 עד 160 מילים עם דעה ברורה, שני נימוקים וטיעון נגדי אחד.", 100, 200, "In my view, companies should not require employees to be in the office every day, but they should set a few shared office days. First, remote days save employees hours of commuting, which can be used for focused work or rest. Second, flexible policies help companies hire talented people who live far from the office. On the other hand, it is true that junior employees learn faster when they work next to experienced colleagues, and some ideas only come up in informal conversations. However, this problem can be solved with two or three fixed office days for meetings and mentoring. Overall, a hybrid model offers the best balance between productivity and teamwork.", { grammar: "conditionals", he: "בדוק מילות קישור כמו First, On the other hand, However, Overall.", en: "Check linking words: First, On the other hand, However, Overall." }),
            ],
          },
        ],
      },
    ],
  }],
};
