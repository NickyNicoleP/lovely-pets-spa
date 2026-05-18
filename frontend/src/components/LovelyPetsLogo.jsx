export const LovelyPetsLogo = ({ size = "sm", variant = "full" }) => {
  const sizeClass = {
    sm: "w-12 h-12",
    md: "w-16 h-16",
    lg: "w-20 h-20",
    xl: "w-24 h-24",
  }[size];

  return (
    <svg
      viewBox="0 0 200 240"
      className={`${sizeClass} inline-block`}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Círculo decorativo exterior */}
      <circle
        cx="100"
        cy="110"
        r="95"
        fill="none"
        stroke="#ec4899"
        strokeWidth="4"
      />

      {/* Semicírculo decorativo superior */}
      <path
        d="M 20 110 A 80 80 0 0 1 180 110"
        fill="none"
        stroke="#ec4899"
        strokeWidth="4"
      />

      {/* Semicírculo decorativo inferior */}
      <path
        d="M 20 110 A 80 80 0 0 0 180 110"
        fill="none"
        stroke="#ec4899"
        strokeWidth="4"
      />

      {/* Perro (izquierda) */}
      <g>
        {/* Orejas */}
        <ellipse cx="55" cy="50" rx="8" ry="15" fill="#ec4899" transform="rotate(-30 55 50)" />
        <ellipse cx="48" cy="60" rx="6" ry="12" fill="#f472b6" transform="rotate(-20 48 60)" />

        {/* Cabeza */}
        <circle cx="60" cy="85" r="22" fill="#ec4899" />
        <circle cx="57" cy="83" r="20" fill="#fbcfe8" />

        {/* Hocico */}
        <circle cx="60" cy="95" r="10" fill="#f472b6" />

        {/* Ojos cerrados feliz */}
        <path d="M 52 80 Q 50 78 48 80" stroke="#db2777" strokeWidth="2" fill="none" />
        <path d="M 68 80 Q 70 78 72 80" stroke="#db2777" strokeWidth="2" fill="none" />

        {/* Nariz */}
        <circle cx="60" cy="95" r="2" fill="#db2777" />

        {/* Cuerpo */}
        <ellipse cx="60" cy="115" rx="18" ry="25" fill="#fbcfe8" />

        {/* Lazo */}
        <ellipse cx="50" cy="45" rx="10" ry="8" fill="#f472b6" />
        <ellipse cx="52" cy="42" rx="5" ry="6" fill="#fbcfe8" />
        <ellipse cx="48" cy="42" rx="5" ry="6" fill="#fbcfe8" />
      </g>

      {/* Gato (derecha) */}
      <g>
        {/* Orejas triangulares */}
        <polygon points="135,45 142,35 138,55" fill="#ec4899" />
        <polygon points="155,45 162,35 158,55" fill="#ec4899" />
        {/* Interior de orejas */}
        <polygon points="137,48 141,40 139,52" fill="#f472b6" />
        <polygon points="157,48 161,40 159,52" fill="#f472b6" />

        {/* Cabeza */}
        <circle cx="145" cy="85" r="20" fill="#ec4899" />
        <circle cx="145" cy="87" r="18" fill="#fbcfe8" />

        {/* Hocico */}
        <polygon points="145,92 140,100 150,100" fill="#f472b6" />

        {/* Ojos cerrados feliz */}
        <path d="M 138 80 Q 136 78 134 80" stroke="#db2777" strokeWidth="2" fill="none" />
        <path d="M 152 80 Q 154 78 156 80" stroke="#db2777" strokeWidth="2" fill="none" />

        {/* Bigotes */}
        <line x1="125" y1="85" x2="145" y2="85" stroke="#db2777" strokeWidth="1.5" />
        <line x1="125" y1="88" x2="145" y2="90" stroke="#db2777" strokeWidth="1.5" />
        <line x1="145" y1="85" x2="165" y2="85" stroke="#db2777" strokeWidth="1.5" />
        <line x1="145" y1="90" x2="165" y2="88" stroke="#db2777" strokeWidth="1.5" />

        {/* Cuerpo */}
        <ellipse cx="145" cy="115" rx="16" ry="22" fill="#fbcfe8" />

        {/* Cola */}
        <path
          d="M 155 110 Q 170 110 165 95"
          stroke="#ec4899"
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
        />
      </g>

      {/* Corazones decorativos */}
      <g fill="#f472b6">
        {/* Corazón superior derecha */}
        <path d="M 160 60 C 160 55 165 52 169 55 C 173 52 178 55 178 60 L 169 68 Z" />

        {/* Corazón izquierda */}
        <path d="M 35 90 C 35 85 40 82 44 85 C 48 82 53 85 53 90 L 44 98 Z" />
      </g>

      {/* Texto "Lovely Pets" */}
      <text
        x="100"
        y="165"
        fontFamily="cursive"
        fontSize="32"
        fontWeight="bold"
        fill="#c2185b"
        textAnchor="middle"
        letterSpacing="1"
      >
        Lovely Pets
      </text>

      {/* Texto "SPA" */}
      <text
        x="100"
        y="195"
        fontFamily="serif"
        fontSize="18"
        letterSpacing="4"
        fill="#ec4899"
        textAnchor="middle"
        fontWeight="300"
      >
        S P A
      </text>

      {/* Iconos decorativos inferiores */}
      {/* Taza */}
      <g transform="translate(70, 210)">
        <rect x="0" y="3" width="8" height="8" rx="1" fill="none" stroke="#ec4899" strokeWidth="0.8" />
        <path d="M 8 5 Q 12 4 12 8 Q 12 11 8 11" fill="none" stroke="#ec4899" strokeWidth="0.8" />
      </g>

      {/* Corazón */}
      <g transform="translate(100, 210)">
        <path
          d="M 5 2 C 5 0 6 0 7 1 C 8 0 9 0 9 2 C 9 4 7 6 7 6 C 7 6 5 4 5 2"
          fill="#ec4899"
        />
      </g>

      {/* Patita */}
      <g transform="translate(128, 210)">
        <circle cx="0" cy="0" r="1.2" fill="#ec4899" />
        <circle cx="-2" cy="2" r="1" fill="#ec4899" />
        <circle cx="2" cy="2" r="1" fill="#ec4899" />
        <circle cx="0" cy="4" r="1" fill="#ec4899" />
      </g>
    </svg>
  );
};

export default LovelyPetsLogo;
