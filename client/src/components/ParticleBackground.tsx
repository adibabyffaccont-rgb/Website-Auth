export default function ParticleBackground() {
  return (
    <div className="particle-bg">
      <div className="absolute inset-0 overflow-hidden">
        {/* Animated gaming particles */}
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
            }}
          />
        ))}
        
        {/* Floating geometric shapes */}
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={`shape-${i}`}
            className={`absolute ${
              i % 3 === 0 ? 'w-2 h-2' : i % 3 === 1 ? 'w-3 h-3' : 'w-1 h-1'
            } ${
              i % 4 === 0 
                ? 'bg-purple-500/20' 
                : i % 4 === 1 
                ? 'bg-blue-500/20' 
                : i % 4 === 2 
                ? 'bg-green-500/20' 
                : 'bg-pink-500/20'
            } ${
              i % 2 === 0 ? 'rounded-full' : 'rotate-45'
            } pulse-animation`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
        
        {/* Gaming grid overlay */}
        <div className="absolute inset-0 opacity-5">
          <div className="w-full h-full bg-gradient-to-br from-purple-500 via-transparent to-blue-500"></div>
          <div 
            className="absolute inset-0"
            style={{
              backgroundImage: 'linear-gradient(rgba(139, 92, 246, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(139, 92, 246, 0.1) 1px, transparent 1px)',
              backgroundSize: '50px 50px'
            }}
          />
        </div>
      </div>
    </div>
  );
}