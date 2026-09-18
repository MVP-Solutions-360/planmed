export interface Clinic {
  id: number;
  name: string;
  logo: string;
  website?: string;
}

export const clinics: Clinic[] = [
  {
    id: 1,
    name: "CEP",
    logo: "/images/allies/CEP.png",
    website: "#"
  },
  {
    id: 2,
    name: "Laser",
    logo: "/images/allies/Laser.png",
    website: "#"
  },
  {
    id: 3,
    name: "Multiestética",
    logo: "/images/allies/multiestetica.png",
    website: "#"
  },
  {
    id: 4,
    name: "Resurlaser",
    logo: "/images/allies/resurlaser.png",
    website: "#"
  },
  {
    id: 5,
    name: "Telesalud",
    logo: "/images/allies/telesalud.png",
    website: "#"
  }
];
