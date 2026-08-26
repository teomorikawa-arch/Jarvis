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

## Vaihe 2: backend (Vercel)

Nyt sivu alkaa oikeasti vastata. Tämän jälkeen sivua **ei enää käytetä GitHub Pagesin osoitteesta** — Vercel palvelee sekä käyttöliittymän että backendin samasta osoitteesta, mikä on myös syy miksi kaikki toimii ilman erillisiä lupasäätöjä (CORS) selainten välillä.

### 1. Hanki API-avain

1. Mene osoitteeseen **platform.claude.com** ja luo tili (tai kirjaudu, jos sinulla on jo)
2. Lisää maksutapa: **Settings → Billing** — Claude API on käytön mukaan laskutettava, ei kuulu Claude Pro -tilaukseen
3. **Settings → API keys → Create key**
4. Kopioi avain heti talteen — se näkyy vain kerran, ja alkaa kirjaimilla `sk-ant-`

### 2. Kytke Vercel GitHubiin

1. Mene osoitteeseen **vercel.com** ja kirjaudu GitHub-tunnuksellasi
2. **Add New → Project**
3. Valitse `jarvis`-repo listasta → **Import**
4. Framework Preset: jätä **Other** — projekti ei tarvitse erillistä build-vaihetta
5. Älä paina Deploy vielä — avaa ensin **Environment Variables**:
   - Name: `ANTHROPIC_API_KEY`
   - Value: äsken kopioitu `sk-ant-...`-avain
   - Paina **Add**
6. Paina **Deploy**

Parin minuutin päästä saat osoitteen tyyliin `jarvis-teomorikawa-arch.vercel.app`. **Tämä on nyt sivustosi oikea, toimiva osoite** — käytä sitä jatkossa, ei enää github.io-osoitetta.

### 3. Kokeile

Avaa Vercel-osoite, kosketa orbia, kirjoita viesti. Yläkulman pitäisi vaihtua tekstiksi **"kytketty"** ja Jarvis vastaa oikeasti.

### 4. Jatkokehitys

Joka kerta kun päivität tiedostoja GitHubissa, Vercel julkaisee uuden version automaattisesti — ei erillistä komentoa tarvita.

**Kustannus:** Sonnet-mallilla tyypillinen henkilökohtainen käyttö maksaa muutamia senttejä per keskustelu. Voit asettaa kulukaton kohdassa **Settings → Billing → Spend limits**, jotta et voi vahingossakaan kuluttaa enempää kuin haluat.

**Seuraava askel ennen kuin jaat linkin kenellekään:** sivu on juuri nyt täysin julkinen — kuka tahansa osoitteen löytävä voi jutella Jarvisin kanssa sinun laskullasi. Lisätään seuraavaksi yksinkertainen salasanasuoja, ennen vaihetta 3.

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
