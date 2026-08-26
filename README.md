# Jarvis

Henkilökohtainen avustaja selaimessa. Toimii puhelimella, Windowsilla ja Macilla samasta osoitteesta.

**Vaihe 1 on valmis:** käyttöliittymä, responsiivinen ulkoasu ja asennettavuus (PWA).
Vaiheessa 2 lisätään backend, joka antaa vastaukset.

---

## Tiedostot

| Tiedosto | Mitä tekee |
|---|---|
| `index.html` | Sivun rakenne |
| `style.css` | Ulkoasu |
| `app.js` | Viestien lähetys, ei sisällä avaimia |
| `manifest.json` | Tekee sivusta asennettavan sovelluksen |
| `service-worker.js` | Pitää käyttöliittymän auki huonolla yhteydellä |
| `icon-*.png` | Sovelluksen ikonit |

---

## Julkaisu

### 1. Luo repo

GitHubissa **New repository** → nimeksi esim. `jarvis` → **Public** → Create.

### 2. Lisää tiedostot

Helpoin tapa ilman komentoriviä: repon etusivulla **Add file → Upload files**, raahaa kaikki tämän kansion tiedostot sisään, ja **Commit changes**.

### 3. Kytke GitHub Pages

Repon **Settings → Pages** → *Branch*: `main`, kansio `/ (root)` → **Save**.

Parin minuutin päästä sivu on osoitteessa:

```
https://KÄYTTÄJÄNIMESI.github.io/jarvis/
```

Avaa se puhelimella ja koneella. Ulkoasu ja kirjoituskenttä toimivat.
Ensin näet pelkän orbin. Kosketa ruutua, niin keskustelu avautuu. Yläkulmassa lukee **ei kytketty** ja viestiin vastataan virheilmoituksella — näin kuuluukin, backendiä ei vielä ole.

---

## Asenna sovellukseksi

- **iPhone (Safari):** Jaa-painike → Lisää kotivalikkoon
- **Android (Chrome):** valikko → Asenna sovellus
- **Windows / Mac (Chrome tai Edge):** osoiterivin oikeassa reunassa asennuskuvake

Ikoni ilmestyy kotinäytölle tai työpöydälle ja sovellus avautuu omassa ikkunassaan.

---

## Orbi ja ääni

Otsikossa oleva pyörivä merkki kertoo mitä Jarvis tekee juuri nyt:

| Tila | Näkyy |
|---|---|
| valmiina | hidas kierto, himmeä |
| ajattelee | nopeutuu, ydin sykkii — näkyy kun vastausta odotetaan |
| puhuu | nopea syke — näkyy kun ääni lukee vastausta |
| kuuntelee | ruosteenvärinen, syke — näkyy mikrofonin ollessa päällä |
| ei yhteyttä | pysähtynyt, harmaa |

**Kaiutin-painike** (otsikon oikeassa reunassa) päättää luetaanko vastaukset ääneen. Tila muistetaan selaimessa seuraavallekin kerralla.

**Mikrofoni-painike** (kirjoituskentän vasemmalla puolella) ilmestyy vain selaimissa, jotka tukevat puheentunnistusta — Chrome ja Edge sekä tietokoneella että Androidilla. iPhonen Safari ei tue sitä, joten painike on siellä piilossa; ääneen lukeminen toimii silti kaikkialla.

Molemmat käyttävät selaimen sisäänrakennettua Web Speech APIa. Ei vaadi avaimia eikä backendiä.

---

## Yksi sääntö

**Älä koskaan kirjoita API-avainta `app.js`-tiedostoon.**

Kaikki tässä kansiossa oleva on julkista — kuka tahansa voi lukea sen selaimen lähdekoodinäkymästä. Avaimet menevät vaiheessa 2 Vercelin ympäristömuuttujiin, missä ne pysyvät piilossa. Jos avain vahingossa päätyy GitHubiin, se pitää mitätöidä heti; pelkkä poistaminen ei riitä, koska se jää commit-historiaan.

---

## Seuraavat vaiheet

2. Backend ja Claude API → sivu alkaa vastata
3. Osakkeet (Finnhub)
4. Sähköposti (Gmail API)
5. Viestit ja puhelut (Twilio)
