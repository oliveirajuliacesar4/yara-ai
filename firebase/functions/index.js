const functions = require("firebase-functions");
const admin = require("firebase-admin");
const OpenAI = require("openai");

admin.initializeApp();

const db = admin.firestore();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

exports.processarGasto = functions.https.onRequest(async (req, res) => {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Metodo nao permitido" });
    }

    const authHeader = req.headers.authorization || "";
    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Token ausente" });
    }

    const idToken = authHeader.replace("Bearer ", "");
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const userId = decodedToken.uid;

    const mensagem = (req.body?.mensagem || "").trim();

    if (!mensagem) {
      return res.status(400).json({ error: "Mensagem obrigatoria" });
    }

    const response = await openai.responses.create({
      model: "gpt-4o-mini",
      input: [
        {
          role: "system",
          content:
            "Voce extrai gastos de mensagens curtas em portugues. " +
            "Responda apenas com JSON valido no schema pedido. " +
            "Categorias permitidas: mercado, transporte, alimentacao, lazer, saude, contas, educacao, outros. " +
            "Se nao houver categoria clara, use outros. " +
            "Se nao houver valor, use 0.",
        },
        {
          role: "user",
          content: mensagem,
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "gasto_extraido",
          strict: true,
          schema: {
            type: "object",
            properties: {
              valor: {
                type: "number",
              },
              categoria: {
                type: "string",
                enum: [
                  "mercado",
                  "transporte",
                  "alimentacao",
                  "lazer",
                  "saude",
                  "contas",
                  "educacao",
                  "outros",
                ],
              },
            },
            required: ["valor", "categoria"],
            additionalProperties: false,
          },
        },
      },
    });

    const outputText = response.output_text;
    const parsed = JSON.parse(outputText);

    const gasto = {
      userId,
      mensagem,
      valor: parsed.valor || 0,
      categoria: parsed.categoria || "outros",
      data: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await db.collection("gastos").add(gasto);

    return res.status(200).json({
      success: true,
      id: docRef.id,
      ...gasto,
    });
  } catch (error) {
    console.error("Erro ao processar gasto:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Erro interno",
    });
  }
});

