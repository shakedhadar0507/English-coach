import type { CourseInput as Course } from "../schema";
import { dictation, err, essay, fill, fix, listen, mc, order, speak, tr, write } from "../dsl";

export const courseA2: Course = {
  slug: "everyday-life-a2", category: "travel-social", level: "A2",
  title_en: "Everyday Life: Past, Plans and Travel", title_he: "חיי היומיום: עבר, תוכניות וטיולים",
  description_en: "Talk about what happened, make plans, and handle travel and appointments.",
  description_he: "לספר מה קרה, לתכנן, ולהסתדר בטיולים ובקביעת תורים.",
  goals: ["everyday", "travel", "general_fluency"],
  modules: [{
    slug: "a2-stories-and-plans", title_en: "Stories and plans", title_he: "סיפורים ותוכניות",
    units: [
      {
        slug: "a2-last-weekend", level: "A2", title_en: "What did you do last weekend?", title_he: "מה עשית בסוף השבוע?",
        objectives: [
          { en: "Tell a short story in the past simple", he: "לספר סיפור קצר בעבר פשוט" },
          { en: "Use common irregular verbs correctly", he: "להשתמש נכון בפעלים לא סדירים נפוצים" },
          { en: "Ask past questions with 'did'", he: "לשאול שאלות בעבר עם did" },
        ],
        prerequisites: ["a1-daily-routine"],
        grammar: ["past-simple", "past-continuous"],
        vocabulary: ["invite", "forget", "crowded", "book", "mistake"],
        lessons: [
          {
            slug: "a2-weekend-grammar", kind: "grammar", minutes: 6,
            title_en: "The past simple", title_he: "עבר פשוט",
            intro_he: "בעבר פשוט מוסיפים ed לפעלים סדירים, אבל לפעלים נפוצים רבים יש צורה מיוחדת: go הופך ל־went.",
            intro_en: "Regular verbs add -ed; many common verbs are irregular (go → went).",
            exercises: [
              mc("Yesterday I ___ to the beach with my friends.", ["go", "went", "gone", "goed"], 1, { grammar: "past-simple", he: "go הוא פועל לא סדיר. בעבר: went.", en: "'go' is irregular: went." }),
              mc("___ you see the game last night?", ["Do", "Were", "Did", "Have"], 2, { grammar: "past-simple", he: "שאלה בעבר פשוט פותחים ב־Did.", en: "Past simple questions start with 'Did'." }),
              fill("We ___ (not / watch) the movie. We were too tired.", [["didn't watch", "did not watch"]], { grammar: "past-simple", he: "שלילה בעבר: didn't ואחריו הפועל בצורת הבסיס.", en: "Negative: didn't + base verb." }),
              fix("I didn't went to work on Sunday.", ["I didn't go to work on Sunday.", "I did not go to work on Sunday."], { grammar: "past-simple", he: "אחרי didn't הפועל חוזר לצורת הבסיס: go ולא went.", en: "After didn't, use the base form: go, not went." }),
              mc("I ___ dinner when you called.", ["cooked", "was cooking", "am cooking", "cook"], 1, { grammar: "past-continuous", he: "פעולה שהייתה באמצע כשמשהו אחר קרה: was cooking.", en: "An action in progress when another happened: past continuous." }),
              err(["She", "buyed", "a new phone", "last", "week."], 1, { grammar: "past-simple", he: "buy הוא לא סדיר. בעבר: bought.", en: "'buy' is irregular: bought." }),
              order("We met our friends at the beach.", { grammar: "past-simple", he: "נושא, פועל בעבר, מושא, ואחר כך מקום.", en: "Subject + past verb + object + place." }),
            ],
          },
          {
            slug: "a2-weekend-vocab", kind: "vocabulary", minutes: 4,
            title_en: "Plans, invitations and mistakes", title_he: "תוכניות, הזמנות וטעויות",
            exercises: [
              mc("What does 'crowded' mean?", ["צפוף, מלא אנשים", "שקט", "סגור", "יקר"], 0, { vocab: "crowded", he: "crowded מתאר מקום עם הרבה אנשים.", en: "Crowded = full of people." }),
              fill("They ___ us to their wedding in June.", [["invited"]], { vocab: "invite", he: "invite someone to something. בעבר: invited.", en: "invite someone to something; past: invited." }),
              mc("I ___ my keys at home, so I couldn't get into the office.", ["forgot", "forget", "forgotten", "forgetting"], 0, { vocab: "forget", grammar: "past-simple", he: "forget בעבר הוא forgot.", en: "Past of 'forget' is 'forgot'." }),
              tr("עשיתי טעות בדוח.", ["I made a mistake in the report.", "I made a mistake on the report."], { vocab: "mistake", he: "באנגלית אומרים make a mistake ולא do a mistake.", en: "We say 'make a mistake', not 'do a mistake'." }),
              mc("Choose the correct sentence.", ["I booked a table for eight people.", "I reserved to a table for eight people.", "I booked for a table eight people.", "I did a booking table for eight."], 0, { vocab: "book", he: "book a table פירושו להזמין שולחן.", en: "'Book a table' = reserve a table." }),
            ],
          },
          {
            slug: "a2-weekend-writing", kind: "writing", minutes: 8,
            title_en: "Write about your weekend", title_he: "כתיבה על סוף השבוע",
            exercises: [
              write("Write one sentence about something you did yesterday. Use a past simple verb and 'yesterday'.", "כתוב משפט אחד על משהו שעשית אתמול. השתמש בפועל בעבר ובמילה yesterday.", ["yesterday"], "Yesterday I ran ten kilometers with my running group.", { grammar: "past-simple", he: "בדוק שהפועל בעבר.", en: "Check that the verb is in the past." }),
              speak("Tell a friend about your last weekend in 4–5 sentences: where you went, who you were with and what happened.", "ספר לחבר על סוף השבוע האחרון ב־4 עד 5 משפטים: לאן הלכת, עם מי, ומה קרה.", ["went", "was", "with"], "Last weekend I went to the north with my family. On Friday we had a big dinner. On Saturday morning I went for a long run. It was hot, but the view was amazing. In the evening we watched a movie.", { grammar: "past-simple", he: "שים לב לפעלים בעבר.", en: "Watch your past forms." }),
              essay("Describe a memorable weekend in 60–90 words. Use at least five past simple verbs.", "תאר סוף שבוע שזכור לך ב־60 עד 90 מילים. השתמש לפחות בחמישה פעלים בעבר פשוט.", 50, 130, "Last month I went to Eilat with three friends. We left early on Friday and arrived before lunch. The beach was crowded, so we rented a small boat and swam near the coral reef. In the evening we ate at a fish restaurant and talked for hours. On Saturday I woke up early and ran along the promenade. It was one of the best weekends of the year.", { grammar: "past-simple", he: "בדוק פעלים לא סדירים כמו went, ate, ran.", en: "Check irregular verbs: went, ate, ran." }),
            ],
          },
        ],
      },
      {
        slug: "a2-travel", level: "A2", title_en: "Travel and hotels", title_he: "טיולים ובתי מלון",
        objectives: [
          { en: "Check in at a hotel and at the airport", he: "לעשות צ'ק־אין במלון ובשדה התעופה" },
          { en: "Use prepositions of time and place", he: "להשתמש במילות יחס של זמן ומקום" },
          { en: "Understand short service conversations", he: "להבין שיחות שירות קצרות" },
        ],
        prerequisites: ["a2-last-weekend"],
        grammar: ["prepositions", "future-forms"],
        vocabulary: ["reservation", "luggage", "boarding pass", "check in", "delay", "comfortable"],
        lessons: [
          {
            slug: "a2-travel-listening", kind: "listening", minutes: 5,
            title_en: "Checking in", title_he: "צ'ק־אין במלון",
            exercises: [
              listen("a2-hotel-checkin", "How many nights is the guest staying?", ["One", "Two", "Three", "Four"], 1, { he: "האורח אומר Two nights.", en: "He says 'Two nights'." }),
              listen("a2-hotel-checkin", "Where is the Wi-Fi password?", ["On the key card", "At reception", "In the email", "On the door"], 0, { he: "הסיסמה נמצאת על כרטיס המפתח: on your key card.", en: "It's on the key card." }),
              listen("a2-hotel-checkin", "When is breakfast?", ["From six to nine", "From seven to ten", "From eight to eleven", "There is no breakfast"], 1, { he: "ארוחת הבוקר משבע עד עשר.", en: "From seven to ten." }),
              dictation("a2-hotel-checkin", 0, ["Good evening. Do you have a reservation?", "Good evening, do you have a reservation?"], { vocab: "reservation", he: "reservation פירושו הזמנה מראש.", en: "Reservation = a booking." }),
            ],
          },
          {
            slug: "a2-travel-grammar", kind: "grammar", minutes: 6,
            title_en: "In, on, at", title_he: "in, on, at",
            intro_he: "at לשעה ולנקודה מדויקת, on ליום ולתאריך, in לחודש, לשנה ולמקום סגור.",
            intro_en: "at + time/point, on + day/date, in + month/year/enclosed place.",
            exercises: [
              mc("My flight leaves ___ 6:40.", ["in", "on", "at", "by"], 2, { grammar: "prepositions", he: "לפני שעה מדויקת: at.", en: "Use 'at' with clock times." }),
              mc("The conference is ___ Monday.", ["in", "on", "at", "to"], 1, { grammar: "prepositions", he: "לפני יום בשבוע: on.", en: "Use 'on' with days." }),
              mc("We're going to Lisbon ___ November.", ["in", "on", "at", "for"], 0, { grammar: "prepositions", he: "לפני חודש: in.", en: "Use 'in' with months." }),
              fill("Your boarding pass is ___ your phone, in the airline app.", [["on"]], { grammar: "prepositions", vocab: "boarding pass", he: "על מסך הטלפון אומרים on your phone.", en: "We say 'on your phone'." }),
              mc("I think it ___ rain tomorrow. Take an umbrella.", ["will", "is going", "rains", "is raining"], 0, { grammar: "future-forms", he: "תחזית או דעה על העתיד: will.", en: "Prediction/opinion: will." }),
              fix("I arrive to the hotel at night.", ["I arrive at the hotel at night.", "I'll arrive at the hotel at night.", "I will arrive at the hotel at night."], { grammar: "prepositions", he: "arrive at למקום מסוים, arrive in לעיר או מדינה. לא arrive to.", en: "arrive at (place) / arrive in (city); never 'arrive to'." }),
            ],
          },
          {
            slug: "a2-travel-vocab", kind: "vocabulary", minutes: 5,
            title_en: "At the airport", title_he: "בשדה התעופה",
            exercises: [
              mc("What is 'luggage'?", ["מזוודות, כבודה", "כרטיס טיסה", "עיכוב", "שער עלייה"], 0, { vocab: "luggage", he: "luggage היא כבודה. זו מילה שאין לה רבים: לא luggages.", en: "Luggage is uncountable: not 'luggages'." }),
              fill("There is a two-hour ___ because of the weather.", [["delay"]], { vocab: "delay", he: "delay הוא עיכוב.", en: "Delay = when something is late." }),
              mc("You need to ___ online 24 hours before the flight.", ["check in", "check up", "check out", "check on"], 0, { vocab: "check in", he: "check in הוא רישום לטיסה או למלון.", en: "Check in = register for a flight/hotel." }),
              tr("המיטה הייתה מאוד נוחה.", ["The bed was very comfortable.", "The bed was really comfortable."], { vocab: "comfortable", he: "comfortable פירושו נוח. שים לב לאיות.", en: "Watch the spelling of 'comfortable'." }),
              speak("You are at a hotel reception. Ask about breakfast time, the Wi-Fi and late check-out.", "אתה בקבלה של מלון. שאל על שעות ארוחת הבוקר, על האינטרנט ועל עזיבה מאוחרת.", ["breakfast", "Wi-Fi", "check out"], "Hi, what time is breakfast? Is the Wi-Fi free, and what's the password? Also, is it possible to check out late, at around one?", { he: "שאלות מנומסות מתחילות לרוב ב־Is it possible או Could I.", en: "Polite questions: 'Is it possible…?', 'Could I…?'" }),
            ],
          },
        ],
      },
      {
        slug: "a2-health-appointments", level: "A2", title_en: "Appointments and health", title_he: "תורים ובריאות",
        objectives: [
          { en: "Make and change an appointment by phone", he: "לקבוע ולשנות תור בטלפון" },
          { en: "Describe a simple health problem", he: "לתאר בעיה בריאותית פשוטה" },
        ],
        prerequisites: ["a2-last-weekend"],
        grammar: ["future-forms", "past-simple"],
        vocabulary: ["appointment", "injury", "improve", "practice", "recommend"],
        lessons: [
          {
            slug: "a2-health-listening", kind: "listening", minutes: 5,
            title_en: "Calling the clinic", title_he: "שיחה למרפאה",
            exercises: [
              listen("a2-doctor-appointment", "Why does the patient need a doctor?", ["She has a cold", "She hurt her knee", "She needs a vaccine", "She hurt her back"], 1, { he: "היא אומרת I hurt my knee while running.", en: "'I hurt my knee while running.'" }),
              listen("a2-doctor-appointment", "Which appointment does the patient take?", ["Thursday at 9:45", "Tomorrow at 4:00 p.m.", "Tomorrow at 9:45", "Thursday at 4:00 p.m."], 1, { he: "היא בוחרת במחר בארבע אחר הצהריים.", en: "She takes tomorrow at four." }),
              dictation("a2-doctor-appointment", 5, ["Tomorrow at four is perfect.", "Tomorrow at 4 is perfect."], { he: "משפט קצר לאישור.", en: "A short confirmation phrase." }),
            ],
          },
          {
            slug: "a2-health-vocab", kind: "vocabulary", minutes: 5,
            title_en: "Health and training", title_he: "בריאות ואימונים",
            exercises: [
              mc("I'd like to make an ___ with Dr. Cohen.", ["appointment", "meeting", "date", "invitation"], 0, { vocab: "appointment", he: "תור אצל רופא הוא appointment.", en: "At a doctor: appointment." }),
              mc("A runner's knee problem after a fall is an ___.", ["injury", "illness", "infection", "accident"], 0, { vocab: "injury", he: "injury היא פציעה גופנית.", en: "Injury = physical damage to the body." }),
              fill("If you ___ every day, your English will improve.", [["practice", "practise"]], { vocab: "practice", he: "practice הוא פועל במשמעות להתאמן. בבריטית כותבים practise.", en: "Verb: practice (US) / practise (UK)." }),
              mc("Can you ___ a good physiotherapist?", ["recommend", "recommend me to", "advise to", "suggest me"], 0, { vocab: "recommend", he: "recommend something, בלי me אחרי הפועל.", en: "recommend + noun (not 'recommend me')." }),
              tr("הריצה שלי השתפרה מאוד החודש.", ["My running improved a lot this month.", "My running has improved a lot this month.", "My running really improved this month."], { vocab: "improve", he: "improve פירושו להשתפר.", en: "improve = get better." }),
            ],
          },
          {
            slug: "a2-health-speaking", kind: "speaking", minutes: 5,
            title_en: "Booking by phone", title_he: "קביעת תור בטלפון",
            exercises: [
              speak("Call a clinic: ask for an appointment, explain the problem, and ask for an earlier time.", "התקשר למרפאה: בקש תור, הסבר את הבעיה ושאל אם יש מועד מוקדם יותר.", ["appointment", "earlier"], "Hi, I'd like to make an appointment with a physiotherapist. I hurt my ankle during a run. Do you have anything earlier this week?", { he: "I'd like to הוא ביטוי מנומס לבקשה.", en: "'I'd like to…' is a polite request." }),
              write("Write a sentence with 'going to' about a plan for next week.", "כתוב משפט עם going to על תוכנית לשבוע הבא.", ["going to"], "I'm going to start physiotherapy next week.", { grammar: "future-forms", he: "תוכנית שכבר החלטת עליה: going to.", en: "A plan you've decided: going to." }),
              order("I'm going to see the doctor tomorrow.", { grammar: "future-forms", he: "be going to ואחריו הפועל.", en: "be going to + verb." }),
            ],
          },
        ],
      },
    ],
  }],
};
