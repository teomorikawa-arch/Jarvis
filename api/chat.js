// api/chat.js
//
// Tämä tiedosto EI toimi selaimessa. Vercel ajaa sen omalla palvelimellaan,
// joten API-avain pysyy piilossa. Selain näkee vain osoitteen "/api/chat",
// ei koskaan tätä koodia eikä avainta.
//
// Käyttää Google Geminin ilmaista tasoa (Gemini 2.5 Flash) — ei vaadi
// maksukorttia. Avain haetaan osoitteesta aistudio.google.com.

const SYSTEM_PROMPT = `Olet Jarvis, henkilökohtainen avustaja selainsovelluksessa.
Vastaa suomeksi, ellei käyttäjä kirjoita muulla kielellä.
Pidä vastaukset lyhyinä ja suorina — käyttöliittymä on puhelimen ruudulla.
Osakkeet, sähköposti, viestit ja puhelut eivät ole vielä kytkettyinä sinuun;
jos joku pyytää niitä, kerro rehellisesti ettei yhteys ole vielä valmis.`;

const MODEL = "gemini-2.5-flash";

module.exports = async (req, res) => {
  // Frontend kutsuu tätä GET-pyynnöllä pelkästään tarkistaakseen
  // onko backend hereillä. Ei vaadi API-kutsua Geminille.
  if (req.method === "GET") {
    res.status(200).json({ ok: true });
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Vain GET tai POST on sallittu." });
    return;
  }

  const { messages } = req.body || {};

  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: "Pyynnöstä puuttuu viestihistoria." });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    // Tämä tarkoittaa että Vercelin ympäristömuuttuja puuttuu tai
    // deploy on tehty ennen sen lisäämistä.
    res.status(500).json({
      error: "Palvelimelta puuttuu GEMINI_API_KEY. Lisää se Vercelin " +
             "Project Settings → Environment Variables -kohtaan ja tee " +
             "uusi deploy."
    });
    return;
  }

  // Gemini käyttää rooleja "user" ja "model" — meidän "assistant" -> "model".
  const contents = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }]
  }));

  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

  try {
    const upstream = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-goog-api-key": apiKey
      },
      body: JSON.stringify({
        contents,
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] }
      })
    });

    if (!upstream.ok) {
      const raw = await upstream.text();
      let detail = raw;
      try {
        const parsed = JSON.parse(raw);
        detail = parsed?.error?.message || raw;
      } catch {
        // raw ei ollut JSONia — näytetään sellaisenaan
      }
      res.status(upstream.status).json({
        error: "Gemini API palautti virheen.",
        detail
      });
      return;
    }

    const data = await upstream.json();
    const parts = data?.candidates?.[0]?.content?.parts || [];
    const reply = parts.map((p) => p.text || "").join("\n").trim();

    res.status(200).json({ reply: reply || "(tyhjä vastaus)" });

  } catch (err) {
    res.status(500).json({ error: "Palvelinvirhe.", detail: String(err) });
  }
};
