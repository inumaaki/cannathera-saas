/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

const messagesDir = path.join(__dirname, 'messages');

const translations = {
  de: {
    title: "Stornierungsbedingungen",
    lastUpdated: "Zuletzt aktualisiert: August 2026",
    s1Title: "Widerrufsrecht für Geschäftskunden (B2B)",
    s1Text: "Da sich die Cannathera-Plattform ausschließlich an gewerbliche Nutzer (Ärzte, medizinisches Fachpersonal, Telemediziner und Apotheken) im Rahmen ihrer beruflichen oder gewerblichen Tätigkeit richtet, besteht kein gesetzliches Widerrufsrecht gemäß § 355 BGB.",
    s2Title: "Kündigung und Stornierung von Abonnements",
    s2Text: "(1) Verträge und Abonnements können mit einer Frist von vier Wochen zum Ende der jeweiligen Vertragslaufzeit gekündigt werden, vorbehaltlich abweichender individueller Vereinbarungen (z.B. während einer Pilotphase).\n(2) Das Recht zur außerordentlichen Kündigung aus wichtigem Grund bleibt für beide Parteien jederzeit unberührt.\n(3) Jede Kündigung bedarf zu ihrer Wirksamkeit der Schriftform (z.B. per E-Mail an den Support)."
  },
  pl: {
    title: "Polityka anulowania",
    lastUpdated: "Ostatnia aktualizacja: Sierpień 2026",
    s1Title: "Prawo do odstąpienia od umowy dla firm (B2B)",
    s1Text: "Ponieważ platforma Cannathera jest przeznaczona wyłącznie dla użytkowników komercyjnych (lekarzy, personelu medycznego, praktyków telemedycyny i aptek) w ramach ich działalności zawodowej lub komercyjnej, nie istnieje ustawowe prawo do odstąpienia od umowy zgodnie z art. 355 niemieckiego kodeksu cywilnego (BGB).",
    s2Title: "Zakończenie i anulowanie subskrypcji",
    s2Text: "(1) Umowy i subskrypcje mogą zostać rozwiązane z zachowaniem czterotygodniowego okresu wypowiedzenia ze skutkiem na koniec odpowiedniego okresu obowiązywania umowy, z zastrzeżeniem innych ustaleń indywidualnych (np. w fazie pilotażowej).\n(2) Prawo do nadzwyczajnego wypowiedzenia z ważnej przyczyny pozostaje nienaruszone dla obu stron w każdym czasie.\n(3) Wypowiedzenie musi być sporządzone w formie pisemnej (np. e-mailem do wsparcia technicznego), aby było skuteczne."
  },
  ro: {
    title: "Politica de anulare",
    lastUpdated: "Ultima actualizare: August 2026",
    s1Title: "Dreptul de retragere pentru companii (B2B)",
    s1Text: "Deoarece platforma Cannathera este destinată exclusiv utilizatorilor comerciali (medici, profesioniști din domeniul medical, practicieni în telemedicină și farmacii) în cursul activității lor profesionale sau comerciale, nu există un drept legal de retragere conform secțiunii 355 din Codul civil german (BGB).",
    s2Title: "Încetarea și anularea abonamentelor",
    s2Text: "(1) Contractele și abonamentele pot fi reziliate cu un preaviz de patru săptămâni până la sfârșitul perioadei contractuale respective, sub rezerva oricăror acorduri individuale diferite (de exemplu, în timpul unei faze pilot).\n(2) Dreptul de reziliere extraordinară din motive întemeiate rămâne neafectat pentru ambele părți în orice moment.\n(3) Orice reziliere trebuie să fie în scris (de exemplu, prin e-mail la asistență) pentru a fi efectivă."
  },
  tr: {
    title: "İptal Politikası",
    lastUpdated: "Son Güncelleme: Ağustos 2026",
    s1Title: "İşletmeler İçin Cayma Hakkı (B2B)",
    s1Text: "Cannathera platformu tamamen mesleki veya ticari faaliyetleri kapsamında ticari kullanıcılara (doktorlar, tıp uzmanları, teletıp pratisyenleri ve eczaneler) yönelik olduğundan, Alman Medeni Kanunu'nun (BGB) 355. Maddesi uyarınca yasal bir cayma hakkı bulunmamaktadır.",
    s2Title: "Aboneliklerin Feshi ve İptali",
    s2Text: "(1) Sözleşmeler ve abonelikler, farklı bireysel anlaşmalara tabi olmak kaydıyla (örneğin pilot aşama sırasında), ilgili sözleşme süresinin bitimine dört hafta kala bildirilmeli feshedilebilir.\n(2) Haklı nedenle olağanüstü fesih hakkı her iki taraf için de her zaman saklıdır.\n(3) Herhangi bir feshin geçerli olabilmesi için yazılı olarak (örneğin desteğe e-posta yoluyla) yapılması gerekir."
  },
  bg: {
    title: "Политика за анулиране",
    lastUpdated: "Последна актуализация: Август 2026",
    s1Title: "Право на отказ за фирми (B2B)",
    s1Text: "Тъй като платформата Cannathera е предназначена изключително за търговски потребители (лекари, медицински специалисти, практикуващи телемедицина и аптеки) в хода на тяхната професионална или търговска дейност, няма законово право на отказ съгласно раздел 355 от Германския граждански кодекс (BGB).",
    s2Title: "Прекратяване и анулиране на абонаменти",
    s2Text: "(1) Договорите и абонаментите могат да бъдат прекратени с четириседмично предизвестие до края на съответния срок на договора, освен ако не са налице различни индивидуални споразумения (напр. по време на пилотна фаза).\n(2) Правото на извънредно прекратяване по основателна причина остава незасегнато и за двете страни по всяко време.\n(3) Всяко прекратяване трябва да бъде в писмена форма (напр. по имейл до поддръжката), за да бъде ефективно."
  },
  ru: {
    title: "Политика отмены",
    lastUpdated: "Последнее обновление: Август 2026",
    s1Title: "Право на отказ для бизнеса (B2B)",
    s1Text: "Поскольку платформа Cannathera предназначена исключительно для коммерческих пользователей (врачей, медицинских работников, специалистов по телемедицине и аптек) в рамках их профессиональной или коммерческой деятельности, законное право на отказ в соответствии с разделом 355 Гражданского кодекса Германии (BGB) не применяется.",
    s2Title: "Расторжение и отмена подписок",
    s2Text: "(1) Договоры и подписки могут быть расторгнуты с уведомлением за четыре недели до окончания соответствующего срока договора, если нет иных индивидуальных соглашений (например, во время пилотного этапа).\n(2) Право на досрочное расторжение по веской причине сохраняется за обеими сторонами в любое время.\n(3) Любое расторжение должно быть в письменной форме (например, по электронной почте в службу поддержки), чтобы иметь силу."
  },
  uk: {
    title: "Політика скасування",
    lastUpdated: "Останнє оновлення: Серпень 2026",
    s1Title: "Право на відмову для бізнесу (B2B)",
    s1Text: "Оскільки платформа Cannathera призначена виключно для комерційних користувачів (лікарів, медичних працівників, спеціалістів з телемедицини та аптек) у рамках їхньої професійної чи комерційної діяльності, законне право на відмову відповідно до розділу 355 Цивільного кодексу Німеччини (BGB) не застосовується.",
    s2Title: "Розірвання та скасування підписок",
    s2Text: "(1) Договори та підписки можуть бути розірвані за умови повідомлення за чотири тижні до закінчення відповідного терміну договору, якщо немає інших індивідуальних угод (наприклад, під час пілотного етапу).\n(2) Право на дострокове розірвання з поважної причини зберігається за обома сторонами в будь-який час.\n(3) Будь-яке розірвання має бути в письмовій формі (наприклад, електронною поштою до служби підтримки), щоб набути чинності."
  },
  ar: {
    title: "سياسة الإلغاء",
    lastUpdated: "آخر تحديث: أغسطس 2026",
    s1Title: "حق الانسحاب للشركات (B2B)",
    s1Text: "نظراً لأن منصة Cannathera مخصصة حصرياً للمستخدمين التجاريين (الأطباء والمهنيين الطبيين وممارسي التطبيب عن بعد والصيدليات) في سياق أنشطتهم المهنية أو التجارية، فلا يوجد حق قانوني في الانسحاب وفقاً للمادة 355 من القانون المدني الألماني (BGB).",
    s2Title: "إنهاء وإلغاء الاشتراكات",
    s2Text: "(1) يمكن إنهاء العقود والاشتراكات بإشعار مدته أربعة أسابيع حتى نهاية مدة العقد المعنية، مع مراعاة أي اتفاقيات فردية مختلفة (على سبيل المثال، خلال المرحلة التجريبية).\n(2) يظل الحق في الإنهاء الاستثنائي لسبب وجيه غير متأثر لكلا الطرفين في أي وقت.\n(3) يجب أن يكون أي إنهاء كتابياً (على سبيل المثال، عبر البريد الإلكتروني للدعم) ليكون سارياً."
  },
  ary: {
    title: "سياسة الإلغاء",
    lastUpdated: "آخر تحديث: أغسطس 2026",
    s1Title: "حق الانسحاب للشركات (B2B)",
    s1Text: "نظراً لأن منصة Cannathera مخصصة حصرياً للمستخدمين التجاريين (الأطباء والمهنيين الطبيين وممارسي التطبيب عن بعد والصيدليات) في سياق أنشطتهم المهنية أو التجارية، فلا يوجد حق قانوني في الانسحاب وفقاً للمادة 355 من القانون المدني الألماني (BGB).",
    s2Title: "إنهاء وإلغاء الاشتراكات",
    s2Text: "(1) يمكن إنهاء العقود والاشتراكات بإشعار مدته أربعة أسابيع حتى نهاية مدة العقد المعنية، مع مراعاة أي اتفاقيات فردية مختلفة (على سبيل المثال، خلال المرحلة التجريبية).\n(2) يظل الحق في الإنهاء الاستثنائي لسبب وجيه غير متأثر لكلا الطرفين في أي وقت.\n(3) يجب أن يكون أي إنهاء كتابياً (على سبيل المثال، عبر البريد الإلكتروني للدعم) ليكون سارياً."
  }
};

const files = fs.readdirSync(messagesDir).filter(f => f.endsWith('.json'));

for (const file of files) {
  const lang = file.replace('.json', '');
  if (translations[lang]) {
    const filePath = path.join(messagesDir, file);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    data.cancellation = translations[lang];
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`Translated ${file}`);
  }
}

