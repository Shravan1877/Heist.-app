/**
 * HEIST. Vector Calculator logic
 * Pillars: [Old Money (OM), Ivy (IV), Soft Boy (SB), Streetwear (SW)]
 */

export type StyleVector = [number, number, number, number];

export interface QuestionOption {
  text: string;
  vector: StyleVector;
}

export interface Question {
  id: number;
  title: string;
  question: string;
  options: QuestionOption[];
}

export const QUESTIONS: Question[] = [
  {
    id: 1,
    title: "Winter Coats",
    question: "What kind of heavy coat are you wearing when it gets cold?",
    options: [
      { text: "A soft, flowing wool or cashmere overcoat with relaxed shoulders.", vector: [0.8, 0.4, 0.9, 0.1] },
      { text: "A thick, heavy cotton hoodie with a boxy fit and dropped shoulders.", vector: [0.0, 0.1, 0.2, 0.9] },
      { text: "A razor-sharp, weather-resistant luxury wool car coat that looks like it belongs in a boardroom.", vector: [0.9, 0.3, 0.1, 0.0] },
      { text: "A classic wax-coated jacket (like a Barbour) or a simple cotton zip-up.", vector: [0.4, 0.9, 0.3, 0.1] }
    ]
  },
  {
    id: 2,
    title: "Pants & Fit",
    question: "How do your pants fit and fall?",
    options: [
      { text: "High-waisted, formal wool dress pants with pleats, cut to just touch the top of the shoe.", vector: [0.9, 0.8, 0.6, 0.0] },
      { text: "Flowy, relaxed pants made of soft material, fitting loose on the thighs and slightly short at the ankle.", vector: [0.3, 0.1, 0.9, 0.3] },
      { text: "Very wide, heavy denim that aggressively stacks and bunches up over a chunky sneaker.", vector: [0.0, 0.0, 0.2, 0.9] },
      { text: "Sturdy cotton chinos (khakis) with a slight taper, fitting like a classic prep-school uniform.", vector: [0.5, 0.9, 0.2, 0.1] }
    ]
  },
  {
    id: 3,
    title: "Sweaters",
    question: "What kind of sweater are you throwing on?",
    options: [
      { text: "A premium, ultra-soft cashmere turtleneck.", vector: [1.0, 0.4, 0.5, 0.0] },
      { text: "A heavily textured, classic wool crewneck sweater that looks a bit rugged.", vector: [0.3, 1.0, 0.4, 0.0] },
      { text: "A fuzzy, slightly distressed mohair cardigan with an oversized, slouchy fit.", vector: [0.1, 0.2, 0.9, 0.7] },
      { text: "A heavy, thick cotton sweatshirt that looks naturally faded or washed.", vector: [0.0, 0.0, 0.1, 0.9] }
    ]
  },
  {
    id: 4,
    title: "Dress Shoes",
    question: "If you have to wear hard-bottom shoes, what are you picking?",
    options: [
      { text: "High-end, classic leather penny loafers that are built to last a lifetime.", vector: [0.7, 1.0, 0.2, 0.0] },
      { text: "Custom-made, incredibly sleek leather dress shoes with no visible seams.", vector: [1.0, 0.3, 0.0, 0.0] },
      { text: "I don't wear dress shoes. I wear bulky, retro-style running shoes with thick rubber soles.", vector: [0.0, 0.2, 1.0, 0.0] },
      { text: "Chunky, square-toed leather derby shoes, maybe with heavy metal hardware.", vector: [0.1, 0.1, 0.8, 0.7] }
    ]
  },
  {
    id: 5,
    title: "THE AUDIT: T-Shirts",
    question: "Let's check the basics. What kind of t-shirt are you wearing?",
    options: [
      { text: "A thick, heavyweight cotton tee with a boxy shape and a tight, high collar.", vector: [0.1, 0.2, 0.5, 0.9] },
      { text: "Whatever comes in a 3-pack. It’s tight on the arms but loose and wavy at the bottom.", vector: [0.0, 0.0, 0.0, 0.0] },
      { text: "A silky, high-quality cotton tee that drapes perfectly and looks expensive.", vector: [0.9, 0.5, 0.3, 0.0] },
      { text: "A vintage-washed, slightly thin cotton tee that fits loose and relaxed.", vector: [0.2, 0.1, 0.9, 0.4] }
    ]
  },
  {
    id: 6,
    title: "Button-Down Shirts",
    question: "When wearing a collared shirt, what's the style?",
    options: [
      { text: "A classic Oxford button-down shirt, worn a bit casually with a naturally curving collar.", vector: [0.4, 1.0, 0.5, 0.0] },
      { text: "A silky, open-collar 'camp' shirt that breathes and flows.", vector: [0.3, 0.1, 0.9, 0.4] },
      { text: "A crisp, stiff-collared dress shirt made of premium cotton, usually worn with a suit.", vector: [0.9, 0.2, 0.0, 0.0] },
      { text: "A thick, rugged flannel shirt, maybe with a slightly frayed bottom edge.", vector: [0.1, 0.3, 0.2, 0.8] }
    ]
  },
  {
    id: 7,
    title: "Jeans",
    question: "If you wear jeans, what do they look like?",
    options: [
      { text: "I don't wear jeans. Only dress pants, linen, or tailored trousers.", vector: [0.9, 0.4, 0.6, 0.0] },
      { text: "Stiff, raw, dark denim that requires months of everyday wear to break in.", vector: [0.3, 0.8, 0.1, 0.7] },
      { text: "Extremely wide, washed-out jeans with frayed bottoms that drag on the floor.", vector: [0.0, 0.0, 0.4, 0.9] },
      { text: "Light blue, straight-leg jeans, cut just short enough to show off my shoes/ankles.", vector: [0.1, 0.2, 0.9, 0.3] }
    ]
  },
  {
    id: 8,
    title: "Jackets & Blazers",
    question: "What shape does your jacket give your shoulders?",
    options: [
      { text: "A tailored suit jacket with completely soft, unpadded shoulders for a relaxed elegance.", vector: [0.9, 0.3, 0.5, 0.0] },
      { text: "An oversized jacket with massively padded, dropped shoulders that swallow your frame.", vector: [0.0, 0.0, 0.7, 0.9] },
      { text: "A classic, slightly boxy 'Ivy league' style sport coat.", vector: [0.5, 1.0, 0.1, 0.0] },
      { text: "A cropped bomber or flight jacket that ends right at the waistline.", vector: [0.2, 0.1, 0.6, 0.9] }
    ]
  },
  {
    id: 9,
    title: "Winter Layering",
    question: "How do you stack your clothes when it's freezing?",
    options: [
      { text: "A patterned sweater vest over a wrinkled button-down, topped with a heavy tweed jacket.", vector: [0.4, 1.0, 0.4, 0.0] },
      { text: "A fine cashmere zip-up sweater layered neatly under a flawless camel hair overcoat.", vector: [0.9, 0.6, 0.2, 0.0] },
      { text: "A thick hoodie worn under a short, puffy jacket to create a top-heavy look.", vector: [0.0, 0.0, 0.3, 1.0] },
      { text: "A flowing shirt left unbuttoned over a tank top, covered by a fuzzy, oversized cardigan.", vector: [0.2, 0.1, 1.0, 0.2] }
    ]
  },
  {
    id: 10,
    title: "Jewelry & Accessories",
    question: "What metals are you wearing?",
    options: [
      { text: "Thick, chunky silver rings and a heavy chain necklace.", vector: [0.0, 0.0, 0.4, 0.9] },
      { text: "A small, understated vintage gold dress watch on a dark leather strap.", vector: [1.0, 0.6, 0.4, 0.0] },
      { text: "A delicate pearl necklace and several thin, subtle silver rings.", vector: [0.1, 0.1, 1.0, 0.3] },
      { text: "A simple gold pinky ring and a sturdy canvas tote bag.", vector: [0.3, 0.8, 0.7, 0.1] }
    ]
  },
  {
    id: 11,
    title: "THE AUDIT: Graphics",
    question: "Do you wear clothes with words or pictures on them?",
    options: [
      { text: "Faded, obscure vintage band tees that look genuinely old and worn out.", vector: [0.0, 0.1, 0.8, 0.7] },
      { text: "Thick, high-quality puff-print graphics or massive designs on the back of heavy hoodies.", vector: [0.0, 0.0, 0.1, 1.0] },
      { text: "No graphics at all. I only wear solid colors or classic woven patterns (like houndstooth or plaid).", vector: [0.9, 0.7, 0.4, 0.0] },
      { text: "Huge, recognizable logos from fast-fashion mall brands so people know what brand I bought.", vector: [0.0, 0.0, 0.0, 0.0] }
    ]
  },
  {
    id: 12,
    title: "Colors",
    question: "What are the main colors in your closet?",
    options: [
      { text: "Navy, cream, beige, and light grey. Subtle and rich.", vector: [1.0, 0.6, 0.3, 0.0] },
      { text: "Strictly black, white, and dark charcoal. Sharp and edgy.", vector: [0.4, 0.0, 0.5, 0.9] },
      { text: "Autumn tones: olive green, rust orange, and mustard yellow.", vector: [0.4, 1.0, 0.6, 0.1] },
      { text: "Soft, dusty pastels: faded pink, light blue, and gentle browns.", vector: [0.2, 0.2, 1.0, 0.2] }
    ]
  },
  {
    id: 13,
    title: "Pant Length",
    question: "Where do your pants end?",
    options: [
      { text: "The 'puddle.' My pants are so long and wide they bunch up heavily on the floor.", vector: [0.0, 0.0, 0.7, 0.9] },
      { text: "The 'no break.' My pants end perfectly right above my shoe to show off my socks or bare ankles.", vector: [0.6, 0.9, 0.4, 0.0] },
      { text: "Aggressively short (cropped) to highlight a chunky boot or heavy shoe.", vector: [0.1, 0.2, 0.9, 0.5] },
      { text: "A classic, slight fold where the pant leg rests gently on top of my shoe.", vector: [0.8, 0.7, 0.1, 0.0] }
    ]
  },
  {
    id: 14,
    title: "Summer Heat",
    question: "What do you wear when it's 90°F out?",
    options: [
      { text: "100% linen. I let it wrinkle naturally because it looks wealthy and relaxed.", vector: [0.9, 0.7, 0.6, 0.0] },
      { text: "Heavy mesh basketball shorts and a thick, boxy t-shirt.", vector: [0.0, 0.0, 0.1, 0.9] },
      { text: "Short, breezy shirts and incredibly wide, lightweight, flowy pants.", vector: [0.1, 0.0, 1.0, 0.4] },
      { text: "Classic plaid short-sleeve button-downs and textured lightweight pants.", vector: [0.3, 1.0, 0.2, 0.0] }
    ]
  },
  {
    id: 15,
    title: "Belts",
    question: "How do you hold your pants up?",
    options: [
      { text: "No belts. My dress pants have built-in side adjusters for a cleaner look.", vector: [1.0, 0.3, 0.5, 0.0] },
      { text: "A woven leather or canvas belt that perfectly matches the color of my shoes.", vector: [0.4, 1.0, 0.3, 0.0] },
      { text: "A thin, slightly beat-up leather belt with a Western buckle, worn loosely.", vector: [0.1, 0.2, 0.9, 0.4] },
      { text: "A tactical, heavy-duty belt with a metal seatbelt-style buckle.", vector: [0.0, 0.0, 0.0, 0.9] }
    ]
  },
  {
    id: 16,
    title: "Rain/Snow Gear",
    question: "What do you wear in a storm?",
    options: [
      { text: "A highly technical, waterproof GORE-TEX jacket with hidden zippers and a futuristic look.", vector: [0.0, 0.0, 0.2, 1.0] },
      { text: "A massive, oversized trench coat that dramatically sweeps around my ankles in the wind.", vector: [0.4, 0.2, 0.9, 0.7] },
      { text: "A luxurious, double-breasted wool overcoat that looks like it belongs to a CEO.", vector: [1.0, 0.4, 0.3, 0.0] },
      { text: "A classic wool duffle coat with wooden toggles, roomy enough for thick sweaters.", vector: [0.4, 1.0, 0.2, 0.1] }
    ]
  },
  {
    id: 17,
    title: "THE AUDIT: Sneakers",
    question: "What kind of everyday sneakers do you wear?",
    options: [
      { text: "Minimalist, unbranded white leather sneakers. Simple and clean.", vector: [0.7, 0.6, 0.5, 0.2] },
      { text: "Rare, highly specific designer running shoes that look slightly alien or futuristic.", vector: [0.0, 0.0, 0.4, 0.9] },
      { text: "The exact same creased white Air Force 1s or Jordans everyone else at the mall is wearing.", vector: [0.0, 0.0, 0.0, 0.0] },
      { text: "Beat-up canvas deck shoes or heavily worn Converse high-tops.", vector: [0.3, 0.9, 0.6, 0.4] }
    ]
  },
  {
    id: 18,
    title: "Cologne/Fragrance",
    question: "How do you smell?",
    options: [
      { text: "A subtle scent that smells close to natural skin, only noticeable when someone hugs me.", vector: [0.4, 0.2, 0.9, 0.5] },
      { text: "Complex, heavy scents like leather or wood. Projects quiet power and wealth.", vector: [1.0, 0.3, 0.4, 0.3] },
      { text: "Something incredibly loud and sweet that I bought because a TikToker told me to.", vector: [0.0, 0.0, 0.0, 0.0] },
      { text: "A crisp, clean, traditional barbershop scent. Very classic and manly.", vector: [0.8, 1.0, 0.2, 0.0] }
    ]
  },
  {
    id: 19,
    title: "Mixing Textures",
    question: "How do you pair different fabrics together?",
    options: [
      { text: "Smooth luxury wool paired with a crisp silk tie and a stiff dress shirt.", vector: [1.0, 0.5, 0.0, 0.0] },
      { text: "Thick corduroy worn over a fuzzy sweater, paired with rough suede shoes.", vector: [0.4, 1.0, 0.5, 0.1] },
      { text: "Shiny nylon paired with matte technical fabrics. Very synthetic, sporty, and modern.", vector: [0.0, 0.0, 0.0, 0.9] },
      { text: "Fuzzy, soft sweaters layered over smooth, flowy shirts, grounded by scuffed leather shoes.", vector: [0.2, 0.1, 1.0, 0.5] }
    ]
  },
  {
    id: 20,
    title: "The Ultimate Goal",
    question: "Why do you care about any of this? What is the point of your wardrobe?",
    options: [
      { text: "To wear extremely high-quality, subtle clothes that only other fashion experts recognize.", vector: [0.8, 0.6, 0.6, 0.8] },
      { text: "To push boundaries with exaggerated, massive fits and rare, highly sought-after streetwear.", vector: [0.0, 0.0, 0.5, 1.0] },
      { text: "To look effortlessly romantic and slightly messy, as if I care more about art than clothes.", vector: [0.2, 0.4, 1.0, 0.2] },
      { text: "To silently command a room with timeless, perfectly tailored clothes that ignore trends entirely.", vector: [1.0, 0.5, 0.1, 0.0] }
    ]
  }
];

export function calculateVector(answers: number[]): StyleVector {
  const result: StyleVector = [0, 0, 0, 0];
  
  answers.forEach((optionIndex, qIndex) => {
    const vector = QUESTIONS[qIndex].options[optionIndex].vector;
    result[0] += vector[0];
    result[1] += vector[1];
    result[2] += vector[2];
    result[3] += vector[3];
  });
  
  // Normalization
  const sum = result[0] + result[1] + result[2] + result[3];
  if (sum === 0) return [0.25, 0.25, 0.25, 0.25];
  
  return result.map(v => Number((v / sum).toFixed(4))) as StyleVector;
}

export function getAestheticIdentity(vector: StyleVector) {
  const [om, iv, sb, sw] = vector;
  
  const identities = [
    { name: "Urban Romantic", primary: "Soft Boy", p: sb, secondary: "Ivy", s: iv },
    { name: "Soft Minimalism", primary: "Old Money", p: om, secondary: "Soft Boy", s: sb },
    { name: "Heritage Classic", primary: "Old Money", p: om, secondary: "Ivy", s: iv },
    { name: "Preppy Street", primary: "Ivy", p: iv, secondary: "Streetwear", s: sw },
    { name: "Luxe Street", primary: "Old Money", p: om, secondary: "Streetwear", s: sw }
  ];
  
  return identities.sort((a, b) => (b.p + b.s) - (a.p + a.s))[0];
}
