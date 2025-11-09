# Keittiön tabletti – vanhan Android-tabletin uusi elämä

Tämä projekti tekee vanhasta tabletista hyödyllisen **info- ja näyttöruudun**, joka näyttää:

- 🕓 **Kellonajan ja päivän muistiinpanon** (`notes.json`-tiedostosta)  
- 🌦️ **Sään useasta paikasta** (OpenWeatherMap API:n kautta)  
- 📰 **Tuoreimmat uutisotsikot** (Ylen RSS-syötteestä)  
- 🖼️ **Vaihtuvat kuvat** `images`-kansiosta  
- 🚏 **Pikalinkit HSL-pysäkeille ja terminaaleille**

Sivu on suunniteltu pyörimään täysnäyttöisenä vanhalla Android-tabletilla, esimerkiksi keittiön seinällä.

## 🔧 Asennus ja käyttö

**Kloonaa repositorio**

```bash
   git clone https://github.com/<käyttäjä>/tabletti.git
   cd tabletti
```

# Cloudflare

⚠️ Tietoturva: Älä laita julkiseen repositioon API-avaimia. Käytä esimerkiksi Cloudflare Worker -välipalvelinta API-kutsujen suojaamiseen.

## OpenWeather

- [API Keys](https://home.openweathermap.org/api_keys)
  - testing: Warning received automatically! talonendm/tabletti - OpenWeatherMap Token exposed on GitHub.
    - OpenWeatherAPIn rajoitus ei toiminut. Action: key deleted
  - 🌤️ Attribution: Säädata: OpenWeather
        - Logo ja teksti: “Weather data provided by OpenWeather”

## Worker

(Cloudflare Worker) on se tapa piilottaa API-avain, vaikka sivusi olisi GitHub Pagesissa. Tämä ratkaisu on kevyt, ilmainen ja toimii jopa jatkuvasti 24/7. GitHub Pages (tabletti-sivusi) hakee sään välipalvelimen kautta:

Worker example: [tabletti-saaa.talonen-dm.workers.dev](https://tabletti-saaa.talonen-dm.workers.dev/weather?city=Helsinki)

Worker kysyy OpenWeatherMapilta oikean datan käyttäen sinun avaintasi,
ja palauttaa tuloksen selaimelle — ilman että avain näkyy koskaan GitHubissa.

## Vaihe 1: Luo Cloudflare-tili

- Mene osoitteeseen 👉 https://dash.cloudflare.com/sign-up
- Luo ilmainen tili (valitse Free plan)
- Kirjaudu sisään ja avaa sivu: Workers & Pages → Create Worker

## Vaihe 2: Luo Worker

- Paina “Create” → “HTTP handler”
- Anna nimi esim. *tabletti-saaa*
- Cloudflare avaa editorin, jossa on jotain tyyliin:

```
export default {
  async fetch(request, env, ctx) {
    return new Response("Hello World!");
  }
}
```

Huom! Tuo “Hello World!”-versio tarkoittaa, että olet avannut Worker-editorin Workers SDK -mallilla, jota voi muokata mutta vain oikeasta paikasta. Korvaa oikeassa paikassa koodi:

- Mene Cloudflare hallintaan → Workers & Pages
- Avaa työn (“Worker”) listasta tabletti-saa
- Klikkaa "Quick edit" (ei “Open in playground” eikä “Edit config”)
- Nyt sinulle aukeaa editori, jossa näet koodin suoraan (valkoinen ruutu jossa numerot vasemmalla)
- Poista kaikki siellä oleva koodi ja liitä tämä minun versio:

```
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname.replace('/', '');
    const city = url.searchParams.get('city');
    const lat = url.searchParams.get('lat');
    const lon = url.searchParams.get('lon');
    const key = env.OWM_API_KEY; // Avain tallennetaan ympäristömuuttujaan

    let target = "";

    if (path === "weather" && city) {
      target = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&lang=fi&appid=${key}`;
    } else if (path === "forecast" && city) {
      target = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&units=metric&lang=fi&appid=${key}`;
    } else if (path === "air" && lat && lon) {
      target = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${key}`;
    } else {
      return new Response("Invalid request", { status: 400 });
    }

    const resp = await fetch(target);
    const data = await resp.text();

    return new Response(data, {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "max-age=600" // 10 min välimuisti
      }
    });
  }
};
```

## 3. Lisää API-avain turvallisesti ympäristömuuttujaksi

- [Settings Cloudfare](https://dash.cloudflare.com/4743a62dd4587c7e02c04b75d4d6c127/workers/services/view/tabletti-saaa/production/settings)
  - OWM_API_KEY: <oma OpenWeatherMap API-avain>
  - Tallenna ja julkaise uudelleen (Deploy).


```
https://tabletti-saa.username.workers.dev/weather?city=Helsinki
https://tabletti-saa.username.workers.dev/forecast?city=Helsinki
https://tabletti-saa.username.workers.dev/air?lat=60.17&lon=24.94
```

Kun haetaan esim. weather?city=Helsinki, Worker hakee ensin sään (weather) JSON:ista coord.lat ja coord.lon.
Sitten se käyttää täsmälleen näitä koordinaatteja ilmanlaadun (air) pyynnössä.

# Images -kansio

Valitettavasti puhtaasti HTML/JS:llä ja GitHub Pagesillä ei ole mahdollista lukea kansion sisältöä suoraan, koska GitHub Pages ei tarjoa hakemistohakua tiedostoihin. Eli JavaScript ei voi vain "katsoa images-kansiota" ja löytää kaikki tiedostot.

```
const fs = require('fs');
const path = require('path');

const imagesDir = path.join(__dirname, 'images'); // images-kansio
const outputFile = path.join(__dirname, 'images.json');

fs.readdir(imagesDir, (err, files) => {
    if (err) {
        console.error(err);
        return;
    }
    // Suodatetaan vain kuvatiedostot
    const imageFiles = files.filter(f => /\.(jpe?g|png|gif|webp)$/i.test(f));
    fs.writeFileSync(outputFile, JSON.stringify(imageFiles, null, 2));
    console.log(`images.json luotu: ${imageFiles.length} tiedostoa`);
});
```

Aja skripti terminaalissa:  `node generate-images-json.js` Tämä luo images.json-tiedoston, jossa on kaikki images-kansion kuvat.

# koodista

## Teema

```
/* --------------------
   Teeman vaihto (päivä/yö)
-------------------- */

// Siirrä nämä ennen setTheme()-kutsua
const toggleBtn = document.getElementById("themeToggle");
let manualTheme = null; // null = automaattinen

function setTheme() {
    if (manualTheme) return; // jos käyttäjä on valinnut käsin, ei automaattista vaihtoa
    const hour = new Date().getHours();
    const isDay = hour >= 7 && hour < 19;
    document.body.classList.toggle("light", isDay);
    toggleBtn.textContent = isDay ? "☀️" : "🌙";
}

toggleBtn.addEventListener("click", () => {
    if (manualTheme === "light") {
        document.body.classList.remove("light");
        manualTheme = "dark";
        toggleBtn.textContent = "🌙";
    } else {
        document.body.classList.add("light");
        manualTheme = "light";
        toggleBtn.textContent = "☀️";
    }
});

// nyt vasta kutsutaan ensimmäisen kerran
setTheme();
setInterval(setTheme, 10 * 60 * 1000);

```

### Wake lock

📌 Huomioita

Wake Lock toimii vain aktiivisessa ja näkyvässä välilehdessä.Manuaalinen teema tallentuu vain sessioksi (voi halutessa lisätä localStorage-tuen). Vanhemmissa tableteissa voi olla rajoituksia Wake Lockin käytölle, joten näyttö kannattaa tarvittaessa laittaa "ei koskaan sammuvaksi" asetuksista.
