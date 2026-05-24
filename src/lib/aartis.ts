export interface Aarti {
  id: string;
  title: { en: string; hi: string };
  category: "morning" | "evening" | "prayer" | "mantra";
  pdfUrl?: string; // optional — admin can upload to public/aartis/ later
  lyrics: { en: string; hi: string };
}

export const aartis: Aarti[] = [
  {
    id: "mangala-aarti",
    title: { en: "Mangala Aarti (Sri Guru-vandana)", hi: "मंगल आरती (श्री गुरु-वंदना)" },
    category: "morning",
    lyrics: {
      en: `Sri Guru Carana-padma, kevala-bhakati-sadma,
Bando mui savadhana mate
Jahara prasade bhai, e bhava toriya jai
Krsna-prapti hoy jaha ha'te.

Guru-mukha-padma-vakya, cittete koriya aikya
Ar na koriho mane asa
Sri Guru-carane rati, ei se uttama-gati
Je prasade pure sarva asa.`,
      hi: `श्री गुरु चरण पद्म, केवल भक्ति सद्म,
बंदों मुई सावधान मते।
जाहार प्रसादे भाई, ए भव तरिया जाई,
कृष्ण प्राप्ति होय जाहा हाते।।

गुरु मुख पद्म वाक्य, चित्तेते करिया ऐक्य,
आर ना करिहो मने आशा।
श्री गुरु चरणे रति, एइ से उत्तम-गति,
जे प्रसादे पूरे सर्व आशा।।`,
    },
  },
  {
    id: "tulsi-aarti",
    title: { en: "Sri Tulsi Aarti", hi: "श्री तुलसी आरती" },
    category: "morning",
    lyrics: {
      en: `Namo namah Tulasi! Krsna-preyasi (namo namah)
Radha-Krsna-seva pabo ei abhilasi.
Je tomara sarana loy, tara vancha purna hoy
Krpa kori' koro tare Vrndavana-vasi.`,
      hi: `नमो नमः तुलसी! कृष्ण-प्रेयसि (नमो नमः)
राधा-कृष्ण-सेवा पाबो एइ अभिलाषी।
जे तोमार शरण लय, तार वांछा पूर्ण होय,
कृपा करि' करो ताारे वृन्दावन-वासी।।`,
    },
  },
  {
    id: "gaura-aarti",
    title: { en: "Sri Gaura Aarti", hi: "श्री गौर आरती" },
    category: "evening",
    lyrics: {
      en: `Jaya jaya gauracander aratiko sobha
Jahnavi-tata-vane jaga-mana-lobha
(jaya) Gauranger arotik sobha jaga-jana-mana-lobha.

Dakhine nitaicand, bame gadadhara
Nikate advaita, srinivasa chatra-dhara.`,
      hi: `जय जय गौरचाँदेर आरतिको शोभा,
जाह्नवी-तट-वने जग-मन-लोभा।
(जय) गौरांगेर आरतिक शोभा जग-जन-मन-लोभा।।

दक्षिणे निताईचाँद, वामे गदाधर,
निकटे अद्वैत, श्रीनिवास छत्र-धर।।`,
    },
  },
  {
    id: "narsimha-aarti",
    title: { en: "Sri Narasimha Pranama & Aarti", hi: "श्री नृसिंह आरती" },
    category: "prayer",
    lyrics: {
      en: `Namaste narasimhaya, prahladahlada-dayine
Hiranyakasipor vaksah-sila-tanka-nakhalaye.

Ito nrsimhah parato nrsimho, yato yato yami tato nrsimhah
Bahir nrsimho hrdaye nrsimho, nrsimham adim saranam prapadye.`,
      hi: `नमस्ते नरसिंहाय, प्रह्लादाह्लाद-दायिने।
हिरण्यकशिपोर्वक्षः-शिला-टंक-नखालये।।

इतो नृसिंहः परतो नृसिंहो, यतो यतो यामि ततो नृसिंहः।
बहिर्नृसिंहो हृदये नृसिंहो, नृसिंहमादिं शरणं प्रपद्ये।।`,
    },
  },
  {
    id: "guru-puja",
    title: { en: "Guru Puja (Gurudeva, Krpa-bindu Diya)", hi: "गुरु पूजा" },
    category: "morning",
    lyrics: {
      en: `Sri-guru-carana-padma, kevala-bhakati-sadma...
Gurudev! Krpa-bindu diya, koro' ei dase,
Trnapeksa ati hina sakala-sahane,
Sahisnuta-guna diya, koro' nija dase.`,
      hi: `गुरुदेव! कृपा-बिन्दु दिया, करो' एइ दासे,
तृणापेक्षा अति हीन सकल-सहने।
सहिष्णुता-गुण दिया, करो' निज दासे,
प्रतिष्ठाशा छाड़ि' मोरे करह उदार।।`,
    },
  },
  {
    id: "sandhya-aarti",
    title: { en: "Sandhya Aarti (Jaya Radha-Madhava)", hi: "संध्या आरती (जय राधा-माधव)" },
    category: "evening",
    lyrics: {
      en: `Jaya radha-madhava kunja-vihari
Gopi-jana-vallabha giri-vara-dhari
Yasoda-nandana vraja-jana-ranjana
Yamuna-tira-vana-cari.`,
      hi: `जय राधा-माधव कुंज-विहारी,
गोपी-जन-वल्लभ गिरि-वर-धारी।
यशोदा-नंदन व्रज-जन-रंजन,
यमुना-तीर-वन-चारी।।`,
    },
  },
  {
    id: "damodar-aarti",
    title: { en: "Sri Damodarastakam", hi: "श्री दामोदराष्टकम्" },
    category: "evening",
    lyrics: {
      en: `Namamisvaram sac-cid-ananda-rupam
Lasat-kundalam gokule bhrajamanam
Yasoda-bhiyolukhalad dhavamanam
Paramrstam atyantato drutya gopya.`,
      hi: `नमामीश्वरं सच्-चिद्-आनंद-रूपम्,
लसत्-कुण्डलं गोकुले भ्राजमानम्।
यशोदा-भियोलूखलाद् धावमानं,
परामृष्टमत्यन्ततो द्रुत्य गोप्या।।`,
    },
  },
  {
    id: "maha-mantra",
    title: { en: "Hare Krishna Maha-Mantra", hi: "हरे कृष्ण महामंत्र" },
    category: "mantra",
    lyrics: {
      en: `Hare Krishna Hare Krishna
Krishna Krishna Hare Hare
Hare Rama Hare Rama
Rama Rama Hare Hare`,
      hi: `हरे कृष्ण हरे कृष्ण
कृष्ण कृष्ण हरे हरे।
हरे राम हरे राम
राम राम हरे हरे।।`,
    },
  },
  {
    id: "vaishnava-pranam",
    title: { en: "Vaishnava Pranam", hi: "वैष्णव प्रणाम" },
    category: "prayer",
    lyrics: {
      en: `Vancha-kalpatarubhyas ca krpa-sindhubhya eva ca
Patitanam pavanebhyo vaisnavebhyo namo namah.`,
      hi: `वांछा-कल्पतरुभ्यश्च कृपा-सिन्धुभ्य एव च।
पतितानां पावनेभ्यो वैष्णवेभ्यो नमो नमः।।`,
    },
  },
  {
    id: "prabhupada-pranam",
    title: { en: "Srila Prabhupada Pranati", hi: "श्रील प्रभुपाद प्रणति" },
    category: "prayer",
    lyrics: {
      en: `Nama om visnu-padaya krsna-presthaya bhu-tale
Srimate bhaktivedanta-svamin iti namine.

Namas te sarasvate deve gaura-vani-pracarine
Nirvisesa-sunyavadi-pascatya-desa-tarine.`,
      hi: `नम ॐ विष्णु-पादाय कृष्ण-प्रेष्ठाय भू-तले।
श्रीमते भक्तिवेदान्त-स्वामिन् इति नामिने।।

नमस् ते सारस्वते देवे गौर-वाणी-प्रचारिणे।
निर्विशेष-शून्यवादी-पाश्चात्य-देश-तारिणे।।`,
    },
  },
];
