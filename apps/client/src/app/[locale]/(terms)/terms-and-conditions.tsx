import { getLocale } from "next-intl/server";

type Copy = {
  label: string;
  title: string;
  intro: string;
  howTitle: string;
  how: string[];
  termsTitle: string;
  terms: string[];
  updated: string;
};

const en: Copy = {
  label: "Guide & policies",
  title: "How it works and our terms",
  intro: "Everything important about using RankMyCountry, in plain language.",
  howTitle: "How it works",
  how: [
    "Sign in, find a country, and use the up or down button. Free-vote limits help keep the leaderboard fair.",
    "To purchase votes, choose a country, vote direction, and quantity. Votes are added after a successful checkout.",
    "To become a sponsor, reserve an available advertising spot, complete payment, then add your brand name, logo, description, colors, and website.",
  ],
  termsTitle: "Terms and conditions",
  terms: [
    "We do not sell your personal data or share it for advertising. We use only the information needed to operate, secure, and improve the service.",
    "RankMyCountry is an entertainment and community-ranking platform. The platform, votes, rankings, sponsor placements, and user data must not be used for political campaigns, elections, propaganda, or political targeting.",
    "Purchases of votes and sponsor placements are final and non-refundable.",
    "Do not automate votes, manipulate rankings, abuse the service, impersonate others, or upload unlawful, misleading, or harmful advertising content.",
    "Rankings reflect activity on this platform only. They are not official statistics, polling results, or statements of fact. We may update features, prices, limits, availability, and these terms.",
  ],
  updated: "Last updated: October 9, 2026",
};

const copies: Partial<Record<string, Copy>> = {
  en,
  hi: { label: "मार्गदर्शिका और नीतियां", title: "यह कैसे काम करता है और हमारी शर्तें", intro: "RankMyCountry के उपयोग की जरूरी जानकारी सरल भाषा में।", howTitle: "यह कैसे काम करता है", how: ["साइन इन करें, देश खोजें और अप या डाउन वोट दें। मुफ़्त वोट सीमा रैंकिंग को निष्पक्ष रखती है।", "वोट खरीदने के लिए देश, वोट का प्रकार और संख्या चुनें। सफल भुगतान के बाद वोट जोड़ दिए जाते हैं।", "स्पॉन्सर बनने के लिए विज्ञापन स्थान आरक्षित करें, भुगतान करें और अपने ब्रांड की जानकारी जोड़ें।"], termsTitle: "नियम और शर्तें", terms: ["हम आपका निजी डेटा विज्ञापन के लिए बेचते या साझा नहीं करते।", "प्लेटफ़ॉर्म, वोट, रैंकिंग और डेटा का राजनीतिक अभियान, चुनाव, प्रचार या राजनीतिक लक्ष्यीकरण में उपयोग नहीं किया जा सकता।", "वोट और स्पॉन्सर स्थान की खरीद अंतिम और गैर-वापसी योग्य है, सिवाय जहां कानून आवश्यक करे।", "स्वचालित वोट, रैंकिंग में हेरफेर, सेवा का दुरुपयोग और अवैध या हानिकारक सामग्री निषिद्ध है।", "रैंकिंग केवल इस प्लेटफ़ॉर्म की गतिविधि दिखाती है; यह आधिकारिक आंकड़ा या सर्वेक्षण नहीं है।"], updated: "अंतिम अपडेट: 9 अक्टूबर 2026" },
  es: { label: "Guía y políticas", title: "Cómo funciona y nuestras condiciones", intro: "Lo esencial sobre RankMyCountry en un lenguaje claro.", howTitle: "Cómo funciona", how: ["Inicia sesión, busca un país y vota a favor o en contra. Los límites gratuitos mantienen una clasificación justa.", "Para comprar votos, elige país, dirección y cantidad. Se añaden tras completar el pago.", "Para ser patrocinador, reserva un espacio, paga y añade los datos de tu marca."], termsTitle: "Términos y condiciones", terms: ["No vendemos ni compartimos tus datos personales para publicidad.", "La plataforma, los votos, las clasificaciones y los datos no pueden usarse para campañas, elecciones, propaganda ni segmentación política.", "Las compras de votos y patrocinios son definitivas y no reembolsables, salvo obligación legal.", "No automatices votos, manipules clasificaciones ni publiques contenido ilegal o dañino.", "Las clasificaciones solo reflejan actividad de esta plataforma; no son estadísticas oficiales ni encuestas."], updated: "Última actualización: 9 de octubre de 2026" },
  fr: { label: "Guide et règles", title: "Fonctionnement et conditions", intro: "L’essentiel de RankMyCountry en langage clair.", howTitle: "Comment ça marche", how: ["Connectez-vous, trouvez un pays et votez positivement ou négativement. Les limites gratuites préservent l’équité.", "Pour acheter des votes, choisissez le pays, le sens et la quantité. Ils sont ajoutés après paiement.", "Pour devenir sponsor, réservez un emplacement, payez puis ajoutez les informations de votre marque."], termsTitle: "Conditions générales", terms: ["Nous ne vendons ni ne partageons vos données personnelles à des fins publicitaires.", "La plateforme, les votes, classements et données ne peuvent servir à des campagnes, élections, propagande ou ciblage politique.", "Les achats de votes et de sponsoring sont définitifs et non remboursables, sauf obligation légale.", "Les votes automatisés, manipulations et contenus illégaux ou nuisibles sont interdits.", "Les classements reflètent uniquement l’activité de la plateforme et ne sont ni des statistiques officielles ni des sondages."], updated: "Dernière mise à jour : 9 octobre 2026" },
  de: { label: "Leitfaden & Regeln", title: "So funktioniert es und unsere Bedingungen", intro: "Alles Wichtige zu RankMyCountry in klarer Sprache.", howTitle: "So funktioniert es", how: ["Anmelden, ein Land suchen und positiv oder negativ abstimmen. Kostenlose Limits schützen die Fairness.", "Für gekaufte Stimmen Land, Richtung und Anzahl wählen. Sie werden nach erfolgreicher Zahlung hinzugefügt.", "Als Sponsor einen Werbeplatz reservieren, bezahlen und die Markendaten eintragen."], termsTitle: "Allgemeine Geschäftsbedingungen", terms: ["Wir verkaufen oder teilen Ihre persönlichen Daten nicht für Werbung.", "Plattform, Stimmen, Rankings und Daten dürfen nicht für Kampagnen, Wahlen, Propaganda oder politisches Targeting verwendet werden.", "Käufe von Stimmen und Sponsorplätzen sind endgültig und nicht erstattungsfähig, soweit gesetzlich zulässig.", "Automatisierte Stimmen, Manipulationen und rechtswidrige oder schädliche Inhalte sind verboten.", "Rankings zeigen nur Plattformaktivitäten und sind keine amtlichen Statistiken oder Umfragen."], updated: "Letzte Aktualisierung: 9. Oktober 2026" },
  pt: { label: "Guia e políticas", title: "Como funciona e nossos termos", intro: "Tudo que importa sobre o RankMyCountry em linguagem simples.", howTitle: "Como funciona", how: ["Entre, encontre um país e vote positivo ou negativo. Limites gratuitos mantêm o ranking justo.", "Para comprar votos, escolha país, direção e quantidade. Eles são adicionados após o pagamento.", "Para ser patrocinador, reserve um espaço, pague e adicione os dados da marca."], termsTitle: "Termos e condições", terms: ["Não vendemos nem compartilhamos seus dados pessoais para publicidade.", "Plataforma, votos, rankings e dados não podem ser usados em campanhas, eleições, propaganda ou segmentação política.", "Compras de votos e patrocínios são finais e não reembolsáveis, salvo exigência legal.", "Votos automáticos, manipulação e conteúdo ilegal ou prejudicial são proibidos.", "Rankings refletem apenas a atividade da plataforma; não são estatísticas oficiais nem pesquisas."], updated: "Última atualização: 9 de outubro de 2026" },
  it: { label: "Guida e regole", title: "Come funziona e le nostre condizioni", intro: "Le informazioni essenziali su RankMyCountry in parole semplici.", howTitle: "Come funziona", how: ["Accedi, trova un paese e vota a favore o contro. I limiti gratuiti mantengono equa la classifica.", "Per acquistare voti, scegli paese, direzione e quantità. I voti sono aggiunti dopo il pagamento.", "Per diventare sponsor, prenota uno spazio, paga e inserisci i dati del brand."], termsTitle: "Termini e condizioni", terms: ["Non vendiamo né condividiamo i tuoi dati personali per la pubblicità.", "Piattaforma, voti, classifiche e dati non possono essere usati per campagne, elezioni, propaganda o targeting politico.", "Gli acquisti di voti e sponsorizzazioni sono definitivi e non rimborsabili, salvo obblighi di legge.", "Voti automatici, manipolazioni e contenuti illegali o dannosi sono vietati.", "Le classifiche riflettono solo l’attività della piattaforma; non sono statistiche ufficiali o sondaggi."], updated: "Ultimo aggiornamento: 9 ottobre 2026" },
  ar: { label: "الدليل والسياسات", title: "طريقة العمل والشروط", intro: "كل ما يهم حول RankMyCountry بلغة واضحة.", howTitle: "طريقة العمل", how: ["سجّل الدخول وابحث عن دولة وصوّت إيجابياً أو سلبياً. تساعد الحدود المجانية على عدالة الترتيب.", "لشراء الأصوات، اختر الدولة ونوع التصويت والكمية. تضاف الأصوات بعد نجاح الدفع.", "لتصبح راعياً، احجز مساحة وأكمل الدفع ثم أضف معلومات علامتك."], termsTitle: "الشروط والأحكام", terms: ["لا نبيع بياناتك الشخصية ولا نشاركها لأغراض إعلانية.", "لا يجوز استخدام المنصة أو الأصوات أو التصنيفات أو البيانات في الحملات أو الانتخابات أو الدعاية أو الاستهداف السياسي.", "مشتريات الأصوات والرعاية نهائية وغير قابلة للاسترداد إلا إذا أوجب القانون ذلك.", "يُحظر التصويت الآلي والتلاعب ونشر المحتوى غير القانوني أو الضار.", "تعكس التصنيفات نشاط المنصة فقط وليست إحصاءات رسمية أو استطلاعات رأي."], updated: "آخر تحديث: 9 أكتوبر 2026" },
  ru: { label: "Руководство и правила", title: "Как это работает и наши условия", intro: "Всё важное о RankMyCountry простым языком.", howTitle: "Как это работает", how: ["Войдите, найдите страну и проголосуйте за или против. Бесплатные лимиты поддерживают честность.", "Для покупки выберите страну, направление и количество. Голоса добавляются после оплаты.", "Чтобы стать спонсором, забронируйте место, оплатите и добавьте данные бренда."], termsTitle: "Условия использования", terms: ["Мы не продаём и не передаём личные данные для рекламы.", "Платформу, голоса, рейтинги и данные нельзя использовать для кампаний, выборов, пропаганды или политического таргетинга.", "Покупки голосов и спонсорских мест окончательны и не возвращаются, кроме предусмотренных законом случаев.", "Автоматизация голосов, манипуляции и незаконный или вредоносный контент запрещены.", "Рейтинги отражают только активность платформы и не являются официальной статистикой или опросом."], updated: "Обновлено: 9 октября 2026 г." },
  zh: { label: "指南与政策", title: "运作方式与使用条款", intro: "用简单语言说明 RankMyCountry 的重要信息。", howTitle: "运作方式", how: ["登录后找到国家并选择支持或反对。免费投票限制有助于保持公平。", "购买投票时选择国家、方向和数量。付款成功后投票会被添加。", "成为赞助商时预订广告位、完成付款并添加品牌信息。"], termsTitle: "条款与条件", terms: ["我们不会出售您的个人数据，也不会为广告目的共享这些数据。", "平台、投票、排名和数据不得用于政治竞选、选举、宣传或政治定向。", "投票和赞助位购买均为最终交易且不予退款，法律要求的情况除外。", "禁止自动投票、操纵排名以及发布违法或有害内容。", "排名仅反映本平台活动，不是官方统计或民意调查。"], updated: "最后更新：2026年10月9日" },
  ja: { label: "ガイドとポリシー", title: "仕組みと利用規約", intro: "RankMyCountryの重要事項を分かりやすく説明します。", howTitle: "仕組み", how: ["ログインして国を探し、賛成または反対に投票します。無料投票の制限により公平性を保ちます。", "票を購入するには国、方向、数量を選びます。決済完了後に追加されます。", "スポンサーになるには広告枠を予約して支払い、ブランド情報を登録します。"], termsTitle: "利用規約", terms: ["個人データを広告目的で販売または共有することはありません。", "プラットフォーム、投票、ランキング、データを政治運動、選挙、宣伝、政治的ターゲティングに利用できません。", "票およびスポンサー枠の購入は、法律で必要な場合を除き返金できません。", "自動投票、ランキング操作、違法または有害なコンテンツは禁止です。", "ランキングは本プラットフォーム内の活動のみを反映し、公式統計や世論調査ではありません。"], updated: "最終更新：2026年10月9日" },
  ko: { label: "안내 및 정책", title: "이용 방법 및 약관", intro: "RankMyCountry의 중요 내용을 쉽게 설명합니다.", howTitle: "이용 방법", how: ["로그인하고 국가를 찾아 찬성 또는 반대에 투표하세요. 무료 제한은 공정성을 유지합니다.", "투표 구매 시 국가, 방향, 수량을 선택하세요. 결제 후 투표가 추가됩니다.", "스폰서가 되려면 광고 공간을 예약하고 결제한 뒤 브랜드 정보를 등록하세요."], termsTitle: "이용약관", terms: ["광고 목적으로 개인 데이터를 판매하거나 공유하지 않습니다.", "플랫폼, 투표, 순위 및 데이터를 정치 캠페인, 선거, 선전 또는 정치적 타기팅에 사용할 수 없습니다.", "투표 및 스폰서 구매는 법률상 필요한 경우를 제외하고 환불되지 않습니다.", "자동 투표, 순위 조작, 불법 또는 유해 콘텐츠는 금지됩니다.", "순위는 플랫폼 활동만 반영하며 공식 통계나 여론조사가 아닙니다."], updated: "최종 업데이트: 2026년 10월 9일" },
  id: { label: "Panduan & kebijakan", title: "Cara kerja dan ketentuan kami", intro: "Hal penting tentang RankMyCountry dalam bahasa sederhana.", howTitle: "Cara kerja", how: ["Masuk, cari negara, lalu pilih suara naik atau turun. Batas gratis menjaga keadilan.", "Untuk membeli suara, pilih negara, arah, dan jumlah. Suara ditambahkan setelah pembayaran.", "Untuk menjadi sponsor, pesan ruang iklan, bayar, lalu tambahkan informasi merek."], termsTitle: "Syarat dan ketentuan", terms: ["Kami tidak menjual atau membagikan data pribadi Anda untuk iklan.", "Platform, suara, peringkat, dan data tidak boleh digunakan untuk kampanye, pemilu, propaganda, atau penargetan politik.", "Pembelian suara dan sponsor bersifat final dan tidak dapat dikembalikan, kecuali diwajibkan hukum.", "Suara otomatis, manipulasi, serta konten ilegal atau berbahaya dilarang.", "Peringkat hanya mencerminkan aktivitas platform, bukan statistik resmi atau jajak pendapat."], updated: "Terakhir diperbarui: 9 Oktober 2026" },
  tr: { label: "Rehber ve politikalar", title: "Nasıl çalışır ve koşullarımız", intro: "RankMyCountry hakkında önemli bilgiler, sade bir dille.", howTitle: "Nasıl çalışır", how: ["Giriş yapın, bir ülke bulun ve olumlu veya olumsuz oy verin. Ücretsiz sınırlar adaleti korur.", "Oy satın almak için ülke, yön ve adedi seçin. Ödeme sonrası oylar eklenir.", "Sponsor olmak için reklam alanı ayırtın, ödeyin ve marka bilgilerini ekleyin."], termsTitle: "Şartlar ve koşullar", terms: ["Kişisel verilerinizi reklam amacıyla satmaz veya paylaşmayız.", "Platform, oylar, sıralamalar ve veriler kampanya, seçim, propaganda veya siyasi hedefleme için kullanılamaz.", "Oy ve sponsor alımları, yasaların gerektirdiği durumlar dışında iade edilmez.", "Otomatik oylar, manipülasyon ve yasa dışı veya zararlı içerik yasaktır.", "Sıralamalar yalnızca platform etkinliğini yansıtır; resmi istatistik veya anket değildir."], updated: "Son güncelleme: 9 Ekim 2026" },
  vi: { label: "Hướng dẫn & chính sách", title: "Cách hoạt động và điều khoản", intro: "Thông tin quan trọng về RankMyCountry bằng ngôn ngữ đơn giản.", howTitle: "Cách hoạt động", how: ["Đăng nhập, tìm quốc gia và bình chọn ủng hộ hoặc phản đối. Giới hạn miễn phí giúp duy trì công bằng.", "Để mua lượt bình chọn, chọn quốc gia, hướng và số lượng. Lượt bình chọn được thêm sau thanh toán.", "Để trở thành nhà tài trợ, đặt chỗ quảng cáo, thanh toán và thêm thông tin thương hiệu."], termsTitle: "Điều khoản và điều kiện", terms: ["Chúng tôi không bán hoặc chia sẻ dữ liệu cá nhân của bạn cho quảng cáo.", "Nền tảng, lượt bình chọn, xếp hạng và dữ liệu không được dùng cho chiến dịch, bầu cử, tuyên truyền hoặc nhắm mục tiêu chính trị.", "Mua lượt bình chọn và tài trợ không được hoàn tiền, trừ khi pháp luật yêu cầu.", "Cấm tự động hóa bình chọn, thao túng và nội dung bất hợp pháp hoặc gây hại.", "Bảng xếp hạng chỉ phản ánh hoạt động nền tảng, không phải số liệu chính thức hay khảo sát."], updated: "Cập nhật lần cuối: 9 tháng 10 năm 2026" },
  th: { label: "คู่มือและนโยบาย", title: "วิธีการทำงานและข้อกำหนด", intro: "ข้อมูลสำคัญเกี่ยวกับ RankMyCountry ในภาษาที่เข้าใจง่าย", howTitle: "วิธีการทำงาน", how: ["เข้าสู่ระบบ ค้นหาประเทศ และโหวตขึ้นหรือลง ขีดจำกัดฟรีช่วยรักษาความยุติธรรม", "หากต้องการซื้อคะแนน ให้เลือกประเทศ ทิศทาง และจำนวน คะแนนจะเพิ่มหลังชำระเงิน", "หากต้องการเป็นผู้สนับสนุน ให้จองพื้นที่ ชำระเงิน และเพิ่มข้อมูลแบรนด์"], termsTitle: "ข้อกำหนดและเงื่อนไข", terms: ["เราไม่ขายหรือแบ่งปันข้อมูลส่วนบุคคลของคุณเพื่อการโฆษณา", "ห้ามใช้แพลตฟอร์ม คะแนน การจัดอันดับ หรือข้อมูลเพื่อการรณรงค์ การเลือกตั้ง โฆษณาชวนเชื่อ หรือการกำหนดเป้าหมายทางการเมือง", "การซื้อคะแนนและพื้นที่ผู้สนับสนุนไม่สามารถคืนเงินได้ เว้นแต่กฎหมายกำหนด", "ห้ามโหวตอัตโนมัติ บิดเบือนอันดับ หรือเผยแพร่เนื้อหาผิดกฎหมายหรือเป็นอันตราย", "การจัดอันดับสะท้อนเฉพาะกิจกรรมบนแพลตฟอร์ม ไม่ใช่สถิติหรือผลสำรวจอย่างเป็นทางการ"], updated: "อัปเดตล่าสุด: 9 ตุลาคม 2026" },
};

const noRefundCopy: Record<string, string> = {
  en: "Purchases of votes and sponsor placements are final and non-refundable.",
  hi: "वोट और स्पॉन्सर स्थान की खरीद अंतिम और गैर-वापसी योग्य है।",
  es: "Las compras de votos y patrocinios son definitivas y no reembolsables.",
  fr: "Les achats de votes et de sponsoring sont définitifs et non remboursables.",
  de: "Käufe von Stimmen und Sponsorplätzen sind endgültig und nicht erstattungsfähig.",
  pt: "Compras de votos e patrocínios são finais e não reembolsáveis.",
  it: "Gli acquisti di voti e sponsorizzazioni sono definitivi e non rimborsabili.",
  ar: "مشتريات الأصوات والرعاية نهائية وغير قابلة للاسترداد.",
  ru: "Покупки голосов и спонсорских мест окончательны и не возвращаются.",
  zh: "投票和赞助位购买均为最终交易且不予退款。",
  ja: "票およびスポンサー枠の購入は返金できません。",
  ko: "투표 및 스폰서 구매는 환불되지 않습니다.",
  id: "Pembelian suara dan sponsor bersifat final dan tidak dapat dikembalikan.",
  tr: "Oy ve sponsor alımları kesindir ve iade edilmez.",
  vi: "Mua lượt bình chọn và tài trợ không được hoàn tiền.",
  th: "การซื้อคะแนนและพื้นที่ผู้สนับสนุนไม่สามารถคืนเงินได้",
};

export default async function TermsAndConditions() {
  const locale = await getLocale();
  const copy = copies[locale] ?? en;
  const terms = copy.terms.map((item, index) =>
    index === 2 ? (noRefundCopy[locale] ?? noRefundCopy.en) : item,
  );

  return (
    <article className="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-white/[0.08] bg-[#0d0d0e] px-5 py-7 sm:px-10 sm:py-10">
      <header className="mx-auto max-w-3xl border-b border-white/[0.08] pb-7">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-emerald-400">{copy.label}</p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-4xl">{copy.title}</h1>
        <p className="mt-3 text-sm leading-6 text-zinc-400 sm:text-base">{copy.intro}</p>
      </header>

      <div className="mx-auto max-w-3xl divide-y divide-white/[0.08]">
        <section className="py-8" aria-labelledby="how-it-works">
          <h2 id="how-it-works" className="text-xl font-semibold text-white sm:text-2xl">{copy.howTitle}</h2>
          <ol className="mt-5 space-y-5">
            {copy.how.map((item, index) => (
              <li key={item} className="flex gap-4">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-emerald-500/25 bg-emerald-500/10 font-mono text-[10px] text-emerald-400">{index + 1}</span>
                <p className="pt-0.5 text-sm leading-6 text-zinc-300">{item}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="py-8" aria-labelledby="terms">
          <h2 id="terms" className="text-xl font-semibold text-white sm:text-2xl">{copy.termsTitle}</h2>
          <ul className="mt-5 space-y-4">
            {terms.map((item) => (
              <li key={item} className="border-l border-white/10 pl-4 text-sm leading-6 text-zinc-400 rtl:border-r rtl:border-l-0 rtl:pr-4 rtl:pl-0">{item}</li>
            ))}
          </ul>
        </section>
      </div>

      <footer className="mx-auto max-w-3xl border-t border-white/[0.08] pt-5 font-mono text-[10px] text-zinc-600">{copy.updated}</footer>
    </article>
  );
}
