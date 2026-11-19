import { grammarTopics } from "./grammar";
import { vocabulary } from "./vocabulary";
import { listening } from "./listening";
import { courseA1 } from "./courses/a1";
import { assessmentItems, placementListening } from "./assessment";
import type { ContentBundle } from "./validate";

export const categories = [
  { slug: "everyday-conversations", title_en: "Everyday Conversations", title_he: "שיחות יומיומיות" },
  { slug: "vocabulary-essentials", title_en: "Vocabulary Essentials", title_he: "אוצר מילים חיוני" },
  { slug: "grammar-foundations", title_en: "Grammar Foundations", title_he: "יסודות הדקדוק" },
  { slug: "business-english", title_en: "Business English", title_he: "אנגלית עסקית" },
  { slug: "academic-english", title_en: "Academic English", title_he: "אנגלית אקדמית" },
  { slug: "travel-social", title_en: "Travel and Social Situations", title_he: "טיולים ומצבים חברתיים" },
  { slug: "professional-communication", title_en: "Professional Communication", title_he: "תקשורת מקצועית" },
  { slug: "reading-comprehension", title_en: "Reading Comprehension", title_he: "הבנת הנקרא" },
  { slug: "listening-comprehension", title_en: "Listening Comprehension", title_he: "הבנת הנשמע" },
  { slug: "idioms-expressions", title_en: "Natural Expressions and Idioms", title_he: "ביטויים וניבים" },
];

export const levels = [
  { code: "A1", ordinal: 1, title_en: "Beginner", title_he: "מתחילים", description_en: "Can understand and use familiar everyday expressions and very basic phrases.", description_he: "מבין ומשתמש בביטויים יומיומיים מוכרים ובמשפטים בסיסיים מאוד." },
  { code: "A2", ordinal: 2, title_en: "Elementary", title_he: "בסיסי", description_en: "Can communicate in simple, routine tasks on familiar topics.", description_he: "מסוגל לתקשר במשימות פשוטות ושגרתיות בנושאים מוכרים." },
  { code: "B1", ordinal: 3, title_en: "Intermediate", title_he: "בינוני", description_en: "Can deal with most situations while travelling and describe experiences, plans and opinions.", description_he: "מתמודד עם רוב המצבים בטיול, ומתאר חוויות, תוכניות ודעות." },
  { code: "B2", ordinal: 4, title_en: "Upper intermediate", title_he: "בינוני־גבוה", description_en: "Can interact with fluency and spontaneity with native speakers on a wide range of topics.", description_he: "מתקשר בשטף ובספונטניות עם דוברי שפת אם במגוון רחב של נושאים." },
  { code: "C1", ordinal: 5, title_en: "Advanced", title_he: "מתקדם", description_en: "Can express ideas fluently and precisely for social, academic and professional purposes.", description_he: "מבטא רעיונות בשטף ובדיוק, לצרכים חברתיים, אקדמיים ומקצועיים." },
  { code: "C2", ordinal: 6, title_en: "Proficient", title_he: "שליטה מלאה", description_en: "Can understand virtually everything heard or read and express themselves with precision and nuance.", description_he: "מבין כמעט כל דבר ששומע או קורא, ומתבטא בדיוק ובדקות." },
] as const;

export const bundle: ContentBundle = {
  grammar: grammarTopics,
  vocabulary,
  listening: [...listening, ...placementListening],
  courses: [courseA1],
  assessment: assessmentItems,
};
