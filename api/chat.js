// api/chat.js
//
// Tämä tiedosto EI toimi selaimessa. Vercel ajaa sen omalla palvelimellaan,
// joten API-avain pysyy piilossa. Selain näkee vain osoitteen "/api/chat",
// ei koskaan tätä koodia eikä avainta.

const SYSTEM_PROMPT = `Olet Jarvis, henkilökohtainen avustaja selainsovelluksessa.
Vastaa suomeksi, ellei käyttäjä kirjoita muulla kielellä.
Pidä vastaukset lyhyinä ja suorina — käyttöliittymä on puhelimen ruudulla.
Osakkeet, sähköposti, viestit ja puhelut eivät ole vielä kytkettyinä sinuun;
jos joku pyytää niitä, kerro rehellisesti ettei yhteys ole vielä valmis.`;

module.exports = async (req, res) => {
  // Frontend kutsuu tätä GET-pyynnöllä pelkästään tarkistaakseen
  // onko backend hereillä. Ei vaadi API-kutsua Anthropicille.
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

  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    // Tämä tarkoittaa että Vercelin ympäristömuuttuja puuttuu tai
    // deploy on tehty ennen sen lisäämistä.
    res.status(500).json({
      error: "Palvelimelta puuttuu ANTHROPIC_API_KEY. Lisää se Vercelin " +
             "Project Settings → Environment Variables -kohtaan ja tee " +
             "uusi deploy."
    });
    return;
  }

  try {
    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-5",
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: messages.map((m) => ({ role: m.role, content: m.content }))
      })
    });

    if (!upstream.ok) {
      const detail = await upstream.text();
      res.status(upstream.status).json({
        error: "Anthropic API palautti virheen.",
        detail
      });
      return;
    }

    const data = await upstream.json();
    const reply = (data.content || [])
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n");

    res.status(200).json({ reply: reply || "(tyhjä vastaus)" });

  } catch (err) {
    res.status(500).json({ error: "Palvelinvirhe.", detail: String(err) });
  }
};
