import {
  archiveManifest,
  type ArchiveManifestEntry,
  type ArchiveSection,
} from "./archive-manifest";
import { headingId, type ArchiveHeading } from "./archive-content.server";

export const englishSnapshotDate = "29 July 2026";

export type EnglishArchiveEntry = ArchiveManifestEntry & {
  body: string;
  headings: ArchiveHeading[];
  plainText: string;
  originalTitle: string;
};

type EnglishCopy = {
  title: string;
  summary: string;
  aliases?: string[];
  facts?: Array<{ label: string; value: string }>;
  body: string;
};

export const englishSections: Record<
  ArchiveSection,
  { title: string; description: string }
> = {
  lives: {
    title: "Lives",
    description: "Complete profiles of the people whose paths make up the company.",
  },
  companions: {
    title: "Companions",
    description: "People closely connected to the Wayfarers beyond the six core members.",
  },
  places: {
    title: "Places",
    description: "Villages, cities, forests, and waypoints along the road.",
  },
  relics: {
    title: "Relics",
    description: "Weapons, keepsakes, and enchanted objects with a history of their own.",
  },
  lore: {
    title: "Lore",
    description: "Oaths, miracles, bloodlines, and magic encountered along the way.",
  },
  heraldry: {
    title: "Heraldry",
    description: "Recorded emblems of churches, peoples, and organizations.",
  },
  tales: {
    title: "Tales",
    description: "Short pieces and self-contained moments away from the main chronicle.",
  },
  chronicle: {
    title: "The Chronicle",
    description: "The shared road of the Windreed Wayfarers, arranged in time.",
  },
  fortunes: {
    title: "Fortunes",
    description: "Personal histories, side roads, and encounters that changed a life.",
  },
};

const englishCopy: Record<string, EnglishCopy> = {
  shirul: {
    title: "Shirul",
    summary:
      "The company’s youngest member, an Oath of the Ancients paladin who was the first to call a loose group of travelers “us.”",
    aliases: ["Shirul", "the little knight"],
    facts: [
      { label: "Ancestry", value: "Human · one-eighth halfling through her mother’s line" },
      { label: "Calling", value: "Paladin · Oath of the Ancients" },
      { label: "Age", value: "15" },
      { label: "From", value: "Emberford" },
    ],
    body: `## At a glance

Shirul is the youngest of the Windreed Wayfarers. One branch of her mother’s family is halfling, giving Shirul one-eighth halfling ancestry. Her mother worships Sheela Peryroyl, so that faith was part of life at home. Shirul later entered Emberford’s church of Sune, learned to read through scripture and prayer, and chose Sune for herself. Her education is modest and her experience of the wider world still narrow, but she takes every duty seriously.

The others were still deciding whether they could trust one another when Shirul had already begun saying “we.” That instinct made her the company’s emotional center.

## The little knight

Shirul is fifteen years old and only 139 centimeters tall. She has white hair, very pale skin, and clear teal eyes. The greatsword she carries, Branch, is almost as tall as she is. Strength has never been her advantage; she learned to wield it through repetition, stubbornness, and faith.

She tries hard to appear grown-up. On duty she straightens her back, recites the tenets of her oath, and insists that a danger is her responsibility. Away from strangers, the performance slips. She is warm, earnest, easily delighted by praise, afraid of ghosts, and incapable of hiding what she feels.

## Oath and road

Around 1490 DR, when Shirul was thirteen, she and Alberina found an injured Flavilar in Neverwinter Wood. Shirul chose first: she would not leave this life behind. She made a vow to protect life while the rescue was still underway. Only then did a restrained miracle appear. Flavilar’s injuries stabilized, and a few nearby plants put out new shoots.

The danger that injured Flavilar, Shirul’s exact words, and the source of the power remain unsettled. Shirul understands what happened as Sune’s answer to her vow.

She believes the oath asks her to preserve life, light, and hope. She will reason with an enemy when she can, offer a way back when one remains, and still raise her sword when there is no other choice.

## The company

Shirul has known Alberina since she was about five. She calls the high elf “Sister Lina,” depends on her, and wants just as fiercely to prove that she can one day stand in front of the person who always protected her.

Flavilar first entered Shirul’s life through the rescue in Neverwinter Wood; she later came to share the front line with her. Pheiron calls Shirul “little knight” after she caught him stealing and answered with a solemn lecture. Skamos was drawn into the company because Shirul kept treating him as though he already belonged. Ariel, a fellow child of Emberford, joined after she offered him the same unguarded invitation.

Asked whom she would protect first, Shirul refused to choose. Her answer was everyone.`,
  },
  alberina: {
    title: "Alberina",
    summary:
      "A high elf sorcerer from Evereska whose learning, judgment, and long companionship steady the company.",
    aliases: ["Alberina", "Lina"],
    facts: [
      { label: "Ancestry", value: "High elf" },
      { label: "Calling", value: "Sorcerer · Silver draconic bloodline" },
      { label: "Age", value: "About 105" },
      { label: "From", value: "Evereska" },
    ],
    body: `## At a glance

Alberina is the most widely read of the Windreed Wayfarers. She grew up with books, formal training, and the comforts of a prosperous household in Evereska. A silver-dragon bloodline gave her an instinct for magic; study taught her how to use it.

She knows a great deal without being worldly in every sense. Precise definitions come easily to her. The rough, ambiguous parts of ordinary life do not. Strangers may read her quiet manner as coldness. Her companions know that she is slow to speak, occasionally lazy, fond of sweets, and capable of a perfectly dry joke.

## Beyond Evereska

Alberina was born around 1387 DR. For years a silver dragon appeared in her dreams and gave her no answers. In 1475 DR, at about eighty-eight, she left Evereska to search beyond the books she had exhausted.

She traveled for seven years along settled roads through the Dessarin Valley and northward. In 1482 DR, with the Second Sundering unsettling roads and towns, she stopped near Emberford. The pause became a home. Shirul was about five when Alberina entered her life.

## Knowledge and magic

Alberina’s magic comes from her silver-dragon ancestry. Her discipline comes from years of study. When the company faces an unfamiliar spell, text, or problem, she is usually the person who takes it in hand and says, “Let me see.”

Her explanations change with the listener. She keeps them plain for Shirul and Flavilar, and uses exact terminology when it will help. In the company she serves as a center of knowledge and judgment, though she rarely tries to command the room.

## Companionship

By 1492 DR, Alberina and Shirul have known one another for roughly ten years: eight in Emberford and two on the road. Alberina once stood mainly as a caretaker. As Shirul grew, she moved to her side and let the younger paladin choose her own direction.

In 1490 DR, Alberina and Shirul found and rescued an injured Flavilar in Neverwinter Wood. Alberina later taught her the language and social knowledge damaged with her memory. She never treats those gaps as stupidity, and she lent Flavilar an enchanted silver choker so the dragonborn could enter towns without drawing immediate fear.

Alberina keeps her own pace and needs time alone, yet she has never stood outside the company. When Shirul chose the road, Alberina was already beside her.`,
  },
  flavilar: {
    title: "Flavilar",
    summary:
      "A black dragonborn fighter rebuilding language, custom, and belonging after the deliberate loss of her memory.",
    aliases: ["Flavilar", "Fla"],
    facts: [
      { label: "Ancestry", value: "Black dragonborn" },
      { label: "Calling", value: "Fighter · Battle Master" },
      { label: "Age", value: "21" },
      { label: "From", value: "The Mere of Dead Men" },
    ],
    body: `## At a glance

Flavilar is difficult for strangers to overlook. She stands about 2.7 meters tall, with a powerful build, black scales, and watchful green eyes. Years of surviving alone in the wild remain in the way she moves: direct, alert, and quick to act.

She speaks in short sentences and rarely explains a feeling twice. Long language, social customs, and many ordinary assumptions had to be learned again after her memory was erased.

## The lost years

Flavilar was born inside a hidden black-dragon domain in the Mere of Dead Men. Its drowned ruins, isolated ground, dragon lairs, and dependent communities followed an order shaped by strength.

Around 1484–1485 DR, when she was thirteen or fourteen, someone deliberately stripped away her memory and cast her into the outer marsh. Language and much of her social understanding were damaged with it. She later traveled north and spent her final three or four solitary years hidden in Neverwinter Wood. Shirul and Alberina found and rescued her there in 1490 DR, when she was eighteen or nineteen.

Flavilar does not make recovering the past her purpose. When asked what happened, she may think for a while and suggest something as simple as having fallen and hit her head. The present holds her attention more securely than the lost life behind her.

## Among other people

Everyday life had to be rebuilt with help from the company: speech, reading, clothing, town manners, hot food, lessons, and the habit of sharing a road. Alberina became her most trusted teacher. Shirul was the person who had refused to abandon her and later became the friend who learned beside her instead of standing above her.

In crowded places Flavilar wears Alberina’s enchanted choker. It gives her the fixed appearance of a tall, black-haired human woman. The disguise makes towns easier to enter, though she remains close to two meters tall.

## On the front line

Flavilar fights as a Battle Master. Her judgment comes from survival and motion more than from formal diagrams. She opens space with strength, holds the front, and creates the gap Pheiron needs for a precise strike.

She has little interest in authority and no patience for abandoning a companion. Asked what she wanted after the adventures ended, she wrote that she wanted a home she could return to. Ten years from now, she still hopes to be with the others.`,
  },
  pheiron: {
    title: "Pheiron",
    summary:
      "A polished, elusive wood elf assassin whose courtesy, theft, and quick judgment keep the company guessing.",
    aliases: ["Pheiron"],
    facts: [
      { label: "Ancestry", value: "Wood elf" },
      { label: "Calling", value: "Rogue · Assassin" },
      { label: "Age", value: "131" },
      { label: "From", value: "A wood-elven homeland" },
    ],
    body: `## At a glance

Pheiron is a wood elf assassin with the manners of an old household and the habits of a practiced thief. He enjoys a little trouble, slips small things into his pockets, and usually has a graceful sentence ready when someone notices.

Courtesy does not mean trust. He can be sociable without revealing much, and warm words often leave his real feelings untouched.

## An old house

Pheiron grew up on an ancient family estate. As a child he played hide-and-seek there with his older brother, Moleta, and was taught honorifics, praise, and formal etiquette. At twelve, his brother gave him the dagger he still carries.

He did not leave home to follow Moleta’s path. Theft struck him as useful and entertaining, and over a long elven life the street thief became an assassin. An old family crest and his brother’s dagger are among the few things he continues to carry.

## Boundaries

Pheiron assumes that strangers should be doubted. He may ignore another adult’s trouble and make an excuse when a friend asks for money. A hungry child is different; he will offer food. Bullying the weak is the act he finds hardest to tolerate.

He values freedom and avoids power when he can. In danger, the first person he thinks to protect is Shirul.

## The company

Pheiron met the Wayfarers at the celebration of Skamos’s arrival. He tried to steal something and was caught by Shirul, who was drinking milk and preparing for bed. A few clever sentences nearly talked her around. She answered with a serious lecture instead of a punishment, and he has called her “little knight” ever since.

In battle he works especially well with Flavilar. She breaks the line; he enters through the opening. His place in the company remains full of jokes, half-truths, and sudden risks taken for people he rarely admits he needs.`,
  },
  skamos: {
    title: "Skamos",
    summary:
      "A tiefling bard shaped by caravan roads, accustomed to observing from the edge until the company gave him a reason to stay.",
    aliases: ["Skamos"],
    facts: [
      { label: "Ancestry", value: "Tiefling" },
      { label: "Calling", value: "Bard · College of Valor" },
      { label: "Age", value: "About 37" },
      { label: "From", value: "Yûlash" },
    ],
    body: `## At a glance

Skamos spent much of his life at the edge of other people’s stories. He watched, listened, moved on, and learned not to make departure difficult. The habit is not indifference. Leaving simply became familiar.

Shirul kept treating him as though he already belonged. In time he stopped observing the Windreed Wayfarers from outside and began to take part.

## The caravan road

Skamos was born among the ruins of Yûlash and taken onto a caravan at about two years old. His childhood is a sequence of wagon wheels, draft animals, inns, markets, and temporary camps. The caravan taught him accents, goods, prices, and the art of judging a strange town quickly.

During the early Second Sundering, the caravan broke apart near Arabel. Skamos lost the closest thing he had to a home. He worked his way west over several years, taking escorts, debt work, and darker employment, until he reached Waterdeep and turned north along the Long Road.

By about 1491 DR he had reached Red Larch. There he met Shirul, Alberina, and Flavilar. The company held a feast when he joined; Pheiron’s attempted theft made it the night another traveler stayed as well.

## Temperament

Skamos is curious about stories, legends, useless questions, sunsets, and beautiful sounds. He has little respect for rules merely because they are old. He keeps promises even when they cost him, arrives late, forgets meals, and needs time alone after too many days among people.

He fears losing his freedom. He carries a badge from his brother, counts every coin, and answers most trouble with “It’s fine.” When he is truly angry, he stops speaking.

## The company

Asked which companion he would protect first, Skamos refused to rank them. Every member counted. Asked for the closest thing to happiness in his life, he named the family he had found in the Windreed Wayfarers.`,
  },
  ariel: {
    title: "Ariel",
    summary:
      "A young warlock raised on the street, direct in danger and slow to trust, newly standing at the edge of the company.",
    aliases: ["Ariel"],
    facts: [
      { label: "Ancestry", value: "Human" },
      { label: "Calling", value: "Warlock" },
      { label: "Age", value: "18" },
      { label: "From", value: "Emberford" },
    ],
    body: `## At a glance

Ariel is the newest of the Windreed Wayfarers and still keeps to its edge. He grew up on the street without a family or home he can trace. Theft, watchfulness, and solitary action kept him alive.

He wears black, keeps his hood low, and rarely explains himself before acting. When real trouble arrives, he is steady. A promise will be completed, a wound dealt with, and unfinished work remembered.

## The pact

A stranger hidden in darkness offered Ariel a pact one night. Violet-black light spread around him and drew back into his body. The bargain gave him the power to face enemies openly, especially through the direct force of eldritch blast.

The price remains visible. The pact darkened his skin as though it had burned him from within, and his blue-violet eyes sometimes shine in the dark. His patron still treats him as a piece on a board. Ariel accepts the usefulness of the power while looking for a way free.

## Street instincts

Ariel assumes that most people are unreliable. He can lie when it serves a purpose, bends rules to circumstance, and does not consider himself good. Even so, he finds it difficult to ignore genuine need. A hungry child will receive food, though Ariel is unlikely to say much about the gesture.

He values strength because it kept him alive. Beauty still catches his attention: a quiet road, a flower’s color, a good sound at dusk. He rarely points these things out.

## Joining the road

Shirul invited Ariel to the company. They come from the same region, and her habit of treating a stranger seriously reached him when another invitation might not have. He stayed.

He is not quick to trust the word “companion,” but his choices already place the Wayfarers before strangers. Shirul is the first person he would protect, the person he trusts most at his back, and the one he expects would notice first if he were hiding something.`,
  },
  merielle: {
    title: "Merielle",
    summary:
      "The village headman’s eldest daughter and Shirul’s older sister, a quiet, perceptive non-adventurer closely tied to Emberford.",
    aliases: ["Merielle"],
    facts: [
      { label: "Ancestry", value: "Human" },
      { label: "Place", value: "Non-adventurer" },
      { label: "Age", value: "26" },
      { label: "From", value: "Emberford" },
    ],
    body: `## At a glance

Merielle is the eldest daughter of Emberford’s headman and Shirul’s older sister. She is not an adventurer. Her life belongs more closely to the village, its household routines, and the journeys she makes to Neverwinter for care.

Her hearing deteriorated early. Shirul grew up accustomed to her quiet voice and to speaking through notes, expression, and patient attention.

## Family

Merielle helped care for Shirul when they were young. She played with her, comforted her, and remained one of the people Shirul watched most carefully. Whenever Merielle left by carriage for the city, Shirul stood at the village road until it disappeared.

Merielle also knows Alberina, which places the high elf inside the family’s ordinary life long before the Wayfarers took to the road.

## A companion who stayed home

The archive records Merielle among the company’s companions because her connection to Shirul and Emberford shapes more than a single journey. She belongs to the life the youngest Wayfarer left behind and still hopes to protect.`,
  },
  "oath-of-the-ancients": {
    title: "Oath of the Ancients",
    summary:
      "The paladin oath Shirul made while rescuing Flavilar in Neverwinter Wood, centered on preserving life, light, and hope.",
    aliases: ["Oath of the Ancients", "Ancients oath"],
    body: `## The oath

Around 1490 DR, Shirul and Alberina found an injured Flavilar in Neverwinter Wood. Shirul first chose not to abandon her and made a vow to protect life while the rescue was underway. The Miracle Light appeared afterward, stabilizing Flavilar’s injuries while a few nearby plants put out new shoots.

The danger, the vow’s exact wording, and the source of its power remain unsettled. Shirul believes Sune answered her promise. In her understanding, it binds her to protect life, light, and hope.

She does not read justice as a demand for easy execution. She reasons first when she can, leaves a path back when one remains, and still accepts that protection sometimes requires her to draw Branch and stand in the way.

## In play

In Dungeons & Dragons, the Oath of the Ancients is a paladin subclass associated with vitality, mercy, courage, and resistance to destructive magic. Shirul’s version of the oath is recorded through her own choices rather than through doctrine alone.`,
  },
  "miracle-light": {
    title: "The Miracle Light",
    summary:
      "A restrained miracle that followed Shirul’s vow, stabilizing Flavilar’s injuries and bringing a few new shoots from nearby plants.",
    aliases: ["Miracle Light", "the light"],
    body: `## What was seen

Around 1490 DR, Shirul and Alberina found an injured Flavilar in Neverwinter Wood. Shirul refused to leave her and made a vow to protect life during the rescue. The miracle came afterward and remained close to them: Flavilar’s injuries stabilized, and a few nearby plants put out new shoots.

## What remains uncertain

The danger that injured Flavilar, Shirul’s exact words, and the source of the power are not settled. Shirul regards the event as Sune’s answer, but the archive does not assign it to a particular deity or other source.`,
  },
  transfiguration: {
    title: "Alter Self",
    summary:
      "A second-level transmutation spell known by Alberina, able to reshape only the caster’s own body for a limited time.",
    aliases: ["Alter Self", "transfiguration"],
    body: `## The spell

Alter Self is a second-level transmutation spell known by Alberina. It changes the caster’s own body for a limited duration; it cannot be used to transform another person.

The spell can provide an aquatic adaptation, natural weapons, or a different appearance, depending on how it is cast.

## In the archive

Alter Self should not be confused with the enchanted choker used by Flavilar. The choker maintains a particular human appearance through an item’s magic, while Alter Self is a spell cast on oneself.`,
  },
  branch: {
    title: "Branch",
    summary:
      "Shirul’s nearly person-high two-handed sword, a treasured weapon whose lightness does not spare its young wielder the work of mastering it.",
    aliases: ["Branch", "the Branch"],
    body: `## The weapon

Branch is the greatsword Shirul has carried through most of her life as an adventurer. It is nearly as tall as she is and built for two hands.

The sword felt lighter than she expected the first time she tried to lift it, but her arms still could not control the swing. Practice, stubbornness, and faith eventually made the weapon usable.

## Form

The blade and guard use branching lines as a repeated motif. Etched patterns give the surface a history of handling and age without turning it into an ornamental court weapon.

## Meaning

When asked what no amount of money could buy from her, Shirul named two things: Branch and Lina. The answer places the sword among the small number of objects and people she understands as inseparable from home.`,
  },
  "flas-mishy-choker": {
    title: "Fla’s Mishy Choker",
    summary:
      "An enchanted silver choker from Evereska, casually renamed by Alberina and now usually worn by Flavilar in towns.",
    aliases: ["Fla’s Mishy Choker", "Traveler’s Choker"],
    body: `## Origin

Alberina’s family gave her an enchanted silver choker when she left Evereska. It was meant to help her conceal obvious elven features while traveling beyond the city.

The item received its odd present name only after Alberina lent it to Flavilar.

## Current use

Flavilar keeps the choker attuned in populated places. It gives her the fixed appearance of a black-haired, green-eyed human woman about two meters tall. It does not change her clothing, so she carries garments suited to that form.

The disguise reduces immediate alarm without asking Flavilar to treat her own body as something shameful.`,
  },
  emberford: {
    title: "Emberford",
    summary:
      "A misted village on the eastern edge of Neverwinter Wood, home to Shirul and the church of Sune where she chose her faith.",
    aliases: ["Emberford"],
    body: `## The village

Emberford stands near the eastern edge of Neverwinter Wood. It is a small settlement shaped by springs, reed-lined water, family ties, and the road toward Neverwinter.

Shirul was born in the headman’s household here. One branch of her mother’s family is halfling, leaving Shirul with one-eighth halfling ancestry. Her mother worships Sheela Peryroyl, and Shirul first encountered that faith at home. She later entered the village church of Sune, received much of her education there, and chose Sune for herself.

## Springs and reeds

Warm springs are part of ordinary village life. As a child, Shirul repeatedly treated a bathing pool as a swimming place and had to be retrieved by Alberina or Merielle.

The village’s water and reeds later contributed to the name carried by the Windreed Wayfarers.

## On the map

Emberford is an original location placed within the Forgotten Realms near Neverwinter Wood. Its position connects the village to Neverwinter while preserving the quiet, wooded setting of Shirul’s childhood.`,
  },
  neverwinter: {
    title: "Neverwinter",
    summary:
      "The warm northern city whose healers and temples make it a regular destination for Merielle’s care.",
    aliases: ["Neverwinter"],
    body: `## The city

Neverwinter is one of the major cities of the Sword Coast North, known for its unusually warm climate, temples, skilled healers, and position along the coast.

For the Windreed archive, its most personal connection is Merielle. Shirul’s older sister travels there for care, sometimes remaining in the city for extended periods.

## The road from Emberford

The journey between Emberford and Neverwinter is familiar to Shirul’s family. As a child, Shirul would watch Merielle’s carriage until it vanished from sight. The city therefore belongs to both the practical geography of the setting and Shirul’s fear of being left behind.`,
  },
  redlarch: {
    title: "Red Larch",
    summary:
      "A caravan town on the Long Road in the Dessarin Valley where the early travelers came together.",
    aliases: ["Red Larch", "Redlarch"],
    body: `## The waypoint

Red Larch is a caravan town on the Long Road in the Dessarin Valley. Its traffic, wagon yards, and markets make it a natural place for travelers arriving by different routes to cross paths.

## The company gathers

Around 1491 DR, Shirul and Alberina reached Red Larch with Flavilar after bringing her out of the wild. They met Skamos there after his long route west and north.

A feast marked Skamos’s arrival. Pheiron attempted a theft that night, Shirul caught him, and the encounter left one more traveler on the road with them.`,
  },
  "mere-kryptgarden": {
    title: "The Mere of Dead Men and Neverwinter Wood",
    summary:
      "The marsh where Flavilar was born and exiled, and the northern forest where Shirul and Alberina later rescued her.",
    aliases: ["Mere of Dead Men", "Neverwinter Wood"],
    body: `## The Mere

The Mere of Dead Men is a vast salt marsh along the Sword Coast, wrapped in fog, ruins, dangerous water, and old histories.

Inside the Windreed setting, a hidden black-dragon domain lies within its deeper reaches. Drowned structures, isolated ground, a dragon lair, and dependent communities formed the world of Flavilar’s early childhood.

## Exile

Around 1484–1485 DR, Flavilar’s memory was erased and she was cast into the outer marsh at the age of thirteen or fourteen. She later traveled north and spent her final three or four solitary years hidden in Neverwinter Wood.

In 1490 DR, when Flavilar was eighteen or nineteen, Shirul and Alberina found her injured in the forest and rescued her. Shirul first refused to abandon her and made a vow to protect life. A restrained miracle followed, stabilizing Flavilar’s injuries while a few nearby plants put out new shoots. The danger, the vow’s wording, and the source of the power remain unsettled.`,
  },
  evereska: {
    title: "Evereska",
    summary:
      "A secluded, magically protected high-elven city-state and the home Alberina left in search of the silver dragon in her dreams.",
    aliases: ["Evereska"],
    body: `## The hidden city

Evereska is a guarded high-elven city-state in the western interior of Faerûn, protected by terrain, secrecy, and magic.

Alberina was born there around 1387 DR. Her family was prosperous, her education extensive, and her early life ordered with a care she eventually found confining.

## Alberina’s departure

In 1475 DR, after the silver dragon returned to her dreams, Alberina left Evereska. She did not break with her family. They prepared equipment for the road, including the enchanted silver choker later lent to Flavilar.

Her seven years of travel began here and ended near Emberford, where a pause beside the forest became a decade of companionship.`,
  },
  "alberina-biography": {
    title: "Alberina · A Life Beyond the Pages",
    summary:
      "From a sheltered childhood in Evereska to the long road, Emberford, and the family Alberina chose without announcing it.",
    aliases: ["Alberina biography", "A Life Beyond the Pages"],
    body: `## I · Evereska

Alberina was born around 1387 DR into a prosperous high-elven household. Books, magic, and careful instruction filled her early life. The recurring dream of a silver dragon did not fit any answer her education could supply.

## II · The road

In 1475 DR she left Evereska without severing ties to her family. For seven years she followed settled routes north, learning the difference between a world described in books and one that changed around the traveler.

## III · Emberford

Alberina stopped near Emberford in 1482 DR as the Second Sundering unsettled roads and towns. She had grown tired of travel. Shirul was about five. What began as a pause became eight years beside the village and a place in the child’s family life.

## IV · The Wayfarers

In 1490 DR, Alberina accompanied thirteen-year-old Shirul into Neverwinter Wood. They found an injured Flavilar there. Shirul refused to leave her and made a vow to protect life while they tried to save her. A restrained miracle followed, stabilizing Flavilar’s injuries while a few nearby plants put out new shoots. The danger, the vow’s exact words, and the source of the power remain unsettled.

Afterward Shirul chose to leave Emberford, and Alberina went with her. The silver dragon remained an unanswered question, but it no longer stood alone as the reason for the journey.

By 1492 DR, Alberina had spent two years on the road with Shirul and the company that formed around them. She rarely named that bond aloud. She did not need to.`,
  },
  timeline: {
    title: "Company Timeline",
    summary:
      "The principal events of the Wayfarers’ lives and the order in which their separate roads became one.",
    aliases: ["Company Timeline", "1492 DR"],
    body: `## Before the company

- **c. 1361 DR** · Pheiron is born.
- **c. 1387 DR** · Alberina is born in Evereska.
- **c. 1455 DR** · Skamos is born among the ruins of Yûlash.
- **1475 DR** · Alberina leaves Evereska.
- **c. 1474 DR** · Ariel is born.
- **1475–1481 DR** · Alberina travels north along settled routes.

## Emberford and the marsh

- **1482 DR** · Alberina settles near Emberford and begins to care for the young Shirul.
- **c. 1484–1485 DR** · Flavilar’s memory is erased and she is cast into the outer Mere of Dead Men.
- **After c. 1484–1485 DR** · Flavilar travels north and spends her final three or four solitary years hidden in Neverwinter Wood.
- **c. 1490 DR** · Shirul and Alberina find the injured, eighteen- or nineteen-year-old Flavilar in Neverwinter Wood. Shirul refuses to abandon her and makes a vow to protect life. A local miracle then stabilizes Flavilar’s injuries and brings out a few nearby shoots.

## The road joins

- **c. 1491 DR** · Shirul, Alberina, and Flavilar reach Red Larch and meet Skamos.
- **1491 DR** · A feast marks Skamos’s arrival. Pheiron’s attempted theft introduces him to the group.
- **1492 DR** · Ariel joins after Shirul invites him. Six formal members now travel as the Windreed Wayfarers.`,
  },
  relationships: {
    title: "Relationship Ledger",
    summary:
      "Confirmed ties among the six core members, Merielle, and the places and objects that bind their histories.",
    aliases: ["Relationship Ledger", "relationships"],
    body: `## The company

- Shirul, Alberina, Flavilar, Pheiron, Skamos, and Ariel are the six formal members of the Windreed Wayfarers.

## Central ties

- **Alberina → Shirul** · Companion and guide since Shirul was about five.
- **Shirul → Alberina** · Family, dependence, and the wish to become strong enough to protect her in return.
- **Shirul ↔ Flavilar** · Their bond begins with the 1490 DR rescue in Neverwinter Wood; they later become partners on the front line and fellow students away from it.
- **Alberina → Flavilar** · Teacher, interpreter, and the lender of Fla’s Mishy Choker.
- **Shirul → Pheiron** · Repeated thefts, repeated lectures, and the name “little knight.”
- **Shirul → Skamos** · The invitation that kept an observer inside the company.
- **Flavilar → Pheiron** · A practiced battlefield opening for the assassin’s strike.
- **Shirul → Ariel** · A fellow child of Emberford and the person who invited him in.
- **Ariel → Shirul** · The first person he would protect and the companion he trusts most.

## Family and older ties

- **Merielle → Shirul** · Older sister.
- **Merielle ↔ Edric** · Sister and brother.
- **Merielle ↔ Alberina** · Known to one another through Emberford.

## Places and objects

- Shirul first vowed not to abandon Flavilar; the Miracle Light followed during the rescue. Shirul also carries Branch.
- Alberina left Evereska and later entrusted Fla’s Mishy Choker to Flavilar.
- Flavilar’s lost years began in the Mere of Dead Men and ended in Neverwinter Wood.`,
  },
};

function extractHeadings(markdown: string): ArchiveHeading[] {
  return markdown.split("\n").flatMap((line) => {
    const match = /^(##|###)\s+(.+)$/.exec(line.trim());
    if (!match) return [];
    const title = match[2].replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
    return [{
      id: headingId(title),
      level: match[1].length as 2 | 3,
      title,
    }];
  });
}

function markdownToPlainText(markdown: string) {
  return markdown
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_`>#|\-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export const englishArchiveManifest: EnglishArchiveEntry[] = archiveManifest.map((entry) => {
  const copy = englishCopy[entry.slug];
  if (!copy) throw new Error(`Missing English archive copy for ${entry.slug}`);
  return {
    ...entry,
    title: copy.title,
    englishTitle: undefined,
    aliases: copy.aliases ?? [copy.title],
    summary: copy.summary,
    monogram: copy.title.slice(0, 1).toUpperCase(),
    facts: copy.facts,
    personalPage: undefined,
    body: copy.body,
    headings: extractHeadings(copy.body),
    plainText: markdownToPlainText(copy.body),
    originalTitle: entry.title,
  };
});

export const englishTeamOverview = `## A company made on the road

The Windreed Wayfarers did not begin with a charter, a patron, or a shared grand design. Their routes crossed, then kept crossing, until six people from very different lives were traveling as one company.

Shirul named the bond first. Alberina brought learning and judgment. Flavilar held the front line while rebuilding a life among other people. Pheiron supplied speed, risk, and polished misdirection. Skamos carried the instincts of a caravan road and the music of a bard. Ariel arrived last, still watchful, and chose for the moment not to leave.

## The name

“Windreed” recalls Emberford’s water and reeds as well as the company’s habit of moving with the road. “Wayfarers” suits them better than any military title. They are people in transit who became responsible for one another before anyone formally declared it.

## 1492 DR

The public archive records the company in 1492 DR on the Sword Coast. It collects their lives, places, possessions, encounters, and the chronology that connects them.`;

export function englishArchiveHref(entry: Pick<ArchiveManifestEntry, "category" | "slug">) {
  return `/en/archive/${entry.category}/${entry.slug}`;
}

export function getEnglishArchiveEntry(category: string, slug: string) {
  return englishArchiveManifest.find(
    (entry) => entry.category === category && entry.slug === slug,
  );
}

export function getEnglishSearchIndex() {
  return englishArchiveManifest.map((entry) => ({
    title: entry.title,
    aliases: entry.aliases,
    section: entry.section,
    summary: entry.summary,
    href: englishArchiveHref(entry),
    text: entry.plainText,
  }));
}
