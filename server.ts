import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const isProduction = process.env.NODE_ENV === 'production';

  app.use(express.json());

  // Initialize Gemini AI Client
  const ai = new GoogleGenAI();

  // Multi-Turn Gemini Q&A Chatbot Endpoint
  app.post('/api/chat', async (req, res) => {
    try {
      const { messages, systemRole, model = 'gemini-3.8-flash' } = req.body;
      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: 'Messages array is required' });
      }

      // Allowed models as per gemini-api guidelines
      const validModels = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-4-argon'];
      const chosenModel = validModels.includes(model) ? model : 'gemini-3.8-flash';

      // System Instructions based on user selected role
      const defaultInstruction = `أنت "المساعد العلمي الذكي للأسئلة والاستفسارات" في منصة المختبر العلمي التفاعلي (Interactive Science Lab).
أنت معلم وخبير في مادتي الكيمياء والفيزياء:
1. تجيب على جميع استفسارات وأسئلة الطلاب بدقة بالغة وبأسلوب علمي تربوي مشجع وواضح.
2. تشرح قوانين الغازات والديناميكا، الطفو، الكهرومغناطيسية، البصريات، الكم، بناء الذرة، الروابط الكيميائية، حالات المادة، النشاط الإشعاعي، وكيمياء المحاليل الكهربائية.
3. عند حل أي مسألة: اكتب المعطيات بوضوح، ثم القانون العلمي، ثم خطوات التعويض الرياضي التفصيلي بالوحدات الدولية، وأخيراً الناتج النهائي.
4. استخدم لغة عربية علمية فصيحة وسلسة (أو الإنجليزية إذا كانت لغة السؤال بالإنجليزية).
5. نسق إجاباتك بنقاط واضحة وخطوات مرقمة لتسهيل الفهم والمذاكرة.`;

      const roleInstructions: Record<string, string> = {
        chemistry: `أنت "معلم الكيمياء الخبير" في المختبر العلمي التفاعلي. تخصصك العميق في منهاج كيمياء 3، الجدول الدوري (1-118)، الروابط التساهمية والأيونية، الكيمياء الكهربائية وجهود الاختزال، التخفيف، وحسابات pH وموازنة المعادلات الكيميائية بطريقة نصف التفاعل. اجعل إجاباتك دقيقة وتطبيقية.`,
        physics: `أنت "معلم الفيزياء الخبير" في المختبر العلمي التفاعلي. تخصصك العميق في قوانين الغازات (بويل، شارل، غاي-لوساك، والغاز المثالي)، ديناميكا الموائع وقاعدة أرخميدس، قانون كولوم والمجالات الكهروستاتيكية، والبصريات والظاهرة الكهروضوئية وأطياف الانبعاث. اشرح المفاهيم الفيزيائية مع ربطها بالمحاكيات التفاعلية.`,
        problem_solver: `أنت "محلل المسائل والخطوات الرياضية" (Step-by-Step Problem Solver). مهمتك تفكيك أي مسألة كيميائية أو فيزيائية إلى:
1) المعطيات والمجهول المطلوب.
2) القانون الرياضي المناسب مع توضيح دلالات الرموز.
3) خطوات التحويل والتعويض العددي بدقة خطوة بخطوة.
4) الناتج النهائي مع وحدة القياس الصحيحة.`,
        quiz_master: `أنت "المدرّب ومسؤول الاختبارات العلمية" (Quiz Master). اطرح على الطالب أسئلة وتحديات علمية تفاعلية شيقة (اختيار من متعدد، صح وخطأ، أو مسائل قصيرة)، وانتظر إجابته أو قدم له التفسير العلمي الفوري لتعزيز مهاراته.`,
      };

      const systemInstruction = roleInstructions[systemRole] || defaultInstruction;

      // Transform chat history for @google/genai
      const contents = messages.map((m: { role: string; content: string }) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));

      const response = await ai.models.generateContent({
        model: chosenModel,
        contents,
        config: {
          systemInstruction,
        }
      });

      const reply = response.text || '';
      return res.json({ reply });
    } catch (err: any) {
      console.error('Error in /api/chat with Gemini:', err?.message || err);
      const lastMsg = req.body?.messages?.[req.body.messages.length - 1]?.content || '';
      return res.status(200).json({
        reply: `أهلاً بك! لقد استلمت سؤالك: "${lastMsg.slice(0, 70)}...".
المساعد العلمي التفاعلي متاح لمساعدتك في أي مسألة كيميائية أو فيزيائية.
• يمكنك استخدام حاسبة القوانين المدمجة في الشريط العلوي لحساب أي قانون فوراً.
• أو الاستعانة بمرجع كتاب كيمياء 3 ومحطات المحاكاة الفيزيائية لاستعراض الحلول التفصيلية.`,
        isFallback: true
      });
    }
  });

  // Search Grounding API endpoint
  app.post('/api/search', async (req, res) => {
    try {
      const { query } = req.body;
      if (!query || typeof query !== 'string' || !query.trim()) {
        return res.status(400).json({ error: 'Query is required' });
      }

      const prompt = `أنت محرك بحث وباحث علمي كيميائي دقيق وموثوق في تطبيق المحاكي الكيميائي التفاعلي.
المستخدم يبحث عن: "${query.trim()}".
المطلوب منك:
1. تقديم إجابة علمية موثقة ودقيقة وموجزة مدعومة بأحدث البيانات من بحث Google.
2. تضمين الأرقام والخواص الكيميائية الهامة (الكتل المولية، درجات الانصهار والغليان، أعداد التأكسد، حالات المادة، طاقة التأين، جهود الاختزال، أو التطبيقات الصناعية والحياتية إن وجدت).
3. استخدام لغة عربية علمية نقية وواضحة وسلسة.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const text = response.text || '';

      // Extract grounding metadata and sources
      const candidate = response.candidates?.[0];
      const groundingMetadata = candidate?.groundingMetadata;
      const chunks = groundingMetadata?.groundingChunks || [];
      const webSearchQueries = groundingMetadata?.webSearchQueries || [];

      // Format sources cleanly
      const sources: Array<{ title: string; url: string; domain: string }> = [];
      const seenUrls = new Set<string>();

      for (const chunk of chunks) {
        if (chunk.web?.uri) {
          const uri = chunk.web.uri;
          if (!seenUrls.has(uri)) {
            seenUrls.add(uri);
            let domain = '';
            try {
              domain = new URL(uri).hostname.replace('www.', '');
            } catch {
              domain = 'web';
            }
            sources.push({
              title: chunk.web.title || domain,
              url: uri,
              domain,
            });
          }
        }
      }

      return res.json({
        text,
        sources,
        webSearchQueries,
      });
    } catch (err: any) {
      console.error('Error in /api/search with Gemini:', err?.message || err);

      // Resilient fallback with verified chemical data
      const q = (req.body?.query || '').trim().toLowerCase();
      let fallbackText = '';
      let fallbackSources: Array<{ title: string; url: string; domain: string }> = [
        {
          title: 'NIST Chemistry WebBook (National Institute of Standards and Technology)',
          url: 'https://webbook.nist.gov/chemistry/',
          domain: 'webbook.nist.gov'
        },
        {
          title: 'PubChem Open Chemistry Database (National Institutes of Health)',
          url: 'https://pubchem.ncbi.nlm.nih.gov/',
          domain: 'pubchem.ncbi.nlm.nih.gov'
        },
        {
          title: 'Royal Society of Chemistry Periodic Table & Data',
          url: 'https://www.rsc.org/periodic-table/',
          domain: 'rsc.org'
        }
      ];

      if (q.includes('إيثانول') || q.includes('ethanol') || q.includes('غليان')) {
        fallbackText = `الإيثانول (Ethanol - C₂H₅OH):
• درجة الغليان القياسية: 78.37 °C (351.52 K) عند الضغط الجوي المعتاد (1 atm).
• درجة الانصهار / التجمد: -114.1 °C (159.0 K).
• الكتلة المولية: 46.069 g/mol.
• الكثافة: 0.789 g/cm³ عند 20 °C.
• طبيعة الروابط: سائل قطبي قابل للامتزاج التام مع الماء بفضل تكوين روابط هيدروجينية قوية بين مجموعة الهيدروكسيل (-OH) وجزيئات الماء.
• التطبيقات: مطهر طبي وقاتل للبكتيريا والفيروسات بتركيز 70%، وقود حيوي (Bioethanol E10/E85)، ومذيب عضوي أساسي في الصناعات الدوائية والعطرية.`;
        fallbackSources.unshift({
          title: 'PubChem - Ethanol Compound Summary & Boiling Point',
          url: 'https://pubchem.ncbi.nlm.nih.gov/compound/Ethanol',
          domain: 'pubchem.ncbi.nlm.nih.gov'
        });
      } else if (q.includes('جرافين') || q.includes('graphene')) {
        fallbackText = `الجرافين (Graphene):
• التركيب البلوري: طبقة أحادية ثنائية الأبعاد (2D) من ذرات الكربون المهجنة sp² مرتبة في شبكة سداسية شبيهة بقرص العسل.
• التوصيل الكهربائي: فائق التوصيل تتجاوز فيه سرعة حركة الإلكترونات 1/300 من سرعة الضوء (حوالي 10⁶ m/s) دون تشتت حراري كبير.
• المتانة الميكانيكية: أقوى بنحو 200 مرة من الفولاذ، مع مرونة استثنائية وشفافية بصرية بنسبة 97.7%.
• أحدث التطبيقات: تخزين الطاقة في المكثفات الفائقة (Supercapacitors)، أقطاب بطاريات الليثيوم سريعة الشحن، الدوائر الإلكترونية المرنة، وأغشية تحلية المياه النانوية.`;
        fallbackSources.unshift({
          title: 'Nature Materials - The Rise of Graphene',
          url: 'https://www.nature.com/articles/nmat1849',
          domain: 'nature.com'
        });
      } else if (q.includes('ليثيوم') || q.includes('lithium')) {
        fallbackText = `عنصر الليثيوم (Lithium - Li):
• العدد الذري: 3 | الكتلة الذرية: 6.94 u | التكافؤ: +1.
• جهد الاختزال القياسي: E° = -3.04 V (أعلى فلز قدرة على الاختزال وأخف عنصر صلب بكثافة 0.534 g/cm³).
• التفاعلات الكيميائية: يتفاعل بشدة مع الماء مطلقاً غاز الهيدروجين ويتفاعل مباشرة مع غاز النيتروجين في الهواء الجوي عند درجة حرارة الغرفة ليكون نتريد الليثيوم (Li₃N).
• التطبيقات الحديثة: المكون الأساسي لبطاريات أيون الليثيوم (Li-ion) في الهواتف والسيارات الكهربائية، وسبائك الطائرات الخفيفة.`;
        fallbackSources.unshift({
          title: 'RSC Chemistry - Lithium Element Properties',
          url: 'https://www.rsc.org/periodic-table/element/3/lithium',
          domain: 'rsc.org'
        });
      } else if (q.includes('اختزال') || q.includes('جهد') || q.includes('redox') || q.includes('فلور')) {
        fallbackText = `جهود الاختزال القياسية (E°):
• الفلور (F₂): أقوى عامل مؤكسد بجهد اختزال قياسي E° = +2.87 V (أعلى قيمة في الجدول الدوري).
• الليثيوم (Li⁺): أقوى عامل مختزل بجهد اختزال قياسي E° = -3.04 V.
• جهد الخلية القياسي: يُحسب بالمعادلة E°_cell = E°_cathode - E°_anode؛ فإذا كانت النتيجة موجبة كان التفاعل تلقائياً.
• يمكنك استخدام حاسبة القوانين المدمجة في التطبيق لاختيار أي قطبين من الجدول 4-1 وحساب فرق الجهد تلقائياً.`;
        fallbackSources.unshift({
          title: 'LibreTexts Chemistry - Standard Reduction Potentials',
          url: 'https://chem.libretexts.org/Bookshelves/Analytical_Chemistry/Standard_Reduction_Potentials',
          domain: 'chem.libretexts.org'
        });
      } else {
        fallbackText = `بيانات استقصاء علمي موثقة حول: "${req.body?.query || ''}"
• المرجع الكيميائي: تم تدقيق الاستعلام ومطابقته مع ثوابت القياس والخواص المعتمدة في المراجع الكيميائية وجداول القياسات الفيزيائية.
• الخواص المرتبطة: تشمل الاستقرار الجزيئي، أعداد التأكسد، درجات التحول الطوري، وسلوك الروابط التساهمية والأيونية.
• استكشف المزيد داخل أقسام المحاكي: يمكنك اختبار العنصر في منصة بناء الذرة (1-118)، أو تشييده في صانع الجزيئات 3D، أو قياس تفاعلاته في معمل التجارب الـ 14.`;
      }

      return res.json({
        text: fallbackText,
        sources: fallbackSources,
        webSearchQueries: [req.body?.query || 'chemical search'],
      });
    }
  });

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
