export default function PawSpaDecorative() {
  return (
    <div className="hidden lg:block absolute right-0 top-0 h-full w-1/3 pointer-events-none overflow-hidden">
      {/* Decorative blob */}
      <div className="absolute top-20 right-10 w-64 h-64 bg-gradient-to-br from-pawspa-200 to-pawspa-100 rounded-full opacity-30 blur-3xl animate-float"></div>
      
      {/* Decorative elements */}
      <div className="absolute bottom-20 right-5 w-32 h-32 bg-pawspa-100 rounded-2xl opacity-20 transform rotate-45 animate-pulse"></div>
      
      {/* Paw illustration - simplified SVG */}
      <svg 
        className="absolute bottom-10 right-20 w-48 h-48 opacity-10 animate-float" 
        viewBox="0 0 200 200" 
        fill="currentColor"
      >
        <circle cx="100" cy="80" r="35" className="fill-pawspa-500" />
        <circle cx="50" cy="130" r="25" className="fill-pawspa-500" />
        <circle cx="100" cy="155" r="25" className="fill-pawspa-500" />
        <circle cx="150" cy="130" r="25" className="fill-pawspa-500" />
        <circle cx="75" cy="165" r="15" className="fill-pawspa-400" />
        <circle cx="125" cy="165" r="15" className="fill-pawspa-400" />
      </svg>

      {/* Floating hearts */}
      <div className="absolute top-1/3 right-1/4 text-4xl animate-float opacity-20">💗</div>
      <div className="absolute bottom-1/3 right-1/3 text-3xl animate-float opacity-15" style={{ animationDelay: '1s' }}>✨</div>
    </div>
  );
}
