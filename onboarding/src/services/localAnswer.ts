import { GUIDE_SECTIONS } from '@/constants/guide';
import { getMunicipality, type MunicipalityId } from '@/constants/municipalities';
import { PLACES } from '@/constants/places';
import type { RoleId } from '@/constants/roles';
import { hourLabel, skyOf } from '@/constants/weather';
import { ZONE_LOOK } from '@/constants/zones';

import type { ChatLang } from './assistant';
import { compassFrom, fetchSeaConditions, loadCachedConditions, seaStateOf, type SeaConditions, type SeaState } from './seaConditions';
import { loadCachedZones } from './zones';

// Friendly answers built on the phone from the app's own data: the live forecast, places, the Guide and
// the zones. Used when the AI service can't be reached (not deployed yet, or no signal), so the chat
// always replies. Plain, everyday words and short sentences in both languages; it never invents facts.

type Intent = 'greet' | 'thanks' | 'weather' | 'seaweed' | 'dive' | 'places' | 'rules' | 'report' | 'help';

// Order matters: the first match wins.
const INTENTS: [Intent, RegExp][] = [
  ['thanks', /\b(salamat|thank|thanks|ty)\b/i],
  ['weather', /(weather|safe|good day|good for|good today|is the sea|calm enough|maayos ba ang dagat|maganda ba ngayon|storm|surge|typhoon|wave|wind|rain|sea today|go out|bagyo|alon|hangin|ulan|panahon|pumalaot|laot|maalon|kalmado|delikado|ligtas)/i],
  ['seaweed', /(ice-ice|ice ice|seaweed|guso|farm|planting|harvest|\bani\b)/i],
  ['rules', /(rule|policy|policies|do'?s and don'?ts|dos|don'?ts|not do|bawal|patakaran|sanctuar|santuwaryo|zone|allowed|penalty|turtle|pawikan|can i not|not fish)/i],
  ['dive', /(snorkel|dive|diving|scuba|sisid|reef|bahura|coral)/i],
  ['places', /(place|spot|beach|island|visit|tour|pasyalan|puntahan|isla|dalampasigan|sandbar|resort)/i],
  ['report', /(report|isumbong|ireport|illegal|dynamite|dinamita|lason|cyanide|basura|trash|pollution)/i],
  ['greet', /^\s*(hi|hello|hey|good (morning|afternoon|evening)|kumusta|magandang (umaga|hapon|gabi)|musta)\b/i],
];

const detect = (text: string): Intent => INTENTS.find(([, re]) => re.test(text))?.[0] ?? 'help';

const t = (lang: ChatLang, tl: string, en: string) => (lang === 'tl' ? tl : en);

// ---- weather -------------------------------------------------------------

async function worstNext48h(town: NonNullable<ReturnType<typeof getMunicipality>>) {
  try {
    const at = `latitude=${town.sea.lat}&longitude=${town.sea.lng}&timezone=Asia%2FManila&forecast_days=2`;
    const [m, w] = await Promise.all([
      fetch(`https://marine-api.open-meteo.com/v1/marine?${at}&hourly=wave_height`).then((r) => r.json()),
      fetch(`https://api.open-meteo.com/v1/forecast?${at}&hourly=wind_gusts_10m&wind_speed_unit=kmh`).then((r) => r.json()),
    ]);
    const max = (xs: unknown) => {
      const n = Array.isArray(xs) ? xs.filter((x): x is number => typeof x === 'number') : [];
      return n.length ? Math.max(...n) : null;
    };
    return { waves: max(m?.hourly?.wave_height), gusts: max(w?.hourly?.wind_gusts_10m) };
  } catch {
    return { waves: null, gusts: null };
  }
}

const SEA_WORD: Record<SeaState, { tl: string; en: string }> = {
  calm: { tl: 'kalmado', en: 'calm' },
  slight: { tl: 'may maliliit na alon', en: 'a little wavy' },
  moderate: { tl: 'medyo malakas ang alon', en: 'a bit rough' },
  rough: { tl: 'malakas ang alon', en: 'rough' },
  veryRough: { tl: 'napakalakas ng alon', en: 'very rough' },
};

async function weather(lang: ChatLang, townId: MunicipalityId | null, askedStorm: boolean): Promise<string> {
  const town = townId ? getMunicipality(townId) : undefined;
  if (!town) {
    return t(
      lang,
      'Gusto kitang tulungan! Pero hindi ko pa alam ang bayan mo. Piliin ito sa More → Change role or town, tapos magtanong ulit.',
      "I'd love to help! But I don't know your town yet. Pick it in More → Change role or town, then ask me again.",
    );
  }

  let now: SeaConditions | null = null;
  let offline = false;
  try {
    now = await fetchSeaConditions(town);
  } catch {
    now = await loadCachedConditions(town);
    offline = true;
  }
  if (!now || now.waveHeightM === null) {
    return t(
      lang,
      `Pasensya na, hindi ko makuha ang lagay ng dagat sa ${town.name} ngayon. Subukan ulit kapag may signal. Tingnan din ang PAGASA bago pumalaot. Ingat!`,
      `Sorry, I can't get the sea report for ${town.name} right now. Please try again when you have signal. Also check PAGASA before you go out. Stay safe!`,
    );
  }

  const state = seaStateOf(now.waveHeightM);
  const word = SEA_WORD[state][lang];
  const waves = now.waveHeightM.toFixed(1);
  const ahead = offline ? { waves: null, gusts: null } : await worstNext48h(town);
  const roughAhead = (ahead.waves ?? 0) >= 2.5 || (ahead.gusts ?? 0) >= 60;

  const lines: string[] = [];
  if (state === 'calm' || state === 'slight') {
    lines.push(t(lang, `Magandang balita! Ang dagat sa ${town.name} ay ${word} ngayon (${waves} m ang alon).`, `Good news! The sea near ${town.name} is ${word} today (waves are ${waves} m).`));
    lines.push(t(lang, 'Ligtas ito para sa maliliit na bangka.', "It's a good day for small boats."));
  } else if (state === 'moderate') {
    lines.push(t(lang, `Mag-ingat ngayon. Ang dagat sa ${town.name} ay ${word} (${waves} m ang alon).`, `Please be careful today. The sea near ${town.name} is ${word} (waves are ${waves} m).`));
    lines.push(t(lang, 'Kung lalabas ka, manatili malapit sa pampang at magsuot ng life vest.', 'If you go out, stay close to shore and wear a life vest.'));
  } else {
    lines.push(t(lang, `Mas mabuting huwag munang pumalaot. Ang dagat sa ${town.name} ay ${word} (${waves} m ang alon).`, `It's better to stay on shore today. The sea near ${town.name} is ${word} (waves are ${waves} m).`));
    lines.push(t(lang, 'Hindi ligtas ang maliliit na bangka ngayon.', 'It is not safe for small boats right now.'));
  }
  if (now.windKmh !== null) {
    const from = now.windFromDeg === null ? '' : t(lang, `, galing sa ${compassFrom(now.windFromDeg)}`, `, from the ${compassFrom(now.windFromDeg)}`);
    lines.push(t(lang, `Ang hangin ay mga ${Math.round(now.windKmh)} km/h${from}.`, `The wind is about ${Math.round(now.windKmh)} km/h${from}.`));
  }
  if (now.weatherCode !== undefined) {
    const sky = skyOf(now.weatherCode, now.isDay);
    const temp = now.tempC === null ? '' : ` (${Math.round(now.tempC)}°C)`;
    if (sky.rainy || (now.rainNowMm ?? 0) > 0) {
      lines.push(t(lang, `${sky.tl} ngayon${temp}. Magdala ng pang-ulan.`, `It is raining now: ${sky.en.toLowerCase()}${temp}. Bring rain gear.`));
    } else if (now.rainStartsAt) {
      const chance = now.rainChanceNext12h === null ? '' : t(lang, ` (${Math.round(now.rainChanceNext12h)}% ang tsansa)`, ` (${Math.round(now.rainChanceNext12h)}% chance)`);
      lines.push(t(lang, `${sky.tl} ngayon${temp}, pero malamang umulan mga ${hourLabel(now.rainStartsAt)}${chance}.`, `It is ${sky.en.toLowerCase()} now${temp}, but rain is likely at about ${hourLabel(now.rainStartsAt)}${chance}.`));
    } else {
      lines.push(t(lang, `${sky.tl} ngayon${temp}. Walang inaasahang ulan sa susunod na 12 oras.`, `It is ${sky.en.toLowerCase()} now${temp}. No rain is expected in the next 12 hours.`));
    }
  }
  if (ahead.waves !== null) {
    lines.push(
      roughAhead
        ? t(lang, `Sa susunod na 2 araw, puwedeng lumakas ang alon hanggang ${ahead.waves.toFixed(1)} m. Bantayan ang panahon.`, `In the next 2 days, waves may get up to ${ahead.waves.toFixed(1)} m. Please watch the weather.`)
        : t(lang, 'Mukhang tahimik din ang susunod na 2 araw.', 'The next 2 days look calm too.'),
    );
  }
  if (askedStorm) {
    lines.push(
      t(
        lang,
        'Tungkol sa bagyo o storm surge (biglang pagtaas ng dagat dahil sa bagyo): forecast lang ang nakikita ko, hindi opisyal na babala. Sundin palagi ang PAGASA, ang LGU, at ang Coast Guard.',
        'About storms or storm surge (when a storm pushes the sea onto land): I only see the forecast, not official warnings. Always follow PAGASA, your LGU, and the Coast Guard.',
      ),
    );
  }
  if (offline) lines.push(t(lang, '(Walang signal, kaya ito ang huling report na naka-save sa phone mo.)', '(No signal, so this is the last report saved on your phone.)'));
  lines.push(t(lang, 'Ingat sa laot!', 'Stay safe out there!'));
  return lines.join(' ');
}

// ---- places, diving, rules, reporting ------------------------------------

function places(lang: ChatLang, divingOnly: boolean): string {
  const reefs = PLACES.filter((p) => /snorkel|reef/i.test(`${p.about} ${p.kindLabel}`));
  const list = (divingOnly ? reefs : PLACES).map((p) => `• ${p.name} (${getMunicipality(p.town)?.name}): ${p.about}`).join('\n');
  if (divingOnly) {
    return t(
      lang,
      `Ay, masaya 'yan! Heto ang lugar na may bahura na pwedeng i-snorkel:\n${list}\n\nPara sa scuba diving, sumama sa may lisensyang dive shop. Tandaan: lumutang lang. Huwag tapakan o hawakan ang coral.`,
      `Oh, you'll love it! Here is a place with a reef you can snorkel:\n${list}\n\nFor scuba diving, please go with a dive shop that has a license. Remember: just float. Don't stand on or touch the coral.`,
    );
  }
  return t(
    lang,
    `Ang ganda ng Marinduque! Heto ang ilang puwede mong puntahan:\n${list}\n\nBuksan ang Places para makita ang lagay ng dagat bago sumakay ng bangka.`,
    `Marinduque has lovely places! Here are some you can visit:\n${list}\n\nOpen Places to check the sea before you take a boat.`,
  );
}

async function rules(lang: ChatLang): Promise<string> {
  const pick = GUIDE_SECTIONS.slice(0, 4)
    .map((s) => `• ${s.title}: ${t(lang, 'Gawin', 'Do')}: ${s.do[0]} ${t(lang, 'Huwag', "Don't")}: ${s.dont[0]}`)
    .join('\n');
  const zones = (await loadCachedZones())?.zones ?? [];
  const noFish = zones.filter((z) => z.type === 'sanctuary' || z.type === 'restricted');
  const zoneLine = noFish.length
    ? t(
        lang,
        `\n\nMga lugar na bawal o limitado ang pangingisda: ${noFish.map((z) => `${z.name} (${ZONE_LOOK[z.type].label})`).join(', ')}.`,
        `\n\nPlaces where fishing is not allowed or is limited: ${noFish.map((z) => `${z.name} (${ZONE_LOOK[z.type].label})`).join(', ')}.`,
      )
    : t(lang, '\n\nPara makita ang mga sanctuary (lugar na bawal mangisda), buksan ang Map. Mag-sign in muna.', '\n\nTo see the sanctuaries (places where no one may fish), open the Map. Sign in first.');
  return t(
    lang,
    `Salamat sa pag-aalaga sa ating dagat! Heto ang mga dapat at bawal:\n${pick}${zoneLine}\n\nNasa Guide ang buong listahan.`,
    `Thank you for caring for our sea! Here are the main do's and don'ts:\n${pick}${zoneLine}\n\nYou can see the full list in Guide.`,
  );
}

const seaweed = (lang: ChatLang) =>
  t(
    lang,
    'Magandang tanong! Ang ice-ice ay kapag pumuputi at lumalambot ang sanga ng seaweed. Madalas itong mangyari pagkatapos ng malakas na ulan o biglang pagbabago ng tubig. Tingnan agad ang mga linya mo pagkatapos ng ulan, at alisin ang mga may sakit na bahagi para hindi kumalat. Sa Farm, makikita mo kung ilang araw na mula pagtanim.',
    "Good question! Ice-ice is when seaweed branches turn white and soft. It often happens after heavy rain or a sudden change in the water. Check your lines soon after rain, and cut off the sick parts so it does not spread. In Farm, you can see how many days since planting.",
  );

const report = (lang: ChatLang) =>
  t(
    lang,
    'Salamat sa pagbabantay! Buksan ang Report. Piliin kung ano ang nakita mo, isulat kung ano, saan at kailan, tapos i-save. Gumagana ito kahit walang signal. Ipapadala ito sa Bantay Dagat at MAO kapag naka-sign in ka at may signal na. Lumayo ka nang kaunti para ligtas ka, ha?',
    'Thank you for watching out! Open Report. Pick what you saw, write what, where and when, then save. It works without signal. It goes to Bantay Dagat and the MAO when you are signed in and have signal. Please stay at a safe distance.',
  );

const help = (lang: ChatLang, role: RoleId | null) =>
  t(
    lang,
    `Hello! Ako si MarAIne. Matutulungan kita sa:\n• lagay ng dagat at panahon\n• mga pwedeng i-snorkel at pasyalan\n• mga dapat at bawal sa dagat\n• paano mag-report sa Bantay Dagat${role === 'aquaculture' ? '\n• pag-aalaga ng seaweed (may tips sa Farm)' : ''}\n\nAno ang gusto mong malaman?`,
    `Hi! I'm MarAIne. I can help you with:\n• the sea and the weather\n• places to snorkel and visit\n• the do's and don'ts at sea\n• how to report to Bantay Dagat${role === 'aquaculture' ? '\n• seaweed farming (tips are in Farm)' : ''}\n\nWhat would you like to know?`,
  );

export async function localAnswer(question: string, town: MunicipalityId | null, role: RoleId | null, lang: ChatLang): Promise<string> {
  switch (detect(question)) {
    case 'thanks':
      return t(lang, 'Walang anuman! Nandito lang ako kung may tanong ka pa. Ingat palagi!', "You're welcome! I'm here if you need me. Take care!");
    case 'greet':
      return help(lang, role);
    case 'seaweed':
      return seaweed(lang);
    case 'weather':
      return weather(lang, town, /(storm|surge|typhoon|bagyo)/i.test(question));
    case 'dive':
      return places(lang, true);
    case 'places':
      return places(lang, false);
    case 'rules':
      return rules(lang);
    case 'report':
      return report(lang);
    default:
      return help(lang, role);
  }
}
