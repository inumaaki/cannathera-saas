/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

const messagesDir = path.join(__dirname, 'messages');

const translations = {
  en: {
    title: "Medical Disclaimer",
    lastUpdated: "Last Updated: August 2026",
    s1Title: "No Substitute for Professional Medical Advice",
    s1Text: "(1) The content, functions, automated evaluations, and reports provided via Cannathera serve solely as a technical documentation and analysis tool to support healthcare providers and pharmacies.\n(2) The platform does not constitute medical, physician, or pharmaceutical advice, diagnosis, or treatment recommendation by the provider. The use of the software never replaces a personal consultation with a physician, examination, or independent professional diagnosis.",
    s2Title: "Responsibility of Medical Personnel",
    s2Text: "(1) All medical decisions, dosage adjustments, prescriptions, and treatment steps are the sole responsibility of the treating physician or other medical professional.\n(2) The provider assumes no liability for the accuracy, completeness, or clinical relevance of the data entered by the patient. Technical analyses or AI-supported monthly summaries are merely guidelines and do not relieve the healthcare provider of their own judgment."
  },
  de: {
    title: "Medizinischer Haftungsausschluss",
    lastUpdated: "Zuletzt aktualisiert: August 2026",
    s1Title: "Kein Ersatz für professionellen medizinischen Rat",
    s1Text: "(1) Die über Cannathera bereitgestellten Inhalte, Funktionen, automatisierten Auswertungen und Berichte dienen ausschließlich als technisches Dokumentations- und Analysewerkzeug zur Unterstützung von medizinischen Fachkräften und Apotheken.\n(2) Die Plattform stellt keine medizinische, ärztliche oder pharmazeutische Beratung, Diagnose oder Behandlungsempfehlung durch den Anbieter dar. Die Nutzung der Software ersetzt niemals eine persönliche Konsultation beim Arzt, eine Untersuchung oder eine eigenständige professionelle Diagnose.",
    s2Title: "Verantwortung des medizinischen Fachpersonals",
    s2Text: "(1) Alle medizinischen Entscheidungen, Dosierungsanpassungen, Verordnungen und Behandlungsschritte liegen in der alleinigen Verantwortung des behandelnden Arztes oder sonstigen medizinischen Fachpersonals.\n(2) Der Anbieter übernimmt keine Haftung für die Richtigkeit, Vollständigkeit oder klinische Relevanz der vom Patienten eingegebenen Daten. Technische Analysen oder KI-gestützte Monatszusammenfassungen sind lediglich Orientierungshilfen und entbinden das medizinische Fachpersonal nicht von seinem eigenen Urteil."
  },
  pl: {
    title: "Zastrzeżenie medyczne",
    lastUpdated: "Ostatnia aktualizacja: Sierpień 2026",
    s1Title: "Nie zastępuje profesjonalnej porady medycznej",
    s1Text: "(1) Treści, funkcje, automatyczne oceny i raporty dostarczane za pośrednictwem Cannathera służą wyłącznie jako techniczne narzędzie dokumentacji i analizy wspierające pracowników służby zdrowia i apteki.\n(2) Platforma nie stanowi porady medycznej, lekarskiej ani farmaceutycznej, diagnozy ani rekomendacji leczenia ze strony dostawcy. Korzystanie z oprogramowania nigdy nie zastępuje osobistej konsultacji z lekarzem, badania ani samodzielnej profesjonalnej diagnozy.",
    s2Title: "Odpowiedzialność personelu medycznego",
    s2Text: "(1) Wszelkie decyzje medyczne, korekty dawkowania, recepty i etapy leczenia leżą w wyłącznej odpowiedzialności lecz lekarza lub innego pracownika medycznego.\n(2) Dostawca nie ponosi odpowiedzialności za dokładność, kompletność ani kliniczną trafność danych wprowadzonych przez pacjenta. Analizy techniczne lub miesięczne podsumowania wspierane przez AI są jedynie wskazówkami i nie zwalniają pracownika służby zdrowia z własnego osądu."
  },
  ro: {
    title: "Declinare de responsabilitate medicală",
    lastUpdated: "Ultima actualizare: August 2026",
    s1Title: "Nu înlocuiește sfatul medical profesionist",
    s1Text: "(1) Conținutul, funcțiile, evaluările automate și rapoartele furnizate prin Cannathera servesc exclusiv ca instrument tehnic de documentare și analiză pentru a sprijini furnizorii de servicii medicale și farmaciile.\n(2) Platforma nu constituie consultanță medicală, a unui medic sau farmaceutică, diagnostic sau recomandare de tratament din partea furnizorului. Utilizarea software-ului nu înlocuiește niciodată o consultație personală cu un medic, o examinare sau un diagnostic profesional independent.",
    s2Title: "Responsabilitatea personalului medical",
    s2Text: "(1) Toate deciziile medicale, ajustările de doze, prescripțiile și etapele de tratament sunt responsabilitatea exclusivă a medicului curant sau a altui profesionist medical.\n(2) Furnizorul nu își asumă nicio răspundere pentru exactitatea, completitudinea sau relevanța clinică a datelor introduse de pacient. Analizele tehnice sau rezumatele lunare susținute de AI sunt doar orientări și nu îl scutesc pe furnizorul de servicii medicale de propriul raționament."
  },
  tr: {
    title: "Tıbbi Sorumluluk Reddi",
    lastUpdated: "Son Güncelleme: Ağustos 2026",
    s1Title: "Profesyonel Tıbbi Tavsiyenin Yerine Geçmez",
    s1Text: "(1) Cannathera aracılığıyla sağlanan içerik, işlevler, otomatik değerlendirmeler ve raporlar yalnızca sağlık hizmeti sağlayıcılarını ve eczaneleri desteklemek için teknik bir dokümantasyon ve analiz aracı olarak hizmet vermektedir.\n(2) Platform, sağlayıcı tarafından tıbbi, hekim veya farmasötik tavsiye, teşhis veya tedavi önerisi oluşturmamaktadır. Yazılımın kullanımı hiçbir zaman bir doktorla kişisel konsültasyonun, muayenenin veya bağımsız profesyonel teşhisin yerini almaz.",
    s2Title: "Tıbbi Personelin Sorumluluğu",
    s2Text: "(1) Tüm tıbbi kararlar, dozaj ayarlamaları, reçeteler ve tedavi adımları yalnızca tedavi eden doktorun veya diğer tıbbi profesyonelin sorumluluğundadır.\n(2) Sağlayıcı, hasta tarafından girilen verilerin doğruluğu, eksiksizliği veya klinik alaka düzeyi için hiçbir sorumluluk üstlenmez. Teknik analizler veya yapay zeka destekli aylık özetler yalnızca rehberlik niteliğindedir ve sağlık hizmeti sağlayıcısını kendi yargısından muaf tutmaz."
  },
  bg: {
    title: "Медицински отказ от отговорност",
    lastUpdated: "Последна актуализация: Август 2026",
    s1Title: "Не заменя професионален медицински съвет",
    s1Text: "(1) Съдържанието, функциите, автоматизираните оценки и докладите, предоставяни чрез Cannathera, служат единствено като технически инструмент за документация и анализ в подкрепа на доставчиците на здравни услуги и аптеките.\n(2) Платформата не представлява медицински, лекарски или фармацевтичен съвет, диагноза или препоръка за лечение от доставчика. Използването на софтуера никога не замества личната консултация с лекар, преглед или независима професионална диагноза.",
    s2Title: "Отговорност на медицинския персонал",
    s2Text: "(1) Всички медицински решения, корекции на дозировката, предписания и стъпки на лечение са единствено отговорност на лекуващия лекар или друг медицински специалист.\n(2) Доставчикът не носи отговорност за точността, пълнотата или клиничната релевантност на данните, въведени от пациента. Техническите анализи или поддържаните от ИИ месечни обобщения са само насоки и не освобождават доставчика на здравни услуги от собствената му преценка."
  },
  ru: {
    title: "Медицинская оговорка",
    lastUpdated: "Последнее обновление: Август 2026",
    s1Title: "Не заменяет профессиональную медицинскую консультацию",
    s1Text: "(1) Контент, функции, автоматизированные оценки и отчёты, предоставляемые через Cannathera, служат исключительно техническим инструментом документации и анализа для поддержки медицинских работников и аптек.\n(2) Платформа не является медицинской, врачебной или фармацевтической консультацией, диагнозом или рекомендацией по лечению со стороны поставщика. Использование программного обеспечения никогда не заменяет личную консультацию с врачом, обследование или самостоятельный профессиональный диагноз.",
    s2Title: "Ответственность медицинского персонала",
    s2Text: "(1) Все медицинские решения, корректировки дозировок, назначения и этапы лечения находятся в исключительной ответственности лечащего врача или иного медицинского специалиста.\n(2) Поставщик не несёт ответственности за точность, полноту или клиническую значимость данных, введённых пациентом. Технические анализы или ежемесячные сводки на основе ИИ являются лишь ориентирами и не освобождают медицинского работника от собственного суждения."
  },
  uk: {
    title: "Медична відмова від відповідальності",
    lastUpdated: "Останнє оновлення: Серпень 2026",
    s1Title: "Не замінює професійну медичну консультацію",
    s1Text: "(1) Вміст, функції, автоматизовані оцінки та звіти, що надаються через Cannathera, слугують виключно технічним інструментом документації та аналізу для підтримки медичних працівників та аптек.\n(2) Платформа не є медичною, лікарською або фармацевтичною консультацією, діагнозом або рекомендацією щодо лікування з боку постачальника. Використання програмного забезпечення ніколи не замінює особисту консультацію з лікарем, обстеження або самостійний професійний діагноз.",
    s2Title: "Відповідальність медичного персоналу",
    s2Text: "(1) Усі медичні рішення, коригування дозування, рецепти та етапи лікування є виключною відповідальністю лікуючого лікаря або іншого медичного спеціаліста.\n(2) Постачальник не несе відповідальності за точність, повноту або клінічну релевантність даних, введених пацієнтом. Технічні аналізи або щомісячні зведення на основі ШІ є лише орієнтирами і не звільняють медичного працівника від власного судження."
  },
  ar: {
    title: "إخلاء المسؤولية الطبية",
    lastUpdated: "آخر تحديث: أغسطس 2026",
    s1Title: "لا يغني عن الاستشارة الطبية المهنية",
    s1Text: "(1) تخدم المحتويات والوظائف والتقييمات الآلية والتقارير المقدمة عبر Cannathera فقط كأداة توثيق وتحليل تقني لدعم مقدمي الرعاية الصحية والصيدليات.\n(2) لا تشكل المنصة نصيحة طبية أو نصيحة طبيب أو صيدلاني، أو تشخيصاً، أو توصية علاجية من قبل مزود الخدمة. إن استخدام البرنامج لا يحل أبداً محل الاستشارة الشخصية مع طبيب، أو الفحص، أو التشخيص المهني المستقل.",
    s2Title: "مسؤولية الكوادر الطبية",
    s2Text: "(1) جميع القرارات الطبية وتعديلات الجرعات والوصفات وخطوات العلاج هي المسؤولية الحصرية للطبيب المعالج أو غيره من المهنيين الطبيين.\n(2) لا يتحمل مزود الخدمة أي مسؤولية عن دقة البيانات التي يدخلها المريض أو اكتمالها أو صلتها السريرية. التحليلات التقنية أو الملخصات الشهرية المدعومة بالذكاء الاصطناعي هي مجرد إرشادات ولا تعفي مقدم الرعاية الصحية من حكمه الخاص."
  },
  ary: {
    title: "إخلاء المسؤولية الطبية",
    lastUpdated: "آخر تحديث: أغسطس 2026",
    s1Title: "لا يغني عن الاستشارة الطبية المهنية",
    s1Text: "(1) تخدم المحتويات والوظائف والتقييمات الآلية والتقارير المقدمة عبر Cannathera فقط كأداة توثيق وتحليل تقني لدعم مقدمي الرعاية الصحية والصيدليات.\n(2) لا تشكل المنصة نصيحة طبية أو نصيحة طبيب أو صيدلاني، أو تشخيصاً، أو توصية علاجية من قبل مزود الخدمة. إن استخدام البرنامج لا يحل أبداً محل الاستشارة الشخصية مع طبيب، أو الفحص، أو التشخيص المهني المستقل.",
    s2Title: "مسؤولية الكوادر الطبية",
    s2Text: "(1) جميع القرارات الطبية وتعديلات الجرعات والوصفات وخطوات العلاج هي المسؤولية الحصرية للطبيب المعالج أو غيره من المهنيين الطبيين.\n(2) لا يتحمل مزود الخدمة أي مسؤولية عن دقة البيانات التي يدخلها المريض أو اكتمالها أو صلتها السريرية. التحليلات التقنية أو الملخصات الشهرية المدعومة بالذكاء الاصطناعي هي مجرد إرشادات ولا تعفي مقدم الرعاية الصحية من حكمه الخاص."
  }
};

const files = fs.readdirSync(messagesDir).filter(f => f.endsWith('.json'));

for (const file of files) {
  const lang = file.replace('.json', '');
  if (translations[lang]) {
    const filePath = path.join(messagesDir, file);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    data.disclaimer = translations[lang];
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`Updated ${file}`);
  }
}

