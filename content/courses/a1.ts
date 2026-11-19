import type { CourseInput as Course } from "../schema";
import { dictation, err, essay, fill, fix, listen, mc, order, speak, tr, write } from "../dsl";

export const courseA1: Course = {
  slug: "foundations-a1", category: "everyday-conversations", level: "A1",
  title_en: "Foundations: Me and My World", title_he: "יסודות: אני והעולם שלי",
  description_en: "Introduce yourself, describe your routine and get around town.",
  description_he: "להציג את עצמך, לתאר את השגרה שלך ולהתמצא בעיר.",
  goals: ["everyday", "general_fluency", "travel"],
  modules: [{
    slug: "a1-me-and-my-day", title_en: "Me and my day", title_he: "אני והיום שלי",
    units: [
      {
        slug: "a1-introductions", level: "A1", title_en: "Introducing yourself", title_he: "להציג את עצמך",
        objectives: [
          { en: "Say your name, job and where you live", he: "לומר את השם, העיסוק ומקום המגורים" },
          { en: "Use 'to be' and a complete subject in every sentence", he: "להשתמש ב־to be ובנושא מלא בכל משפט" },
        ],
        grammar: ["sentence-structure", "articles"],
        vocabulary: ["family", "friend", "neighbor", "job", "work"],
        lessons: [
          {
            slug: "a1-introductions-grammar", kind: "grammar", minutes: 5,
            title_en: "Complete sentences with 'to be'", title_he: "משפטים מלאים עם to be",
            intro_he: "בעברית אומרים 'אני סטודנט'. באנגלית חייבים פועל: I am a student.",
            intro_en: "English sentences need a verb. Use am / is / are.",
            exercises: [
              mc("I ___ a student at Reichman University.", ["am", "is", "are", "be"], 0, { grammar: "sentence-structure", he: "עם I משתמשים ב־am.", en: "Use 'am' with I." }),
              mc("My parents ___ from Haifa.", ["is", "am", "are", "be"], 2, { grammar: "sentence-structure", he: "my parents זה רבים, ולכן are.", en: "'My parents' is plural, so we use 'are'." }),
              fill("___ is cold today.", [["It"]], { grammar: "sentence-structure", he: "באנגלית חייבים נושא. כשאין נושא אמיתי משתמשים ב־It.", en: "English needs a subject. Use the dummy subject 'It'." }),
              fix("She engineer.", ["She is an engineer.", "She's an engineer."], { grammar: "sentence-structure", he: "חסרים is ו־an. לפני מקצוע ביחיד צריך מילית.", en: "Missing 'is' and the article 'an'." }),
              mc("He is ___ teacher.", ["a", "an", "the", "—"], 0, { grammar: "articles", he: "teacher מתחיל בצליל עיצור, ולכן a.", en: "'teacher' starts with a consonant sound, so 'a'." }),
              mc("She is ___ architect.", ["a", "an", "—", "the"], 1, { grammar: "articles", he: "architect מתחיל בצליל תנועה, ולכן an.", en: "'architect' starts with a vowel sound, so 'an'." }),
              order("My brother is a doctor.", { grammar: "sentence-structure", he: "נושא, פועל, ואחר כך המקצוע.", en: "Subject + verb + complement." }),
              err(["We", "is", "very", "busy", "today."], 1, { grammar: "sentence-structure", he: "עם we משתמשים ב־are.", en: "Use 'are' with 'we'." }),
            ],
          },
          {
            slug: "a1-introductions-vocab", kind: "vocabulary", minutes: 4,
            title_en: "People in my life", title_he: "האנשים בחיים שלי",
            exercises: [
              mc("What is 'neighbor' in Hebrew?", ["שכן", "חבר", "בן משפחה", "עמית"], 0, { vocab: "neighbor", he: "neighbor הוא אדם שגר לידך.", en: "A neighbor lives near you." }),
              mc("Choose the English word for 'עבודה, משרה'.", ["job", "jog", "joy", "job interview"], 0, { vocab: "job", he: "job היא משרה או עבודה בתשלום.", en: "A job is regular paid work." }),
              fill("She is my best ___. We talk every day.", [["friend"]], { vocab: "friend", he: "best friend הוא החבר הכי טוב.", en: "'Best friend' is a common collocation." }),
              tr("המשפחה שלי גרה בירושלים.", ["My family lives in Jerusalem.", "My family live in Jerusalem."], { vocab: "family", he: "family ביחיד בדרך כלל עם lives. באנגלית בריטית גם live מקובל.", en: "'Family' usually takes a singular verb (lives); British English also accepts 'live'." }),
              tr("אני עובד בהייטק.", ["I work in high-tech.", "I work in high tech.", "I work in tech.", "I work in the tech industry."], { vocab: "work", he: "work in ואחריו תחום.", en: "Use 'work in' + industry." }),
            ],
          },
          {
            slug: "a1-introductions-speaking", kind: "speaking", minutes: 4,
            title_en: "Say it out loud", title_he: "לומר בקול",
            exercises: [
              speak("Introduce yourself in 3–4 sentences: name, where you live, what you do, and one hobby.", "הצג את עצמך ב־3 עד 4 משפטים: שם, איפה אתה גר, מה אתה עושה ותחביב אחד.", ["live", "work", "like"], "Hi, I'm Shaked. I live in Tel Aviv. I'm a business student, and I also manage a running community. I like running in the morning.", { he: "שים לב שבכל משפט יש נושא ופועל.", en: "Make sure every sentence has a subject and a verb." }),
              write("Write one sentence about a family member using 'is'.", "כתוב משפט אחד על בן משפחה, עם המילה is.", ["is"], "My sister is a nurse in Haifa.", { grammar: "sentence-structure", he: "משפט עם נושא, is, ותיאור.", en: "Subject + is + description." }),
            ],
          },
        ],
      },
      {
        slug: "a1-daily-routine", level: "A1", title_en: "My daily routine", title_he: "השגרה היומית שלי",
        objectives: [
          { en: "Describe habits with the Present Simple", he: "לתאר הרגלים בהווה פשוט" },
          { en: "Use adverbs of frequency in the right position", he: "למקם נכון מילים של תדירות" },
        ],
        prerequisites: ["a1-introductions"],
        grammar: ["present-simple"],
        vocabulary: ["wake up", "get up", "breakfast", "usually", "always", "never", "sometimes", "busy", "tired"],
        lessons: [
          {
            slug: "a1-routine-vocab", kind: "vocabulary", minutes: 4,
            title_en: "Routine words", title_he: "מילים של שגרה",
            exercises: [
              mc("What is the difference between 'wake up' and 'get up'?", ["wake up = stop sleeping; get up = leave the bed", "They mean exactly the same", "wake up = leave the bed; get up = stop sleeping", "get up is only for the evening"], 0, { vocab: "get up", he: "wake up זה להתעורר. get up זה לקום מהמיטה.", en: "You wake up (open your eyes), then you get up (out of bed)." }),
              fill("I ___ drink coffee after 4 p.m. It keeps me awake. (אף פעם)", [["never"]], { vocab: "never", he: "never פירושו אף פעם. באנגלית לא משתמשים בשלילה כפולה.", en: "'Never' = at no time. No double negative." }),
              mc("Choose the best word: I'm ___ after a 20 km run.", ["tired", "busy", "hungry", "cheap"], 0, { vocab: "tired", he: "tired פירושו עייף.", en: "'Tired' means needing rest." }),
              tr("בדרך כלל אני אוכל ארוחת בוקר בשבע.", ["I usually have breakfast at seven.", "I usually eat breakfast at seven.", "I usually have breakfast at 7.", "I usually eat breakfast at 7."], { vocab: "usually", he: "usually בא לפני הפועל הראשי.", en: "'Usually' goes before the main verb." }),
              order("She always answers emails quickly.", { vocab: "always", he: "מילת התדירות באה לפני הפועל הראשי.", en: "Adverbs of frequency go before the main verb." }),
            ],
          },
          {
            slug: "a1-routine-grammar", kind: "grammar", minutes: 6,
            title_en: "Present Simple", title_he: "הווה פשוט",
            intro_he: "בגוף שלישי יחיד (he, she, it) מוסיפים s לפועל. זו הטעות הכי נפוצה אצל דוברי עברית.",
            exercises: [
              mc("She ___ in a bank.", ["work", "works", "working", "is work"], 1, { grammar: "present-simple", he: "she זה גוף שלישי יחיד, ולכן works.", en: "Third person singular: works." }),
              fill("He ___ (go) to the gym three times a week.", [["goes"]], { grammar: "present-simple", he: "אחרי o מוסיפים es: goes.", en: "Verbs ending in -o add -es: goes." }),
              fill("My sister ___ (watch) TV every evening.", [["watches"]], { grammar: "present-simple", he: "אחרי ch מוסיפים es.", en: "Verbs ending in -ch add -es." }),
              mc("___ you speak English at work?", ["Do", "Does", "Are", "Is"], 0, { grammar: "present-simple", he: "שאלה עם you בהווה פשוט מתחילה ב־Do.", en: "Questions with 'you' use 'Do'." }),
              fill("She ___ like coffee. She prefers tea.", [["doesn't", "does not"]], { grammar: "present-simple", he: "שלילה בגוף שלישי יחיד: doesn't, ואחריו פועל בסיס.", en: "Negative third person: doesn't + base verb." }),
              fix("He don't like early meetings.", ["He doesn't like early meetings.", "He does not like early meetings."], { grammar: "present-simple", he: "עם he משתמשים ב־doesn't.", en: "With 'he', use 'doesn't'." }),
              err(["She", "doesn't", "likes", "running."], 2, { grammar: "present-simple", he: "אחרי doesn't הפועל חוזר לבסיס: like.", en: "After 'doesn't', use the base verb: like." }),
              mc("Water ___ at 100°C.", ["boil", "boils", "is boiling", "boiling"], 1, { grammar: "present-simple", he: "עובדה מדעית, ולכן הווה פשוט.", en: "A scientific fact takes the Present Simple." }),
              tr("הוא לא עובד בימי שישי.", ["He doesn't work on Fridays.", "He does not work on Fridays."], { grammar: "present-simple", he: "doesn't ואחריו work, ולפני ימים on.", en: "doesn't + work; 'on' with days." }),
            ],
          },
          {
            slug: "a1-routine-listening", kind: "listening", minutes: 4,
            title_en: "Noa's morning", title_he: "הבוקר של נועה",
            exercises: [
              listen("a1-morning-routine", "What time does Noa usually wake up?", ["6:00", "6:30", "7:30", "8:15"], 1, { he: "היא אומרת six thirty, כלומר שש וחצי.", en: "She says 'six thirty'." }),
              listen("a1-morning-routine", "Who does she have breakfast with?", ["Her mother", "Her friend", "Her brother", "Alone"], 2, { he: "היא אומרת with my brother, כלומר עם אחיה.", en: "She has breakfast with her brother." }),
              listen("a1-morning-routine", "How does she get to work?", ["By train", "By bike", "On foot", "By bus"], 3, { he: "היא אומרת I take the bus, כלומר באוטובוס.", en: "She takes the bus." }),
              dictation("a1-morning-routine", 0, ["I usually wake up at six thirty.", "I usually wake up at 6:30."], { he: "שים לב למיקום של usually.", en: "Notice where 'usually' goes." }),
            ],
          },
          {
            slug: "a1-routine-writing", kind: "writing", minutes: 6,
            title_en: "Write about your day", title_he: "כתוב על היום שלך",
            exercises: [
              write("Write a sentence about your morning using 'usually'.", "כתוב משפט על הבוקר שלך עם usually.", ["usually"], "I usually run before breakfast.", { vocab: "usually", he: "usually בא לפני הפועל.", en: "'Usually' goes before the verb." }),
              essay("Describe a typical weekday in 50–80 words. Use at least three adverbs of frequency.", "תאר יום חול רגיל ב־50 עד 80 מילים. השתמש לפחות בשלוש מילים של תדירות.", 40, 120, "I usually wake up at six. I always drink water first, and then I go for a run. I sometimes have breakfast with my roommate, but I never eat a big meal before classes. I take the bus to the university at eight. In the evening, I usually work on my community and I often go to bed late.", { grammar: "present-simple", he: "בדוק את ה־s בגוף שלישי ואת מיקום מילות התדירות.", en: "Check third-person -s and adverb position." }),
            ],
          },
        ],
      },
      {
        slug: "a1-right-now", level: "A1", title_en: "What's happening now", title_he: "מה קורה עכשיו",
        objectives: [
          { en: "Describe actions in progress with the Present Continuous", he: "לתאר פעולות שקורות עכשיו" },
          { en: "Choose between Present Simple and Present Continuous", he: "לבחור בין הווה פשוט להווה מתמשך" },
          { en: "Ask and answer simple questions", he: "לשאול ולענות על שאלות פשוטות" },
        ],
        prerequisites: ["a1-daily-routine"],
        grammar: ["present-continuous", "questions-negatives"],
        vocabulary: ["weather", "weekend"],
        lessons: [
          {
            slug: "a1-now-grammar", kind: "grammar", minutes: 6,
            title_en: "Present Continuous", title_he: "הווה מתמשך",
            exercises: [
              mc("Look! It ___.", ["rains", "is raining", "rain", "raining"], 1, { grammar: "present-continuous", he: "Look מראה שזה קורה עכשיו, ולכן הווה מתמשך.", en: "'Look!' signals now → Present Continuous." }),
              fill("I ___ (work) from home today.", [["am working", "'m working"]], { grammar: "present-continuous", he: "today מצביע על מצב זמני.", en: "'Today' shows a temporary situation." }),
              mc("She usually ___ by bus, but today she ___.", ["goes / is walking", "is going / walks", "go / walking", "goes / walks"], 0, { grammar: "present-continuous", he: "usually להרגל, today לחריגה זמנית.", en: "'usually' = habit (simple); 'today' = temporary (continuous)." }),
              fix("I am knowing the answer.", ["I know the answer."], { grammar: "present-continuous", he: "know הוא פועל מצב, ולא בא בהווה מתמשך.", en: "'Know' is a stative verb." }),
              mc("Which sentence is correct?", ["I want a coffee.", "I am wanting a coffee.", "I wanting a coffee.", "I wants a coffee."], 0, { grammar: "present-continuous", he: "want הוא פועל מצב.", en: "'Want' is stative." }),
              order("We are meeting the team tomorrow.", { grammar: "present-continuous", he: "הווה מתמשך יכול לתאר סידור עתידי.", en: "Present Continuous for a fixed arrangement." }),
            ],
          },
          {
            slug: "a1-now-questions", kind: "grammar", minutes: 5,
            title_en: "Asking questions", title_he: "לשאול שאלות",
            exercises: [
              mc("___ do you live?", ["Where", "Who", "What time", "Whose"], 0, { grammar: "questions-negatives", he: "Where שואלת על מקום.", en: "'Where' asks about place." }),
              fix("Where you work?", ["Where do you work?"], { grammar: "questions-negatives", he: "חסר פועל העזר do.", en: "Missing auxiliary 'do'." }),
              fix("What means this word?", ["What does this word mean?"], { grammar: "questions-negatives", he: "צריך does, ואחריו mean בבסיס.", en: "Use 'does' + base verb 'mean'." }),
              order("Are you working today?", { grammar: "questions-negatives", he: "בשאלה עם be, are בא לפני הנושא.", en: "With 'be', invert: Are you...?" }),
              mc("___ called you this morning?", ["Who", "Who did", "Whom did", "Who does"], 0, { grammar: "questions-negatives", he: "שאלה על הנושא, בלי פועל עזר.", en: "Subject question: no auxiliary." }),
              tr("מה אתה עושה בסוף השבוע?", ["What are you doing this weekend?", "What are you doing on the weekend?", "What do you do on weekends?", "What do you do on the weekend?"], { grammar: "questions-negatives", vocab: "weekend", he: "שתי האפשרויות נכונות: לתוכנית מסוימת, או להרגל.", en: "Both continuous (a plan) and simple (a habit) are possible." }),
            ],
          },
          {
            slug: "a1-now-speaking", kind: "speaking", minutes: 4,
            title_en: "Describe the moment", title_he: "לתאר את הרגע",
            exercises: [
              speak("Describe what you and the people around you are doing right now. Use at least three verbs in the Present Continuous.", "תאר מה אתה והאנשים סביבך עושים עכשיו. השתמש לפחות בשלושה פעלים בהווה מתמשך.", [], "Right now I'm sitting in a café. I'm practicing English on my phone. The barista is making coffee and two students are working on their laptops.", { grammar: "present-continuous", he: "am, is, are ואחריהם פועל עם ing.", en: "am/is/are + -ing." }),
            ],
          },
        ],
      },
      {
        slug: "a1-around-town", level: "A1", title_en: "Around town", title_he: "בעיר",
        objectives: [
          { en: "Order food and drinks politely", he: "להזמין אוכל ושתייה בנימוס" },
          { en: "Ask for and understand simple directions", he: "לשאול על הדרך ולהבין הוראות פשוטות" },
          { en: "Use a/an/the correctly", he: "להשתמש נכון ב־a, an, the" },
        ],
        prerequisites: ["a1-introductions"],
        grammar: ["articles"],
        vocabulary: ["expensive", "cheap", "ticket", "train station", "left", "straight"],
        lessons: [
          {
            slug: "a1-town-listening", kind: "listening", minutes: 5,
            title_en: "Café and directions", title_he: "בית קפה והכוונה",
            exercises: [
              listen("a1-cafe-order", "What does the customer order?", ["A small coffee and a cake", "A large coffee with oat milk and a croissant", "Tea and a croissant", "A large coffee with regular milk"], 1, { he: "הלקוח מבקש קפה גדול עם חלב שיבולת שועל וקרואסון אחד.", en: "Large coffee with oat milk + one croissant." }),
              listen("a1-cafe-order", "How much does it cost?", ["14 shekels", "20 shekels", "24 shekels", "40 shekels"], 2, { he: "twenty-four, כלומר 24.", en: "'Twenty-four'." }),
              listen("a1-directions", "Where is the station?", ["Next to a supermarket", "Opposite a bank", "Behind a school", "Next to a hotel"], 0, { he: "התחנה ליד סופרמרקט גדול: next to a big supermarket.", en: "Next to a big supermarket." }),
              dictation("a1-directions", 1, ["Go straight for two blocks, then turn left.", "Go straight for 2 blocks, then turn left."], { vocab: "straight", he: "go straight פירושו להמשיך ישר.", en: "'Go straight' = continue without turning." }),
            ],
          },
          {
            slug: "a1-town-articles", kind: "grammar", minutes: 5,
            title_en: "a, an, the", title_he: "a, an, the",
            exercises: [
              mc("I'd like ___ orange juice, please.", ["a", "an", "the", "—"], 1, { grammar: "articles", he: "orange מתחיל בצליל תנועה.", en: "Vowel sound → an." }),
              mc("It takes ___ hour to get there.", ["a", "an", "the", "—"], 1, { grammar: "articles", he: "ב־hour ה־h לא נשמעת, והצליל הראשון הוא תנועה.", en: "Silent h: 'an hour'." }),
              mc("She studies at ___ university in Herzliya.", ["a", "an", "the", "—"], 0, { grammar: "articles", he: "university נשמע כמו 'יוּ', צליל עיצור, ולכן a.", en: "'University' starts with a /j/ sound → a." }),
              fill("I bought a ticket. ___ ticket was cheap.", [["The"]], { grammar: "articles", vocab: "ticket", he: "בפעם השנייה שמזכירים את הכרטיס, הוא כבר ידוע, ולכן the.", en: "Second mention → the." }),
              fix("I need to buy new phone.", ["I need to buy a new phone."], { grammar: "articles", he: "שם עצם יחיד שאפשר לספור צריך a.", en: "Singular countable noun needs 'a'." }),
              mc("Choose the correct sentence.", ["Life is beautiful.", "The life is beautiful.", "A life is beautiful.", "Lifes is beautiful."], 0, { grammar: "articles", he: "מושג כללי בלי the, בשונה מעברית.", en: "General concepts take no article." }),
              mc("Apartments in Tel Aviv are very ___.", ["expensive", "cheap", "straight", "tired"], 0, { vocab: "expensive", he: "expensive פירושו יקר.", en: "'Expensive' = costing a lot." }),
            ],
          },
        ],
      },
    ],
  }],
};
