// api/speak.js
//
// Tämä tiedosto EI toimi selaimessa — Vercel ajaa sen omalla palvelimellaan,
// joten API-avain pysyy piilossa. Muuntaa tekstin puheeksi ElevenLabsilla
// ja palauttaa mp3-äänen suoraan selaimelle.

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Vain POST on sallittu." });
    return;
  }

  const { text } = req.body || {};

  if (!text || !text.trim()) {
    res.status(400).json({ error: "Pyynnöstä puuttuu teksti." });
    return;
  }

  const apiKey  = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID;

  if (!apiKey || !voiceId) {
    res.status(500).json({
      error: "Palvelimelta puuttuu ELEVENLABS_API_KEY tai ELEVENLABS_VOICE_ID. " +
             "Lisää molemmat Vercelin Environment Variables -kohtaan ja tee uusi deploy."
    });
    return;
  }

  try {
    const upstream = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "xi-api-key": apiKey
        },
        body: JSON.stringify({
          text: text.slice(0, 2000), // varosuoja: ei lähetetä valtavia tekstejä vahingossa
          model_id: "eleven_flash_v2_5"
        })
      }
    );

    if (!upstream.ok) {
      const detail = await upstream.text();
      res.status(upstream.status).json({ error: "ElevenLabs palautti virheen.", detail });
      return;
    }

    const audio = await upstream.arrayBuffer();
    res.setHeader("Content-Type", "audio/mpeg");
    res.status(200).send(Buffer.from(audio));

  } catch (err) {
    res.status(500).json({ error: "Palvelinvirhe.", detail: String(err) });
  }
};
