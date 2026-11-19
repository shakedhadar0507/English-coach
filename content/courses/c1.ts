import type { CourseInput as Course } from "../schema";
import { dictation, err, essay, fill, fix, listen, mc, reading, rewrite, speak, tr, write } from "../dsl";

export const courseC1: Course = {
  slug: "precision-academic-c1", category: "academic-english", level: "C1",
  title_en: "Precision and Academic Argument", title_he: "דיוק וטיעון אקדמי",
  description_en: "Express nuance, structure arguments and discuss complex topics precisely.",
  description_he: "להביע ניואנסים, לבנות טיעונים ולדון בנושאים מורכבים בדיוק.",
  goals: ["academic", "presentations", "business"],
  modules: [{
    slug: "c1-precision", title_en: "Precise English", title_he: "אנגלית מדויקת",
    units: [
      {
        slug: "c1-precision", level: "C1", title_en: "Reflecting on what went wrong", title_he: "תחקיר: מה השתבש",
        objectives: [
          { en: "Discuss past mistakes with inversion and mixed conditionals", he: "לדון בטעויות עבר עם היפוך ומשפטי תנאי מעורבים" },
          { en: "Use precise verbs instead of general ones", he: "להשתמש בפעלים מדויקים במקום כלליים" },
          { en: "Lead a candid, constructive post-mortem", he: "להוביל תחקיר כן ובונה" },
        ],
        prerequisites: ["b2-meetings"],
        grammar: ["advanced-structures", "conditionals"],
        vocabulary: ["in hindsight", "undermine", "mitigate", "streamline", "discrepancy", "take for granted"],
        lessons: [
          {
            slug: "c1-precision-listening", kind: "listening", minutes: 7,
            title_en: "A product post-mortem", title_he: "תחקיר אחרי השקה",
            exercises: [
              listen("c1-product-postmortem", "Why did the system fail at launch?", ["A security breach", "Traffic spiked much faster than expected", "A bug in the payment flow", "The servers were switched off"], 1, { he: "הבדיקות הניחו עלייה הדרגתית, אבל התנועה זינקה תוך דקות.", en: "Tests assumed a gradual ramp-up; traffic spiked within minutes." }),
              listen("c1-product-postmortem", "What damaged trust with early adopters?", ["The price", "The slow rollback", "The design", "The marketing email"], 1, { he: "החזרה לגרסה הקודמת לקחה יותר משעה, וזה פגע באמון.", en: "The rollback took over an hour." }),
              listen("c1-product-postmortem", "What does 'Had we rehearsed the rollback' mean?", ["We rehearsed it", "If we had rehearsed it", "We will rehearse it", "We should never rehearse it"], 1, { grammar: "advanced-structures", he: "Had we rehearsed הוא היפוך שמחליף את If we had rehearsed.", en: "Inversion = 'If we had rehearsed'." }),
              dictation("c1-product-postmortem", 0, ["Let's be candid about what went wrong with the launch.", "Let us be candid about what went wrong with the launch."], { he: "candid פירושו כן וגלוי, בלי לייפות.", en: "candid = honest and direct." }),
            ],
          },
          {
            slug: "c1-precision-grammar", kind: "grammar", minutes: 8,
            title_en: "Inversion and mixed conditionals", title_he: "היפוך ומשפטי תנאי מעורבים",
            intro_he: "היפוך נותן משקל ורשמיות: Not only did we miss the deadline, but we also lost the client. תנאי מעורב מחבר עבר להווה: If we had tested it, we wouldn't be in this situation now.",
            intro_en: "Inversion adds emphasis/formality. Mixed conditionals link a past condition to a present result.",
            exercises: [
              mc("Not only ___ the deadline, but we also exceeded the budget.", ["we missed", "did we miss", "we did miss", "missed we"], 1, { grammar: "advanced-structures", he: "אחרי Not only בתחילת משפט בא היפוך: did we miss.", en: "Not only + auxiliary + subject." }),
              mc("If we had hired a designer last year, our product ___ much better now.", ["would look", "would have looked", "will look", "looked"], 0, { grammar: "conditionals", he: "תנאי מעורב: תנאי בעבר ותוצאה בהווה, ולכן would look.", en: "Mixed: past condition → present result (would + verb)." }),
              rewrite("If I had known about the bug, I would have delayed the release.", "Rewrite starting with 'Had'.", "כתוב מחדש כך שהמשפט יתחיל ב־Had.", ["Had I known about the bug, I would have delayed the release."], { grammar: "advanced-structures", he: "מוותרים על If ומקדימים את had: Had I known.", en: "Drop 'if' and invert: Had I known…" }),
              mc("Rarely ___ such a strong first-year result.", ["we have seen", "have we seen", "we saw", "seen we have"], 1, { grammar: "advanced-structures", he: "אחרי Rarely בתחילת משפט: have we seen.", en: "Rarely + auxiliary + subject." }),
              fix("Never I have worked with such a talented team.", ["Never have I worked with such a talented team.", "I have never worked with such a talented team."], { grammar: "advanced-structures", he: "אחרי Never בתחילת משפט צריך היפוך: Never have I worked.", en: "Initial 'Never' requires inversion." }),
              err(["Had we", "tested", "the load,", "we would avoid", "the outage."], 3, { grammar: "conditionals", he: "התוצאה בעבר: we would have avoided.", en: "Past result: would have avoided." }),
            ],
          },
          {
            slug: "c1-precision-vocab", kind: "vocabulary", minutes: 6,
            title_en: "Precise verbs", title_he: "פעלים מדויקים",
            exercises: [
              mc("The delayed rollback ___ our credibility with early users.", ["undermined", "underlined", "understood", "underwent"], 0, { vocab: "undermine", he: "undermine פירושו לערער או להחליש בהדרגה.", en: "undermine = gradually weaken." }),
              mc("We introduced load tests to ___ the risk of another outage.", ["mitigate", "migrate", "mediate", "imitate"], 0, { vocab: "mitigate", he: "mitigate פירושו לצמצם נזק או סיכון.", en: "mitigate = reduce risk/harm." }),
              mc("There's a ___ between the numbers in the report and the dashboard.", ["discrepancy", "discretion", "description", "disruption"], 0, { vocab: "discrepancy", he: "discrepancy היא אי־התאמה בין שני נתונים.", en: "discrepancy = mismatch." }),
              fill("We automated the reports to ___ the onboarding process.", [["streamline"]], { vocab: "streamline", he: "streamline פירושו לייעל ולפשט תהליך.", en: "streamline = make simpler and more efficient." }),
              tr("בדיעבד, היינו צריכים לבדוק את המערכת עם יותר משתמשים.", ["In hindsight, we should have tested the system with more users.", "In hindsight we should have tested the system with more users.", "With hindsight, we should have tested the system with more users."], { vocab: "in hindsight", grammar: "modal-verbs", he: "in hindsight ואחריו should have ופועל בצורה שלישית.", en: "in hindsight + should have + past participle." }),
              speak("Lead a short post-mortem about a project that didn't go as planned: what happened, why, and two action items.", "הובל תחקיר קצר על פרויקט שלא הלך לפי התוכנית: מה קרה, למה, ושני צעדים להמשך.", ["in hindsight", "had we", "action items"], "Let's be candid about last month's event. Attendance was half of what we expected. In hindsight, we announced it too late and relied only on WhatsApp. Had we partnered with student unions earlier, we would have reached far more people. Two action items: announce events three weeks in advance, and set up at least two partner channels.", { grammar: "advanced-structures", he: "שלב in hindsight והיפוך עם Had we.", en: "Combine 'in hindsight' with 'Had we…'." }),
            ],
          },
        ],
      },
      {
        slug: "c1-academic-argument", level: "C1", title_en: "Academic argument", title_he: "טיעון אקדמי",
        objectives: [
          { en: "Follow and summarize a complex lecture", he: "לעקוב אחרי הרצאה מורכבת ולסכם אותה" },
          { en: "Hedge claims and use discourse markers", he: "לסייג טענות ולהשתמש במילות קישור" },
          { en: "Write a balanced academic paragraph", he: "לכתוב פסקה אקדמית מאוזנת" },
        ],
        prerequisites: ["c1-precision"],
        grammar: ["discourse-markers", "advanced-structures"],
        vocabulary: ["albeit", "thereby", "nuanced", "compelling", "by and large", "bear in mind", "ubiquitous", "articulate"],
        lessons: [
          {
            slug: "c1-academic-lecture", kind: "listening", minutes: 8,
            title_en: "Lecture: are algorithms neutral?", title_he: "הרצאה: האם אלגוריתמים ניטרליים?",
            exercises: [
              listen("c1-academic-ai-ethics", "What common assumption does the lecturer challenge?", ["Algorithms are expensive", "Algorithms are neutral because they are mathematical", "Algorithms are always biased", "Data is always accurate"], 1, { he: "המרצה מערער על ההנחה שאלגוריתמים ניטרליים כי הם מתמטיים.", en: "That algorithms are neutral because they're mathematical." }),
              listen("c1-academic-ai-ethics", "Why might a hiring model discriminate?", ["It is programmed to", "It learns from historical data that reflects past discrimination", "It has too little data", "It is too slow"], 1, { he: "המודל לומד מנתוני עבר שמשקפים אפליה, ולכן עלול לשחזר אותה.", en: "It reproduces discrimination present in historical data." }),
              listen("c1-academic-ai-ethics", "What does mitigating bias require, according to the lecturer?", ["Only better algorithms", "Technical fixes plus transparency and accountability", "Stopping all AI use", "More training data only"], 1, { vocab: "mitigate", he: "נדרשים גם תיקונים טכניים וגם שקיפות ואחריותיות.", en: "Technical fixes + transparency + accountability." }),
              dictation("c1-academic-ai-ethics", 1, ["However, a model is only as good as the data it is trained on.", "However, a model is only as good as the data it's trained on."], { he: "only as good as הוא מבנה שמשמעותו טוב רק כמו.", en: "'only as good as' = limited by." }),
            ],
          },
          {
            slug: "c1-academic-grammar", kind: "grammar", minutes: 7,
            title_en: "Hedging and discourse markers", title_he: "סייגים ומילות קישור",
            intro_he: "בכתיבה אקדמית מסייגים טענות (tends to, appears to, is likely to) ומחברים רעיונות במילות קישור מדויקות (whereas, thereby, nevertheless).",
            intro_en: "Academic writing hedges claims and connects ideas with precise markers.",
            exercises: [
              mc("Which sentence is appropriately hedged for academic writing?", ["The data appears to suggest a link between sleep and memory.", "The data proves sleep is everything.", "Everyone knows sleep helps memory.", "Sleep totally improves memory."], 0, { grammar: "discourse-markers", he: "appears to suggest מסייג את הטענה ולא מגזים.", en: "'appears to suggest' hedges the claim." }),
              mc("The model was retrained on balanced data, ___ reducing bias in its predictions.", ["thereby", "whereas", "albeit", "despite"], 0, { vocab: "thereby", grammar: "discourse-markers", he: "thereby פירושו ובכך, ומציג תוצאה.", en: "thereby = as a result of this." }),
              mc("The results were promising, ___ based on a small sample.", ["albeit", "although of", "despite of", "whereas"], 0, { vocab: "albeit", he: "albeit פירושו אם כי, ובא לפני תיאור קצר בלי פועל.", en: "albeit + adjective/phrase (no clause)." }),
              fill("Online courses are flexible, ___ classroom courses offer more interaction.", [["whereas", "while"]], { grammar: "discourse-markers", he: "whereas מנגיד בין שני רעיונות.", en: "whereas contrasts two ideas." }),
              fix("Despite of the limitations, the study is valuable.", ["Despite the limitations, the study is valuable.", "In spite of the limitations, the study is valuable."], { grammar: "discourse-markers", he: "despite בלי of, או in spite of.", en: "despite (no 'of') / in spite of." }),
              err(["Nevertheless,", "the findings", "are", "very much", "100% certain."], 4, { grammar: "discourse-markers", he: "בכתיבה אקדמית לא טוענים לוודאות מלאה. עדיף: are not conclusive או should be treated with caution.", en: "Avoid absolute certainty; hedge instead." }),
            ],
          },
          {
            slug: "c1-academic-writing", kind: "writing", minutes: 12,
            title_en: "A balanced academic paragraph", title_he: "פסקה אקדמית מאוזנת",
            exercises: [
              reading("Smartphones are now ubiquitous on university campuses. While some lecturers argue that they distract students, others note that phones give instant access to research tools. By and large, studies indicate that the effect depends less on the device itself than on how and when it is used.", "What is the main conclusion of the passage?", ["Phones should be banned", "The effect depends on how and when phones are used", "Phones always improve learning", "Lecturers agree on the issue"], 1, { vocab: "ubiquitous", he: "המסקנה היא שההשפעה תלויה באופן ובזמן השימוש.", en: "It depends on how and when they are used." }),
              mc("Which word best replaces 'very convincing' in an academic text?", ["compelling", "nice", "cool", "huge"], 0, { vocab: "compelling", he: "compelling פירושו משכנע מאוד, ומתאים לכתיבה רשמית.", en: "compelling = very convincing (formal)." }),
              write("Write one sentence that presents a nuanced view. Use 'nuanced' or 'bear in mind'.", "כתוב משפט אחד שמציג עמדה מורכבת. השתמש ב־nuanced או ב־bear in mind.", ["bear in mind"], "We should bear in mind that the benefits of remote learning vary considerably between students.", { vocab: "bear in mind", he: "bear in mind פירושו לזכור ולקחת בחשבון.", en: "bear in mind = remember/consider." }),
              essay("To what extent should universities use AI tools in teaching? Write a balanced paragraph of 150–200 words with hedged claims and at least three discourse markers.", "באיזו מידה אוניברסיטאות צריכות להשתמש בכלי בינה מלאכותית בהוראה? כתוב פסקה מאוזנת של 150 עד 200 מילים עם טענות מסויגות ולפחות שלוש מילות קישור.", 130, 240, "The use of AI tools in university teaching raises a nuanced question rather than a simple yes or no. On the one hand, such tools appear to offer considerable benefits: they can provide instant, personalized feedback and thereby allow lecturers to focus on discussion and mentoring. Moreover, students who struggle with academic writing may gain confidence by receiving immediate suggestions. On the other hand, there is a risk that over-reliance on AI could undermine the development of independent thinking. It should also be borne in mind that these systems are only as reliable as the data on which they are trained, and they may reproduce existing biases, albeit unintentionally. Consequently, a blanket ban seems as unhelpful as unrestricted use. A more compelling approach would be to integrate AI tools selectively, with clear guidelines on transparency and assessment. By and large, the evidence suggests that the value of these tools depends less on the technology itself than on how thoughtfully it is used.", { grammar: "discourse-markers", he: "בדוק סייגים כמו appear to ו־may, ומילות קישור כמו Moreover, Consequently, On the other hand.", en: "Check hedging and discourse markers." }),
            ],
          },
        ],
      },
    ],
  }],
};
