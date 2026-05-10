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
    title: "The Heavy Winter Coat",
    question: "When it gets freezing outside, what kind of coat are you putting on?",
    options: [
      { text: "A long, incredibly soft coat that flows when you walk and looks expensive but relaxed.", vector: [0.8, 0.4, 0.9, 0.1] },
      { text: "A massive, heavy, oversized hoodie.", vector: [0.0, 0.1, 0.2, 0.9] },
      { text: "A sharp, stiff, weather-proof jacket that looks like you own a business or a yacht.", vector: [0.9, 0.3, 0.1, 0.0] },
      { text: "A simple, neat zip-up jacket or a classic hunting coat.", vector: [0.4, 0.9, 0.3, 0.1] }
    ]
  },
  {
    id: 2,
    title: "Pant Shape & Fit",
    question: "How do your pants fit your legs?",
    options: [
      { text: "High-waisted dress pants that rest perfectly right at the top of your shoe.", vector: [0.9, 0.8, 0.6, 0.0] },
      { text: "Very loose, flowy pants that look light, breezy, and relaxed.", vector: [0.3, 0.1, 0.9, 0.3] },
      { text: "Huge, baggy pants that drag, bunch up, and cover your sneakers entirely.", vector: [0.0, 0.0, 0.2, 0.9] },
      { text: "Standard, neat khaki pants that aren't too tight or too loose.", vector: [0.5, 0.9, 0.2, 0.1] }
    ]
  },
  {
    id: 3,
    title: "Sweaters",
    question: "What is your go-to sweater?",
    options: [
      { text: "The softest, thinnest premium sweater you can find, like a turtleneck.", vector: [1.0, 0.4, 0.5, 0.0] },
      { text: "A thick, slightly rough wool sweater that looks classic and outdoorsy.", vector: [0.3, 1.0, 0.4, 0.0] },
      { text: "A fuzzy, oversized, slightly messy-looking button-up sweater.", vector: [0.1, 0.2, 0.9, 0.7] },
      { text: "A thick, heavy, faded cotton sweatshirt.", vector: [0.0, 0.0, 0.1, 0.9] }
    ]
  },
  {
    id: 4,
    title: "Hard Shoes",
    question: "If you can't wear sneakers, what shoes are you wearing?",
    options: [
      { text: "Classic, simple slip-on leather dress shoes.", vector: [0.7, 1.0, 0.2, 0.0] },
      { text: "Extremely smooth, sleek leather lace-up dress shoes that look flawless.", vector: [1.0, 0.3, 0.0, 0.0] },
      { text: "I refuse to wear dress shoes. I wear big, bulky athletic sneakers.", vector: [0.0, 0.0, 0.2, 1.0] },
      { text: "Heavy, thick-soled black leather shoes that look slightly aggressive.", vector: [0.1, 0.1, 0.8, 0.7] }
    ]
  },
  {
    id: 5,
    title: "THE AUDIT: The Basic T-Shirt",
    question: "Let's check your absolute basics. What kind of plain t-shirt do you wear?",
    options: [
      { text: "A heavy, thick t-shirt that sits wide and boxy on your body.", vector: [0.1, 0.2, 0.5, 0.9] },
      { text: "Whatever comes in a cheap 3-pack. It’s tight on the arms but loose and wavy at the waist.", vector: [0.0, 0.0, 0.0, 0.0] },
      { text: "A silky-smooth, perfectly fitting t-shirt that looks rich and doesn't lose its shape.", vector: [0.9, 0.5, 0.3, 0.0] },
      { text: "A vintage-style, slightly thin, faded t-shirt that hangs loosely.", vector: [0.2, 0.1, 0.9, 0.4] }
    ]
  },
  {
    id: 6,
    title: "Everyday Shirts",
    question: "When you wear a shirt with buttons, what is your style?",
    options: [
      { text: "A standard, slightly wrinkly cotton button-down shirt.", vector: [0.4, 1.0, 0.5, 0.0] },
      { text: "A thin, breezy shirt with a flat collar that you leave unbuttoned at the top to show some chest.", vector: [0.3, 0.1, 0.9, 0.4] },
      { text: "A stiff, perfectly ironed, crisp business shirt.", vector: [0.9, 0.2, 0.0, 0.0] },
      { text: "A thick, rugged plaid shirt.", vector: [0.1, 0.3, 0.2, 0.8] }
    ]
  },
  {
    id: 7,
    title: "THE AUDIT: Logos and Designs",
    question: "Do you wear clothes with pictures or words on them?",
    options: [
      { text: "Faded, obscure band or art designs that look genuinely old.", vector: [0.0, 0.1, 0.8, 0.7] },
      { text: "Huge, thick letters or massive designs on the back of hoodies.", vector: [0.0, 0.0, 0.1, 1.0] },
      { text: "Zero graphics. I only wear solid colors or classic woven patterns like plaid.", vector: [0.9, 0.7, 0.4, 0.0] },
      { text: "Huge, recognizable logos from the mall so people know exactly what brand I bought.", vector: [0.0, 0.0, 0.0, 0.0] }
    ]
  },
  {
    id: 8,
    title: "Your Colors",
    question: "If you looked in your closet, what colors would you see the most?",
    options: [
      { text: "Navy blue, cream, beige, and light grey.", vector: [1.0, 0.6, 0.3, 0.0] },
      { text: "Strictly black, white, and dark grey.", vector: [0.4, 0.0, 0.5, 0.9] },
      { text: "Fall colors like olive green, rusty orange, and mustard yellow.", vector: [0.4, 1.0, 0.6, 0.1] },
      { text: "Soft, faded colors like light pink, baby blue, and gentle brown.", vector: [0.2, 0.2, 1.0, 0.2] }
    ]
  },
  {
    id: 9,
    title: "Summer Heat",
    question: "What do you wear when it is scorching hot outside?",
    options: [
      { text: "Super light, breathable fabrics that wrinkle naturally and look wealthy.", vector: [0.9, 0.7, 0.6, 0.0] },
      { text: "Heavy basketball shorts and a thick t-shirt.", vector: [0.0, 0.0, 0.1, 0.9] },
      { text: "Very loose, flowy short-sleeve shirts and extremely wide, light pants.", vector: [0.1, 0.0, 1.0, 0.4] },
      { text: "Plaid short-sleeve button-downs and neat, lightweight shorts.", vector: [0.3, 1.0, 0.2, 0.0] }
    ]
  },
  {
    id: 10,
    title: "The Ultimate Goal",
    question: "Why do you care about your style? What are you trying to achieve?",
    options: [
      { text: "To wear extremely high-quality, quiet clothes that only other fashion experts notice.", vector: [0.8, 0.6, 0.6, 0.8] },
      { text: "To wear oversized, rare clothing that gets a lot of attention on the internet.", vector: [0.0, 0.0, 0.5, 1.0] },
      { text: "To look effortlessly romantic, like an artist who just threw something on but still looks perfect.", vector: [0.2, 0.4, 1.0, 0.2] },
      { text: "To look powerful, wealthy, and classic, ignoring internet trends entirely.", vector: [1.0, 0.5, 0.1, 0.0] }
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