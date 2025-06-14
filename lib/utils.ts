import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Australian states
const australianStates = ["NSW", "VIC", "QLD", "SA", "WA", "TAS", "NT", "ACT"]

// Random name generator
const firstNames = [
  "James",
  "Robert",
  "John",
  "Michael",
  "David",
  "William",
  "Richard",
  "Joseph",
  "Thomas",
  "Charles",
  "Mary",
  "Patricia",
  "Jennifer",
  "Linda",
  "Elizabeth",
  "Barbara",
  "Susan",
  "Jessica",
  "Sarah",
  "Karen",
]

const lastNames = [
  "Smith",
  "Johnson",
  "Williams",
  "Brown",
  "Jones",
  "Miller",
  "Davis",
  "Garcia",
  "Rodriguez",
  "Wilson",
  "Martinez",
  "Anderson",
  "Taylor",
  "Thomas",
  "Hernandez",
  "Moore",
  "Martin",
  "Jackson",
  "Thompson",
  "White",
]

// Random street names
const streetNames = [
  "High",
  "Main",
  "Church",
  "Park",
  "Mill",
  "Station",
  "Victoria",
  "Green",
  "Manor",
  "Kings",
  "Queens",
  "New",
  "George",
  "York",
  "Castle",
  "North",
  "South",
  "East",
  "West",
  "School",
]

const streetTypes = ["Street", "Road", "Avenue", "Lane", "Drive", "Boulevard", "Way", "Place", "Court", "Terrace"]

// Random city names (Australian cities)
const cities = [
  "Sydney",
  "Melbourne",
  "Brisbane",
  "Perth",
  "Adelaide",
  "Gold Coast",
  "Newcastle",
  "Canberra",
  "Wollongong",
  "Hobart",
  "Geelong",
  "Townsville",
  "Cairns",
  "Darwin",
  "Toowoomba",
  "Ballarat",
]

// Random postcode generator (Australian format)
function generateRandomPostcode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString()
}

// Random phone number generator (Australian format)
export function generateRandomPhone(): string {
  const prefix = "04"
  const remainingDigits = Array.from({ length: 8 }, () => Math.floor(Math.random() * 10)).join("")
  return `${prefix}${remainingDigits}`
}

// Generate a random address
export function generateRandomAddress(preferredState?: string) {
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)]
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)]
  const streetNumber = Math.floor(1 + Math.random() * 200)
  const streetName = streetNames[Math.floor(Math.random() * streetNames.length)]
  const streetType = streetTypes[Math.floor(Math.random() * streetTypes.length)]
  const city = cities[Math.floor(Math.random() * cities.length)]
  const state = preferredState || australianStates[Math.floor(Math.random() * australianStates.length)]
  const postcode = generateRandomPostcode()

  return {
    fullName: `${firstName} ${lastName}`,
    street: `${streetNumber} ${streetName} ${streetType}`,
    cityStatePostcode: `${city}, ${state} ${postcode}`,
  }
}
