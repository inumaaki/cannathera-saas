const fs = require('fs');
const path = require('path');

const dir = 'd:/Github/cannathera-saas/frontend/messages';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));

const translations = {
  de: {
    modal: {
      title: "Wichtiger Hinweis zur Tarifbindung",
      description: "Die Nutzung von externen Apotheken oder behandelnden Ärzt:innen, die nicht an Ihren Plan angebunden sind, führt zum Verlust der subventionierten Tarifvorteile. In diesem Fall müssen Sie die monatlichen Plattformkosten selbst tragen.",
      confirm: "Ich habe verstanden"
    },
    profileWarning: "Wichtiger Hinweis: Bei einem Wechsel zu einer externen Apotheke / ärztlichen Betreuung entfällt die Kostenübernahme durch Ihren Tarif."
  },
  en: {
    modal: {
      title: "Important Notice Regarding Your Plan",
      description: "Using an external pharmacy or an external physician not linked to your plan will void your subsidized benefits. In this case, you will be responsible for the monthly platform costs.",
      confirm: "I understand and agree"
    },
    profileWarning: "Important: Switching to an external pharmacy or physician voids the subsidized benefits of your plan."
  },
  uk: {
    modal: {
      title: "Важливе повідомлення щодо вашого плану",
      description: "Використання зовнішньої аптеки або зовнішнього лікаря, які не прив’язані до вашого плану, анулює ваші субсидовані пільги. У цьому випадку ви будете нести відповідальність за щомісячні витрати платформи.",
      confirm: "Я розумію та погоджуюсь"
    },
    profileWarning: "Важливо: Перехід до зовнішньої аптеки або лікаря анулює субсидовані пільги вашого плану."
  },
  tr: {
    modal: {
      title: "Planınızla İlgili Önemli Bilgilendirme",
      description: "Planınıza bağlı olmayan harici bir eczane veya harici bir doktor kullanmak, sübvanse edilmiş avantajlarınızı geçersiz kılacaktır. Bu durumda, aylık platform maliyetlerinden siz sorumlu olacaksınız.",
      confirm: "Anlıyor ve kabul ediyorum"
    },
    profileWarning: "Önemli: Harici bir eczaneye veya doktora geçmek, planınızın sübvanse edilmiş avantajlarını geçersiz kılar."
  },
  ru: {
    modal: {
      title: "Важное уведомление о вашем плане",
      description: "Использование внешней аптеки или внешнего врача, не связанных с вашим планом, аннулирует ваши субсидируемые льготы. В этом случае вы будете нести ответственность за ежемесячные расходы платформы.",
      confirm: "Я понимаю и согласен"
    },
    profileWarning: "Важно: Переход во внешнюю аптеку или к врачу аннулирует субсидируемые льготы вашего плана."
  },
  ro: {
    modal: {
      title: "Notificare importantă privind planul dvs.",
      description: "Utilizarea unei farmacii externe sau a unui medic extern care nu este legat de planul dvs. va anula beneficiile subvenționate. În acest caz, veți fi responsabil pentru costurile lunare ale platformei.",
      confirm: "Înțeleg și sunt de acord"
    },
    profileWarning: "Important: Trecerea la o farmacie sau medic extern anulează beneficiile subvenționate ale planului dvs."
  },
  pl: {
    modal: {
      title: "Ważna informacja dotycząca Twojego planu",
      description: "Korzystanie z zewnętrznej apteki lub zewnętrznego lekarza niezwiązanego z Twoim planem unieważni Twoje dotowane świadczenia. W takim przypadku będziesz odpowiedzialny za miesięczne koszty platformy.",
      confirm: "Rozumiem i zgadzam się"
    },
    profileWarning: "Ważne: Przejście do zewnętrznej apteki lub lekarza unieważnia dotowane świadczenia Twojego planu."
  },
  bg: {
    modal: {
      title: "Важно известие относно вашия план",
      description: "Използването на външна аптека или външен лекар, които не са свързани с вашия план, ще анулира вашите субсидирани ползи. В този случай ще носите отговорност за месечните разходи на платформата.",
      confirm: "Разбирам и съм съгласен"
    },
    profileWarning: "Важно: Преминаването към външна аптека или лекар анулира субсидираните ползи на вашия план."
  },
  ar: {
    modal: {
      title: "إشعار هام بخصوص خطتك",
      description: "إن استخدام صيدلية خارجية أو طبيب خارجي غير مرتبط بخطتك سيؤدي إلى إلغاء المزايا المدعومة الخاصة بك. في هذه الحالة، ستكون مسؤولاً عن تكاليف المنصة الشهرية.",
      confirm: "أفهم وأوافق"
    },
    profileWarning: "هام: إن التحول إلى صيدلية أو طبيب خارجي يلغي المزايا المدعومة لخطتك."
  },
  ary: {
    modal: {
      title: "إشعار هام بخصوص خطتك",
      description: "إن استخدام صيدلية خارجية أو طبيب خارجي غير مرتبط بخطتك سيؤدي إلى إلغاء المزايا المدعومة الخاصة بك. في هذه الحالة، ستكون مسؤولاً عن تكاليف المنصة الشهرية.",
      confirm: "أفهم وأوافق"
    },
    profileWarning: "هام: إن التحول إلى صيدلية أو طبيب خارجي يلغي المزايا المدعومة لخطتك."
  }
};

files.forEach(file => {
  const filePath = path.join(dir, file);
  const lang = path.basename(file, '.json');
  
  if (translations[lang]) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const data = JSON.parse(content);
      
      // Inject safeguardModal
      if (!data.patient.safeguardModal) {
        data.patient.safeguardModal = translations[lang].modal;
      }
      
      // Inject safeguardWarning into profile
      if (data.patient.profile && !data.patient.profile.safeguardWarning) {
        data.patient.profile.safeguardWarning = translations[lang].profileWarning;
      }
      
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
      console.log(`Updated translations for ${lang}`);
    } catch (err) {
      console.error(`Error processing ${lang}: ${err.message}`);
    }
  }
});
