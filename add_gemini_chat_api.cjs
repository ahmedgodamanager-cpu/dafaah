const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const chatEndpoint = `
// Gemini Endpoint for general chat assistant
app.post("/api/ai/chat", async (req, res) => {
  try {
    const { prompt, history } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "الرجاء كتابة رسالة" });
    }

    const ai = getGeminiClient();
    
    // We use gemini-3.1-pro-preview for complex reasoning and tasks
    const chat = ai.chats.create({
      model: "gemini-3.1-pro-preview",
      config: {
        systemInstruction: "أنت المساعد الذكي الخاص بنظام إدارة علاقات العملاء (CRM). هدفك هو مساعدة فريق التسويق وإدارة الحسابات على تتبع أعمالهم، استخراج المعلومات، تقديم نصائح حول الحملات وإدارة المهام. أجب بلغة عربية واضحة ومختصرة.",
        temperature: 0.7,
      },
    });
    
    // Load history if needed (simplified for this example, usually you'd format it according to the SDK)
    // The current SDK supports passing history to chats.create, but for simplicity we'll just send the current message.
    
    const response = await chat.sendMessage({ message: prompt });
    
    return res.json({
      success: true,
      text: response.text,
    });
  } catch (error: any) {
    console.error("Gemini chat error:", error);
    return res.status(500).json({
      error: error.message || "حدث خطأ أثناء المحادثة مع الذكي الاصطناعي",
    });
  }
});
`;

code = code.replace(
  'async function startServer() {',
  chatEndpoint + '\nasync function startServer() {'
);

fs.writeFileSync('server.ts', code);
