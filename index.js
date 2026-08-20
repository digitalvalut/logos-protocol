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
  'limits.title': "Cosa non fa",
  'limits.body': "Serve che siate online tutti e due nello stesso momento, altrimenti non arriva niente. Chi parla con te vede il tuo indirizzo di rete (IP). Su reti molto filtrate le chiamate possono non collegarsi. E nessun sito al mondo può impedire a qualcuno di fare uno screenshot.",
  'limits.why': "Lo scriviamo qui, in prima pagina, perché preferiamo dirtelo prima che dopo.",
  'foot.who': "Software libero e open source (licenza Apache 2.0), di proprietà dell'Associazione di Promozione Sociale DigitalValut, Ente del Terzo Settore. Utilizzabile gratis da chiunque, ovunque nel mondo.",
  'foot.code': "Il codice, in chiaro, per chiunque voglia controllarlo",
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
  'limits.title': "What it doesn't do",
  'limits.body': "You both need to be online at the same time, otherwise nothing arrives. Whoever talks to you sees your network address (IP). On heavily filtered networks calls may not connect. And no website anywhere can stop somebody taking a screenshot.",
  'limits.why': "We put this on the front page because we would rather tell you now than later.",
  'foot.who': "Free and open source software (Apache 2.0 licence), owned by DigitalValut, an Italian non-profit social promotion association. Free for anyone to use, anywhere in the world.",
  'foot.code': "The code, in the open, for anyone who wants to check it",
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
  'limits.title': "Ce qu'elle ne fait pas",
  'limits.body': "Il faut que vous soyez en ligne tous les deux en même temps, sinon rien n'arrive. La personne qui vous parle voit votre adresse réseau (IP). Sur les réseaux très filtrés, les appels peuvent ne pas aboutir. Et aucun site au monde ne peut empêcher quelqu'un de faire une capture d'écran.",
  'limits.why': "Nous l'écrivons ici, en première page, parce que nous préférons vous le dire avant qu'après.",
  'foot.who': "Logiciel libre et open source (licence Apache 2.0), propriété de DigitalValut, association italienne de promotion sociale à but non lucratif. Utilisable gratuitement par tous, partout dans le monde.",
  'foot.code': "Le code, en clair, pour qui veut le vérifier",
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
  'limits.title': "Was sie nicht kann",
  'limits.body': "Ihr müsst beide gleichzeitig online sein, sonst kommt nichts an. Wer mit dir spricht, sieht deine Netzwerkadresse (IP). In stark gefilterten Netzen kommen Anrufe womöglich nicht zustande. Und keine Website der Welt kann jemanden am Bildschirmfoto hindern.",
  'limits.why': "Wir schreiben das auf die Startseite, weil wir es dir lieber vorher sagen als hinterher.",
  'foot.who': "Freie und quelloffene Software (Apache 2.0-Lizenz), Eigentum von DigitalValut, einem italienischen gemeinnützigen Verein zur sozialen Förderung. Für alle kostenlos nutzbar, überall auf der Welt.",
  'foot.code': "Der Quelltext, offen, für alle die ihn prüfen wollen",
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
  'limits.title': "Lo que no hace",
  'limits.body': "Hace falta que estéis los dos en línea a la vez, si no, no llega nada. Quien habla contigo ve tu dirección de red (IP). En redes muy filtradas las llamadas pueden no conectarse. Y ninguna web del mundo puede impedir que alguien haga una captura de pantalla.",
  'limits.why': "Lo escribimos aquí, en la portada, porque preferimos decírtelo antes que después.",
  'foot.who': "Software libre y de código abierto (licencia Apache 2.0), propiedad de DigitalValut, asociación italiana sin ánimo de lucro de promoción social. Gratis para cualquiera, en cualquier parte del mundo.",
  'foot.code': "El código, a la vista, para quien quiera comprobarlo",
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
  'limits.title': "O que não faz",
  'limits.body': "É preciso que estejam os dois online ao mesmo tempo, senão não chega nada. Quem fala consigo vê o seu endereço de rede (IP). Em redes muito filtradas as chamadas podem não ligar. E nenhum site do mundo pode impedir alguém de tirar uma captura de ecrã.",
  'limits.why': "Escrevemos isto na primeira página porque preferimos dizer-lho antes do que depois.",
  'foot.who': "Software livre e de código aberto (licença Apache 2.0), propriedade da DigitalValut, associação italiana sem fins lucrativos de promoção social. Utilizável gratuitamente por qualquer pessoa, em qualquer parte do mundo.",
  'foot.code': "O código, à vista, para quem o quiser verificar",
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
  'limits.title': "Чего оно не делает",
  'limits.body': "Нужно, чтобы вы оба были в сети одновременно, иначе ничего не придёт. Тот, кто говорит с вами, видит ваш сетевой адрес (IP). В сильно фильтруемых сетях звонки могут не соединяться. И ни один сайт в мире не может помешать сделать снимок экрана.",
  'limits.why': "Мы пишем это на первой странице, потому что предпочитаем сказать заранее, а не потом.",
  'foot.who': "Свободное программное обеспечение с открытым исходным кодом (лицензия Apache 2.0), принадлежит DigitalValut — итальянской некоммерческой ассоциации социального содействия. Бесплатно для всех и везде.",
  'foot.code': "Исходный код, открытый для всех, кто захочет его проверить",
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
  'limits.title': "它做不到什么",
  'limits.body': "需要你们两个同时在线，否则什么都收不到。和你通话的人能看到你的网络地址（IP）。在过滤严格的网络上，通话可能连不上。而且世界上没有任何网站能阻止别人截屏。",
  'limits.why': "我们把这些写在首页，因为我们宁愿事先告诉你，而不是事后。",
  'foot.who': "自由开源软件（Apache 2.0 许可证），归意大利非营利社会促进协会 DigitalValut 所有。世界上任何人都可以免费使用。",
  'foot.code': "公开的源代码，供任何想检查的人查看",
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
  'limits.title': "ما لا يفعله",
  'limits.body': "يجب أن تكونا متصلين بالإنترنت في الوقت نفسه، وإلا لن يصل شيء. من يتحدث معك يرى عنوان شبكتك (IP). على الشبكات المُرشَّحة بشدة قد لا تنجح المكالمات. ولا يوجد موقع في العالم يستطيع منع أحد من التقاط صورة للشاشة.",
  'limits.why': "نكتب هذا في الصفحة الأولى لأننا نفضّل إخبارك قبل، لا بعد.",
  'foot.who': "برمجية حرة ومفتوحة المصدر (رخصة Apache 2.0)، مملوكة لـ DigitalValut، وهي جمعية إيطالية غير ربحية للنهوض الاجتماعي. مجانية لأي شخص، في أي مكان في العالم.",
  'foot.code': "الشيفرة، مكشوفة، لكل من أراد التحقق منها",
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
  'limits.title': "یہ کیا نہیں کرتا",
  'limits.body': "ضروری ہے کہ آپ دونوں ایک ہی وقت میں آن لائن ہوں، ورنہ کچھ نہیں پہنچے گا۔ جو آپ سے بات کرتا ہے وہ آپ کا نیٹ ورک پتہ (IP) دیکھتا ہے۔ سخت فلٹر شدہ نیٹ ورکس پر کالیں نہیں جڑ سکتیں۔ اور دنیا کی کوئی ویب سائٹ کسی کو اسکرین شاٹ لینے سے نہیں روک سکتی۔",
  'limits.why': "ہم یہ پہلے صفحے پر لکھ رہے ہیں کیونکہ ہم بعد میں بتانے کے بجائے پہلے بتانا بہتر سمجھتے ہیں۔",
  'foot.who': "آزاد اور اوپن سورس سافٹ ویئر (Apache 2.0 لائسنس)، جو DigitalValut کی ملکیت ہے — ایک اطالوی غیر منافع بخش سماجی فروغ کی انجمن۔ دنیا میں کہیں بھی، ہر کسی کے لیے مفت۔",
  'foot.code': "کھلا ہوا کوڈ، ہر اُس شخص کے لیے جو اسے جانچنا چاہے",
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
  'limits.title': "यह क्या नहीं करता",
  'limits.body': "ज़रूरी है कि आप दोनों एक ही समय ऑनलाइन हों, वरना कुछ नहीं पहुँचेगा। जो आपसे बात करता है वह आपका नेटवर्क पता (IP) देखता है। बहुत छने हुए नेटवर्क पर कॉल नहीं जुड़ सकतीं। और दुनिया की कोई वेबसाइट किसी को स्क्रीनशॉट लेने से नहीं रोक सकती।",
  'limits.why': "हम यह पहले पन्ने पर लिख रहे हैं क्योंकि हमें बाद में बताने से पहले बताना बेहतर लगता है।",
  'foot.who': "मुफ़्त और ओपन सोर्स सॉफ़्टवेयर (Apache 2.0 लाइसेंस), DigitalValut की संपत्ति — एक इतालवी ग़ैर-लाभकारी सामाजिक संवर्धन संस्था। दुनिया में कहीं भी, हर किसी के लिए मुफ़्त।",
  'foot.code': "खुला हुआ कोड, हर उस व्यक्ति के लिए जो इसे जाँचना चाहे",
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
  'limits.title': "এটি যা করে না",
  'limits.body': "আপনাদের দুজনকেই একই সময়ে অনলাইনে থাকতে হবে, নইলে কিছুই পৌঁছাবে না। যে আপনার সঙ্গে কথা বলে সে আপনার নেটওয়ার্ক ঠিকানা (IP) দেখতে পায়। খুব ছাঁকা নেটওয়ার্কে কল না-ও যুক্ত হতে পারে। আর পৃথিবীর কোনো ওয়েবসাইট কাউকে স্ক্রিনশট নেওয়া থেকে আটকাতে পারে না।",
  'limits.why': "আমরা এটি প্রথম পাতাতেই লিখছি, কারণ পরে বলার চেয়ে আগে বলাই ভালো মনে করি।",
  'foot.who': "মুক্ত ও ওপেন সোর্স সফটওয়্যার (Apache 2.0 লাইসেন্স), মালিকানা DigitalValut-এর — একটি ইতালীয় অলাভজনক সামাজিক উন্নয়ন সমিতি। পৃথিবীর যেকোনো জায়গায়, সবার জন্য বিনামূল্যে।",
  'foot.code': "খোলা কোড, যে কেউ যাচাই করতে চাইলে",
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
  'limits.title': "Yang tidak bisa dilakukannya",
  'limits.body': "Kalian berdua harus daring pada saat yang sama, kalau tidak, tidak ada yang sampai. Orang yang berbicara dengan Anda melihat alamat jaringan (IP) Anda. Di jaringan yang disaring ketat, panggilan bisa gagal tersambung. Dan tidak ada situs mana pun di dunia yang bisa mencegah orang mengambil tangkapan layar.",
  'limits.why': "Kami menulisnya di halaman depan karena kami lebih suka memberi tahu Anda sekarang daripada nanti.",
  'foot.who': "Perangkat lunak bebas dan sumber terbuka (lisensi Apache 2.0), milik DigitalValut, sebuah asosiasi nirlaba Italia untuk promosi sosial. Gratis untuk siapa saja, di mana saja di dunia.",
  'foot.code': "Kodenya, terbuka, bagi siapa pun yang ingin memeriksanya",
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
