/*
 * Copyright 2026 Associazione di Promozione Sociale DigitalValut (ETS)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/* The front door, in every language the app itself speaks.

   Kept deliberately short. A landing page is read standing up, on a phone, by
   somebody who was sent a link and has not decided yet whether to care — so
   there are eighteen sentences here and no more. Short sentences also survive
   translation, which matters when thirteen of them have to be right. */

'use strict';

const LANGS = {
  it: 'Italiano', en: 'English', ar: 'العربية', bn: 'বাংলা', de: 'Deutsch',
  es: 'Español', fr: 'Français', hi: 'हिन्दी', id: 'Indonesia', pt: 'Português',
  ru: 'Русский', ur: 'اردو', zh: '中文',
};
const RTL = ['ar', 'ur'];

const T = {};

T.it = {
  'hero.title': "Fatti chiamare senza dare il numero.",
  'hero.sub': "Messaggi, foto e videochiamate direttamente fra due telefoni. Senza registrarsi, senza numero di telefono, gratis per sempre.",
  'hero.cta': "Apri l'app",
  'hero.note': "Si apre nel browser. Non c'è niente da installare e niente da registrare.",
  'what.1t': "Dai un indirizzo, non il numero",
  'what.1b': "Chi ce l'ha ti raggiunge quando vuole, senza conoscere il tuo numero di telefono.",
  'what.2t': "E quando basta, chiudi la porta",
  'what.2b': "Crea un indirizzo usa e getta per un annuncio o per uno sconosciuto. Lo cancelli e quella persona non ti trova più.",
  'what.3t': "Nessuno legge in mezzo",
  'what.3b': "Messaggi, foto e chiamate passano da un telefono all'altro. Il contenuto non attraversa nessun server.",
  'how.title': "Come funziona",
  'how.1': "Apri l'app: non c'è niente da registrare.",
  'how.2': "Manda il tuo indirizzo, o un invito, come preferisci.",
  'how.3': "Quando l'altra persona lo tocca, siete collegati.",
  'foot.who': "Software libero e open source (licenza Apache 2.0), di proprietà dell'Associazione di Promozione Sociale DigitalValut, Ente del Terzo Settore. Utilizzabile gratis da chiunque, ovunque nel mondo.",
  'foot.code': "Il codice, in chiaro, per chiunque voglia controllarlo",
  'hero.qr': "Inquadralo dal telefono",
  'hero.simple': "C'è anche una modalità con due soli pulsanti, per chi preferisce non pensarci.",
  'compare.title': "In cosa è diversa",
  'compare.row1': "Serve un numero di telefono o un account",
  'compare.row2': "I messaggi passano da un server dell'azienda",
  'compare.row3': "Foto e video vengono compressi",
  'compare.row4': "Codice sorgente pubblico e verificabile",
  'compare.yes': "Sì",
  'compare.no': "No",
  'compare.partial': "Parzialmente (Telegram) / No (WhatsApp)",
};

T.en = {
  'hero.title': "Be reachable without giving out your number.",
  'hero.sub': "Messages, photos and video calls straight between two phones. No sign-up, no phone number, free forever.",
  'hero.cta': "Open the app",
  'hero.note': "It opens in your browser. Nothing to install, nothing to sign up for.",
  'what.1t': "Give an address, not your number",
  'what.1b': "Whoever holds it can reach you whenever they like, without knowing your phone number.",
  'what.2t': "And when you're done, shut the door",
  'what.2b': "Make a throwaway address for a listing or a stranger. Delete it and that person can no longer find you.",
  'what.3t': "Nobody reads it in between",
  'what.3b': "Messages, photos and calls go from one phone to the other. The content crosses no server.",
  'how.title': "How it works",
  'how.1': "Open the app — there is nothing to sign up for.",
  'how.2': "Send your address, or an invite, however you like.",
  'how.3': "When the other person taps it, you're connected.",
  'foot.who': "Free and open source software (Apache 2.0 licence), owned by DigitalValut, an Italian non-profit social promotion association. Free for anyone to use, anywhere in the world.",
  'foot.code': "The code, in the open, for anyone who wants to check it",
  'hero.qr': "Scan it with your phone",
  'hero.simple': "There's also a mode with just two big buttons, for anyone who'd rather not think about it.",
  'compare.title': "How it's different",
  'compare.row1': "Requires a phone number or an account",
  'compare.row2': "Messages pass through a company server",
  'compare.row3': "Photos and videos get compressed",
  'compare.row4': "Public, checkable source code",
  'compare.yes': "Yes",
  'compare.no': "No",
  'compare.partial': "Partly (Telegram) / No (WhatsApp)",
};

T.fr = {
  'hero.title': "Soyez joignable sans donner votre numéro.",
  'hero.sub': "Messages, photos et appels vidéo directement entre deux téléphones. Sans inscription, sans numéro de téléphone, gratuit pour toujours.",
  'hero.cta': "Ouvrir l'application",
  'hero.note': "Elle s'ouvre dans le navigateur. Rien à installer, rien à créer.",
  'what.1t': "Donnez une adresse, pas votre numéro",
  'what.1b': "Qui la possède vous joint quand il veut, sans connaître votre numéro de téléphone.",
  'what.2t': "Et quand ça suffit, fermez la porte",
  'what.2b': "Créez une adresse jetable pour une annonce ou un inconnu. Vous la supprimez et cette personne ne vous trouve plus.",
  'what.3t': "Personne ne lit au milieu",
  'what.3b': "Messages, photos et appels passent d'un téléphone à l'autre. Le contenu ne traverse aucun serveur.",
  'how.title': "Comment ça marche",
  'how.1': "Ouvrez l'application : il n'y a rien à créer.",
  'how.2': "Envoyez votre adresse, ou une invitation, comme vous voulez.",
  'how.3': "Quand l'autre personne y touche, vous êtes connectés.",
  'foot.who': "Logiciel libre et open source (licence Apache 2.0), propriété de DigitalValut, association italienne de promotion sociale à but non lucratif. Utilisable gratuitement par tous, partout dans le monde.",
  'foot.code': "Le code, en clair, pour qui veut le vérifier",
  'hero.qr': "Scannez-le avec votre téléphone",
  'hero.simple': "Il existe aussi un mode à deux boutons seulement, pour qui préfère ne pas y réfléchir.",
  'compare.title': "En quoi elle est différente",
  'compare.row1': "Nécessite un numéro de téléphone ou un compte",
  'compare.row2': "Les messages passent par un serveur de l'entreprise",
  'compare.row3': "Les photos et vidéos sont compressées",
  'compare.row4': "Code source public et vérifiable",
  'compare.yes': "Oui",
  'compare.no': "Non",
  'compare.partial': "Partiellement (Telegram) / Non (WhatsApp)",
};

T.de = {
  'hero.title': "Erreichbar sein, ohne deine Nummer herzugeben.",
  'hero.sub': "Nachrichten, Fotos und Videoanrufe direkt zwischen zwei Telefonen. Ohne Anmeldung, ohne Telefonnummer, für immer kostenlos.",
  'hero.cta': "App öffnen",
  'hero.note': "Sie öffnet sich im Browser. Nichts zu installieren, nichts anzumelden.",
  'what.1t': "Gib eine Adresse, nicht deine Nummer",
  'what.1b': "Wer sie hat, erreicht dich jederzeit, ohne deine Telefonnummer zu kennen.",
  'what.2t': "Und wenn es reicht, mach die Tür zu",
  'what.2b': "Erstelle eine Wegwerf-Adresse für eine Anzeige oder eine fremde Person. Du löschst sie, und diese Person findet dich nicht mehr.",
  'what.3t': "Niemand liest dazwischen mit",
  'what.3b': "Nachrichten, Fotos und Anrufe gehen von einem Telefon zum anderen. Der Inhalt läuft über keinen Server.",
  'how.title': "So funktioniert es",
  'how.1': "Öffne die App — es gibt nichts anzumelden.",
  'how.2': "Schick deine Adresse oder eine Einladung, wie du magst.",
  'how.3': "Sobald die andere Person darauf tippt, seid ihr verbunden.",
  'foot.who': "Freie und quelloffene Software (Apache 2.0-Lizenz), Eigentum von DigitalValut, einem italienischen gemeinnützigen Verein zur sozialen Förderung. Für alle kostenlos nutzbar, überall auf der Welt.",
  'foot.code': "Der Quelltext, offen, für alle die ihn prüfen wollen",
  'hero.qr': "Mit dem Handy scannen",
  'hero.simple': "Es gibt auch einen Modus mit nur zwei großen Tasten, für alle, die sich nicht damit beschäftigen möchten.",
  'compare.title': "Worin sie sich unterscheidet",
  'compare.row1': "Erfordert eine Telefonnummer oder ein Konto",
  'compare.row2': "Nachrichten laufen über einen Server des Unternehmens",
  'compare.row3': "Fotos und Videos werden komprimiert",
  'compare.row4': "Öffentlicher, überprüfbarer Quellcode",
  'compare.yes': "Ja",
  'compare.no': "Nein",
  'compare.partial': "Teilweise (Telegram) / Nein (WhatsApp)",
};

T.es = {
  'hero.title': "Que te localicen sin dar tu número.",
  'hero.sub': "Mensajes, fotos y videollamadas directamente entre dos teléfonos. Sin registrarse, sin número de teléfono, gratis para siempre.",
  'hero.cta': "Abrir la aplicación",
  'hero.note': "Se abre en el navegador. No hay nada que instalar ni que registrar.",
  'what.1t': "Da una dirección, no tu número",
  'what.1b': "Quien la tenga puede localizarte cuando quiera, sin conocer tu número de teléfono.",
  'what.2t': "Y cuando ya basta, cierras la puerta",
  'what.2b': "Crea una dirección desechable para un anuncio o un desconocido. La borras y esa persona ya no te encuentra.",
  'what.3t': "Nadie lee por el camino",
  'what.3b': "Mensajes, fotos y llamadas van de un teléfono a otro. El contenido no atraviesa ningún servidor.",
  'how.title': "Cómo funciona",
  'how.1': "Abre la aplicación: no hay nada que registrar.",
  'how.2': "Envía tu dirección, o una invitación, como prefieras.",
  'how.3': "Cuando la otra persona la toca, estáis conectados.",
  'foot.who': "Software libre y de código abierto (licencia Apache 2.0), propiedad de DigitalValut, asociación italiana sin ánimo de lucro de promoción social. Gratis para cualquiera, en cualquier parte del mundo.",
  'foot.code': "El código, a la vista, para quien quiera comprobarlo",
  'hero.qr': "Escanéalo con el teléfono",
  'hero.simple': "También hay un modo con solo dos botones grandes, para quien prefiera no pensarlo.",
  'compare.title': "En qué se diferencia",
  'compare.row1': "Requiere un número de teléfono o una cuenta",
  'compare.row2': "Los mensajes pasan por un servidor de la empresa",
  'compare.row3': "Las fotos y los vídeos se comprimen",
  'compare.row4': "Código fuente público y verificable",
  'compare.yes': "Sí",
  'compare.no': "No",
  'compare.partial': "Parcialmente (Telegram) / No (WhatsApp)",
};

T.pt = {
  'hero.title': "Seja contactado sem dar o seu número.",
  'hero.sub': "Mensagens, fotografias e videochamadas diretamente entre dois telemóveis. Sem registo, sem número de telefone, grátis para sempre.",
  'hero.cta': "Abrir a aplicação",
  'hero.note': "Abre no navegador. Não há nada para instalar nem para registar.",
  'what.1t': "Dê um endereço, não o seu número",
  'what.1b': "Quem o tiver pode contactá-lo quando quiser, sem saber o seu número de telefone.",
  'what.2t': "E quando chega, fecha a porta",
  'what.2b': "Crie um endereço descartável para um anúncio ou para um desconhecido. Apaga-o e essa pessoa deixa de o encontrar.",
  'what.3t': "Ninguém lê pelo meio",
  'what.3b': "Mensagens, fotografias e chamadas passam de um telemóvel para o outro. O conteúdo não atravessa nenhum servidor.",
  'how.title': "Como funciona",
  'how.1': "Abra a aplicação: não há nada para registar.",
  'how.2': "Envie o seu endereço, ou um convite, como preferir.",
  'how.3': "Quando a outra pessoa lhe tocar, estão ligados.",
  'foot.who': "Software livre e de código aberto (licença Apache 2.0), propriedade da DigitalValut, associação italiana sem fins lucrativos de promoção social. Utilizável gratuitamente por qualquer pessoa, em qualquer parte do mundo.",
  'foot.code': "O código, à vista, para quem o quiser verificar",
  'hero.qr': "Aponte a câmara do telemóvel",
  'hero.simple': "Há também um modo com apenas dois botões grandes, para quem preferir não pensar nisso.",
  'compare.title': "Em que é diferente",
  'compare.row1': "Exige um número de telefone ou uma conta",
  'compare.row2': "As mensagens passam por um servidor da empresa",
  'compare.row3': "As fotos e vídeos são comprimidos",
  'compare.row4': "Código-fonte público e verificável",
  'compare.yes': "Sim",
  'compare.no': "Não",
  'compare.partial': "Parcialmente (Telegram) / Não (WhatsApp)",
};

T.ru = {
  'hero.title': "Будьте на связи, не давая свой номер.",
  'hero.sub': "Сообщения, фотографии и видеозвонки напрямую между двумя телефонами. Без регистрации, без номера телефона, бесплатно навсегда.",
  'hero.cta': "Открыть приложение",
  'hero.note': "Открывается в браузере. Ничего не нужно устанавливать и нигде не нужно регистрироваться.",
  'what.1t': "Дайте адрес, а не номер",
  'what.1b': "Тот, у кого он есть, свяжется с вами когда захочет, не зная вашего номера телефона.",
  'what.2t': "А когда хватит — закройте дверь",
  'what.2b': "Создайте одноразовый адрес для объявления или незнакомца. Удалите его — и этот человек вас больше не найдёт.",
  'what.3t': "Никто не читает по дороге",
  'what.3b': "Сообщения, фотографии и звонки идут с одного телефона на другой. Содержимое не проходит ни через один сервер.",
  'how.title': "Как это работает",
  'how.1': "Откройте приложение — регистрироваться не нужно.",
  'how.2': "Отправьте свой адрес или приглашение, как вам удобно.",
  'how.3': "Как только другой человек нажмёт на него, вы соединены.",
  'foot.who': "Свободное программное обеспечение с открытым исходным кодом (лицензия Apache 2.0), принадлежит DigitalValut — итальянской некоммерческой ассоциации социального содействия. Бесплатно для всех и везде.",
  'foot.code': "Исходный код, открытый для всех, кто захочет его проверить",
  'hero.qr': "Отсканируйте телефоном",
  'hero.simple': "Есть и режим всего с двумя большими кнопками — для тех, кто предпочитает не задумываться.",
  'compare.title': "Чем оно отличается",
  'compare.row1': "Нужен номер телефона или учётная запись",
  'compare.row2': "Сообщения проходят через сервер компании",
  'compare.row3': "Фото и видео сжимаются",
  'compare.row4': "Открытый и проверяемый исходный код",
  'compare.yes': "Да",
  'compare.no': "Нет",
  'compare.partial': "Частично (Telegram) / Нет (WhatsApp)",
};

T.zh = {
  'hero.title': "不给号码，也能被联系到。",
  'hero.sub': "消息、照片和视频通话，直接在两部手机之间传递。无需注册，无需电话号码，永久免费。",
  'hero.cta': "打开应用",
  'hero.note': "在浏览器里打开。不用安装，也不用注册。",
  'what.1t': "给出地址，而不是号码",
  'what.1b': "拿到它的人随时都能联系你，却不知道你的电话号码。",
  'what.2t': "不需要了，就关上门",
  'what.2b': "为一则广告或一个陌生人建一个一次性地址。删掉它，那个人就再也找不到你。",
  'what.3t': "中间没有人在读",
  'what.3b': "消息、照片和通话从一部手机直达另一部。内容不经过任何服务器。",
  'how.title': "如何使用",
  'how.1': "打开应用：没有什么需要注册。",
  'how.2': "把你的地址或一个邀请，用你喜欢的方式发出去。",
  'how.3': "对方一点，你们就连上了。",
  'foot.who': "自由开源软件（Apache 2.0 许可证），归意大利非营利社会促进协会 DigitalValut 所有。世界上任何人都可以免费使用。",
  'foot.code': "公开的源代码，供任何想检查的人查看",
  'hero.qr': "用手机扫一扫",
  'hero.simple': "还有一种只有两个大按钮的简单模式，适合不想多想的人。",
  'compare.title': "有何不同",
  'compare.row1': "需要电话号码或账号",
  'compare.row2': "消息经过公司的服务器",
  'compare.row3': "照片和视频会被压缩",
  'compare.row4': "公开且可验证的源代码",
  'compare.yes': "是",
  'compare.no': "否",
  'compare.partial': "部分公开（Telegram）／否（WhatsApp）",
};

T.ar = {
  'hero.title': "كن قابلًا للوصول دون أن تعطي رقمك.",
  'hero.sub': "رسائل وصور ومكالمات فيديو مباشرة بين هاتفين. بلا تسجيل، بلا رقم هاتف، مجانًا إلى الأبد.",
  'hero.cta': "افتح التطبيق",
  'hero.note': "يفتح في المتصفح. لا شيء لتثبيته ولا شيء للتسجيل فيه.",
  'what.1t': "أعطِ عنوانًا، لا رقمك",
  'what.1b': "من يملكه يصل إليك متى شاء، دون أن يعرف رقم هاتفك.",
  'what.2t': "وحين يكفي، أغلق الباب",
  'what.2b': "أنشئ عنوانًا للاستعمال مرة واحدة لإعلان أو لشخص غريب. تحذفه فلا يعود ذلك الشخص يجدك.",
  'what.3t': "لا أحد يقرأ في الطريق",
  'what.3b': "الرسائل والصور والمكالمات تنتقل من هاتف إلى آخر. المحتوى لا يمر بأي خادم.",
  'how.title': "كيف يعمل",
  'how.1': "افتح التطبيق: لا شيء للتسجيل فيه.",
  'how.2': "أرسل عنوانك، أو دعوة، بالطريقة التي تفضّلها.",
  'how.3': "ما إن يضغط عليها الطرف الآخر حتى تصبحا متصلين.",
  'foot.who': "برمجية حرة ومفتوحة المصدر (رخصة Apache 2.0)، مملوكة لـ DigitalValut، وهي جمعية إيطالية غير ربحية للنهوض الاجتماعي. مجانية لأي شخص، في أي مكان في العالم.",
  'foot.code': "الشيفرة، مكشوفة، لكل من أراد التحقق منها",
  'hero.qr': "امسحه بكاميرا هاتفك",
  'hero.simple': "توجد أيضًا وضعية بزرّين كبيرين فقط، لمن يفضّل ألا يفكر في الأمر.",
  'compare.title': "بمَ يختلف",
  'compare.row1': "يتطلب رقم هاتف أو حسابًا",
  'compare.row2': "تمر الرسائل عبر خادم الشركة",
  'compare.row3': "يتم ضغط الصور ومقاطع الفيديو",
  'compare.row4': "شيفرة مصدرية عامة وقابلة للتحقق",
  'compare.yes': "نعم",
  'compare.no': "لا",
  'compare.partial': "جزئيًا (Telegram) / لا (WhatsApp)",
};

T.ur = {
  'hero.title': "اپنا نمبر دیے بغیر قابلِ رسائی رہیں۔",
  'hero.sub': "پیغامات، تصاویر اور ویڈیو کالیں براہِ راست دو فونوں کے درمیان۔ بغیر رجسٹریشن، بغیر فون نمبر، ہمیشہ کے لیے مفت۔",
  'hero.cta': "ایپ کھولیں",
  'hero.note': "براؤزر میں کھلتی ہے۔ نہ کچھ انسٹال کرنا ہے، نہ کہیں رجسٹر ہونا ہے۔",
  'what.1t': "پتہ دیں، اپنا نمبر نہیں",
  'what.1b': "جس کے پاس یہ ہو وہ جب چاہے آپ تک پہنچ سکتا ہے، آپ کا فون نمبر جانے بغیر۔",
  'what.2t': "اور جب کافی ہو، دروازہ بند کر دیں",
  'what.2b': "کسی اشتہار یا اجنبی کے لیے ایک بار استعمال ہونے والا پتہ بنائیں۔ اسے مٹا دیں اور وہ شخص آپ کو دوبارہ نہیں پا سکے گا۔",
  'what.3t': "درمیان میں کوئی نہیں پڑھتا",
  'what.3b': "پیغامات، تصاویر اور کالیں ایک فون سے دوسرے فون تک جاتی ہیں۔ مواد کسی سرور سے نہیں گزرتا۔",
  'how.title': "یہ کیسے کام کرتا ہے",
  'how.1': "ایپ کھولیں: رجسٹر ہونے کو کچھ نہیں۔",
  'how.2': "اپنا پتہ، یا دعوت، جیسے چاہیں بھیج دیں۔",
  'how.3': "جیسے ہی دوسرا شخص اسے چھوئے، آپ جڑ جاتے ہیں۔",
  'foot.who': "آزاد اور اوپن سورس سافٹ ویئر (Apache 2.0 لائسنس)، جو DigitalValut کی ملکیت ہے — ایک اطالوی غیر منافع بخش سماجی فروغ کی انجمن۔ دنیا میں کہیں بھی، ہر کسی کے لیے مفت۔",
  'foot.code': "کھلا ہوا کوڈ، ہر اُس شخص کے لیے جو اسے جانچنا چاہے",
  'hero.qr': "اپنے فون سے اسکین کریں",
  'hero.simple': "ایک ایسا موڈ بھی ہے جس میں صرف دو بڑے بٹن ہیں، اُن کے لیے جو اس بارے میں سوچنا نہیں چاہتے۔",
  'compare.title': "یہ کن باتوں میں مختلف ہے",
  'compare.row1': "فون نمبر یا اکاؤنٹ درکار ہے",
  'compare.row2': "پیغامات کمپنی کے سرور سے گزرتے ہیں",
  'compare.row3': "تصاویر اور ویڈیوز کمپریس ہو جاتی ہیں",
  'compare.row4': "عوامی اور قابلِ تصدیق سورس کوڈ",
  'compare.yes': "ہاں",
  'compare.no': "نہیں",
  'compare.partial': "جزوی طور پر (Telegram) / نہیں (WhatsApp)",
};

T.hi = {
  'hero.title': "अपना नंबर दिए बिना संपर्क में रहें।",
  'hero.sub': "संदेश, तस्वीरें और वीडियो कॉल सीधे दो फ़ोनों के बीच। बिना रजिस्ट्रेशन, बिना फ़ोन नंबर, हमेशा के लिए मुफ़्त।",
  'hero.cta': "ऐप खोलें",
  'hero.note': "ब्राउज़र में खुलता है। न कुछ इंस्टॉल करना है, न कहीं रजिस्टर होना है।",
  'what.1t': "पता दें, अपना नंबर नहीं",
  'what.1b': "जिसके पास यह हो वह जब चाहे आप तक पहुँच सकता है, आपका फ़ोन नंबर जाने बिना।",
  'what.2t': "और जब बस हो जाए, दरवाज़ा बंद कर दें",
  'what.2b': "किसी विज्ञापन या अजनबी के लिए एक बार का पता बनाएँ। उसे मिटा दें और वह व्यक्ति आपको दोबारा नहीं पा सकेगा।",
  'what.3t': "बीच में कोई नहीं पढ़ता",
  'what.3b': "संदेश, तस्वीरें और कॉल एक फ़ोन से दूसरे तक जाते हैं। सामग्री किसी सर्वर से नहीं गुज़रती।",
  'how.title': "यह कैसे काम करता है",
  'how.1': "ऐप खोलें: रजिस्टर करने को कुछ नहीं है।",
  'how.2': "अपना पता, या एक निमंत्रण, जैसे चाहें भेज दें।",
  'how.3': "जैसे ही दूसरा व्यक्ति उसे छूता है, आप जुड़ जाते हैं।",
  'foot.who': "मुफ़्त और ओपन सोर्स सॉफ़्टवेयर (Apache 2.0 लाइसेंस), DigitalValut की संपत्ति — एक इतालवी ग़ैर-लाभकारी सामाजिक संवर्धन संस्था। दुनिया में कहीं भी, हर किसी के लिए मुफ़्त।",
  'foot.code': "खुला हुआ कोड, हर उस व्यक्ति के लिए जो इसे जाँचना चाहे",
  'hero.qr': "अपने फ़ोन से स्कैन करें",
  'hero.simple': "एक ऐसा तरीका भी है जिसमें सिर्फ़ दो बड़े बटन होते हैं, उनके लिए जो इसके बारे में सोचना नहीं चाहते।",
  'compare.title': "यह किस तरह अलग है",
  'compare.row1': "फ़ोन नंबर या खाता ज़रूरी है",
  'compare.row2': "संदेश कंपनी के सर्वर से होकर जाते हैं",
  'compare.row3': "फ़ोटो और वीडियो कंप्रेस हो जाते हैं",
  'compare.row4': "सार्वजनिक और जाँचने योग्य सोर्स कोड",
  'compare.yes': "हाँ",
  'compare.no': "नहीं",
  'compare.partial': "आंशिक रूप से (Telegram) / नहीं (WhatsApp)",
};

T.bn = {
  'hero.title': "নিজের নম্বর না দিয়েই যোগাযোগযোগ্য থাকুন।",
  'hero.sub': "বার্তা, ছবি আর ভিডিও কল সরাসরি দুটি ফোনের মধ্যে। নিবন্ধন ছাড়া, ফোন নম্বর ছাড়া, চিরকাল বিনামূল্যে।",
  'hero.cta': "অ্যাপ খুলুন",
  'hero.note': "ব্রাউজারেই খোলে। কিছু ইনস্টল করার নেই, কোথাও নিবন্ধনেরও নেই।",
  'what.1t': "ঠিকানা দিন, নম্বর নয়",
  'what.1b': "যার কাছে এটি আছে সে যখন খুশি আপনার সঙ্গে যোগাযোগ করতে পারে, আপনার ফোন নম্বর না জেনেই।",
  'what.2t': "আর যথেষ্ট হলে, দরজা বন্ধ করে দিন",
  'what.2b': "কোনো বিজ্ঞাপন বা অচেনা কারও জন্য একবার-ব্যবহারের ঠিকানা বানান। মুছে দিলে সেই ব্যক্তি আপনাকে আর খুঁজে পাবে না।",
  'what.3t': "মাঝখানে কেউ পড়ে না",
  'what.3b': "বার্তা, ছবি আর কল এক ফোন থেকে আরেক ফোনে যায়। বিষয়বস্তু কোনো সার্ভার দিয়ে যায় না।",
  'how.title': "কীভাবে কাজ করে",
  'how.1': "অ্যাপ খুলুন: নিবন্ধনের কিছু নেই।",
  'how.2': "আপনার ঠিকানা, বা একটি আমন্ত্রণ, যেভাবে খুশি পাঠান।",
  'how.3': "অন্য জন সেটিতে চাপ দিলেই আপনারা যুক্ত।",
  'foot.who': "মুক্ত ও ওপেন সোর্স সফটওয়্যার (Apache 2.0 লাইসেন্স), মালিকানা DigitalValut-এর — একটি ইতালীয় অলাভজনক সামাজিক উন্নয়ন সমিতি। পৃথিবীর যেকোনো জায়গায়, সবার জন্য বিনামূল্যে।",
  'foot.code': "খোলা কোড, যে কেউ যাচাই করতে চাইলে",
  'hero.qr': "আপনার ফোন দিয়ে স্ক্যান করুন",
  'hero.simple': "শুধু দুটি বড় বোতামের একটি মোডও আছে, যারা এ নিয়ে ভাবতে চান না তাদের জন্য।",
  'compare.title': "এটি কীভাবে আলাদা",
  'compare.row1': "ফোন নম্বর বা অ্যাকাউন্ট প্রয়োজন",
  'compare.row2': "বার্তাগুলি কোম্পানির সার্ভারের মধ্য দিয়ে যায়",
  'compare.row3': "ছবি ও ভিডিও সংকুচিত হয়",
  'compare.row4': "প্রকাশ্য ও যাচাইযোগ্য সোর্স কোড",
  'compare.yes': "হ্যাঁ",
  'compare.no': "না",
  'compare.partial': "আংশিকভাবে (Telegram) / না (WhatsApp)",
};

T.id = {
  'hero.title': "Bisa dihubungi tanpa memberikan nomor Anda.",
  'hero.sub': "Pesan, foto, dan panggilan video langsung antara dua ponsel. Tanpa mendaftar, tanpa nomor telepon, gratis selamanya.",
  'hero.cta': "Buka aplikasi",
  'hero.note': "Terbuka di peramban. Tidak ada yang perlu dipasang, tidak ada yang perlu didaftarkan.",
  'what.1t': "Berikan alamat, bukan nomor Anda",
  'what.1b': "Siapa pun yang memilikinya bisa menghubungi Anda kapan saja, tanpa tahu nomor telepon Anda.",
  'what.2t': "Dan kalau sudah cukup, tutup pintunya",
  'what.2b': "Buat alamat sekali pakai untuk sebuah iklan atau orang asing. Anda hapus, dan orang itu tidak bisa menemukan Anda lagi.",
  'what.3t': "Tidak ada yang membaca di tengah",
  'what.3b': "Pesan, foto, dan panggilan berpindah dari satu ponsel ke ponsel lain. Isinya tidak melewati server mana pun.",
  'how.title': "Cara kerjanya",
  'how.1': "Buka aplikasi: tidak ada yang perlu didaftarkan.",
  'how.2': "Kirim alamat Anda, atau sebuah undangan, sesuka Anda.",
  'how.3': "Begitu orang lain menyentuhnya, Anda sudah terhubung.",
  'foot.who': "Perangkat lunak bebas dan sumber terbuka (lisensi Apache 2.0), milik DigitalValut, sebuah asosiasi nirlaba Italia untuk promosi sosial. Gratis untuk siapa saja, di mana saja di dunia.",
  'foot.code': "Kodenya, terbuka, bagi siapa pun yang ingin memeriksanya",
  'hero.qr': "Pindai dengan ponsel Anda",
  'hero.simple': "Ada juga mode dengan hanya dua tombol besar, untuk yang lebih suka tidak memikirkannya.",
  'compare.title': "Apa yang membuatnya berbeda",
  'compare.row1': "Memerlukan nomor telepon atau akun",
  'compare.row2': "Pesan melewati server perusahaan",
  'compare.row3': "Foto dan video dikompresi",
  'compare.row4': "Kode sumber publik dan dapat diperiksa",
  'compare.yes': "Ya",
  'compare.no': "Tidak",
  'compare.partial': "Sebagian (Telegram) / Tidak (WhatsApp)",
};

/* ------------------------------------------------------------------------ */

function paint(lang){
  const dict = T[lang] || T.it;
  for (const el of document.querySelectorAll('[data-i18n]')){
    const line = dict[el.getAttribute('data-i18n')];
    if (line) el.textContent = line;
  }
  document.documentElement.lang = lang;
  document.documentElement.dir = RTL.includes(lang) ? 'rtl' : 'ltr';
  if (dict['hero.title']) document.title = 'DigitalValut Logos — ' + dict['hero.title'].replace(/\.$/, '');
  try{ localStorage.setItem('dvlogos-lang', lang); }catch(e){}
}

function preferred(){
  try{
    const saved = localStorage.getItem('dvlogos-lang');
    if (saved && T[saved]) return saved;
  }catch(e){}
  for (const tag of (navigator.languages || [navigator.language || 'it'])){
    const short = String(tag).slice(0, 2).toLowerCase();
    if (T[short]) return short;
  }
  return 'en';   /* somebody whose language is not here reads English sooner than Italian */
}

const sel = document.getElementById('langSel');
for (const [code, name] of Object.entries(LANGS)){
  const opt = document.createElement('option');
  opt.value = code;
  opt.textContent = name;
  sel.appendChild(opt);
}
const start = preferred();
sel.value = start;
paint(start);
sel.addEventListener('change', () => paint(sel.value));

/* ============================== QR code ==============================
   Copied verbatim from modifica.js rather than rewritten: it is the exact
   same encoder, already checked there against a real QR decoder on 200
   random links, and this page is bound by the same rule — nothing loaded
   from anywhere else (see the Content-Security-Policy in index.html), so a
   third-party QR library was never an option here either. */
/* ---- Galois field GF(256) for Reed-Solomon, generator 0x11d ---- */
const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);
(function initGF(){
  let x = 1;
  for (let i = 0; i < 255; i++){
    GF_EXP[i] = x;
    GF_LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) GF_EXP[i] = GF_EXP[i - 255];
})();
function gfMul(a, b){ return (a === 0 || b === 0) ? 0 : GF_EXP[GF_LOG[a] + GF_LOG[b]]; }

/* generator polynomial for `degree` error-correction codewords */
function rsGenerator(degree){
  let poly = [1];
  for (let i = 0; i < degree; i++){
    const next = new Array(poly.length + 1).fill(0);
    for (let j = 0; j < poly.length; j++){
      next[j] ^= poly[j];
      next[j + 1] ^= gfMul(poly[j], GF_EXP[i]);
    }
    poly = next;
  }
  return poly;
}
function rsRemainder(data, degree){
  const gen = rsGenerator(degree);
  const rem = new Array(degree).fill(0);
  for (const b of data){
    const factor = b ^ rem[0];
    rem.shift();
    rem.push(0);
    for (let i = 0; i < degree; i++) rem[i] ^= gfMul(gen[i + 1], factor);
  }
  return rem;
}

/* ---- per-version tables (byte mode, error-correction level M) ----
   [ total codewords, ec codewords per block, number of blocks ] */
const VERSIONS_M = {
  1: [26, 10, 1], 2: [44, 16, 1], 3: [70, 26, 1], 4: [100, 18, 2],
  5: [134, 24, 2], 6: [172, 16, 4], 7: [196, 18, 4], 8: [242, 22, 4],
  9: [292, 22, 5], 10: [346, 26, 5],
};
const ALIGN_POS = {
  1: [], 2: [6,18], 3: [6,22], 4: [6,26], 5: [6,30],
  6: [6,34], 7: [6,22,38], 8: [6,24,42], 9: [6,26,46], 10: [6,28,50],
};

function capacityBytes(version){
  const [total, ecPerBlock, blocks] = VERSIONS_M[version];
  const dataCodewords = total - ecPerBlock * blocks;
  const headerBits = 4 + (version < 10 ? 8 : 16);
  return Math.floor((dataCodewords * 8 - headerBits) / 8);
}

function buildCodewords(bytes, version){
  const [total, ecPerBlock, blocks] = VERSIONS_M[version];
  const dataCodewords = total - ecPerBlock * blocks;

  /* bit stream: mode 0100 (byte), length, payload, terminator, padding */
  const bits = [];
  const push = (val, len) => { for (let i = len - 1; i >= 0; i--) bits.push((val >> i) & 1); };
  push(0b0100, 4);
  push(bytes.length, version < 10 ? 8 : 16);
  for (const b of bytes) push(b, 8);
  for (let i = 0; i < 4 && bits.length < dataCodewords * 8; i++) bits.push(0);
  while (bits.length % 8 !== 0) bits.push(0);
  const data = [];
  for (let i = 0; i < bits.length; i += 8){
    let v = 0;
    for (let j = 0; j < 8; j++) v = (v << 1) | bits[i + j];
    data.push(v);
  }
  const PAD = [0xEC, 0x11];
  for (let i = 0; data.length < dataCodewords; i++) data.push(PAD[i % 2]);

  /* split into blocks, compute EC for each, then interleave */
  const shortBlockLen = Math.floor(dataCodewords / blocks);
  const longBlocks = dataCodewords % blocks;
  const dataBlocks = [], ecBlocks = [];
  let offset = 0;
  for (let b = 0; b < blocks; b++){
    const len = shortBlockLen + (b >= blocks - longBlocks ? 1 : 0);
    const block = data.slice(offset, offset + len);
    offset += len;
    dataBlocks.push(block);
    ecBlocks.push(rsRemainder(block, ecPerBlock));
  }
  const out = [];
  const maxData = Math.max(...dataBlocks.map(b => b.length));
  for (let i = 0; i < maxData; i++)
    for (const b of dataBlocks) if (i < b.length) out.push(b[i]);
  for (let i = 0; i < ecPerBlock; i++)
    for (const b of ecBlocks) out.push(b[i]);
  return out;
}

/* ---- module placement ---- */
function makeMatrix(version, codewords, mask){
  const size = version * 4 + 17;
  const m = Array.from({ length: size }, () => new Array(size).fill(null));

  const setFinder = (r, c) => {
    for (let dr = -1; dr <= 7; dr++)
      for (let dc = -1; dc <= 7; dc++){
        const rr = r + dr, cc = c + dc;
        if (rr < 0 || cc < 0 || rr >= size || cc >= size) continue;
        const inner = dr >= 0 && dr <= 6 && dc >= 0 && dc <= 6 &&
          (dr === 0 || dr === 6 || dc === 0 || dc === 6 || (dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4));
        m[rr][cc] = inner ? 1 : 0;
      }
  };
  setFinder(0, 0); setFinder(0, size - 7); setFinder(size - 7, 0);

  /* timing patterns */
  for (let i = 8; i < size - 8; i++){
    if (m[6][i] === null) m[6][i] = i % 2 === 0 ? 1 : 0;
    if (m[i][6] === null) m[i][6] = i % 2 === 0 ? 1 : 0;
  }
  /* alignment patterns */
  const pos = ALIGN_POS[version];
  for (const r of pos) for (const c of pos){
    if ((r <= 7 && c <= 7) || (r <= 7 && c >= size - 8) || (r >= size - 8 && c <= 7)) continue;
    for (let dr = -2; dr <= 2; dr++)
      for (let dc = -2; dc <= 2; dc++)
        m[r + dr][c + dc] = (Math.abs(dr) === 2 || Math.abs(dc) === 2 || (dr === 0 && dc === 0)) ? 1 : 0;
  }
  /* the always-dark module */
  m[size - 8][8] = 1;

  /* reserve format areas so data skips them */
  const reserved = [];
  for (let i = 0; i < 9; i++){ reserved.push([8, i], [i, 8]); }
  for (let i = 0; i < 8; i++){ reserved.push([8, size - 1 - i], [size - 1 - i, 8]); }
  for (const [r, c] of reserved) if (m[r][c] === null) m[r][c] = 0;

  /* data, snaking up and down in two-column strips, skipping column 6 */
  let bitIndex = 0;
  const totalBits = codewords.length * 8;
  for (let right = size - 1; right >= 1; right -= 2){
    if (right === 6) right = 5;
    for (let vert = 0; vert < size; vert++){
      for (let j = 0; j < 2; j++){
        const c = right - j;
        const upward = ((right + 1) & 2) === 0;
        const r = upward ? size - 1 - vert : vert;
        if (m[r][c] !== null) continue;
        let bit = 0;
        if (bitIndex < totalBits){
          bit = (codewords[bitIndex >> 3] >> (7 - (bitIndex & 7))) & 1;
          bitIndex++;
        }
        m[r][c] = bit ^ (maskBit(mask, r, c) ? 1 : 0);
      }
    }
  }
  return m;
}
function maskBit(mask, r, c){
  switch (mask){
    case 0: return (r + c) % 2 === 0;
    case 1: return r % 2 === 0;
    case 2: return c % 3 === 0;
    case 3: return (r + c) % 3 === 0;
    case 4: return (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0;
    case 5: return (r * c) % 2 + (r * c) % 3 === 0;
    case 6: return ((r * c) % 2 + (r * c) % 3) % 2 === 0;
    case 7: return ((r + c) % 2 + (r * c) % 3) % 2 === 0;
  }
}
/* format information: level M (0b00) + mask, BCH(15,5) with the standard mask */
function placeFormat(m, mask){
  const size = m.length;
  const data = (0b00 << 3) | mask;
  let rem = data;
  for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >> 9) * 0x537);
  const bits = ((data << 10) | rem) ^ 0x5412;
  const get = i => (bits >> i) & 1; /* get(14) is the most significant bit */
  /* first copy, wrapped around the top-left finder */
  for (let i = 0; i <= 5; i++) m[8][i] = get(14 - i);
  m[8][7] = get(8); m[8][8] = get(7); m[7][8] = get(6);
  for (let i = 0; i < 6; i++) m[5 - i][8] = get(5 - i);
  /* second copy: bits 14..8 climbing the bottom-left column, then 7..0 along
     row 8 at the right. Seven, not eight, going up — the eighth position is the
     module that is always dark and must stay that way. */
  for (let i = 0; i < 7; i++) m[size - 1 - i][8] = get(14 - i);
  for (let i = 0; i < 8; i++) m[8][size - 8 + i] = get(7 - i);
  m[size - 8][8] = 1;
}

/* ---- penalty scoring, to pick the mask the way the spec says ---- */
function penalty(m){
  const size = m.length;
  let score = 0;
  const runScore = line => {
    let s = 0, run = 1;
    for (let i = 1; i < line.length; i++){
      if (line[i] === line[i - 1]) run++;
      else { if (run >= 5) s += run - 2; run = 1; }
    }
    if (run >= 5) s += run - 2;
    return s;
  };
  for (let r = 0; r < size; r++) score += runScore(m[r]);
  for (let c = 0; c < size; c++) score += runScore(m.map(row => row[c]));
  for (let r = 0; r < size - 1; r++)
    for (let c = 0; c < size - 1; c++)
      if (m[r][c] === m[r][c+1] && m[r][c] === m[r+1][c] && m[r][c] === m[r+1][c+1]) score += 3;
  const pat1 = [1,0,1,1,1,0,1,0,0,0,0], pat2 = [0,0,0,0,1,0,1,1,1,0,1];
  const hasPat = (line, i, pat) => pat.every((v, k) => line[i + k] === v);
  for (let r = 0; r < size; r++)
    for (let c = 0; c + 11 <= size; c++)
      if (hasPat(m[r], c, pat1) || hasPat(m[r], c, pat2)) score += 40;
  for (let c = 0; c < size; c++){
    const col = m.map(row => row[c]);
    for (let r = 0; r + 11 <= size; r++)
      if (hasPat(col, r, pat1) || hasPat(col, r, pat2)) score += 40;
  }
  let dark = 0;
  for (const row of m) for (const v of row) dark += v;
  score += Math.floor(Math.abs(dark * 100 / (size * size) - 50) / 5) * 10;
  return score;
}

function qrMatrix(text){
  const bytes = [...new TextEncoder().encode(text)];
  let version = 0;
  for (let v = 1; v <= 10; v++) if (capacityBytes(v) >= bytes.length){ version = v; break; }
  if (!version) return null;
  const codewords = buildCodewords(bytes, version);
  let best = null, bestScore = Infinity;
  for (let mask = 0; mask < 8; mask++){
    const m = makeMatrix(version, codewords, mask);
    placeFormat(m, mask);
    const s = penalty(m);
    if (s < bestScore){ bestScore = s; best = m; }
  }
  return best;
}

/* Points at the app itself, not at this landing page — scanning it should
   put the app in your hand, not send you back to the page you are already
   looking at. */
function paintHeroQr(){
  const cv = document.getElementById('heroQr');
  if (!cv) return;
  const m = qrMatrix('https://digitalvalut.github.io/logos-protocol/modifica.html');
  if (!m) return;
  const size = m.length, quiet = 4, scale = 4, total = size + quiet * 2;
  cv.width = cv.height = total * scale;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cv.width, cv.height);
  ctx.fillStyle = '#000';
  for (let r = 0; r < size; r++)
    for (let c = 0; c < size; c++)
      if (m[r][c]) ctx.fillRect((c + quiet) * scale, (r + quiet) * scale, scale, scale);
}
paintHeroQr();
